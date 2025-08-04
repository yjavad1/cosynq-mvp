#!/usr/bin/env node

import { preview } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  try {
    const server = await preview({
      root: path.resolve(__dirname),
      preview: {
        port: parseInt(process.env.PORT) || 3000,
        host: '0.0.0.0',
        strictPort: false,
        cors: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
        },
      },
    });

    server.printUrls();
    
    console.log(`🚀 Frontend server running on port ${server.config.preview.port}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`🔗 Server accessible from external hosts`);
    
  } catch (error) {
    console.error('❌ Failed to start preview server:', error);
    process.exit(1);
  }
}

startServer();