export type Member = {
    id: string;
    fullName: string;
    username: string;
    connectCode: string;
    avatarUrl: string | null;
    online: boolean;
}

export type LastMessage = {
    content: string;
    timestamp: string;
    sender: string | null;
}

export type Conversation = {
    conversationId: string;
    type: "direct" | "group";
    name: string | null;
    avatarUrl: string | null;
    createdBy: string | null;
    admins: string[];
    members: Member[];
    unreadCounts: Record<string, number>;
    lastMessage: LastMessage | null;
}
