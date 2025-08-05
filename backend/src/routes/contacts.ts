import express from 'express';
import {
  createContact,
  getContacts,
  getContact,
  updateContact,
  deleteContact,
  addInteraction,
  updateContextState,
  getContactStats,
  getContactAIContext,
  getConversationPrompts
} from '../controllers/contactController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all contact routes
router.use(authenticate);

// Contact CRUD operations
router.post('/', createContact);
router.get('/', getContacts);
router.get('/stats', getContactStats);
router.get('/:id', getContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

// Contact interactions
router.post('/:id/interactions', addInteraction);

// Context state management
router.patch('/:id/context-state', updateContextState);

// AI Context features
router.get('/:id/ai-context', getContactAIContext);
router.get('/:id/conversation-prompts', getConversationPrompts);

export default router;