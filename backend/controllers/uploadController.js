import fs from "fs";
import { cleanMime, hasImageSignature } from "../utils/files.js";

const discard = (file) => file && fs.promises.unlink(file.path).catch(() => {});

class UploadController {
    static async uploadAttachment(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }

            const mime = cleanMime(req.file.mimetype);
            const isImage = mime.startsWith("image/");
            const isAudio = mime.startsWith("audio/");

            if (!isImage && !isAudio) {
                await discard(req.file);
                return res.status(400).json({ message: "Unsupported file type" });
            }

            if (isImage && !(await hasImageSignature(req.file.path, mime))) {
                await discard(req.file);
                return res.status(400).json({ message: "That file is not a valid image" });
            }

            res.json({
                url: `/uploads/${req.file.filename}`,
                type: isImage ? "image" : "audio",
                mimeType: mime,
                size: req.file.size,
            });

        } catch (error) {
            console.error("Error uploading attachment", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }

    /** Stores a profile or group picture and returns its URL. Saving it to a user or group is a separate call. */
    static async uploadAvatar(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "No file uploaded" });
            }

            if (!(await hasImageSignature(req.file.path, cleanMime(req.file.mimetype)))) {
                await discard(req.file);
                return res.status(400).json({ message: "That file is not a valid image" });
            }

            res.json({ url: `/uploads/avatars/${req.file.filename}` });

        } catch (error) {
            console.error("Error uploading avatar", error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
}

export default UploadController;
