import React, { useState, useEffect } from "react";
import { FaMoneyBillWave, FaCog, FaSignOutAlt } from "react-icons/fa";
import { motion } from "motion/react";
import "../pages/home.css";
import logo from '../assets/ctc-logo.png';
import { logout } from "../scripts/AuthProvider";
import { Navigate, useNavigate } from "react-router-dom";

const Sidebar = ({ activeComponent, setActiveComponent }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const navigate = useNavigate();

    // Map "newExam" to "manageExam" if needed
    const currentActive = activeComponent === "newExam" ? "manageExam" : activeComponent;

    useEffect(() => {
        const handleResize = () => {
            const isNowMobile = window.innerWidth <= 1024;
            setIsMobile(isNowMobile);
            if (!isNowMobile && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [isOpen]);

    const handleNavigation = (componentName) => {
        setActiveComponent(componentName);
        if (isMobile) {
            setIsOpen(false);
        }
    };
    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <>
            {isMobile && (
                <motion.button
                    className="menu-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    animate={{ left: isOpen ? "200px" : "0px" }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.svg
                        width="50"
                        height="50"
                        viewBox="0 0 50 50"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Top Bar */}
                        <motion.line
                            x1="10"
                            y1="15"
                            x2="40"
                            y2="15"
                            stroke="white"
                            strokeWidth="4"
                            strokeLinecap="round"
                            animate={{ rotate: isOpen ? 45 : 0, translateY: isOpen ? 10 : 0 }}
                            transition={{ duration: 0.3 }}
                        />
                        {/* Middle Bar */}
                        <motion.line
                            x1="10"
                            y1="25"
                            x2="40"
                            y2="25"
                            stroke="white"
                            strokeWidth="4"
                            strokeLinecap="round"
                            animate={{ opacity: isOpen ? 0 : 1 }}
                            transition={{ duration: 0.2 }}
                        />
                        {/* Bottom Bar */}
                        <motion.line
                            x1="10"
                            y1="35"
                            x2="40"
                            y2="35"
                            stroke="white"
                            strokeWidth="4"
                            strokeLinecap="round"
                            animate={{ rotate: isOpen ? -45 : 0, translateY: isOpen ? -10 : 0 }}
                            transition={{ duration: 0.3 }}
                        />
                    </motion.svg>
                </motion.button>
            )}

            <div className={`sidebar-container ${isOpen && isMobile ? "open" : ""}`}>
                <img src={logo} alt="logo" className="sidebar-logo lg:hidden" />
                <div className="sidebar-top">
                    <button
                        type="button"
                        className={`sidebar-button ${currentActive === "dashboard" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("dashboard")}
                    >
                        <h6 className="sidebar-item">Home</h6>
                        <div className={`sidebar-animation ${currentActive === "dashboard" ? "active" : ""}`} />
                    </button>

                    <button
                        type="button"
                        className={`sidebar-button ${currentActive === "manageExam" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("manageExam")}
                    >
                        <h6 className="sidebar-item">Manage Exam</h6>
                        <div className={`sidebar-animation ${currentActive === "manageExam" ? "active" : ""}`} />
                    </button>

                    <button
                        type="button"
                        className={`sidebar-button ${currentActive === "result" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("result")}
                    >
                        <h6 className="sidebar-item">Manage Results</h6>
                        <div className={`sidebar-animation ${currentActive === "result" ? "active" : ""}`} />
                    </button>

                    <button
                        type="button"
                        className={`sidebar-button ${currentActive === "student" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("student")}
                    >
                        <h6 className="sidebar-item">Manage Students</h6>
                        <div className={`sidebar-animation ${currentActive === "student" ? "active" : ""}`} />
                    </button>
                </div>

                {/* Bottom Menu */}
                <div className="sidebar-bottom">
                    <button
                        type="button"
                        className={`bottom-sidebar-button ${currentActive === "subcribe" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("subcribe")}
                    >
                        <FaMoneyBillWave className="sidebar-icon" />
                        <h6 className="sidebar-item">Subscription</h6>
                    </button>
                    <button
                        type="button"
                        className={`bottom-sidebar-button ${currentActive === "settings" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("settings")}
                    >
                        <FaCog className="sidebar-icon" />
                        <h6 className="sidebar-item">Settings</h6>
                    </button>
                    <button
                        type="button"
                        className={`bottom-sidebar-button ${currentActive === "settings" ? "side-active" : ""}`}
                        onClick={() => handleLogout()}
                    >
                        <FaSignOutAlt className="sidebar-icon" />
                        <h6 className="sidebar-item">Logout</h6>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
