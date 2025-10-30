import React, { useEffect } from 'react'
import { Link } from 'react-router-dom';
import { sha256Hash } from '../sha256';
// import {getFingerprint} from "../Fingerprint/fingerprint";
import { getFingerprint} from "sessionhalt"
import { autoAuth } from '../autoAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Spinner from '../components/Spinner';
import { checkXSS } from '../../checkForXSS';
import { sanitizeURL } from '../../sanitizeUrl';
const Signup = () => {
  const navigate = useNavigate();
  const [username, setUsername] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [Loaded, setLoaded] = useState(false);
  const fingerprint = getFingerprint();
useEffect(() => {
  sanitizeURL();
  (async () => {
    try {
      // Get the accountFingerprints first.
      let accountFingerprints = await fetch("http://localhost:3001/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  accountFingerprints = await accountFingerprints.json();
   // ------------
      console.log("Downsampled WebGL Fingerprint Length:", fingerprint.length);
      const res = await autoAuth(fingerprint, accountFingerprints.fingerprints);

      if (!res.error && res.mlResult.result==="Legitimate Change") {
        navigate("/home");
      } else if (res?.error) {
        console.warn("AutoAuth error:", res.error);
        setLoaded(true);
      }
    } catch (err) {
      console.error("AutoAuth failed:", err);
      setLoaded(true);
    }
  })();
}, [navigate]);


  async function handleOnSignup(e) {
  e.preventDefault();
  if(checkXSS(email) || checkXSS(password) || checkXSS(username)) {
    alert("Please remove all the anchprs and script tags from input fields");
    return;
  }
  else {
  setLoaded(false);
  let passwordHash = await sha256Hash(password);
  const fingerprint = getFingerprint();
  
  const res = await fetch("http://localhost:3001/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      email,
      username,
      password: passwordHash,
      fingerprint,
    }),
  });
  
  const data = await res.json();
  console.log(data);
  
  // ADD THIS: Handle redirect after signup
  if (data?.redirectTo) {
    navigate(data.redirectTo);
  } else if (data?.error) {
    console.error("Signup error:", data.error);
    setLoaded(true); // Make sure to show the form again on error
  }
}
}
  return (
    Loaded ? 
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-6 sm:p-8 rounded-xl shadow-md">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-800">
          Sign Up
        </h2>
        <form className="space-y-4" onSubmit={handleOnSignup}>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">Email</label>
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
            <label className="block text-gray-700 text-sm font-medium mb-1">Password</label>
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
            Sign Up
          </button>
        </form>

        <p className="mt-4 text-center text-gray-500 text-sm sm:text-base">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div> : <div className="w-screen h-screen flex justify-center items-center"><Spinner size="w-16 h-16" color="border-indigo-500" spinning={true} /></div>
  ) 
}

export default Signup