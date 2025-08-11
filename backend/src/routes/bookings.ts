import express from 'express';
import {
  createBooking,
  getBookings,
  getBooking,
  updateBooking,
  deleteBooking,
  getBookingStats
} from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';
import { requireOnboarding } from '../middleware/onboarding';

const router = express.Router();

// Apply authentication middleware to all booking routes
router.use(authenticate);

// Apply onboarding check to all booking routes
router.use(requireOnboarding);

// Booking CRUD operations
router.post('/', createBooking);
router.get('/', getBookings);
router.get('/stats', getBookingStats);
router.get('/:id', getBooking);
router.put('/:id', updateBooking);
router.delete('/:id', deleteBooking);

export default router;