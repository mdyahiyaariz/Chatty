import apiClient from "../utils/apiClient";
import type { Member } from "../types/chat";

export const conversationService = {
    fetchConversations: async () => {
        const response = await apiClient.get("/api/conversations");
        return response.data;
    },
    checkConnectCode: async (connectCode: string) => {
        const response = await apiClient.get("/api/conversations/check-connect-code", {
            params: {
                connectCode,
            }
        })
        return response.data;
    },
    fetchFriendRequests: async () => {
        const response = await apiClient.get("/api/conversations/requests");
        return response.data;
    },
    fetchFriends: async (): Promise<Member[]> => {
        const response = await apiClient.get("/api/conversations/friends");
        return response.data.data;
    },

    // Group chats
    createGroup: async (data: {name: string, memberIds: string[], avatarUrl?: string | null}): Promise<{conversationId: string}> => {
        const response = await apiClient.post("/api/conversations/groups", data);
        return response.data;
    },
    updateGroup: async (conversationId: string, data: {name?: string, avatarUrl?: string | null}) => {
        const response = await apiClient.patch(`/api/conversations/${conversationId}/group`, data);
        return response.data;
    },
    addMembers: async (conversationId: string, memberIds: string[]) => {
        const response = await apiClient.post(`/api/conversations/${conversationId}/members`, {memberIds});
        return response.data;
    },
    removeMember: async (conversationId: string, userId: string) => {
        const response = await apiClient.delete(`/api/conversations/${conversationId}/members/${userId}`);
        return response.data;
    }
}
