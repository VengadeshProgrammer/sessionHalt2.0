// api/signup.js
import { createClient } from "@supabase/supabase-js";
import cookie from "cookie";
import { generateSessionId } from "./generateSessionId.js";

export default async function handler(req, res) {
  // Only POST
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // env (support server injecting env via req.env or fallback to process.env)
  const SUPABASE_URL = req.env?.SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_KEY = req.env?.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(500).json({ error: "Server config missing" });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // parse body
  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { email, username, password, fingerprint } = body;
  if (!email || !username || !password || !fingerprint) {
    return res.status(400).json({ error: "email, username, password and fingerprint required" });
  }

  if (!Array.isArray(fingerprint)) {
    return res.status(400).json({ error: "fingerprint must be an array" });
  }

  try {
    // check existing
    const { data: existing } = await supabase.from("users").select("id").eq("email", email).single();
    if (existing) return res.status(400).json({ error: "User already exists" });

    const sessionId = generateSessionId();

    // store as array-of-arrays
    const fingerprintsToStore = [fingerprint];

    const { data: newUser, error } = await supabase
      .from("users")
      .insert([{
        email,
        username,
        password_hash: password,
        fingerprints: fingerprintsToStore,
        session_id: sessionId
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "DB insert failed", details: error.message || error });
    }

    // set cookie
    res.setHeader("Set-Cookie", cookie.serialize("sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 180 * 24 * 60 * 60 // 180 days
    }));

    return res.status(200).json({ message: "User created", redirectTo: "/home" });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
