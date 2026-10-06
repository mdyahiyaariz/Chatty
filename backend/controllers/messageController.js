import Message from "../models/Message.js"
import Conversation from "../models/Conversation.js"
import mongoose from "mongoose"

class MessageController {
    static async getMessages(req, res) {
        try {
            const { conversationId } = req.params;
            const { cursor } = req.query;
            const limit = 20;

            if (!mongoose.isValidObjectId(conversationId)) {
                return res.status(404).json({message: "Conversation not found"});
            }

            // Only people in the conversation may read it.
            const isMember = await Conversation.exists({_id: conversationId, participants: req.user._id});
            if (!isMember) {
                return res.status(404).json({message: "Conversation not found"});
            }

            const query = {conversation: conversationId};

            if (cursor) {
                const before = new Date(cursor);
                if (Number.isNaN(before.getTime())) {
                    return res.status(400).json({message: "Invalid cursor"});
                }
                query.createdAt = {$lt: before};
            }

            let messages = await Message.find(query)
                .sort({createdAt: -1})
                .limit(limit)
                .populate("sender", "username fullName avatarUrl")
                .lean();

            const nextCursor = messages.length > 0 ? messages[messages.length - 1].createdAt.toISOString() : null;

            messages = messages.reverse();

            res.json({
                messages,
                nextCursor,
                hasNext: messages.length === limit
            })

        } catch (error) {
            console.error("Error fetching messages", error);
            res.status(500).json({message: "Internal server error"});
        }
    }
}

export default MessageController;
