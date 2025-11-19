import React, { useEffect, useState } from "react";
import firstPost from "../assets/firstPost.png";
import secondPost from "../assets/secondPost.png";
import Spinner from "../components/Spinner";
import { getCanvasNumericData } from "sessionhalt";
import { useNavigate } from "react-router-dom";

export default function SocialFeed() {
  const navigate = useNavigate();

  // Example static posts
  const posts = [
    { id: 1, title: "Design", img: firstPost },
    { id: 2, title: "3D Model", img: secondPost },
  ];

  const fingerprint = getCanvasNumericData();
  const [loaded, setLoaded] = useState(false);

  // ---------------------------------------------------------
  // AUTO LOGIN CHECK USING FINGERPRINT ONLY
  // ---------------------------------------------------------
  useEffect(() => {
  (async () => {
    try {
      const res = await fetch("http://localhost:3001/api/verify-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fingerprint })
      });

      const data = await res.json();
      console.log("VERIFY SESSION:", data);

      if (!data.authenticated) {
        navigate("/login");
        return;
      }

      setLoaded(true);
    } catch (err) {
      console.error("Verify failed:", err);
      navigate("/login");
    }
  })();
}, []);


  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return loaded ? (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-12">
      <h1 className="text-3xl sm:text-4xl font-bold mb-8 text-center text-gray-800">
        Social Feed
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <img
              src={post.img}
              alt={post.title}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {post.title}
              </h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : (
    <div className="w-screen h-screen flex justify-center items-center">
      <Spinner size="w-16 h-16" color="border-indigo-500" spinning={true} />
    </div>
  );
}
