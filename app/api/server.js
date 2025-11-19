import http from "http";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    const requestObj = {
      method: req.method,
      url: req.url,
      body,
      headers: req.headers,
      env: {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      },
    };

    const responseObj = {
      statusCode: 200,
      headers: {},
      setHeader(key, value) {
        this.headers[key] = value;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.setHeader("Content-Type", "application/json");
        res.writeHead(this.statusCode, this.headers);
        res.end(JSON.stringify(data));
      },
    };

    try {
      if (req.url === "/api/signup" && req.method === "POST") {
        const signupHandler = (await import("./signup.js")).default;
        await signupHandler(requestObj, responseObj);
      } 
else if( req.url === "/api/login" && req.method === "POST") {
        const loginHandler = (await import("./login.js")).default;
        await loginHandler(requestObj, responseObj);
      }
      else if(req.url === "/api/verify-session" && req.method === "POST") {
        const verifySessionHandler = (await import("./verify-session.js")).default;
        await verifySessionHandler(requestObj, responseObj);
      }
else {
        responseObj.status(404).json({ error: "Endpoint not found" });
      }
    } catch (err) {
      console.error("Server error:", err);
      responseObj.status(500).json({ error: "Internal server error" });
    }
  });
});

server.listen(3001, () =>
  console.log(`Backend running at http://localhost:3001`)
);
