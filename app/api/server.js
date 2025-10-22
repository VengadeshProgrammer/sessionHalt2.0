import http from 'http';
import signupHandler from './signup.js';
import loginHandler from './login.js';
import logoutHandler from './logout.js';
import autoAuthHandler from './autoauth.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173'); // Your Vite frontend
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
    // Create request object for your handlers
    const requestObj = {
      method: req.method,
      url: req.url,
      body: body,
      headers: req.headers
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
        await signupHandler(requestObj, responseObj);
      } else if (req.url === '/api/login' && req.method === 'POST') {
        await loginHandler(requestObj, responseObj);
      } else if (req.url === '/api/logout' && req.method === 'POST') {
        await logoutHandler(requestObj, responseObj);
      } else if (req.url === '/api/autoauth' && (req.method === 'GET' || req.method === 'POST')) {
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
  console.log('Available endpoints:');
  console.log('  POST /api/signup');
  console.log('  POST /api/login'); 
  console.log('  POST /api/logout');
  console.log('  GET  /api/autoauth');
});