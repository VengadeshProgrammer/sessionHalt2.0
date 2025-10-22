import React from 'react'
import { useNavigate } from 'react-router-dom';
const Logout = () => {
  const navigate = useNavigate();
    async function logoutUser() {
  const res = await fetch("/api/logout", {
      method: "POST",
      credentials: "include", // ✅ sends the cookie (sessionId)
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    if (data?.redirectTo) {
      navigate(data.redirectTo); // React Router redirect
    }
    }
    return (
    <div>
        <button onClick={logoutUser} className="hover:cursor-pointer hover:bg-gray-700 p-2 rounded-md">
            Logout
        </button>
    </div>
    );
}

export default Logout
