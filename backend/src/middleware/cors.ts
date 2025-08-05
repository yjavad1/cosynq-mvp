import cors from 'cors';

const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    console.log(`🔧 CORS check for origin: ${origin || 'no-origin'}`);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3002',
      'https://localhost:3000',
      'https://localhost:3002',
      process.env.FRONTEND_URL,
      // Railway frontend domain
      'https://zonal-possibility-production.up.railway.app'
    ].filter(Boolean); // Remove undefined values
    
    console.log('🔧 Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origin allowed');
      callback(null, true);
    } else {
      console.log('❌ CORS: Origin not allowed');
      // For debugging, allow all origins in production temporarily
      if (process.env.NODE_ENV === 'production') {
        console.log('🔧 CORS: Allowing all origins for debugging');
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export default cors(corsOptions);