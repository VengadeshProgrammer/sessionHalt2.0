export async function autoAuth(fingerprint, accountFingerprint) {
  try {
    console.log("Sending fingerprint to server:", fingerprint);
    

    const res = await fetch("http://localhost:3001/api/autoauth", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint,accountFingerprint }),
    });

    const text = await res.text();
    console.log("Server response:", text);
    
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