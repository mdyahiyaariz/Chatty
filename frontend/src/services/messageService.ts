import apiClient from "../utils/apiClient";

export type MessageReaction = {
    user: string;
    emoji: string;
}

export type MessageAttachment = {
    url: string;
    type: "image" | "audio";
    mimeType: string;
    size: number;
}

export type Message = {
    _id: string;
    conversation: string;
    sender: {
        _id: string;
        username: string;
        fullName?: string;
        avatarUrl?: string | null;
    };
    content: string;
    read: boolean;
    createdAt: string;
    reactions?: MessageReaction[];
    attachment?: MessageAttachment;
}

interface MessagesResponse {
    messages: Message[],
    nextCursor: string | undefined,
    hasNext: boolean
}

export const messageService = {
    fetchMessages: async (conversationId: string, cursor?: string): Promise<MessagesResponse> => {
        const result = await apiClient.get(`/api/conversations/${conversationId}/messages`, {
            params: {
                cursor,
            }
        })
        return result.data;
    }
}
