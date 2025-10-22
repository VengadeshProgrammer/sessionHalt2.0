import { createClient } from "@supabase/supabase-js";
import cookie from "cookie";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const setSessionCookie = (res, sessionId) => {
  res.setHeader("Set-Cookie", cookie.serialize("sessionId", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 180 // 6 months
  }));
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Parse the JSON string from req.body
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (error) {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }

  const { email, password, fingerprint } = body; // Now use the parsed body

  console.log("Received:", email, password);
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  if (!fingerprint) return res.status(400).json({ error: "Fingerprint is required" });

  try {
    // Find user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("id, password_hash, session_id, fingerprints")
      .eq("email", email)
      .single();

    if (error || !user) return res.status(401).json({ error: "Invalid email or password" });

    // Compare password directly (already hashed on client)
    if (password !== user.password_hash) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Append fingerprint if not already stored
    const fingerprints = user.fingerprints || [];
    const sessionId = user.session_id;

    if (!fingerprints.includes(fingerprint)) {
      const newFingerprints = [...fingerprints, fingerprint];
      const { error: updateError } = await supabase
        .from("users")
        .update({ fingerprints: newFingerprints })
        .eq("id", user.id);
      if (updateError) console.error("Error updating fingerprints:", updateError);
    }

    setSessionCookie(res, sessionId);
    res.status(200).json({ message: "User authenticated", redirectTo: "/home" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}