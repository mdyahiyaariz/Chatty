import Conversation from "../models/Conversation.js"
import Friendship from "../models/Friendship.js"
import User from "../models/User.js"
import RedisService from "../services/RedisService.js";
import { USER_FIELDS, serializeConversation, publicUser } from "../utils/serialize.js";

class ConversationController {
    static async checkConnectCode(req, res) {
        try {
            const userId = req.user._id;
            const { connectCode } = req.query;

            const friend = typeof connectCode === "string" ? await User.findOne({ connectCode }) : null;

            if (!friend || friend._id.toString() === userId.toString()) {
                return res.status(400).json({message: "Invalid connect ID"});
            }

            const existingFriendship = await Friendship.findOne({
                $or: [
                    {requester: userId, recipient: friend._id},
                    {requester: friend._id, recipient: userId},
                ],
            })

            if (existingFriendship) {
                return res.status(400).json({message: "Friendship already exists"})
            }

            res.json({
                success: true,
                message: "Connect ID is valid"
            });

        } catch (error) {
            console.error("Error checking connect code", error);
            res.status(500).json({message: 'Internal server error'})
        }
    }

    /** Every conversation the user is part of, direct and group, newest activity first. */
    static async getConversations(req, res) {
        try {
            const userId = req.user._id;

            const conversations = await Conversation.find({ participants: userId })
                .populate("participants", USER_FIELDS)
                .lean();

            const data = await Promise.all(conversations.map((c) => serializeConversation(c, userId)));

            data.sort((a, b) => new Date(b.lastMessage?.timestamp ?? 0) - new Date(a.lastMessage?.timestamp ?? 0));

            res.json({data});

        } catch (error) {
            console.error("Error fetching conversations", error);
            res.status(500).json({message: 'Internal server error'})
        }
    }

    /** Accepted friends, used by the "new group" picker. */
    static async getFriends(req, res) {
        try {
            const userId = req.user._id;

            const friendships = await Friendship.find({
                status: "accepted",
                $or: [{requester: userId}, {recipient: userId}],
            }).populate([
                {path: "requester", select: USER_FIELDS},
                {path: "recipient", select: USER_FIELDS},
            ]).lean();

            const friends = await Promise.all(friendships.map(async (f) => {
                const friend = f.requester._id.toString() === userId.toString() ? f.recipient : f.requester;
                return publicUser(friend, await RedisService.isUserOnline(friend._id.toString()));
            }));

            res.json({data: friends});

        } catch (error) {
            console.error("Error fetching friends", error);
            res.status(500).json({message: 'Internal server error'})
        }
    }

    static async getFriendRequests(req, res) {
        try {
            const userId = req.user._id;

            const [incoming, outgoing] = await Promise.all([
                Friendship.find({recipient: userId, status: "pending"})
                    .populate('requester', USER_FIELDS)
                    .lean(),
                Friendship.find({requester: userId, status: "pending"})
                    .populate('recipient', USER_FIELDS)
                    .lean(),
            ]);

            const shape = (friendship, user) => ({
                requestId: friendship._id.toString(),
                user: publicUser(user),
            });

            res.json({
                incoming: incoming.map((f) => shape(f, f.requester)),
                outgoing: outgoing.map((f) => shape(f, f.recipient)),
            });

        } catch (error) {
            console.error("Error fetching friend requests", error);
            res.status(500).json({message: 'Internal server error'})
        }
    }
}
export default ConversationController;
