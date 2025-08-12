import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./login.css";
import logo from "/logo.png";
import Loadinggif from "../assets/Loading.gif";
import { login } from "../scripts/AuthProvider";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const boxVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
      when: 'beforeChildren',
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 10, opacity: 0, transition: { duration: 0.2 } },
  visible: { y: 0, opacity: 1, transition: { duration: 0.2 } }
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [resetEmail, setResetEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // on mount, load saved credentials if rememberMe
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (localStorage.getItem('rememberMe') === 'true') {
      const savedUser = localStorage.getItem('username') || '';
      const savedPass = localStorage.getItem('password') || '';
      setUsername(savedUser);
      setPassword(savedPass);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (error) { setShakeCount(c => c + 1); return; }
    setError(""); setLoading(true);
    try {
      const response = await login(username, password);
      if (response) {
        if (rememberMe) {
          localStorage.setItem('username', username);
          localStorage.setItem('password', password);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('username');
          localStorage.removeItem('password');
          localStorage.setItem('rememberMe', 'false');
        }
        navigate("/home");
      }
    } catch (error) {
      // Check if it's a network error
      if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('Network') || !navigator.onLine) {
        setError("Network error! Please check your internet connection and try again.");
      } else if (error.message && error.message.includes('Login failed')) {
        setError("Invalid username or password!");
      } else {
        setError("Something went wrong! Please try again later.");
      }
      setShakeCount(c => c + 1);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setEmailError("");

    if (!resetEmail.trim()) {
      setEmailError("Email address is required");
      return;
    }

    if (!validateEmail(resetEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setResetLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      // Show success alert
      Swal.fire({
        title: 'Reset Link Sent!',
        text: `A password reset link has been sent to ${resetEmail}`,
        icon: 'success',
        confirmButtonColor: '#a294f9',
        background: '#181817',
        color: '#FFFFFF',
        confirmButtonText: 'OK'
      });

      // Close popup and reset form
      setIsPopupOpen(false);
      setResetEmail("");
      setEmailError("");
      setResetLoading(false);
    }, 2000); // 2 second delay to show the loading spinner
  };

  return (
    <>
      <AnimatePresence>
        {showSplash ? (
          <motion.div
            className="splash-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
          >
            <img
              src={Loadinggif}
              alt="Loading..."
              className="splash-gif"
              style={{ maxWidth: '300px' }}
            />
          </motion.div>
        ) : (
          <motion.div
            className="login-container"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="login-box"
              variants={boxVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={itemVariants} className="logo-container">
                <img src={logo} alt="Logo" className="logo" />
              </motion.div>

              <div className="form-content">
                {error && (
                  <motion.div key={shakeCount} className="error-message" variants={itemVariants} initial="hidden" animate="visible">
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleLogin} initial="hidden" animate="visible">
                  <motion.div variants={itemVariants} className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      placeholder="Enter your username"
                      className="input-field"
                      value={username}
                      onChange={e => {
                        setUsername(e.target.value);
                        if (error) setError("");
                      }}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      className="input-field"
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (error) setError("");
                      }}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="remember-me">
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(r => !r)}
                    />
                    <label htmlFor="rememberMe" style={{ marginLeft: '8px' }}>
                      Remember me
                    </label>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <button type="submit" className="login-button" disabled={loading}>
                      {loading ? 'Logging in...' : 'Login'}
                    </button>
                  </motion.div>
                </form>

                <motion.p variants={itemVariants} className="forgot">
                  <a href="#" onClick={() => setIsPopupOpen(true)}>Forgot Password?</a>
                </motion.p>
              </div>

              {isPopupOpen && (
                <div className="popup-overlay">
                  <div className="popup-box">
                    <h3>Reset Password</h3>
                    <p>Enter your email address to receive a reset link.</p>
                    <form onSubmit={handleResetPassword}>
                      <input 
                        type="email" 
                        placeholder="Enter your email" 
                        className="popup-input" 
                        value={resetEmail} 
                        onChange={(e) => setResetEmail(e.target.value)} 
                      />
                      {emailError && <p className="error-message">{emailError}</p>}
                                             <button type="submit" className="popup-submit" disabled={resetLoading}>
                         {resetLoading ? (
                           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                             {/* <img src={Loadinggif} alt="Loading" style={{ width: '16px', height: '16px' }} /> */}
                             Sending...
                           </div>
                         ) : 'Submit'}
                       </button>
                      <button type="button" className="popup-close" onClick={() => {
                        setIsPopupOpen(false);
                        setResetEmail("");
                        setEmailError("");
                      }}>Close</button>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LoginPage;
