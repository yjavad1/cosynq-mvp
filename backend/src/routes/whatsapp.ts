import { Router } from 'express';
import {
  verifyWebhook,
  handleWebhook,
  sendMessage,
  sendTemplateMessage,
  getConversationHistory,
  getConversations,
  getServiceStatus
} from '../controllers/whatsappController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public webhook endpoints (no auth required)
router.get('/webhook', verifyWebhook);
router.post('/webhook', handleWebhook);

// Protected endpoints (require authentication)
router.use(authenticate); // Apply auth middleware to all routes below

// Send messages
router.post('/send-message', sendMessage);
router.post('/send-template', sendTemplateMessage);

// Get conversations
router.get('/conversations', getConversations);
router.get('/conversation/:phoneNumber', getConversationHistory);

// Service status
router.get('/status', getServiceStatus);

export default router;