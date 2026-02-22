/**
 * Browser Location Capture for Zero-Trust Login
 * Supports Netlify deployment with browser geolocation API
 */

export async function captureBrowserLocation() {
  console.log("🌍 [Location] Starting location capture...");
  
  if (!navigator || !navigator.geolocation) {
    console.warn("⚠️ [Location] Geolocation not supported by browser");
    return {
      permission_status: "not_supported",
      latitude: null,
      longitude: null,
      accuracy_m: null
    };
  }

  try {
    // Check permission state if API available (modern browsers)
    if (navigator.permissions) {
      try {
        const permissionStatus = await navigator.permissions.query({ name: "geolocation" });
        console.log(`📍 [Location] Permission status: ${permissionStatus.state}`);
        if (permissionStatus.state === "denied") {
          console.warn("❌ [Location] Permission denied by user");
          return {
            permission_status: "denied",
            latitude: null,
            longitude: null,
            accuracy_m: null
          };
        }
      } catch (permError) {
        console.log("⚠️ [Location] Permissions API not supported, will prompt user");
        // permissions API not fully supported in all browsers, continue to geolocation prompt
      }
    }

    // Request geolocation (will prompt user if permission not yet granted)
    console.log("📡 [Location] Requesting position from browser...");
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 8000,
        maximumAge: 0,
        enableHighAccuracy: false // faster, suitable for login
      });
    });

    console.log(`✅ [Location] Position captured: ${position.coords.latitude}, ${position.coords.longitude} (±${position.coords.accuracy}m)`);
    return {
      permission_status: "granted",
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy_m: position.coords.accuracy
    };
  } catch (error) {
    // User denied or timeout occurred
    console.error("❌ [Location] Error capturing location:", error);
    if (error.code === 1) {
      console.warn("🚫 [Location] User denied permission");
      return {
        permission_status: "denied",
        latitude: null,
        longitude: null,
        accuracy_m: null
      };
    } else if (error.code === 2) {
      console.warn("📍 [Location] Position unavailable");
      return {
        permission_status: "unavailable",
        latitude: null,
        longitude: null,
        accuracy_m: null
      };
    } else if (error.code === 3) {
      console.warn("⏱️ [Location] Timeout - location took too long");
      return {
        permission_status: "timeout",
        latitude: null,
        longitude: null,
        accuracy_m: null
      };
    }

    return {
      permission_status: "error",
      latitude: null,
      longitude: null,
      accuracy_m: null
    };
  }
}
