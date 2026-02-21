/**
 * ⚠️ DEPRECATED - Device Fingerprinting Module (No Longer Used)
 * 
 * This module is DEPRECATED and no longer used in the Zero Trust system.
 * 
 * Why deprecated:
 * - Browser-based fingerprinting has been replaced by agent-based authentication
 * - Agent system provides stronger device identification via secret tokens
 * - Agent heartbeat mechanism offers real-time device monitoring
 * - Phase B enterprise enforcement handles device trust and approval
 * 
 * Migration:
 * - Use agent token system instead (see backend/PHASE_B_AGENT_ENDPOINTS.py)
 * - Register devices via /agent/register endpoint
 * - Device authentication via /agent/heartbeat with secret tokens
 * 
 * This file is kept for backward compatibility only.
 * DO NOT USE in new code.
 * 
 * @deprecated Use agent-based device authentication instead
 * @module deviceFingerprint
 * @version 1.0.0 (DEPRECATED)
 */

// =============================================================================
// DEPRECATION WARNING
// =============================================================================

console.warn(
  '⚠️ deviceFingerprint.js is DEPRECATED. ' +
  'Use agent-based authentication instead. ' +
  'See backend/PHASE_B_AGENT_ENDPOINTS.py for migration guide.'
);

/**
 * Device Fingerprinting Module (LEGACY)
 * 
 * Generates deterministic, stable device UUIDs based on immutable device properties.
 * Uses SHA-256 hashing for secure identification without randomness.
 * 
 * Features:
 * - Zero randomness (all properties are deterministic)
 * - Persistent storage via localStorage
 * - 64-character hex string output
 * - No timestamp dependencies
 * - Browser-native Web Crypto API
 * 
 * @module deviceFingerprint
 * @version 1.0.0
 */

// =============================================================================
// STORAGE CONFIGURATION
// =============================================================================

const STORAGE_KEY = 'device_uuid';
const STORAGE_TIMEOUT = 1000; // milliseconds to wait for storage

// =============================================================================
// CORE FUNCTIONS
// =============================================================================

/**
 * Generate a deterministic device UUID from hardware/OS fingerprints
 * 
 * Uses only immutable device properties to create a stable fingerprint:
 * - Browser user agent (OS, browser version)
 * - Display language (regional setting)
 * - Operating system platform
 * - Screen resolution (width × height)
 * - Timezone (Intl API)
 * 
 * Hashed with SHA-256 to produce a 64-character hex string.
 * 
 * @async
 * @returns {Promise<string>} - SHA-256 hash of fingerprint (64 hex characters)
 * @throws {Error} - If Web Crypto API is unavailable
 * 
 * @example
 * const uuid = await generateDeviceUUID();
 * console.log(uuid); // 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6...' (64 chars)
 */
async function generateDeviceUUID() {
  // Verify Web Crypto API availability
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error(
      'Web Crypto API not available. ' +
      'Device fingerprinting requires HTTPS and modern browser.'
    );
  }

  try {
    // Build fingerprint from deterministic properties only
    // Order matters for consistent JSON serialization
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: {
        width: screen.width,
        height: screen.height
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // Convert fingerprint object to JSON string
    // JSON.stringify ensures consistent key ordering
    const fingerprintString = JSON.stringify(fingerprint);

    // Encode string to UTF-8 bytes for hashing
    const encoder = new TextEncoder();
    const fingerprintBuffer = encoder.encode(fingerprintString);

    // Generate SHA-256 hash using Web Crypto API (native browser crypto)
    // SHA-256 produces 32 bytes (256 bits)
    const hashBuffer = await crypto.subtle.digest('SHA-256', fingerprintBuffer);

    // Convert hash buffer to hexadecimal string
    // Uint8Array converts each byte (0-255) to 2-character hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');

    return hashHex;

  } catch (error) {
    console.error('Device UUID generation failed:', error);
    throw new Error(`Failed to generate device UUID: ${error.message}`);
  }
}

/**
 * Get device UUID from localStorage or create new one
 * 
 * Implements persistent device identification:
 * 1. Check if UUID already stored in localStorage
 * 2. If found, return existing UUID (no regeneration)
 * 3. If not found, generate new UUID via generateDeviceUUID()
 * 4. Store in localStorage with key 'device_uuid'
 * 
 * This ensures the same physical device always gets the same UUID,
 * even across browser restarts and sessions.
 * 
 * @async
 * @returns {Promise<string>} - Device UUID (from storage or newly generated)
 * @throws {Error} - If storage is unavailable
 * 
 * @example
 * // First call: generates and stores
 * const uuid1 = await getOrCreateDeviceUUID();
 * 
 * // Subsequent calls: returns from storage
 * const uuid2 = await getOrCreateDeviceUUID();
 * 
 * // Always true
 * console.log(uuid1 === uuid2); // true
 */
async function getOrCreateDeviceUUID() {
  const existingUUID = localStorage.getItem(STORAGE_KEY);

  if (existingUUID) {
    // UUID already stored, reuse it
    if (typeof existingUUID === 'string' && existingUUID.length === 64) {
      console.log('✓ Device UUID retrieved from localStorage');
      return existingUUID;
    } else {
      // Corrupted data, regenerate
      console.warn('⚠️  Corrupted device UUID in storage, regenerating...');
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // No valid UUID in storage, generate new one
  const newUUID = await generateDeviceUUID();

  // Store in localStorage for future use
  try {
    localStorage.setItem(STORAGE_KEY, newUUID);
    console.log('✓ Device UUID generated and stored in localStorage');
  } catch (error) {
    console.error('⚠️  Failed to store device UUID:', error);
    console.warn('Device UUID will not persist across sessions');
    // Continue anyway - just won't be stored
  }

  return newUUID;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Clear device UUID from localStorage
 * 
 * WARNING: Only call this explicitly on user action (e.g., logout, reset)
 * Clearing will cause device to be treated as new on next login.
 * 
 * @returns {void}
 * 
 * @example
 * // On logout
 * clearDeviceUUID();
 */
function clearDeviceUUID() {
  localStorage.removeItem(STORAGE_KEY);
  console.log('✓ Device UUID cleared from localStorage');
}

/**
 * Get currently stored device UUID (read-only)
 * 
 * @returns {string|null} - Device UUID if stored, null otherwise
 * 
 * @example
 * const uuid = getStoredDeviceUUID();
 * if (uuid) {
 *   console.log('Device already identified:', uuid);
 * } else {
 *   console.log('Device not yet registered');
 * }
 */
function getStoredDeviceUUID() {
  return localStorage.getItem(STORAGE_KEY);
}

/**
 * Display device UUID and fingerprint info (debugging)
 * 
 * Logs current device UUID and all fingerprint properties to console.
 * Useful for troubleshooting and development.
 * 
 * @async
 * @returns {Promise<string>} - Currently active device UUID
 * 
 * @example
 * // In browser console
 * await displayDeviceInfo();
 * // Output:
 * // ✓ Device UUID retrieved from localStorage
 * // Current Device UUID: a1b2c3d4...
 * // Length: 64 characters
 * // Fingerprint properties: {...}
 */
async function displayDeviceInfo() {
  const uuid = await getOrCreateDeviceUUID();

  const fingerprint = {
    'User Agent': navigator.userAgent,
    'Language': navigator.language,
    'Platform': navigator.platform,
    'Screen Resolution': `${screen.width}x${screen.height}`,
    'Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
  };

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📱 DEVICE FINGERPRINT INFORMATION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Device UUID:', uuid);
  console.log('UUID Length:', uuid.length, 'characters');
  console.log('\nFingerprint Properties:');
  console.table(fingerprint);
  console.log('═══════════════════════════════════════════════════════════\n');

  return uuid;
}

/**
 * Verify device UUID format and validity
 * 
 * @param {string} uuid - UUID to verify
 * @returns {Object} - Validation result with details
 * 
 * @example
 * const result = verifyDeviceUUID('a1b2c3d4...');
 * console.log(result);
 * // {
 * //   valid: true,
 * //   length: 64,
 * //   isHex: true,
 * //   errors: []
 * // }
 */
function verifyDeviceUUID(uuid) {
  const errors = [];

  if (!uuid) {
    errors.push('UUID is empty or undefined');
  }

  if (typeof uuid !== 'string') {
    errors.push(`UUID must be string, got ${typeof uuid}`);
  }

  if (uuid && uuid.length !== 64) {
    errors.push(`UUID must be 64 characters, got ${uuid.length}`);
  }

  if (uuid && !/^[0-9a-f]{64}$/.test(uuid)) {
    errors.push('UUID must contain only lowercase hex characters (0-9, a-f)');
  }

  return {
    valid: errors.length === 0,
    length: uuid ? uuid.length : 0,
    isHex: uuid ? /^[0-9a-f]{64}$/.test(uuid) : false,
    errors
  };
}

/**
 * Check if localStorage is available and writable
 * 
 * @returns {Promise<boolean>} - True if storage available, false otherwise
 * 
 * @example
 * if (await isStorageAvailable()) {
 *   console.log('Storage is available');
 * } else {
 *   console.warn('Storage unavailable (private mode?)');
 * }
 */
async function isStorageAvailable() {
  try {
    const testKey = `__device_fingerprint_test_${Date.now()}__`;
    const testValue = 'test';

    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);

    return retrieved === testValue;

  } catch (error) {
    console.warn('localStorage is not available:', error.message);
    return false;
  }
}

// =============================================================================
// FINGERPRINT PROPERTY HELPERS (Optional, for device registration)
// =============================================================================

/**
 * Extract device name from user agent
 * 
 * Used for device registration to provide human-readable device name.
 * Examples: 'iPhone', 'MacBook', 'Windows PC', 'Android Phone'
 * 
 * @returns {string} - Device name
 * 
 * @example
 * const name = getDeviceName();
 * // 'iPhone' or 'MacBook Pro' etc
 */
function getDeviceName() {
  const ua = navigator.userAgent;

  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Mac')) return 'MacBook';
  if (ua.includes('Windows')) return 'Windows PC';
  if (ua.includes('Linux')) return 'Linux Device';
  if (ua.includes('Android')) return 'Android Phone';

  return 'Unknown Device';
}

/**
 * Extract operating system details from user agent
 * 
 * Attempts to identify and version the operating system.
 * Examples: 'iOS 17.3', 'macOS 14.2', 'Windows 11', 'Android 13'
 * 
 * @returns {string} - Operating system identifier with version
 * 
 * @example
 * const os = getOperatingSystem();
 * // 'iOS 17.3' or 'macOS 14.2' etc
 */
function getOperatingSystem() {
  const ua = navigator.userAgent;

  // iOS detection
  const iosMatch = ua.match(/OS (\d+_\d+)/);
  if (iosMatch) return `iOS ${iosMatch[1].replace('_', '.')}`;

  // macOS detection
  const macMatch = ua.match(/Mac OS X (\d+_\d+)/);
  if (macMatch) return `macOS ${macMatch[1].replace('_', '.')}`;

  // Windows detection
  if (ua.includes('Windows NT 10.0')) return 'Windows 10';
  if (ua.includes('Windows NT 11.0')) return 'Windows 11';

  // Android detection
  const androidMatch = ua.match(/Android (\d+)/);
  if (androidMatch) return `Android ${androidMatch[1]}`;

  return 'Unknown OS';
}

// =============================================================================
// INTEGRATION HELPERS
// =============================================================================

/**
 * Complete login flow with device UUID
 * 
 * This function handles the login process with device identification.
 * 
 * IMPORTANT: Device registration is separate from login.
 * On 428 response, user must register device via separate flow.
 * Do NOT attempt auto-registration here (creates circular dependency).
 * 
 * Flow:
 * 1. Get or create device UUID from fingerprint
 * 2. Send login request with device_uuid
 * 3. If 428: User must register device first (separate endpoint/flow)
 * 4. If 403: Device is inactive or untrusted
 * 5. If 200: Login successful, store tokens
 * 
 * @async
 * @param {string} username - User email or username
 * @param {string} password - User password
 * @param {string} [apiEndpoint='/login'] - API endpoint URL
 * @returns {Promise<Object>} - Login response with tokens and device info
 * @throws {Error} - If login fails
 * 
 * @example
 * try {
 *   const result = await performLogin('user@example.com', 'password123');
 *   console.log('Login successful!');
 *   console.log('Device ID:', result.device_id);
 * } catch (error) {
 *   if (error.message.includes('must be registered')) {
 *     // Show device registration UI
 *     showDeviceRegistrationFlow();
 *   }
 * }
 */
async function performLogin(username, password, apiEndpoint = '/login') {
  try {
    // Step 1: Get or create device UUID from fingerprint
    const deviceUUID = await getOrCreateDeviceUUID();
    console.log(`📱 Using device UUID: ${deviceUUID.substring(0, 16)}...`);

    // Step 2: Call login endpoint with device_uuid (required by Phase 2)
    const loginResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        password,
        device_uuid: deviceUUID
      })
    });

    // Step 3: Handle 428 (device not registered)
    // Device registration MUST happen separately (before login or via pre-auth endpoint)
    // Do NOT attempt auto-registration here - creates circular dependency
    if (loginResponse.status === 428) {
      const errorData = await loginResponse.json();
      console.error('⚠️  Device not registered. Device registration required.');
      throw new Error(errorData.detail || 'Device must be registered before login');
    }

    // Step 4: Handle 403 (device inactive or untrusted)
    if (loginResponse.status === 403) {
      const errorData = await loginResponse.json();
      console.error('⚠️  Device access denied:', errorData.detail);
      throw new Error(errorData.detail);
    }

    // Step 5: Handle other errors
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(errorData.detail || `Login failed with status ${loginResponse.status}`);
    }

    // Step 6: Success - parse and store response
    const data = await loginResponse.json();

    // Store authentication tokens and device info
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('device_id', data.device_id);
    localStorage.setItem('session_id', data.session_id);

    console.log('✅ Login successful!');
    console.log(`Device ID: ${data.device_id}`);
    console.log(`Location: ${data.location}`);

    return data;

  } catch (error) {
    console.error('❌ Login error:', error.message);
    throw error;
  }
}

/**
 * Register device on backend
 * 
 * Calls the device registration endpoint to register the current device.
 * This is called automatically during login if device is not registered.
 * 
 * @async
 * @param {string} deviceUUID - Device UUID from fingerprinting
 * @param {string} deviceName - Human-readable device name
 * @param {string} osName - Operating system identifier
 * @param {string} authToken - JWT authentication token
 * @param {string} [apiEndpoint='/devices/register'] - API endpoint URL
 * @returns {Promise<boolean>} - True if registration successful
 * 
 * @example
 * const success = await registerDevice(
 *   uuid,
 *   'iPhone 15',
 *   'iOS 17.3',
 *   jwtToken
 * );
 */
async function registerDevice(
  deviceUUID,
  deviceName,
  osName,
  authToken,
  apiEndpoint = '/devices/register'
) {
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        device_uuid: deviceUUID,
        device_name: deviceName,
        os: osName
      })
    });

    if (response.ok) {
      console.log('✅ Device registered successfully');
      return true;
    } else {
      const error = await response.json();
      console.error('❌ Device registration failed:', error.detail);
      return false;
    }

  } catch (error) {
    console.error('Device registration error:', error);
    return false;
  }
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

// For ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateDeviceUUID,
    getOrCreateDeviceUUID,
    clearDeviceUUID,
    getStoredDeviceUUID,
    displayDeviceInfo,
    verifyDeviceUUID,
    isStorageAvailable,
    getDeviceName,
    getOperatingSystem,
    performLogin,
    registerDevice
  };
}

// For browser globals (if not using modules)
if (typeof window !== 'undefined') {
  window.deviceFingerprint = {
    generateDeviceUUID,
    getOrCreateDeviceUUID,
    clearDeviceUUID,
    getStoredDeviceUUID,
    displayDeviceInfo,
    verifyDeviceUUID,
    isStorageAvailable,
    getDeviceName,
    getOperatingSystem,
    performLogin,
    registerDevice
  };
}

// ES6 exports for Vite/React
export {
  generateDeviceUUID,
  getOrCreateDeviceUUID,
  clearDeviceUUID,
  getStoredDeviceUUID,
  displayDeviceInfo,
  verifyDeviceUUID,
  isStorageAvailable,
  getDeviceName,
  getOperatingSystem,
  performLogin,
  registerDevice
};
