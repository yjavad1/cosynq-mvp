import express from 'express';
import authRoutes from './auth';
import contactRoutes from './contacts';
import spaceRoutes from './spaces';

const router = express.Router();

// Debug logging for route registration
console.log('🔧 Registering API routes...');

router.use('/auth', authRoutes);
console.log('✅ Auth routes registered at /api/auth');

router.use('/contacts', contactRoutes);
console.log('✅ Contact routes registered at /api/contacts');

router.use('/spaces', spaceRoutes);
console.log('✅ Space routes registered at /api/spaces');

router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Cosynq API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || '8000',
    availableRoutes: [
      'GET /api/health',
      'GET /api/routes',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/profile',
      'POST /api/auth/logout',
      'GET /api/contacts',
      'POST /api/contacts',
      'GET /api/contacts/stats',
      'GET /api/contacts/:id',
      'PUT /api/contacts/:id',
      'DELETE /api/contacts/:id',
      'POST /api/contacts/:id/interactions',
      'PATCH /api/contacts/:id/context-state',
      'GET /api/contacts/:id/ai-context',
      'GET /api/contacts/:id/conversation-prompts',
      'GET /api/spaces',
      'POST /api/spaces',
      'GET /api/spaces/stats',
      'GET /api/spaces/availability',
      'GET /api/spaces/:id',
      'PUT /api/spaces/:id',
      'DELETE /api/spaces/:id'
    ]
  });
});

// Add a debug route to list all registered routes
router.get('/routes', (req, res) => {
  const routes: any[] = [];
  
  function extractRoutes(stack: any[], basePath = '') {
    stack.forEach((layer) => {
      if (layer.route) {
        // Direct route
        const methods = Object.keys(layer.route.methods);
        routes.push({
          path: basePath + layer.route.path,
          methods: methods,
          type: 'route'
        });
      } else if (layer.name === 'router' && layer.handle.stack) {
        // Router middleware
        const path = layer.regexp.source
          .replace('\\/?(?=\\/|$)', '')
          .replace(/\\\//g, '/')
          .replace(/\^/, '')
          .replace(/\$/, '');
        extractRoutes(layer.handle.stack, basePath + '/' + path);
      }
    });
  }
  
  extractRoutes(router.stack, '/api');
  
  res.json({
    success: true,
    message: 'Registered routes',
    timestamp: new Date().toISOString(),
    routes: routes
  });
});

console.log('✅ Health route registered at /api/health');
console.log('🚀 All API routes registered successfully');

export default router;