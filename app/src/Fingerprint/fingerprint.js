function getDeviceInfo() {
  return {
    os: navigator.platform || "unknown",
    browser: navigator.userAgent || "unknown",
    deviceWidth: window.screen.width,
    deviceHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio,
    deviceMemory: navigator.deviceMemory || 0,
    deviceColorDepth: window.screen.colorDepth || 0,
    hardwareConcurrency: navigator.hardwareConcurrency || 0
  };
}
function detectCanvasTampering() {
    const canvas = document.createElement("canvas");
    const funcStr = HTMLCanvasElement.prototype.toDataURL.toString();
    const pointerOk = (canvas.toDataURL === HTMLCanvasElement.prototype.toDataURL);
         if (!funcStr.includes('[native code]') || !pointerOk) {
        alert("⚠️ Possible canvas.toDataURL() tampering detected!, Don't try to hack!");
        return "tampered";
        } else {
          console.log("Canvas toDataURL() looks good");
        return "notampered";
        }
  }
function getCanvasFingerprint() {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  ctx.textBaseline = "top";
  ctx.font = "14px 'Arial'";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f60";
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = "#069";
  ctx.fillText("Vengadesh", 2, 15);
  ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
  ctx.fillText("Vengadesh", 4, 17);

  return canvas.toDataURL();
}
export async function getFingerprintString() {
  if(detectCanvasTampering() === "tampered") {
    // code to remove the cookie and logout the user
    console.log("⚠️ Possible canvas.toDataURL() tampering detected!, Don't try to hack!");
    console.log(await logoutUser());
  } else {
  const canvasFP = getCanvasFingerprint();
  const deviceInfo = getDeviceInfo();

  // Convert device info object to string
  const deviceString = Object.values(deviceInfo).join("::");

  // Combine canvas + device info
  let combinedFingerprint = canvasFP + "::" + deviceString;
  return combinedFingerprint;
}
}