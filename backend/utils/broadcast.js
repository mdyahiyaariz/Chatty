import Conversation from "../models/Conversation.js";

/** Tells everyone who shares a conversation with this user (and the user's other tabs) about a new name or picture. */
export const broadcastProfileUpdate = async (io, user) => {
    if (!io) return;

    const conversations = await Conversation.find({ participants: user._id }).select("participants").lean();
    const audience = new Set([user._id.toString()]);
    conversations.forEach(c => c.participants.forEach(p => audience.add(p.toString())));

    const payload = { id: user._id.toString(), fullName: user.fullName, avatarUrl: user.avatarUrl || null };
    audience.forEach(id => io.to(id).emit("user:profile-updated", payload));
}
