import { createClient } from "@supabase/supabase-js";
import cookie from "cookie";

export default async function handler(req, res) {
  try {
    console.log("AutoAuth handler called");
    
    // Use environment variables passed from server.js
    const supabaseUrl = req.env?.SUPABASE_URL;
    const supabaseKey = req.env?.SUPABASE_ANON_KEY;

    console.log('AutoAuth - Environment:', {
      supabaseUrl: supabaseUrl ? 'Loaded' : 'Missing',
      supabaseKey: supabaseKey ? 'Loaded' : 'Missing'
    });

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method !== "POST")
      return res.status(405).json({ error: "Method not allowed" });

    // Parse cookies
    const cookies = cookie.parse(req.headers.cookie || "");
    const sessionId = cookies.sessionId;

    // Parse the JSON string from req.body
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (error) {
      return res.status(400).json({ error: "Invalid JSON in request body" });
    }

    const { fingerprint, accountFingerprint } = body; // This is now the CANVAS fingerprint object
    
    console.log("Received fingerprint type:", typeof fingerprint);
    console.log("Received fingerprint:", fingerprint);
    
    if (!sessionId || !fingerprint)
      return res.status(400).json({ error: "All fields are required" });

    // 🎯 UPDATED VALIDATION FOR CANVAS FINGERPRINT
    if (!isValidCanvasFingerprint(fingerprint)) {
      return res.status(400).json({ 
        error: "Invalid canvas fingerprint format",
        expected: "Canvas fingerprint object with imageHash, colorDistribution, etc."
      });
    }
    if(accountFingerprint!=null||accountFingerprint!=undefined){
    // Send canvas fingerprint to ML model for similarity analysis
    const mlResult = await sendToMLModel(fingerprint, accountFingerprint);
    console.log("ML Result:", mlResult);

    // Return the ML result to the client
    return res.status(200).json({
      success: true,
      mlResult: mlResult
    });
  }
  } catch (err) {
    console.error("API ERROR:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

// 🎯 NEW VALIDATION FUNCTION FOR CANVAS FINGERPRINTS
function isValidCanvasFingerprint(fingerprint) {
  if (typeof fingerprint !== 'object' || fingerprint === null) {
    console.error('Fingerprint is not an object');
    return false;
  }

  // Check for required canvas fingerprint fields
  const requiredFields = [
    'imageHash', 'colorDistribution', 'gradientPatterns',
    'edgeDetection', 'noisePattern', 'entropy',
    'contrast', 'meanBrightness', 'renderingArtifacts'
  ];

  for (let field of requiredFields) {
    if (fingerprint[field] === undefined) {
      console.error(`Missing required field: ${field}`);
      return false;
    }
  }

  // Validate specific field types
  if (typeof fingerprint.imageHash !== 'number') {
    console.error('imageHash must be a number');
    return false;
  }

  if (typeof fingerprint.colorDistribution !== 'object' || 
      !fingerprint.colorDistribution.r || 
      !fingerprint.colorDistribution.g || 
      !fingerprint.colorDistribution.b) {
    console.error('colorDistribution must be an object with r, g, b properties');
    return false;
  }

  if (!Array.isArray(fingerprint.gradientPatterns)) {
    console.error('gradientPatterns must be an array');
    return false;
  }

  // All validations passed
  console.log('✅ Canvas fingerprint validation passed');
  return true;
}

// 🎯 IMPROVED ML MODEL COMMUNICATION
async function sendToMLModel(canvasFingerprint, accountFingerprint) {
  console.log("Sending canvas fingerprint to ML model...");
  
  try {
    console.log("Sending accountFingerprint", accountFingerprint);
    const mlResponse = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_fingerprint: {
          device: "user_current_device",
          canvasFingerprint: canvasFingerprint,
          accountFingerprint 
        },
      })
    });

    const mlResult = await mlResponse.json(); // ✅ read once only

    if (!mlResponse.ok) {
      throw new Error(`ML model error: ${mlResponse.status} - ${mlResult.error || mlResult.details || mlResponse.statusText}`);
    }

    console.log("✅ ML Analysis Result:", mlResult);
    return mlResult;

  } catch (error) {
    console.error('❌ ML Model connection failed:', error.message);
    
    // Check if ML server is running
    try {
      const healthResponse = await fetch('http://localhost:5000/health');
      if (!healthResponse.ok) {
        return {
          error: "ML server is not responding",
          details: "Make sure the ML server is running on port 5000"
        };
      }
    } catch (healthError) {
      return {
        error: "ML server is not running",
        details: "Start the ML server with: node server.js",
        solution: "Run 'node server.js' in your ML project directory"
      };
    }

    return {
      error: "ML analysis failed",
      details: error.message
    };
  }
}
