// generateSessionId.js - Universal (Browser + Node.js)
import crypto from 'crypto';

function generateSessionId() {
  try {
    // Browser environment (mobile + desktop)
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(32);
      window.crypto.getRandomValues(array);
      return Array.from(array).map(b => b.toString(16).padStart(2, "0")).join("");
    }
    // Node.js environment (using ES modules)
    else {
      // Since we're importing crypto at the top, we can use it directly
      return crypto.randomBytes(32).toString('hex');
    }
  } catch (error) {
    console.error('Session ID generation failed:', error);
    // Fallback - less secure but functional
    return Array.from({length: 64}, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

export { generateSessionId };