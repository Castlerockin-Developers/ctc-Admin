import React, { useState } from "react";
import "./login.css";
import logo from "/logo.png"; // Ensure logo is in the public folder

const LoginPage = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-container">
          <img src={logo} alt="Logo" className="logo" />
        </div>
        <h2>Login</h2>
        <div className="form-content">
          <form>
            <div className="form-group">
              <label>Username</label>
              <input type="text" placeholder="Enter your username" className="input-field" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Enter your password" className="input-field" />
            </div>
            <button type="submit" className="login-button">Login</button>
          </form>
          <p>
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
