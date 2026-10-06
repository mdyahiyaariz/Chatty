import express from "express"
import ConversationController from "../controllers/conversationController.js"
import GroupController from "../controllers/groupController.js"
import authMiddleware from "../middlewares/authMiddleware.js"

const router = express.Router();

router.get('/check-connect-code', authMiddleware, ConversationController.checkConnectCode);
router.get('/requests', authMiddleware, ConversationController.getFriendRequests);
router.get('/friends', authMiddleware, ConversationController.getFriends);
router.get('/', authMiddleware, ConversationController.getConversations);

// Group chats
router.post('/groups', authMiddleware, GroupController.create);
router.patch('/:conversationId/group', authMiddleware, GroupController.update);
router.post('/:conversationId/members', authMiddleware, GroupController.addMembers);
router.delete('/:conversationId/members/:userId', authMiddleware, GroupController.removeMember);

export default router;
