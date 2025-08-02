import express from 'express';
import { register, login, getProfile, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.post('/logout', authenticate, logout);

export default router;