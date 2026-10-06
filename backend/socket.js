import RedisService from "./services/RedisService.js";
import Conversation from "./models/Conversation.js";
import { roomOf } from "./utils/serialize.js";
import {
    conversationMarkAsRead,
    conversationReactToMessage,
    conversationRequest,
    conversationRequestRespond,
    conversationSendMessage,
    conversationTyping,
    notifyConversationOnlineStatus
} from "./socket/socketConversation.js";


export const initializeSocket = async (io) => {
    io.on("connection", async (socket) => {
        try {
            const user = socket.user;
            const userId = user._id.toString();

            // Personal room: used to reach this user on every device.
            socket.join(userId);

            // One room per conversation (direct or group) the user belongs to.
            const conversations = await Conversation.find({ participants: user._id }).select("_id").lean();
            conversations.forEach((c) => socket.join(roomOf(c._id)));

            await RedisService.addUserSession(userId, socket.id);
            await notifyConversationOnlineStatus(io, socket, true);

            // Any activity keeps the user marked online.
            socket.use((packet, next) => {
                RedisService.touchUserSession(userId);
                next();
            });

            socket.on("conversation:request", (data) => conversationRequest(io, socket, data))
            socket.on("conversation:request:respond", (data) => conversationRequestRespond(io, socket, data))
            socket.on("conversation:mark-as-read", (data) => conversationMarkAsRead(io, socket, data));
            socket.on("conversation:send-message", (data) => conversationSendMessage(io, socket, data))
            socket.on("conversation:react-to-message", (data) => conversationReactToMessage(io, socket, data))
            socket.on("conversation:typing", (data) => conversationTyping(io, socket, data));

            socket.on('disconnect', async () => {
                await RedisService.removeUserSession(userId, socket.id);

                if (!(await RedisService.isUserOnline(userId))) {
                    await notifyConversationOnlineStatus(io, socket, false);
                }
            })

        } catch (error) {
            console.error("Socket connection error", error);
            socket.emit("internal_error", {error: "Internal server error"});
        }
    })
}
