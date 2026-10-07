import apiClient from "../utils/apiClient";

export type AttachmentType = "image" | "audio";

export type UploadedAttachment = {
    url: string;
    type: AttachmentType;
    mimeType: string;
    size: number;
};

export const uploadService = {
    uploadFile: async (file: File | Blob, filename?: string): Promise<UploadedAttachment> => {
        const formData = new FormData();
        formData.append("file", file, filename);

        const response = await apiClient.post("/api/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    /** Profile and group pictures: JPG, PNG or WebP up to 2 MB. Returns the stored URL. */
    uploadAvatar: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await apiClient.post("/api/upload/avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data.url;
    }
}
