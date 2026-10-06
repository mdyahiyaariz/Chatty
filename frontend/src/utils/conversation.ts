import type { Conversation, Member } from "../types/chat";

export const isGroup = (c: Conversation) => c.type === "group";

/** In a direct chat, the one person who is not you. */
export const getFriend = (c: Conversation, myId?: string): Member | undefined =>
    c.members.find((m) => m.id !== myId) ?? c.members[0];

export const conversationTitle = (c: Conversation, myId?: string) =>
    isGroup(c) ? (c.name ?? "Group") : (getFriend(c, myId)?.fullName ?? "Conversation");

export const conversationAvatarUrl = (c: Conversation, myId?: string) =>
    isGroup(c) ? c.avatarUrl : (getFriend(c, myId)?.avatarUrl ?? null);

export const isAdmin = (c: Conversation, userId?: string) => !!userId && c.admins.includes(userId);

export const memberMap = (c: Conversation | null) =>
    new Map((c?.members ?? []).map((m) => [m.id, m] as const));
