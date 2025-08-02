import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import connectDB from './config/database';
import routes from './routes';
import corsMiddleware from './middleware/cors';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '8000', 10);
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

connectDB();

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 Cosynq backend server running on ${HOST}:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});