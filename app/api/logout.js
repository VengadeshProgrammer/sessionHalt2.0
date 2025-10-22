// api/logout.js
import cookie from "cookie";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    // Clear the cookie
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("sessionId", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api",
        maxAge: 0, // expire immediately
      })
    );

    res.status(200).json({ message: "Logged out successfully", redirectTo: "/login" });
  } catch (err) {
    console.error("Logout API error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
