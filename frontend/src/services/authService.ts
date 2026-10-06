import apiClient from "../utils/apiClient";

export const authService = {
    login: async (data: {email: string, password: string}) => {
        const response = await apiClient.post("/api/auth/login", data);
        return response.data;
    },

    register: async (data: {fullName: string, username: string, email: string, password: string}) => {
        const response = await apiClient.post("/api/auth/register", data);
        return response.data;
    },

    me: async () => {
        const response = await apiClient.get("/api/auth/me");
        return response.data;
    },

    updateProfile: async (data: {fullName?: string, avatarUrl?: string | null}) => {
        const response = await apiClient.patch("/api/auth/profile", data);
        return response.data;
    },

    logout: async () => {
        await apiClient.post("/api/auth/logout");
    }
}
