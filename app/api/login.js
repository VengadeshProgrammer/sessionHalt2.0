import { createClient } from "@supabase/supabase-js";
import { autoAuth } from "../src/autoAuth.js";
import cookie from "cookie";

const supabase = createClient(
process.env.SUPABASE_URL,
process.env.SUPABASE_ANON_KEY
);

const setSessionCookie = (res, sessionId) => {
res.setHeader(
"Set-Cookie",
cookie.serialize("sessionId", sessionId, {
httpOnly: true,
secure: process.env.NODE_ENV === "production",
sameSite: "lax",
maxAge: 1000 * 60 * 60 * 24 * 180, // 6 months
})
);
};

export default async function handler(req, res) {
if (req.method !== "POST")
return res.status(405).json({ error: "Method not allowed" });

// 🍪 1️⃣ Check cookies first
const cookies = cookie.parse(req.headers.cookie || "");
const sessionIdFromCookie = cookies.sessionId;

if (sessionIdFromCookie) {
console.log("🍪 Session ID from cookie:", sessionIdFromCookie);
// 2️⃣ Fetch fingerprints from Supabase
const { data: user, error } = await supabase
  .from("users")
  .select("fingerprints")
  .eq("session_id", sessionIdFromCookie)
  .single();

if (error) {
  console.error("Supabase error:", error);
  return res.status(500).json({ error: "Database query failed" });
}

if (user && user.fingerprints) {
  console.log("✅ Fingerprints found:", user.fingerprints);
  return res.status(200).json({
    success: true,
    fingerprints: user.fingerprints || [],
  });
}

// if no fingerprints found
return res.status(404).json({ error: "No fingerprints found" });
}

// 🧠 2️⃣ Parse request body (for login)
let body;
try {
body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
} catch (error) {
return res.status(400).json({ error: "Invalid JSON in request body" });
}

const { email, password, fingerprint } = body;
if (!email || !password)
return res.status(400).json({ error: "Email and password are required" });
if (!fingerprint)
return res.status(400).json({ error: "Fingerprint is required" });

// 🧩 3️⃣ Authenticate user
const { data: user, error } = await supabase
.from("users")
.select("id, password_hash, session_id, fingerprints")
.eq("email", email)
.single();

if (error || !user)
return res.status(401).json({ error: "Invalid email or password" });

if (password !== user.password_hash)
return res.status(401).json({ error: "Invalid password" });

// 🍪 5️⃣ Set session cookie
setSessionCookie(res, user.session_id);

return res.status(200).json({
message: "User authenticated",
redirectTo: "/home",
});
}