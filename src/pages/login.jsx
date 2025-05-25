import React, { useState } from "react";
import "./login.css";
import logo from "/logo.png"; // Ensure logo is in the public folder
import { login } from "../scripts/AuthProvider";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // New state for error message
  const [loading, setLoading] = useState(false); // New state for loading

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); // Clear error on new attempt
    setLoading(true); // Start loading
    try {
      const response = await login(username, password);
      if (response) {
        navigate("/");
      }
    } catch (err) {
      // Show error message from backend or fallback
      setError("Invalid username or password");
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const showHome = () => {
    navigate("/home"); // Change to "/home" or desired route
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo" />
        </div>
        <h2 className="heading">Login</h2>
        <div className="form-content">
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
          )}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                placeholder="Enter your username"
                className="input-field"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="input-field"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="login-button" onClick={showHome} disabled={loading}>
              {loading ? (
                <span className="loader" style={{display:'inline-block', marginRight:'8px'}}>
                  <svg width="16" height="16" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#fff">
                    <g fill="none" fillRule="evenodd">
                      <g transform="translate(1 1)" strokeWidth="2">
                        <circle strokeOpacity=".5" cx="18" cy="18" r="18" />
                        <path d="M36 18c0-9.94-8.06-18-18-18">
                          <animateTransform
                            attributeName="transform"
                            type="rotate"
                            from="0 18 18"
                            to="360 18 18"
                            dur="1s"
                            repeatCount="indefinite" />
                        </path>
                      </g>
                    </g>
                  </svg>
                </span>
                ) : null}
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
          <p className="forgot">
            <a href="#" onClick={() => setIsPopupOpen(true)}>Forgot Password?</a>
          </p>
        </div>
      </div>

      {/* Forgot Password Popup */}
      {isPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h3>Reset Password</h3>
            <p>Enter your email address to receive a reset link.</p>
            <input type="email" placeholder="Enter your email" className="popup-input" />
            <button className="popup-submit">Submit</button>
            <button className="popup-close" onClick={() => setIsPopupOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
