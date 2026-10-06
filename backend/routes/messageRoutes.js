import express from "express"
import authMiddleware from "../middlewares/authMiddleware.js"
import MessageController from "../controllers/messageController.js"

const router = express.Router();

router.get("/:conversationId/messages", authMiddleware, MessageController.getMessages)

export default router;