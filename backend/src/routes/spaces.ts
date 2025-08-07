import express from 'express';
import {
  createSpace,
  getSpaces,
  getSpace,
  updateSpace,
  deleteSpace,
  getSpaceAvailability,
  getSpaceStats
} from '../controllers/spaceController';
import { authenticate } from '../middleware/auth';
import { requireOnboarding } from '../middleware/onboarding';

const router = express.Router();

// Apply authentication middleware to all space routes
router.use(authenticate);

// Apply onboarding check to all space routes
router.use(requireOnboarding);

// Space CRUD operations
router.post('/', createSpace);
router.get('/', getSpaces);
router.get('/stats', getSpaceStats);
router.get('/availability', getSpaceAvailability);
router.get('/:id', getSpace);
router.put('/:id', updateSpace);
router.delete('/:id', deleteSpace);

export default router;