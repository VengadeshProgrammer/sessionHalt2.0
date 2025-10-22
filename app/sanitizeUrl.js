export function sanitizeURL() {
  // Get full URL and query params
  const url = new URL(window.location.href);

  // Remove <script> or javascript: attempts in query parameters
  for (const [key, value] of url.searchParams.entries()) {
    // Remove any script tags or javascript: payloads
    const cleanValue = value
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/data:text\/html/gi, "");

    // If it changed, update the param
    if (cleanValue !== value) {
      url.searchParams.set(key, cleanValue);
    }
  }

  // Remove script or javascript: in hash fragment (# part)
  const cleanHash = url.hash
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "");

  if (cleanHash !== url.hash) url.hash = cleanHash;

  // Replace the URL without reloading
  window.history.replaceState({}, "", url.toString());
};
