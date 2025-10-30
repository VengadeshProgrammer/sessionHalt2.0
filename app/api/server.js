import http from 'http';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== DEBUG INFO ===');
console.log('Server.js location:', __filename);
console.log('Server.js directory:', __dirname);

// CORRECT PATH: Go up one level to app/ folder where .env is located
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('Environment check:', {
  supabaseUrl: process.env.SUPABASE_URL ? 'Loaded' : 'Missing',
  supabaseKey: process.env.SUPABASE_ANON_KEY ? 'Loaded' : 'Missing'
});

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }
  
  // Parse JSON body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    // Create request object for your handlers WITH ENV VARIABLES
    const requestObj = {
      method: req.method,
      url: req.url,
      body: body,
      headers: req.headers,
      env: {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
      }
    };
    
    // Create response object for your handlers
    const responseObj = {
      statusCode: 200,
      headers: {},
      setHeader: function(key, value) {
        this.headers[key] = value;
      },
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.setHeader('Content-Type', 'application/json');
        res.writeHead(this.statusCode, this.headers);
        res.end(JSON.stringify(data));
      },
      end: function(data) {
        res.writeHead(this.statusCode, this.headers);
        res.end(data);
      }
    };
    
    try {
      // Route the requests
      if (req.url === '/api/signup' && req.method === 'POST') {
        const signupHandler = (await import('./signup.js')).default;
        await signupHandler(requestObj, responseObj);
      } else if (req.url === '/api/login' && req.method === 'POST') {
        const loginHandler = (await import('./login.js')).default;
        await loginHandler(requestObj, responseObj);
      } else if (req.url === '/api/logout' && req.method === 'POST') {
        const logoutHandler = (await import('./logout.js')).default;
        await logoutHandler(requestObj, responseObj);
      } else if (req.url === '/api/autoauth' && (req.method === 'GET' || req.method === 'POST')) {
        const autoAuthHandler = (await import('./autoauth.js')).default;
        await autoAuthHandler(requestObj, responseObj);
      } else {
        responseObj.status(404).json({ error: 'Endpoint not found' });
      }
    } catch (error) {
      console.error('Server error:', error);
      responseObj.status(500).json({ error: 'Internal server error' });
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});