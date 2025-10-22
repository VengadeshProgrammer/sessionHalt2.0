export async function autoAuth(fingerprint) {
  try {
    const res = await fetch("http://localhost:3001/api/autoauth", {  // ✅ absolute path
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint }),
    });

    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      console.error("Server returned non-JSON:", text);
      return { error: "Server returned invalid response" };
    }
  } catch (err) {
    console.error("Fetch error:", err);
    return { error: "Network/server error" };
  }
}
