import express from 'express';
import { 
  createLocation, 
  getLocations, 
  getLocationStats, 
  getLocation, 
  updateLocation, 
  deleteLocation, 
  checkLocationHours 
} from '../controllers/locationController';
import { authenticate } from '../middleware/auth';
import { requireOnboarding } from '../middleware/onboarding';

const router = express.Router();

// Apply authentication middleware to all location routes
router.use(authenticate);

// Apply onboarding check to all location routes
router.use(requireOnboarding);

// Location CRUD operations
router.post('/', createLocation);
router.get('/', getLocations);
router.get('/stats', getLocationStats);
router.get('/:id', getLocation);
router.put('/:id', updateLocation);
router.delete('/:id', deleteLocation);

// Location specific operations
router.get('/:id/hours', checkLocationHours);

export default router;