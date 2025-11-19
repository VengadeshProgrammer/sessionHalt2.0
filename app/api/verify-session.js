// api/verify-session.js
import cookie from "cookie";
import { createClient } from "@supabase/supabase-js";
import { sendToMLModel } from "./sendToMLModel.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function normalizeFingerprintArray(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const item of raw) {
    if (Array.isArray(item)) out.push(item);
    else if (typeof item === "string") {
      try {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) out.push(parsed);
      } catch {
        // ignore
      }
    }
  }
  return out;
}

const setSessionCookie = (resObj, sessionId) => {
  resObj.setHeader("Set-Cookie", cookie.serialize("sessionId", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 180 * 24 * 60 * 60
  }));
};

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // parse body safely
  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const cookies = cookie.parse(req.headers.cookie || "");
  const sessionId = cookies.sessionId;
  if (!sessionId) return res.status(401).json({ error: "No session" });

  const fingerprint = body.fingerprint;
  if (!Array.isArray(fingerprint)) return res.status(400).json({ error: "Fingerprint required" });

  // fetch user by session_id
  const { data: user, error } = await supabase
    .from("users")
    .select("id, fingerprints, session_id")
    .eq("session_id", sessionId)
    .single();

  if (error || !user) return res.status(401).json({ error: "Invalid or expired session" });

  const accountFingerprints = normalizeFingerprintArray(user.fingerprints);

  try {
    const mlResult = await sendToMLModel(fingerprint, accountFingerprints);

    if (mlResult.classification === "SessionStealer") {
      return res.json({ authenticated: false, reason: "SessionStealer detected", mlResult });
    }

    if (mlResult.classification === "Legitimate Change") {
      // update the matched slot with fresh fingerprint
      const idx = mlResult.bestMatchIndex;
      const arr = accountFingerprints.slice();
      if (typeof idx === "number" && idx >= 0 && idx < arr.length) {
        arr[idx] = fingerprint;
        await supabase.from("users").update({ fingerprints: arr }).eq("id", user.id);
      }
      // renew cookie
      setSessionCookie(res, user.session_id);
      return res.json({ authenticated: true, mlResult });
    }

    // Unknown ML response -> be cautious; deny or accept? for POC we'll accept but return result.
    return res.json({ authenticated: true, mlResult });

  } catch (err) {
    console.error("verify-session ML error:", err);
    return res.status(500).json({ error: "ML verification failed" });
  }
}
