import { createClient } from "@supabase/supabase-js";
import { generateSessionId } from "./generateSessionId.js";
import cookie from "cookie";
import dotenv from 'dotenv';

dotenv.config();
console.log(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, "from line 4 of api/signup.js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const setSessionCookie = (res, sessionId) => {
  res.setHeader("Set-Cookie", cookie.serialize("sessionId", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api",
    maxAge: 180 * 24 * 60 * 60 // 180 days
  }));
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { email, username, password, fingerprint } = body;

  if (!email || !username || !password || !fingerprint)
    return res.status(400).json({ error: "All fields are required" });

  try {
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const sessionId = generateSessionId();

    const { data: newUser, error } = await supabase
      .from("users")
      .insert([{ email, username, password_hash: password, fingerprints: [fingerprint], session_id: sessionId }])
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    setSessionCookie(res, sessionId);
    res.status(200).json({ message: "User authenticated", redirectTo: "/home" });

  } catch (err) {
    console.error("Signup API error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
