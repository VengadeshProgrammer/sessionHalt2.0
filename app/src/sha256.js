// sha256.js
import { sha256 } from "js-sha256"; // run: npm install js-sha256

export async function sha256Hash(message) {
  try {
    // Prefer Web Crypto only on secure contexts (HTTPS or localhost)
    if (window.isSecureContext && window.crypto?.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    } else {
      console.warn("Insecure context detected — using js-sha256 fallback");
      return sha256(message);
    }
  } catch (err) {
    console.error("sha256Hash() failed:", err);
    // fallback for older browsers or insecure context
    return sha256(message);
  }
}
