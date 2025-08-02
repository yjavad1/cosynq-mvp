import express from 'express';
import authRoutes from './auth';

const router = express.Router();

router.use('/auth', authRoutes);

router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Cosynq API is running',
    timestamp: new Date().toISOString()
  });
});

export default router;