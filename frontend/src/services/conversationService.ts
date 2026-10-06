import apiClient from "../utils/apiClient";
import type { Member } from "../types/chat";

export const conversationService = {
    fetchConversations: async () => {
        const response = await apiClient.get("/conversations");
        return response.data;
    },
    checkConnectCode: async (connectCode: string) => {
        const response = await apiClient.get("/conversations/check-connect-code", {
            params: {
                connectCode,
            }
        })
        return response.data;
    },
    fetchFriendRequests: async () => {
        const response = await apiClient.get("/conversations/requests");
        return response.data;
    },
    fetchFriends: async (): Promise<Member[]> => {
        const response = await apiClient.get("/conversations/friends");
        return response.data.data;
    },

    // Group chats
    createGroup: async (data: {name: string, memberIds: string[], avatarUrl?: string | null}): Promise<{conversationId: string}> => {
        const response = await apiClient.post("/conversations/groups", data);
        return response.data;
    },
    updateGroup: async (conversationId: string, data: {name?: string, avatarUrl?: string | null}) => {
        const response = await apiClient.patch(`/conversations/${conversationId}/group`, data);
        return response.data;
    },
    addMembers: async (conversationId: string, memberIds: string[]) => {
        const response = await apiClient.post(`/conversations/${conversationId}/members`, {memberIds});
        return response.data;
    },
    removeMember: async (conversationId: string, userId: string) => {
        const response = await apiClient.delete(`/conversations/${conversationId}/members/${userId}`);
        return response.data;
    }
}
