import { useState, useEffect } from "react";
import { loginUser, registerUser } from "../api/api";
import { useNavigate } from "react-router-dom";

// GOOGLE OAUTH - DISABLED
// All Google OAuth functions commented out - using manual login only
// 
// // Load Google's sign-in script
// const loadGoogleScript = () => {
//   return new Promise((resolve) => {
//     if (window.google) {
//       resolve();
//       return;
//     }
//     const script = document.createElement("script");
//     script.src = "https://accounts.google.com/gsi/client";
//     script.async = true;
//     script.defer = true;
//     script.onload = () => {
//       setTimeout(resolve, 100);
//     };
//     document.head.appendChild(script);
//   });
// };
//
// const handleGoogleSignIn = async (credentialResponse, navigate) => {
//   if (!credentialResponse || !credentialResponse.credential) {
//     console.error("No credential in response:", credentialResponse);
//     alert("Google Sign-In Error: No credential received. Please try again.");
//     return;
//   }
//
//   const token = credentialResponse.credential;
//   console.log(`[Google OAuth] Received token (length: ${token.length})`);
//   
//   try {
//     console.log("[Google OAuth] Sending token to backend...");
//     const res = await fetch("http://localhost:8000/login/google", {
//       method: "POST",
//       headers: { 
//         "Content-Type": "application/json"
//       },
//       body: JSON.stringify({ token })
//     });
//
//     const data = await res.json();
//     console.log(`[Google OAuth] Backend response status: ${res.status}`, data);
//
//     if (res.ok && data.access_token) {
//       console.log("[Google OAuth] Login successful, storing tokens...");
//       localStorage.setItem("access_token", data.access_token);
//       localStorage.setItem("refresh_token", data.refresh_token);
//       localStorage.setItem("role", data.role);
//       localStorage.setItem("username", data.username);
//       localStorage.setItem("loginType", "google");
//       window.dispatchEvent(new Event("login"));
//       
//       console.log(`[Google OAuth] Redirecting to ${data.role === "admin" || data.role === "superadmin" ? "admin" : "dashboard"}`);
//       
//       if (data.role === "admin" || data.role === "superadmin") {
//         navigate("/admin");
//       } else {
//         navigate("/dashboard");
//       }
//     } else {
//       const errorDetail = data.detail || JSON.stringify(data);
//       console.error("[Google OAuth] Login failed:", errorDetail);
//       
//       let userMessage = `Google Sign-In Error: ${errorDetail}`;
//       
//       // Provide helpful error messages based on specific errors
//       if (errorDetail.includes("'NoneType' object")) {
//         userMessage = "Backend error processing Google token. Check GOOGLE_CLIENT_ID configuration.";
//       } else if (errorDetail.includes("not configured")) {
//         userMessage = "Google OAuth not configured on backend. See GOOGLE_OAUTH_TROUBLESHOOTING.md";
//       } else if (errorDetail.includes("Invalid token")) {
//         userMessage = "Google token validation failed. Token may have expired.";
//       } else if (errorDetail.includes("already")) {
//         userMessage = "Email already registered. Try signing in instead.";
//       }
//       
//       alert(userMessage);
//     }
//   } catch (err) {
//     console.error("[Google OAuth] Network error:", err);
//     const errorMessage = `Google Sign-In Error: ${err.message || "Connection failed"}`;
//     
//     // Provide specific guidance for connection errors
//     if (err.message.includes("Failed to fetch")) {
//       alert(`${errorMessage}\n\nMake sure backend is running on http://localhost:8000`);
//     } else if (err.message.includes("NetworkError")) {
//       alert(`${errorMessage}\n\nCheck backend server is accessible`);
//     } else {
//       alert(errorMessage);
//     }
//   }
// };

function Login() {
  const [rightPanelActive, setRightPanelActive] = useState(false);

  // Login form
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    loginType: "company"
  });

  // Register form
  const [registerForm, setRegisterForm] = useState({
    username: "",
    name: "",
    companyEmail: "",
    personalEmail: "",
    password: "",
    confirmPassword: "",
    photo: null,
    photoPreview: null
  });

  const [msg, setMsg] = useState("");
  // GOOGLE OAUTH - DISABLED: googleError state removed
  // const [googleError, setGoogleError] = useState("");
  const navigate = useNavigate();

  // Auto redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) navigate("/dashboard");
  }, [navigate]);

  // GOOGLE OAUTH - DISABLED: All Google script loading commented out
  // // Load Google Sign-In script
  // useEffect(() => {
  //   loadGoogleScript();
  // }, []);
  //
  // // Initialize Google Sign-In button
  // useEffect(() => {
  //   const initGoogle = async () => {
  //     await loadGoogleScript();
  //     
  //     if (!window.google) {
  //       console.warn("[Google OAuth] Google API not loaded");
  //       setGoogleError("Google Sign-In library failed to load. Check internet connection.");
  //       return;
  //     }
  //
  //     console.log("[Google OAuth] Initializing Google Sign-In...");
  //
  //     const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  //     const currentOrigin = window.location.origin;
  //
  //     console.log(`[Google OAuth] Client ID: ${clientId ? clientId.substring(0, 15) + "..." : "NOT SET"}`);
  //     console.log(`[Google OAuth] Current origin: ${currentOrigin}`);
  //
  //     if (!clientId || clientId === "your_google_client_id_here" || clientId.includes("undefined")) {
  //       console.error("[Google OAuth] VITE_GOOGLE_CLIENT_ID not configured or invalid");
  //       setGoogleError("❌ Google Sign-In not configured. Set VITE_GOOGLE_CLIENT_ID in frontend/.env");
  //       return;
  //     }
  //
  //     try {
  //       console.log(`[Google OAuth] Calling window.google.accounts.id.initialize...`);
  //       window.google.accounts.id.initialize({
  //         client_id: clientId,
  //         callback: (credentialResponse) => {
  //           console.log("[Google OAuth] Credential callback received");
  //           handleGoogleSignIn(credentialResponse, navigate);
  //         }
  //       });
  //       
  //       console.log("[Google OAuth] Looking for button element...");
  //       const buttonElement = document.getElementById("google-signin-button");
  //       if (buttonElement) {
  //         console.log("[Google OAuth] Rendering Google sign-in button...");
  //         window.google.accounts.id.renderButton(buttonElement, {
  //           theme: "outline",
  //           size: "large",
  //           width: 300,
  //           logo_alignment: "center"
  //         });
  //         console.log("[Google OAuth] Button rendered successfully");
  //       } else {
  //         console.warn("[Google OAuth] Button element not found");
  //       }
  //
  //       // Show one-tap prompt
  //       console.log("[Google OAuth] Attempting to show one-tap prompt...");
  //       window.google.accounts.id.prompt((notification) => {
  //         console.log(`[Google OAuth] Prompt shown: ${!notification.isNotDisplayed()}`);
  //         
  //         if (notification.isNotDisplayed && notification.isNotDisplayed()) {
  //           const reason = notification.getNotDisplayedReason
  //             ? notification.getNotDisplayedReason()
  //             : "unknown";
  //           console.warn(`[Google OAuth] Prompt not displayed. Reason: ${reason}`);
  //           
  //           if (reason === "invalid_origin") {
  //             setGoogleError(
  //               `❌ Google Sign-In blocked: origin "${currentOrigin}" not allowed.\n` +
  //               `Add to Google Cloud Console → OAuth settings → Authorized origins`
  //             );
  //           }
  //         }
  //       });
  //     } catch (err) {
  //       console.error("[Google OAuth] Initialization error:", err);
  //       setGoogleError(`Google Sign-In unavailable: ${err.message}`);
  //     }
  //   };
  //
  //   initGoogle();
  // }, [navigate]);

  // Email validation helper
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Password validation helper (minimum 8 characters)
  function isValidPassword(password) {
    return password.length >= 8;
  }

  // UI switch animation
  const handleSignUpClick = () => setRightPanelActive(true);
  const handleSignInClick = () => setRightPanelActive(false);

  // ---------------- LOGIN SUBMIT ----------------
  async function handleLoginSubmit(e) {
    e.preventDefault();

    if (!loginForm.email) return setMsg("Email is required ❌");
    if (!isValidEmail(loginForm.email)) return setMsg("Invalid email format ❌");
    if (!loginForm.password) return setMsg("Password is required ❌");

    try {
      // No device UUID needed - agent handles device authentication separately
      const payload = {
        username: loginForm.email, // backend expects username but we pass email
        password: loginForm.password
      };

      const res = await loginUser(payload);

      if (res.success && res.user.access_token) {
        setMsg("Login Successful ✔");

        localStorage.setItem("role", res.user.role);
        localStorage.setItem("username", res.user.username);
        localStorage.setItem("loginType", loginForm.loginType);

        window.dispatchEvent(new Event("login"));

        // redirect based on role
        if (res.user.role === "admin" || res.user.role === "superadmin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }

      } else {
        setMsg(res.message || "Login Failed ❌");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMsg("Login failed - " + error.message);
    }
  }

  // ---------------- REGISTER SUBMIT ----------------
  async function handleRegisterSubmit(e) {
    e.preventDefault();

    // Validation
    if (!registerForm.username) return setMsg("Username is required ❌");
    if (!registerForm.name) return setMsg("Name is required ❌");
    if (!registerForm.companyEmail) return setMsg("Company email is required ❌");
    if (!registerForm.personalEmail) return setMsg("Personal email is required ❌");
    if (!isValidEmail(registerForm.companyEmail)) return setMsg("Invalid company email format ❌");
    if (!isValidEmail(registerForm.personalEmail)) return setMsg("Invalid personal email format ❌");
    if (!registerForm.password) return setMsg("Password is required ❌");
    if (!isValidPassword(registerForm.password)) return setMsg("Password must be at least 8 characters ❌");
    if (registerForm.password !== registerForm.confirmPassword)
      return setMsg("Passwords do not match ❌");

    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append("username", registerForm.username);
    formData.append("name", registerForm.name);
    formData.append("company_email", registerForm.companyEmail);
    formData.append("personal_email", registerForm.personalEmail);
    formData.append("password", registerForm.password);
    
    // Add photo if provided
    if (registerForm.photo) {
      formData.append("photo", registerForm.photo);
    }

    try {
      const res = await fetch("http://localhost:8000/register", {
        method: "POST",
        body: formData  // Don't set Content-Type header - browser will set it with boundary
      });

      const data = await res.json();

      if (res.ok && data.id) {
        setMsg("Registration Successful 🎉 Login now!");
        setRightPanelActive(false);
        setRegisterForm({
          username: "",
          name: "",
          companyEmail: "",
          personalEmail: "",
          password: "",
          confirmPassword: "",
          photo: null,
          photoPreview: null
        });
      } else {
        setMsg(data.detail || "Registration Failed ❌");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMsg("Registration failed - " + error.message);
    }
  }

  // Handle photo selection
  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMsg("Photo size must be less than 5MB ❌");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setRegisterForm({
          ...registerForm,
          photo: file,
          photoPreview: reader.result
        });
      };
      reader.readAsDataURL(file);
      setMsg("");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-orb orb-1" aria-hidden="true" />
      <div className="auth-orb orb-2" aria-hidden="true" />
      <div className="auth-grid" aria-hidden="true" />

      <div
        className={`container auth-card ${rightPanelActive ? "right-panel-active" : ""}`}
        id="container"
      >
        {/* REGISTER FORM */}
        <div className="form-container sign-up-container">
          <form onSubmit={handleRegisterSubmit}>
            <h1>Create Account</h1>
            <p className="auth-subtitle">Build a trusted profile for secure access.</p>
          <input type="text" placeholder="Username"
            value={registerForm.username}
            onChange={e=>setRegisterForm({...registerForm, username:e.target.value})} required/>
          <input type="text" placeholder="Name"
            value={registerForm.name}
            onChange={e=>setRegisterForm({...registerForm, name:e.target.value})} required/>
          <input type="email" placeholder="Company Email"
            value={registerForm.companyEmail}
            onChange={e=>setRegisterForm({...registerForm, companyEmail:e.target.value})} required/>
          <input type="email" placeholder="Personal Email"
            value={registerForm.personalEmail}
            onChange={e=>setRegisterForm({...registerForm, personalEmail:e.target.value})} required/>
          <input type="password" placeholder="Password"
            value={registerForm.password}
            onChange={e=>setRegisterForm({...registerForm, password:e.target.value})} required/>
          <input type="password" placeholder="Confirm Password"
            value={registerForm.confirmPassword}
            onChange={e=>setRegisterForm({...registerForm, confirmPassword:e.target.value})} required/>
          
          {/* Photo Upload */}
          <div style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            margin: "15px 0"
          }}>
            {registerForm.photoPreview && (
              <div style={{
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                border: "2px solid var(--accent)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <img 
                  src={registerForm.photoPreview} 
                  alt="preview"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}
            <label style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontSize: "14px",
              color: "var(--accent)",
              padding: "8px 16px",
              border: "1px solid var(--accent)",
              borderRadius: "4px",
              transition: "all 0.3s"
            }}>
              📷 Choose Photo (Optional)
              <input 
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ display: "none" }}
              />
            </label>
            {!registerForm.photoPreview && (
              <small style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                No photo selected - avatar will be generated
              </small>
            )}
          </div>
          
          <button type="submit">Sign Up</button>
        </form>
      </div>

      {/* LOGIN FORM */}
      <div className="form-container sign-in-container">
        <form onSubmit={handleLoginSubmit}>
          <h1>Sign in</h1>
          <p className="auth-subtitle">Continue into your Zero Trust workspace.</p>
          
          {/* GOOGLE OAUTH - DISABLED: Google Sign-In Button removed */}
          {/* 
          <div 
            id="google-signin-button" 
            style={{ 
              margin: "18px 0",
              display: "flex",
              justifyContent: "center"
            }}
          />

          {googleError && (
            <div style={{
              marginTop: "8px",
              fontSize: "12px",
              color: "#b71c1c",
              textAlign: "center"
            }}>
              {googleError}
            </div>
          )}
          
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            margin: "16px 0",
            color: "var(--text-muted)"
          }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
            <span style={{ fontSize: "12px" }}>OR</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border)" }} />
          </div>
          */}

          <input type="email" placeholder="Email"
            value={loginForm.email}
            onChange={e=>setLoginForm({...loginForm, email:e.target.value})} required/>
          
          {/* Login email type selection */}
          <select value={loginForm.loginType}
            onChange={e=>setLoginForm({...loginForm, loginType:e.target.value})}>
            <option value="company">Company Email</option>
            <option value="personal">Personal Email</option>
          </select>

          <input type="password" placeholder="Password"
            value={loginForm.password}
            onChange={e=>setLoginForm({...loginForm, password:e.target.value})} required/>

          <button type="submit">Sign In</button>
        </form>
      </div>

      {/* UI Panels */}
      <div className="overlay-container">
        <div className="overlay">
          <div className="overlay-panel overlay-left">
            <span className="auth-badge">Secure Session</span>
            <h1>Welcome Back!</h1>
            <p className="auth-hero">Review alerts, verify devices, and keep control.</p>
            <button className="ghost" onClick={handleSignInClick}>Sign In</button>
          </div>
          <div className="overlay-panel overlay-right">
            <span className="auth-badge">New Access</span>
            <h1>Hello Friend!</h1>
            <p className="auth-hero">Create your profile and start monitoring securely.</p>
            <button className="ghost" onClick={handleSignUpClick}>Sign Up</button>
          </div>
        </div>
      </div>

      <p className="auth-message">{msg}</p>
    </div>
  </div>
  );
}

export default Login;
