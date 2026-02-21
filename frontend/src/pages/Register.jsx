import { useState } from "react";
import { loginUser, registerUser } from "../api/api";
import { useNavigate } from "react-router-dom";

function Register() {
  const [rightPanelActive, setRightPanelActive] = useState(true); // Start with sign-up
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", name: "", companyEmail: "", personalEmail: "", password: "", confirmPassword: "" });
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const handleSignUpClick = () => {
    setRightPanelActive(true);
  };

  const handleSignInClick = () => {
    setRightPanelActive(false);
  };

  async function handleLoginSubmit(e) {
    e.preventDefault();
    const res = await loginUser({ username: loginForm.email, password: loginForm.password });

    if (res.success && res.user.access_token) {
      setMsg("Login Successful ✔");
      localStorage.setItem("role", res.user.role);
      localStorage.setItem("username", res.user.username);
      localStorage.setItem("loginType", "company");

      window.dispatchEvent(new Event("login"));

      if (res.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } else {
      setMsg(res.message || "Login Failed ❌");
    }
  }

  // Email validation helper
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Password validation helper
  function isValidPassword(password) {
    return password.length >= 8;
  }

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
    if (registerForm.password !== registerForm.confirmPassword) {
      setMsg("Passwords do not match ❌");
      return;
    }
    
    const data = {
      username: registerForm.username,
      name: registerForm.name,
      company_email: registerForm.companyEmail,
      personal_email: registerForm.personalEmail,
      password: registerForm.password,
      role: "user"
    };
    const res = await registerUser(data);

    if (res.success) {
      setMsg("Registered Successfully! You can login now.");
      setRightPanelActive(false); // Switch to sign in
    } else {
      setMsg(res.message || "Registration Failed ❌");
    }
  }

  return (
    <>
      <div className={`container ${rightPanelActive ? 'right-panel-active' : ''}`} id="container">
        <div className="form-container sign-up-container">
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h1>Create Account</h1>
            <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '20px' }}>
              <div className="social-container">
                <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
              </div>
              <span>or use your username for registration</span>
              <input
                type="text"
                placeholder="Username"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Name"
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Company Email"
                value={registerForm.companyEmail}
                onChange={(e) => setRegisterForm({ ...registerForm, companyEmail: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Personal Email"
                value={registerForm.personalEmail}
                onChange={(e) => setRegisterForm({ ...registerForm, personalEmail: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                required
              />
              <button type="submit">Sign Up</button>
            </div>
          </form>
        </div>
        <div className="form-container sign-in-container">
          <form onSubmit={handleLoginSubmit}>
            <h1>Sign in</h1>
            <div className="social-container">
              <a href="#" className="social"><i className="fab fa-facebook-f"></i></a>
              <a href="#" className="social"><i className="fab fa-google-plus-g"></i></a>
              <a href="#" className="social"><i className="fab fa-linkedin-in"></i></a>
            </div>
            <span>or use your account</span>
            <input
              type="email"
              placeholder="Email"
              value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
            />
            <a href="#">Forgot your password?</a>
            <button type="submit">Sign In</button>
          </form>
        </div>
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className="ghost" onClick={handleSignInClick} id="signIn">Sign In</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start journey with us</p>
              <button className="ghost" onClick={handleSignUpClick} id="signUp">Sign Up</button>
            </div>
          </div>
        </div>
      </div>
      <p style={{ color: "red" }}>{msg}</p>
    </>
  );
}

export default Register;
