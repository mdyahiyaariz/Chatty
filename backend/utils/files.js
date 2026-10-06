import fs from "fs";
import path from "path";
import crypto from "crypto";

// The file extension always comes from this table, never from the uploaded file name.
export const EXTENSION_BY_MIME = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "audio/webm": ".webm",
    "audio/mpeg": ".mp3",
    "audio/wav": ".wav",
    "audio/ogg": ".ogg",
    "audio/mp4": ".m4a",
};

export const cleanMime = (mimetype = "") => mimetype.split(";")[0].trim().toLowerCase();

export const randomFileName = (mime) => `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${EXTENSION_BY_MIME[mime]}`;

const startsWith = (buffer, bytes, offset = 0) => bytes.every((byte, i) => buffer[offset + i] === byte);

/** Checks the first bytes of an uploaded image so a renamed HTML/SVG file cannot pass as a picture. */
export const hasImageSignature = async (filePath, mime) => {
    const handle = await fs.promises.open(filePath, "r");
    try {
        const buffer = Buffer.alloc(12);
        await handle.read(buffer, 0, 12, 0);

        switch (mime) {
            case "image/jpeg": return startsWith(buffer, [0xff, 0xd8, 0xff]);
            case "image/png": return startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
            case "image/gif": return startsWith(buffer, [0x47, 0x49, 0x46, 0x38]);
            case "image/webp": return startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8);
            default: return true;
        }
    } finally {
        await handle.close();
    }
};

const AVATAR_URL = /^\/uploads\/avatars\/[\w-]+\.(jpg|png|webp)$/;

/** Only URLs produced by our own avatar upload endpoint are accepted as profile or group pictures. */
export const isAvatarUrl = (value) => typeof value === "string" && AVATAR_URL.test(value);

/** Deletes a stored avatar when it is replaced. Only touches files inside uploads/avatars. */
export const removeAvatarFile = async (url) => {
    if (!isAvatarUrl(url)) return;
    const file = path.join(process.cwd(), "uploads", "avatars", path.basename(url));
    await fs.promises.unlink(file).catch(() => {});
};
