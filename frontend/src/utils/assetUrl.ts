const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

export const getAssetUrl = (path: string | undefined | null): string => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${API_ORIGIN}${path}`;
};
