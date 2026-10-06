import mongoose from "mongoose"
import Friendship from "../models/Friendship.js"
import User from "../models/User.js"
import Conversation from "../models/Conversation.js"
import Message from "../models/Message.js"

import { roomOf, directKeyOf, serializeConversation, publicUser, USER_FIELDS } from "../utils/serialize.js"
import RedisService from "../services/RedisService.js"

const MAX_MESSAGE_LENGTH = 4000;
const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];
const ATTACHMENT_URL = /^\/uploads\/[\w-]+\.(jpg|png|gif|webp|webm|mp3|wav|ogg|m4a)$/;

const countsOf = (conversation) =>
    conversation.unreadCounts instanceof Map ? Object.fromEntries(conversation.unreadCounts) : (conversation.unreadCounts || {});

/** Tells everyone who shares a conversation with the user that they came online or went offline. */
export const notifyConversationOnlineStatus = async (io, socket, online) => {
    try {
        const userId = socket.userId;

        const conversations = await Conversation.find({ participants: userId }).select("participants").lean();
        const audience = new Set();
        conversations.forEach((c) => c.participants.forEach((p) => audience.add(p.toString())));
        audience.delete(userId);

        audience.forEach((id) => {
            io.to(id).emit('conversation:online-status', {
                friendId: userId,
                username: socket.user.username,
                online,
            })
        })

    } catch (error) {
        console.error("notifyConversationOnlineStatus", error);
    }
}

export const conversationRequest = async (io, socket, data) => {
    try {
        const userId = socket.userId;
        const user = socket.user;
        const connectCode = data?.connectCode;

        const friend = typeof connectCode === "string" ? await User.findOne({ connectCode }) : null;
        if (!friend) {
            socket.emit("conversation:request:error", {error: "Unable to find conversation"});
            return;
        }

        if (friend._id.toString() === userId.toString()) {
            socket.emit("conversation:request:error", {error: "Can not add yourself as a friend"});
            return;
        }

        const existingFriendship = await Friendship.findOne({
            $or: [
                {requester: userId, recipient: friend._id},
                {requester: friend._id, recipient: userId}
            ],
        })
        if (existingFriendship) {
            const message = existingFriendship.status === "pending"
                ? "A request with this user is already pending"
                : "Friendship already exists";
            socket.emit("conversation:request:error", {error: message});
            return;
        }

        const friendship = await Friendship.create({
            requester: userId,
            recipient: friend._id,
            status: "pending",
        })

        socket.emit('conversation:request:sent', {
            requestId: friendship._id.toString(),
            friend: publicUser(friend),
        })

        io.to(friend._id.toString()).emit('conversation:request:incoming', {
            requestId: friendship._id.toString(),
            requester: publicUser(user),
        })

    } catch (error) {
        console.error("Error conversation:request", error);
        socket.emit("conversation:request:error", {error: "Error conversation:request"})
    }
}

export const conversationRequestRespond = async (io, socket, data) => {
    try {
        const userId = socket.userId;
        const user = socket.user;
        const { requestId, accept } = data ?? {};

        if (!mongoose.isValidObjectId(requestId)) {
            socket.emit("conversation:request:respond:error", {error: "Request not found"});
            return;
        }

        const friendship = await Friendship.findById(requestId);
        if (!friendship) {
            socket.emit("conversation:request:respond:error", {error: "Request not found"});
            return;
        }

        if (friendship.recipient.toString() !== userId.toString()) {
            socket.emit("conversation:request:respond:error", {error: "Not authorized to respond to this request"});
            return;
        }

        if (friendship.status !== "pending") {
            socket.emit("conversation:request:respond:error", {error: "This request has already been handled"});
            return;
        }

        const requester = await User.findById(friendship.requester);
        if (!requester) {
            socket.emit("conversation:request:respond:error", {error: "Requesting user no longer exists"});
            return;
        }

        if (!accept) {
            await friendship.deleteOne();

            socket.emit('conversation:request:responded', { requestId });
            io.to(requester._id.toString()).emit('conversation:request:declined', {
                requestId,
                username: user.username,
            })
            return;
        }

        friendship.status = "accepted";
        await friendship.save();

        const key = directKeyOf(userId, requester._id);
        let conversation = await Conversation.findOne({ directKey: key });
        if (!conversation) {
            conversation = await Conversation.create({ type: "direct", participants: [userId, requester._id.toString()] });
        }

        // Both people join the room right away, so no reconnect is needed.
        io.in(userId.toString()).socketsJoin(roomOf(conversation._id));
        io.in(requester._id.toString()).socketsJoin(roomOf(conversation._id));

        socket.emit('conversation:request:responded', { requestId });

        const populated = await Conversation.findById(conversation._id).populate("participants", USER_FIELDS);
        for (const id of [userId.toString(), requester._id.toString()]) {
            io.to(id).emit('conversation:accept', await serializeConversation(populated, id));
        }

    } catch (error) {
        console.error("Error conversation:request:respond", error);
        socket.emit("conversation:request:respond:error", {error: "Error conversation:request:respond"})
    }
}

export const conversationMarkAsRead = async (io, socket, data) => {
    try {
        const { conversationId } = data ?? {};
        const userId = socket.userId;

        if (!mongoose.isValidObjectId(conversationId)) return;

        const conversation = await Conversation.findOneAndUpdate(
            { _id: conversationId, participants: userId },
            { $set: { [`unreadCounts.${userId}`]: 0 } },
            { new: true }
        );

        if (!conversation) {
            socket.emit("conversation:mark-as-read:error", {error: "No conversation found"})
            return;
        }

        io.to(roomOf(conversation._id)).emit('conversation:update-unread-counts', {
            conversationId: conversation._id.toString(),
            unreadCounts: countsOf(conversation),
        })

    } catch (error) {
        console.error("Error marking conversation as read", error);
        socket.emit("conversation:mark-as-read:error", {error: "Error: conversation:mark-as-read:error"})
    }
}

export const conversationSendMessage = async (io, socket, data) => {
    try {
        const { conversationId, content, attachment } = data ?? {};
        const userId = socket.userId;
        const user = socket.user;

        const hasContent = typeof content === "string" && content.trim() !== "";
        const hasAttachment = attachment && typeof attachment.url === "string" && ATTACHMENT_URL.test(attachment.url)
            && ["image", "audio"].includes(attachment.type);

        if (!hasContent && !hasAttachment) {
            socket.emit("conversation:send-message:error", {error: "Message cannot be empty"})
            return;
        }

        if (hasContent && content.trim().length > MAX_MESSAGE_LENGTH) {
            socket.emit("conversation:send-message:error", {error: `Messages can be up to ${MAX_MESSAGE_LENGTH} characters`})
            return;
        }

        if (!mongoose.isValidObjectId(conversationId)) {
            socket.emit("conversation:send-message:error", {error: "No conversation found"})
            return;
        }

        // Membership is the only permission check needed, and it works for direct and group chats alike.
        const conversation = await Conversation.findOne({ _id: conversationId, participants: userId });
        if (!conversation) {
            socket.emit("conversation:send-message:error", {error: "No conversation found"})
            return;
        }

        const message = new Message({
            conversation: conversation.id,
            sender: userId,
            content: hasContent ? content.trim() : undefined,
            attachment: hasAttachment ? {
                url: attachment.url,
                type: attachment.type,
                mimeType: attachment.mimeType,
                size: attachment.size,
            } : undefined,
        })
        await message.save();

        // Atomic increment for everyone except the sender, so concurrent messages never lose a count.
        const increments = {};
        conversation.participants.forEach((p) => {
            if (p.toString() !== userId) increments[`unreadCounts.${p}`] = 1;
        });
        const updated = await Conversation.findByIdAndUpdate(conversation._id, { $inc: increments }, { new: true });

        const room = roomOf(conversation._id);

        io.to(room).emit("conversation:new-message", {
            conversationId: conversation.id,
            message: {
                _id: message.id,
                sender: {
                    _id: userId,
                    username: user.username,
                    fullName: user.fullName,
                    avatarUrl: user.avatarUrl || null,
                },
                content: message.content,
                attachment: message.attachment?.url ? message.attachment : undefined,
                createdAt: message.createdAt,
                read: message.read,
                reactions: [],
            },
        });

        io.to(room).emit("conversation:update-conversation", {
            conversationId: conversation.id,
            lastMessage: updated.lastMessagePreview?.content ? {
                content: updated.lastMessagePreview.content,
                timestamp: updated.lastMessagePreview.timestamp,
                sender: userId,
            } : null,
            unreadCounts: countsOf(updated),
        });

    } catch (error) {
        console.error("Error sending message", error);
        socket.emit("conversation:send-message:error", {error: "Error: conversation:send-message:error"})
    }
}

export const conversationReactToMessage = async (io, socket, data) => {
    try {
        const { conversationId, messageId, emoji } = data ?? {};
        const userId = socket.userId;

        if (!ALLOWED_EMOJIS.includes(emoji) || !mongoose.isValidObjectId(conversationId) || !mongoose.isValidObjectId(messageId)) {
            socket.emit("conversation:react-to-message:error", {error: "Invalid reaction"});
            return;
        }

        const conversation = await Conversation.exists({ _id: conversationId, participants: userId });
        if (!conversation) {
            socket.emit("conversation:react-to-message:error", {error: "Not authorized for this conversation"});
            return;
        }

        const message = await Message.findById(messageId);
        if (!message || message.conversation.toString() !== conversationId) {
            socket.emit("conversation:react-to-message:error", {error: "Message not found"});
            return;
        }

        const existingIndex = message.reactions.findIndex((reaction) => reaction.user.toString() === userId.toString());

        if (existingIndex !== -1 && message.reactions[existingIndex].emoji === emoji) {
            message.reactions.splice(existingIndex, 1);
        } else if (existingIndex !== -1) {
            message.reactions[existingIndex].emoji = emoji;
        } else {
            message.reactions.push({ user: userId, emoji });
        }

        await message.save();

        io.to(roomOf(conversationId)).emit("conversation:message-reaction", {
            conversationId,
            messageId,
            reactions: message.reactions.map((reaction) => ({
                user: reaction.user.toString(),
                emoji: reaction.emoji,
            })),
        });

    } catch (error) {
        console.error("Error reacting to message", error);
        socket.emit("conversation:react-to-message:error", {error: "Error: conversation:react-to-message:error"})
    }
}

export const conversationTyping = async (io, socket, data) => {
    try {
        const { conversationId, isTyping } = data ?? {};

        // Only sockets that joined the conversation room (i.e. members) may broadcast typing.
        const room = roomOf(conversationId);
        if (!socket.rooms.has(room)) return;

        socket.to(room).emit("conversation:update-typing", {
            conversationId,
            userId: socket.userId,
            username: socket.user.username,
            isTyping: Boolean(isTyping),
        })

    } catch (error) {
        console.error("Error sending conversation typing state", error);
    }
}
