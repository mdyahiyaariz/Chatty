import RedisService from "../services/RedisService.js";

export const USER_FIELDS = "fullName username connectCode avatarUrl";

export const roomOf = (conversationId) => `conv_${conversationId}`;

export const directKeyOf = (a, b) => [a.toString(), b.toString()].sort().join("_");

export const publicUser = (user, online = false) => ({
    id: user._id.toString(),
    fullName: user.fullName,
    username: user.username,
    connectCode: user.connectCode,
    avatarUrl: user.avatarUrl || null,
    online,
});

const countsToObject = (counts) => {
    if (!counts) return {};
    return counts instanceof Map ? Object.fromEntries(counts) : { ...counts };
};

/**
 * Turns a conversation whose participants are populated into the shape the client uses.
 * Direct chats also get `friend`, so the client can treat both kinds the same way.
 */
export const serializeConversation = async (conversation, viewerId) => {
    const members = await Promise.all(conversation.participants.map(
        async (p) => publicUser(p, await RedisService.isUserOnline(p._id.toString()))
    ));

    const preview = conversation.lastMessagePreview;

    return {
        conversationId: conversation._id.toString(),
        type: conversation.type || "direct",
        name: conversation.name || null,
        avatarUrl: conversation.avatarUrl || null,
        createdBy: conversation.createdBy ? conversation.createdBy.toString() : null,
        admins: (conversation.admins || []).map((a) => a.toString()),
        members,
        friend: conversation.type === "group" ? undefined : members.find((m) => m.id !== viewerId.toString()),
        unreadCounts: countsToObject(conversation.unreadCounts),
        lastMessage: preview?.content ? {
            content: preview.content,
            timestamp: preview.timestamp,
            sender: preview.sender ? preview.sender.toString() : null,
        } : null,
    };
};
