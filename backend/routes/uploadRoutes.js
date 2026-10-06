import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { upload, avatarUpload } from "../middlewares/uploadMiddleware.js";
import UploadController from "../controllers/uploadController.js";

const router = express.Router();

// Turns multer errors (size, type) into a clean 400 instead of a crash.
const handle = (middleware) => (req, res, next) => {
    middleware(req, res, (err) => {
        if (err) {
            const message = err.code === "LIMIT_FILE_SIZE" ? "File is too large" : err.message || "Upload failed";
            return res.status(400).json({ message });
        }
        next();
    });
};

router.post("/", authMiddleware, handle(upload.single("file")), UploadController.uploadAttachment);
router.post("/avatar", authMiddleware, handle(avatarUpload.single("file")), UploadController.uploadAvatar);

export default router;
