// api/login.js
import { createClient } from "@supabase/supabase-js";
import cookie from "cookie";
import { sendToMLModel } from "./sendToMLModel.js"; // returns { classification, bestMatchIndex? }

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const setSessionCookie = (resObj, sessionId) => {
  resObj.setHeader("Set-Cookie", cookie.serialize("sessionId", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 180 * 24 * 60 * 60
  }));
};

// Normalize + produce map: normalized = [valid arrays], origIndexMap = [indexes in raw array]
function normalizeAndMap(raw) {
  const normalized = [];
  const origIndexMap = [];
  if (!Array.isArray(raw)) return { normalized, origIndexMap };

  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (Array.isArray(item)) {
      normalized.push(item);
      origIndexMap.push(i);
    } else if (typeof item === "string") {
      // maybe stored as JSON string
      try {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed)) {
          normalized.push(parsed);
          origIndexMap.push(i);
        }
      } catch (err) {
        // ignore unparsable
      }
    } else {
      // ignore null/undefined/other
    }
  }
  return { normalized, origIndexMap };
}

// Replace rawFingerprints at rawIndex or append if rawIndex === null
async function writeBackFingerprint(userId, rawFingerprints, rawIndexToReplace, newFingerprint) {
  // make a shallow copy to preserve holes
  const arr = Array.isArray(rawFingerprints) ? rawFingerprints.slice() : [];

  if (typeof rawIndexToReplace === "number" && rawIndexToReplace >= 0) {
    arr[rawIndexToReplace] = newFingerprint;
  } else {
    // append
    arr.push(newFingerprint);
  }

  const { error } = await supabase
    .from("users")
    .update({ fingerprints: arr })
    .eq("id", userId);

  if (error) throw error;
  return arr;
}

// Safe exact-match; returns rawIndex if found else -1
function findExactMatchRawIndex(rawFingerprints, incomingFp) {
  if (!Array.isArray(rawFingerprints)) return -1;
  for (let i = 0; i < rawFingerprints.length; i++) {
    const stored = rawFingerprints[i];
    if (!Array.isArray(stored)) continue;
    if (stored.length !== incomingFp.length) continue;
    let same = true;
    for (let k = 0; k < stored.length; k++) {
      if (stored[k] !== incomingFp[k]) { same = false; break; }
    }
    if (same) return i;
  }
  return -1;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // parse body
  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (err) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const cookies = cookie.parse(req.headers.cookie || "");
  const sessionIdFromCookie = cookies.sessionId;

  const { email, password, fingerprint, buttonClicked } = body;

  // ---------- AUTO-AUTH via cookie (no buttonClicked)
  if (sessionIdFromCookie && !buttonClicked) {
    // fetch user by session id
    const { data: user, error } = await supabase
      .from("users")
      .select("id, fingerprints, session_id")
      .eq("session_id", sessionIdFromCookie)
      .single();

    if (error || !user) {
      console.warn("Auto-auth: invalid session or DB error", error);
      return res.status(401).json({ error: "Invalid session" });
    }

    if (!Array.isArray(fingerprint)) {
      return res.status(400).json({ error: "Fingerprint required for auto-auth" });
    }

    // normalize and map
    const { normalized, origIndexMap } = normalizeAndMap(user.fingerprints);
    if (normalized.length === 0) {
      return res.status(401).json({ autoLogin: false, message: "No stored fingerprints" });
    }

    try {
      const ml = await sendToMLModel(fingerprint, normalized);
      console.log("AUTO-AUTH ML =>", ml);

      if (ml && ml.classification === "Legitimate Change") {
        const normIdx = typeof ml.bestMatchIndex === "number" ? ml.bestMatchIndex : -1;
        const rawIndex = (normIdx >= 0 && normIdx < origIndexMap.length) ? origIndexMap[normIdx] : null;
        // replace
        await writeBackFingerprint(user.id, user.fingerprints, rawIndex, fingerprint);
        // renew cookie
        setSessionCookie(res, user.session_id);
        return res.status(200).json({ autoLogin: true, message: "Auto-login successful", redirectTo: "/home" });
      } else {
        // SessionStealer (or inconclusive) - deny auto-login
        return res.status(401).json({ autoLogin: false, message: "Auto auth failed", mlResult: ml });
      }
    } catch (err) {
      console.error("Auto-auth ML error:", err);
      return res.status(500).json({ error: "Auto-auth failed" });
    }
  }

  // ---------- MANUAL LOGIN (buttonClicked true)
  if (!email || !password || !Array.isArray(fingerprint)) {
    return res.status(400).json({ error: "Email, password and fingerprint required" });
  }

  try {
    // get user by email
    const { data: user, error } = await supabase
      .from("users")
      .select("id, password_hash, session_id, fingerprints")
      .eq("email", email)
      .single();

    if (error || !user) return res.status(401).json({ error: "Invalid email or password" });

    // compare hashed password (client hashes before send)
    if (user.password_hash !== password) return res.status(401).json({ error: "Invalid email or password" });

    // 1) If exact match exists in raw DB -> replace at that raw index and login
    const exactRawIndex = findExactMatchRawIndex(user.fingerprints, fingerprint);
    if (exactRawIndex >= 0) {
      await writeBackFingerprint(user.id, user.fingerprints, exactRawIndex, fingerprint);
      setSessionCookie(res, user.session_id);
      return res.status(200).json({ message: "User authenticated (exact match)", redirectTo: "/home" });
    }

    // 2) No exact -> normalize + send ML
    const { normalized, origIndexMap } = normalizeAndMap(user.fingerprints);

    const ml = await sendToMLModel(fingerprint, normalized || []);
    console.log("MANUAL LOGIN ML =>", ml);

    if (ml && ml.classification === "Legitimate Change") {
      const normIdx = typeof ml.bestMatchIndex === "number" ? ml.bestMatchIndex : -1;
      const rawIndex = (normIdx >= 0 && normIdx < origIndexMap.length) ? origIndexMap[normIdx] : null;
      await writeBackFingerprint(user.id, user.fingerprints, rawIndex, fingerprint);
      setSessionCookie(res, user.session_id);
      return res.status(200).json({ message: "User authenticated (legit change replaced)", redirectTo: "/home" });
    }

    if (ml && ml.classification === "SessionStealer") {
      // manual login: treat as new device -> append
      await writeBackFingerprint(user.id, user.fingerprints, null, fingerprint);
      setSessionCookie(res, user.session_id);
      return res.status(200).json({ message: "User authenticated (new device appended)", redirectTo: "/home", mlResult: ml });
    }

    // fallback: append and login
    await writeBackFingerprint(user.id, user.fingerprints, null, fingerprint);
    setSessionCookie(res, user.session_id);
    return res.status(200).json({ message: "User authenticated (fallback append)", redirectTo: "/home", mlResult: ml });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
