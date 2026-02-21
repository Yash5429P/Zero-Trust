/**
 * Browser Console Diagnostic Tool for Login/Register
 * Copy and paste into browser console (F12) to debug form submissions
 */

console.log("=== LOGIN/REGISTER DIAGNOSTIC TOOL ===\n");

// Intercept fetch to log all API calls
const originalFetch = window.fetch;
window.fetch = function(...args) {
  const url = args[0];
  const options = args[1] || {};
  
  if (url.includes("/login") || url.includes("/register")) {
    console.log(`\n📤 API Request:`);
    console.log(`  URL: ${url}`);
    console.log(`  Method: ${options.method || 'GET'}`);
    try {
      const body = JSON.parse(options.body || '{}');
      console.log(`  Payload:`, body);
    } catch (e) {
      console.log(`  Payload:`, options.body);
    }
  }
  
  return originalFetch.apply(this, arguments).then(res => {
    if (url.includes("/login") || url.includes("/register")) {
      console.log(`  Status: ${res.status} ${res.statusText}`);
    }
    return res;
  });
};

console.log("✓ Fetch interceptor active");
console.log("✓ All API calls will be logged in console");
console.log("\nNow try to login or register - check the console for details!");
