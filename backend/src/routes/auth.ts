import express from 'express';
import { register, login, getProfile, logout } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

console.log('🔧 Registering auth routes...');

router.post('/register', register);
console.log('✅ POST /register route registered');

router.post('/login', login);
console.log('✅ POST /login route registered');

router.get('/profile', authenticate, getProfile);
console.log('✅ GET /profile route registered (protected)');

router.post('/logout', authenticate, logout);
console.log('✅ POST /logout route registered (protected)');

console.log('🚀 All auth routes registered successfully');

export default router;