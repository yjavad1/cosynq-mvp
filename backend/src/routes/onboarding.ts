import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getOnboardingStatus,
  updateOnboardingData,
  completeOnboarding,
  resetOnboarding
} from '../controllers/onboardingController';

const router = Router();

// All onboarding routes require authentication
router.use(authenticate);

// Get current onboarding status
router.get('/status', getOnboardingStatus);

// Update onboarding data
router.put('/data', updateOnboardingData);

// Complete onboarding
router.post('/complete', completeOnboarding);

// Reset onboarding (for testing/admin)
router.post('/reset', resetOnboarding);

export default router;