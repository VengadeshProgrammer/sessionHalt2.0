import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCanvasNumericData } from "sessionhalt";
import { sha256Hash } from "../sha256";
import Spinner from "../components/Spinner";
import { checkXSS } from "../../checkForXSS";
import { sanitizeURL } from "../../sanitizeUrl";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Generate fingerprint once
  const fingerprint = getCanvasNumericData();

  // ---------------------------------------------------------
  // AUTO LOGIN FEATURE
  // ---------------------------------------------------------
 // ---------------------------------------------------------
// AUTO LOGIN FEATURE
// ---------------------------------------------------------
useEffect(() => {
  sanitizeURL();

  (async () => {
    try {
      const res = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          fingerprint,
          buttonClicked: false,
        }),
      });

      const data = await res.json();
      console.log("AUTO-AUTH RESPONSE:", data);

      // ❌ No cookie / session invalid
      if (data.error) {
        setLoaded(true);
        return;
      }

      // 🔥 NEW: Direct match with backend auto-login response
      if (data.autoLogin === true && data.redirectTo) {
        navigate(data.redirectTo);
        return;
      }

    } catch (err) {
      console.error("AutoAuth failed:", err);
    } finally {
      setLoaded(true);
    }
  })();
}, [navigate, fingerprint]);


  // ---------------------------------------------------------
  // NORMAL LOGIN (email + password)
  // ---------------------------------------------------------
  async function handleOnLogin(e) {
    e.preventDefault();

    if (checkXSS(email) || checkXSS(password)) {
      alert("Please remove all script/anchor tags from input.");
      return;
    }

    if (!fingerprint) {
      alert("Fingerprint not ready, try again.");
      return;
    }

    setLoaded(false);

    const passwordHash = await sha256Hash(password);

    const res = await fetch("http://localhost:3001/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email,
        password: passwordHash,
        fingerprint,
        buttonClicked: true, // tells backend this is MANUAL LOGIN
      }),
    });

    const data = await res.json();
    console.log("LOGIN RESPONSE:", data);

    if (data.error) {
      alert(data.error);
      setLoaded(true);
      return;
    }

    if (data.redirectTo) {
      navigate(data.redirectTo);
    }
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return loaded ? (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-xl shadow-md">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-800">
          Log In
        </h2>

        <form className="space-y-4" onSubmit={handleOnLogin}>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 mt-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
          >
            Log In
          </button>
        </form>

        <p className="mt-4 text-center text-gray-500 text-sm sm:text-base">
          Don't have an account?{" "}
          <Link to="/" className="text-indigo-600 hover:underline">
            Signup
          </Link>
        </p>
      </div>
    </div>
  ) : (
    <div className="w-screen h-screen flex justify-center items-center">
      <Spinner size="w-16 h-16" color="border-indigo-500" spinning={true} />
    </div>
  );
};

export default Login;
