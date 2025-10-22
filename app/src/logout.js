// src/logout.js
export async function logoutUser(navigate) {
  try {
    const res = await fetch("/api/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (data?.redirectTo) {
      // Use React Router navigate if you pass it
      if (navigate) {
        navigate(data.redirectTo);
      } else {
        // fallback: redirect with window.location
        window.location.href = data.redirectTo;
      }
    }

    return data;
  } catch (err) {
    console.error("Logout failed:", err);
    return { error: "Network/server error" };
  }
}
