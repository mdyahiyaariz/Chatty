import multer from "multer";
import path from "path";
import fs from "fs";
import { EXTENSION_BY_MIME, cleanMime, randomFileName } from "../utils/files.js";

const uploadDir = path.join(process.cwd(), "uploads");
const avatarDir = path.join(uploadDir, "avatars");
fs.mkdirSync(avatarDir, { recursive: true });

const diskStorage = (dir) => multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => cb(null, randomFileName(cleanMime(file.mimetype))),
});

const filterBy = (allowed, message) => (req, file, cb) => {
    allowed.includes(cleanMime(file.mimetype)) ? cb(null, true) : cb(new Error(message));
};

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const upload = multer({
    storage: diskStorage(uploadDir),
    fileFilter: filterBy(Object.keys(EXTENSION_BY_MIME), "Unsupported file type. Only images and audio are allowed."),
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

export const avatarUpload = multer({
    storage: diskStorage(avatarDir),
    fileFilter: filterBy(AVATAR_TYPES, "Profile pictures must be JPG, PNG or WebP."),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

export { IMAGE_TYPES };
