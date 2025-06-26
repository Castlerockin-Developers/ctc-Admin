import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./login.css";
import logo from "/logo.png";
import Loadinggif from "../assets/Loading.gif";
import { login } from "../scripts/AuthProvider";
import { useNavigate } from "react-router-dom";

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
    } catch {
      setError("Invalid username or password!");
      setShakeCount(c => c + 1);
    } finally {
      setLoading(false);
    }
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

                <motion.form onSubmit={handleLogin} variants={itemVariants} initial="hidden" animate="visible">
                  <motion.div variants={itemVariants} className="form-group">
                    <label>Username</label>
                    <input
                      type="text"
                      placeholder="Enter your username"
                      className="input-field"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      className="input-field"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
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
                </motion.form>

                <motion.p variants={itemVariants} className="forgot">
                  <a href="#" onClick={() => setIsPopupOpen(true)}>Forgot Password?</a>
                </motion.p>
              </div>

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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LoginPage;
