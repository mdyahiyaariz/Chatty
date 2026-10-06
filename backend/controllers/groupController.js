import mongoose from "mongoose";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import Friendship from "../models/Friendship.js";
import { USER_FIELDS, serializeConversation, roomOf } from "../utils/serialize.js";
import { isAvatarUrl, removeAvatarFile } from "../utils/files.js";

const MAX_MEMBERS = 50;
const MIN_OTHER_MEMBERS = 2;

const loadPopulated = (id) => Conversation.findById(id).populate("participants", USER_FIELDS);

const cleanIds = (ids, exclude = []) => {
    if (!Array.isArray(ids)) return null;
    const skip = new Set(exclude.map(String));
    const unique = [...new Set(ids.map(String))].filter((id) => !skip.has(id));
    return unique.every((id) => mongoose.isValidObjectId(id)) ? unique : null;
};

/** You can only put people into a group when they are your accepted friends. */
const allAreFriends = async (userId, ids) => {
    const count = await Friendship.countDocuments({
        status: "accepted",
        $or: [
            { requester: userId, recipient: { $in: ids } },
            { recipient: userId, requester: { $in: ids } },
        ],
    });
    return count === ids.length;
};

const isAdmin = (conversation, userId) => conversation.admins.some((a) => a.toString() === userId.toString());
const isMember = (conversation, userId) => conversation.participants.some((p) => (p._id ?? p).toString() === userId.toString());

/** Sends each member their own view of the conversation (the `friend` field depends on who is looking). */
const emitToMembers = async (io, conversation, event, memberIds) => {
    const populated = await loadPopulated(conversation._id);
    for (const id of memberIds) {
        io.to(id.toString()).emit(event, await serializeConversation(populated, id));
    }
};

const joinRoom = (io, userId, conversationId) => io.in(userId.toString()).socketsJoin(roomOf(conversationId));
const leaveRoom = (io, userId, conversationId) => io.in(userId.toString()).socketsLeave(roomOf(conversationId));

class GroupController {
    /** POST /conversations/groups  { name, memberIds, avatarUrl? } */
    static async create(req, res) {
        try {
            const creator = req.user._id;
            const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
            const { avatarUrl } = req.body;
            const memberIds = cleanIds(req.body.memberIds, [creator]);

            if (name.length < 1 || name.length > 50) {
                return res.status(400).json({message: "Group name must be 1 to 50 characters"});
            }
            if (!memberIds || memberIds.length < MIN_OTHER_MEMBERS) {
                return res.status(400).json({message: `Choose at least ${MIN_OTHER_MEMBERS} friends for a group`});
            }
            if (memberIds.length + 1 > MAX_MEMBERS) {
                return res.status(400).json({message: `Groups can have at most ${MAX_MEMBERS} members`});
            }
            if (avatarUrl && !isAvatarUrl(avatarUrl)) {
                return res.status(400).json({message: "Invalid group picture"});
            }
            if (!(await allAreFriends(creator, memberIds))) {
                return res.status(400).json({message: "You can only add people you are friends with"});
            }

            const conversation = await Conversation.create({
                type: "group",
                name,
                avatarUrl: avatarUrl || null,
                participants: [creator, ...memberIds],
                admins: [creator],
                createdBy: creator,
            });

            const io = req.app.get("io");
            const everyone = [creator.toString(), ...memberIds];
            everyone.forEach((id) => joinRoom(io, id, conversation._id));
            await emitToMembers(io, conversation, "conversation:added", everyone);

            res.status(201).json({conversationId: conversation._id.toString()});

        } catch (error) {
            console.error("Error creating group", error);
            res.status(500).json({message: "Internal server error"});
        }
    }

    /** PATCH /conversations/:id/group  { name?, avatarUrl? }  admins only */
    static async update(req, res) {
        try {
            const conversation = await Conversation.findById(req.params.conversationId);
            if (!conversation || conversation.type !== "group" || !isMember(conversation, req.user._id)) {
                return res.status(404).json({message: "Group not found"});
            }
            if (!isAdmin(conversation, req.user._id)) {
                return res.status(403).json({message: "Only group admins can do that"});
            }

            const { name, avatarUrl } = req.body;

            if (name !== undefined) {
                const clean = typeof name === "string" ? name.trim() : "";
                if (clean.length < 1 || clean.length > 50) {
                    return res.status(400).json({message: "Group name must be 1 to 50 characters"});
                }
                conversation.name = clean;
            }

            if (avatarUrl !== undefined) {
                if (avatarUrl !== null && !isAvatarUrl(avatarUrl)) {
                    return res.status(400).json({message: "Invalid group picture"});
                }
                if (conversation.avatarUrl && conversation.avatarUrl !== avatarUrl) {
                    await removeAvatarFile(conversation.avatarUrl);
                }
                conversation.avatarUrl = avatarUrl;
            }

            await conversation.save();
            await emitToMembers(req.app.get("io"), conversation, "conversation:updated", conversation.participants);

            res.json({success: true});

        } catch (error) {
            console.error("Error updating group", error);
            res.status(500).json({message: "Internal server error"});
        }
    }

    /** POST /conversations/:id/members  { memberIds }  admins only */
    static async addMembers(req, res) {
        try {
            const conversation = await Conversation.findById(req.params.conversationId);
            if (!conversation || conversation.type !== "group" || !isMember(conversation, req.user._id)) {
                return res.status(404).json({message: "Group not found"});
            }
            if (!isAdmin(conversation, req.user._id)) {
                return res.status(403).json({message: "Only group admins can add people"});
            }

            const existing = conversation.participants.map(String);
            const newIds = cleanIds(req.body.memberIds, existing);

            if (!newIds || newIds.length === 0) {
                return res.status(400).json({message: "Choose at least one new friend to add"});
            }
            if (existing.length + newIds.length > MAX_MEMBERS) {
                return res.status(400).json({message: `Groups can have at most ${MAX_MEMBERS} members`});
            }
            if (!(await allAreFriends(req.user._id, newIds))) {
                return res.status(400).json({message: "You can only add people you are friends with"});
            }

            conversation.participants.push(...newIds);
            await conversation.save();

            const io = req.app.get("io");
            newIds.forEach((id) => joinRoom(io, id, conversation._id));
            await emitToMembers(io, conversation, "conversation:added", newIds);
            await emitToMembers(io, conversation, "conversation:updated", existing);

            res.json({success: true});

        } catch (error) {
            console.error("Error adding members", error);
            res.status(500).json({message: "Internal server error"});
        }
    }

    /** DELETE /conversations/:id/members/:userId  admins remove others; anyone can remove themselves (leave) */
    static async removeMember(req, res) {
        try {
            const { conversationId, userId: targetId } = req.params;
            const me = req.user._id.toString();

            const conversation = await Conversation.findById(conversationId);
            if (!conversation || conversation.type !== "group" || !isMember(conversation, me)) {
                return res.status(404).json({message: "Group not found"});
            }
            if (!isMember(conversation, targetId)) {
                return res.status(404).json({message: "That person is not in this group"});
            }

            const leaving = targetId === me;
            if (!leaving && !isAdmin(conversation, me)) {
                return res.status(403).json({message: "Only group admins can remove people"});
            }

            conversation.participants = conversation.participants.filter((p) => p.toString() !== targetId);
            conversation.admins = conversation.admins.filter((a) => a.toString() !== targetId);
            conversation.unreadCounts.delete(targetId);

            const io = req.app.get("io");

            if (conversation.participants.length === 0) {
                await Message.deleteMany({conversation: conversation._id});
                await removeAvatarFile(conversation.avatarUrl);
                await conversation.deleteOne();
            } else {
                // Never leave a group without an admin: the longest-standing member takes over.
                if (conversation.admins.length === 0) {
                    conversation.admins = [conversation.participants[0]];
                }
                await conversation.save();
                await emitToMembers(io, conversation, "conversation:updated", conversation.participants);
            }

            io.to(targetId).emit("conversation:removed", {conversationId, reason: leaving ? "left" : "removed"});
            leaveRoom(io, targetId, conversationId);

            res.json({success: true});

        } catch (error) {
            console.error("Error removing member", error);
            res.status(500).json({message: "Internal server error"});
        }
    }
}

export default GroupController;
