import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "/logo.png";
import Loadinggif from "../assets/Loading.gif";
import { login, baseUrl } from "../scripts/AuthProvider";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const boxVariants = {
  hidden: { scale: 0.96, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
      when: "beforeChildren",
      staggerChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.25 } },
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

  useEffect(() => {
    const lastVisit = sessionStorage.getItem("ctc_last_visit");
    const now = Date.now();
    const skipSplash = lastVisit && now - parseInt(lastVisit, 10) < 30000;
    sessionStorage.setItem("ctc_last_visit", now.toString());
    const timer = setTimeout(() => setShowSplash(false), skipSplash ? 0 : 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (localStorage.getItem("access")) {
      navigate("/home", { replace: true });
      return;
    }
    if (localStorage.getItem("rememberMe") === "true") {
      setUsername(localStorage.getItem("username") || "");
      setPassword(localStorage.getItem("password") || "");
      setRememberMe(true);
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (error) {
      setShakeCount((c) => c + 1);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await login(username, password);
      if (response) {
        if (rememberMe) {
          localStorage.setItem("username", username);
          localStorage.setItem("password", password);
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("username");
          localStorage.removeItem("password");
          localStorage.setItem("rememberMe", "false");
        }
        navigate("/home", { replace: true });
      }
    } catch (err) {
      if (
        err.name === "TypeError" ||
        err.message?.includes("fetch") ||
        err.message?.includes("Network") ||
        !navigator.onLine
      ) {
        setError("Network error! Please check your connection and try again.");
      } else if (err.message?.includes("Login failed")) {
        setError("Invalid username or password.");
      } else {
        setError("Something went wrong. Please try again later.");
      }
      setShakeCount((c) => c + 1);
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setEmailError("");
    if (!resetEmail.trim()) {
      setEmailError("Email address is required.");
      return;
    }
    if (!validateEmail(resetEmail)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setResetLoading(true);
    try {
      const response = await fetch(`${baseUrl}/auth/password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        Swal.fire({
          title: "Reset Link Sent!",
          text: `Check ${resetEmail} for the password reset link.`,
          icon: "success",
          iconColor: "#A294F9",
          confirmButtonColor: "#a294f9",
          background: "#181817",
          color: "#FFFFFF",
          confirmButtonText: "OK",
        });
        setIsPopupOpen(false);
        setResetEmail("");
      } else {
        setEmailError(
          data.message ||
            data.error ||
            data.detail ||
            data.email?.[0] ||
            "Failed to send reset link"
        );
      }
    } catch {
      setEmailError("Network error. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const inputBase =
    "w-full rounded-xl border-2 border-[#5a5a5a] bg-[#1e1e1e] px-4 py-3.5 text-white placeholder-gray-500 outline-none transition-colors focus:border-[#A294F9] focus:ring-2 focus:ring-[#A294F9]/30 sm:py-3";
  const labelBase = "mb-2 block text-sm font-semibold text-gray-200";

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div
            className="flex min-h-screen items-center justify-center bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
          >
            <img
              src={Loadinggif}
              alt="Loading..."
              className="max-h-[180px] w-auto max-w-[90vw] object-contain sm:max-w-[300px]"
            />
          </motion.div>
        ) : (
          <motion.div
            className="flex min-h-screen items-center justify-center bg-black p-4 sm:p-6"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="w-full max-w-[480px] rounded-2xl border border-[#404040] bg-[#282828] p-6 shadow-xl shadow-black/50 sm:p-8 md:p-10"
              variants={boxVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={itemVariants}
                className="mb-6 flex justify-center sm:mb-8"
              >
                <img
                  src={logo}
                  alt="Crack the Campus"
                  className="h-14 w-auto object-contain sm:h-16"
                />
              </motion.div>

              <div className="w-full">
                {error && (
                  <motion.div
                    key={shakeCount}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="mb-4 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label htmlFor="username" className={labelBase}>
                      Username
                    </label>
                    <input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      className={inputBase}
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (error) setError("");
                      }}
                      autoComplete="username"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-2">
                    <label htmlFor="password" className={labelBase}>
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      className={inputBase}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                      }}
                      autoComplete={rememberMe ? "current-password" : "off"}
                    />
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="flex items-center gap-2"
                  >
                    <input
                      id="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe((r) => !r)}
                      className="h-4 w-4 rounded border-[#5a5a5a] bg-[#1e1e1e] text-[#A294F9] focus:ring-2 focus:ring-[#A294F9]/50"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="cursor-pointer text-sm font-medium text-gray-300"
                    >
                      Remember me
                    </label>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-xl bg-[#A294F9] py-3.5 text-base font-semibold text-black transition-colors hover:bg-[#8b7ce8] disabled:cursor-not-allowed disabled:opacity-70 sm:py-4 sm:text-lg"
                    >
                      {loading ? "Logging in…" : "Login"}
                    </button>
                  </motion.div>
                </form>

                <motion.p
                  variants={itemVariants}
                  className="mt-4 text-right text-sm text-gray-400"
                >
                  <button
                    type="button"
                    onClick={() => setIsPopupOpen(true)}
                    className="font-medium text-white underline-offset-2 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </motion.p>
              </div>

              <AnimatePresence>
                {isPopupOpen && (
                  <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => {
                      setIsPopupOpen(false);
                      setResetEmail("");
                      setEmailError("");
                    }}
                  >
                    <motion.div
                      className="w-full max-w-md rounded-2xl border border-[#404040] bg-[#282828] p-6 shadow-xl sm:p-8"
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="mb-2 text-xl font-semibold text-white sm:text-2xl">
                        Reset Password
                      </h3>
                      <p className="mb-5 text-sm text-gray-400">
                        Enter your email to receive a reset link.
                      </p>
                      <form onSubmit={handleResetPassword} className="space-y-4">
                        <input
                          type="email"
                          placeholder="Enter your email"
                          className={inputBase}
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          autoComplete="email"
                        />
                        {emailError && (
                          <p className="text-sm text-red-400">{emailError}</p>
                        )}
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setIsPopupOpen(false);
                              setResetEmail("");
                              setEmailError("");
                            }}
                            className="flex-1 rounded-xl border border-[#5a5a5a] bg-[#3d3d3d] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4a4a4a]"
                          >
                            Close
                          </button>
                          <button
                            type="submit"
                            disabled={resetLoading}
                            className="flex-1 rounded-xl bg-[#A294F9] py-3 text-sm font-semibold text-black transition-colors hover:bg-[#8b7ce8] disabled:opacity-70"
                          >
                            {resetLoading ? "Sending…" : "Submit"}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LoginPage;
