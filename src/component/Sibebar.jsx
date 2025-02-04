import React, { useState, useEffect } from "react";
import { FaQuestionCircle, FaMoneyBillWave, FaCog } from "react-icons/fa";
import { motion } from "motion/react";
import "../pages/home.css";
import logo from '../assets/logo.png';

const Sidebar = ({ setActiveComponent }) => {
    const [activeButton, setActiveButton] = useState("dashboard");
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024); // Updated breakpoint for tablets

    useEffect(() => {
        const handleResize = () => {
            const isNowMobile = window.innerWidth <= 1024; // Adjust breakpoint
            setIsMobile(isNowMobile);

            if (!isNowMobile && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [isOpen]);

    const handleNavigation = (componentName) => {
        setActiveButton(componentName);
        setActiveComponent(componentName);
        if (isMobile) {
            setIsOpen(false); // Auto-close on mobile after selecting an option
        }
    };

    const menuPath =
        "M4.83335 54.25C3.57015 54.25 2.51204 53.822 1.65902 52.966C0.805988 52.11 0.377988 51.0519 0.375015 49.7917C0.372043 48.5314 0.800044 47.4733 1.65902 46.6173C2.51799 45.7613 3.5761 45.3333 4.83335 45.3333H76.1667C77.4299 45.3333 78.4895 45.7613 79.3455 46.6173C80.2015 47.4733 80.628 48.5314 80.625 49.7917C80.622 51.0519 80.194 52.1115 79.341 52.9705C78.488 53.8294 77.4299 54.2559 76.1667 54.25H4.83335ZM4.83335 31.9583C3.57015 31.9583 2.51204 31.5303 1.65902 30.6743C0.805988 29.8183 0.377988 28.7602 0.375015 27.5C0.372043 26.2398 0.800044 25.1817 1.65902 24.3257C2.51799 23.4697 3.5761 23.0417 4.83335 23.0417H76.1667C77.4299 23.0417 78.4895 23.4697 79.3455 24.3257C80.2015 25.1817 80.628 26.2398 80.625 27.5C80.622 28.7602 80.194 29.8198 79.341 30.6788C78.488 31.5378 77.4299 31.9643 76.1667 31.9583H4.83335ZM4.83335 9.66667C3.57015 9.66667 2.51204 9.23867 1.65902 8.38267C0.805988 7.52667 0.377988 6.46856 0.375015 5.20833C0.372043 3.94811 0.800044 2.89 1.65902 2.034C2.51799 1.178 3.5761 0.75 4.83335 0.75H76.1667C77.4299 0.75 78.4895 1.178 79.3455 2.034C80.2015 2.89 80.628 3.94811 80.625 5.20833C80.622 6.46856 80.194 7.52815 79.341 8.38712C78.488 9.2461 77.4299 9.67261 76.1667 9.66667H4.83335Z";

    // Path for "X" Shape
    const xPath =
        "M10 5L70 50L60 55L5 10L10 5Z M5 50L70 5L75 10L10 55L5 50Z";

    return (
        <>
            {isMobile && (
                <motion.button
                    className="menu-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    animate={{
                        left: isOpen ? "150px" : "0px",
                    }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.svg
                        width="50"
                        height="50"
                        viewBox="0 0 50 50"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Top Bar (Rotates to form X) */}
                        <motion.line
                            x1="10"
                            y1="15"
                            x2="40"
                            y2="15"
                            stroke="white"
                            strokeWidth="4"
                            strokeLinecap="round"
                            animate={{
                                rotate: isOpen ? 45 : 0,
                                translateY: isOpen ? 10 : 0, // Moves down while rotating
                            }}
                            transition={{ duration: 0.3 }}
                        />

                        {/* Middle Bar (Fades out when open) */}
                        <motion.line
                            x1="10"
                            y1="25"
                            x2="40"
                            y2="25"
                            stroke="white"
                            strokeWidth="4"
                            strokeLinecap="round"
                            animate={{
                                opacity: isOpen ? 0 : 1,
                            }}
                            transition={{ duration: 0.2 }}
                        />

                        {/* Bottom Bar (Rotates to form X) */}
                        <motion.line
                            x1="10"
                            y1="35"
                            x2="40"
                            y2="35"
                            stroke="white"
                            strokeWidth="4"
                            strokeLinecap="round"
                            animate={{
                                rotate: isOpen ? -45 : 0,
                                translateY: isOpen ? -10 : 0, // Moves up while rotating
                            }}
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
                        className={`sidebar-button ${activeButton === "dashboard" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("dashboard")}
                    >
                        <h6 className="sidebar-item">Home</h6>
                        <div className={`sidebar-animation ${activeButton === "dashboard" ? "active" : ""}`} />
                    </button>

                    <button
                        type="button"
                        className={`sidebar-button ${activeButton === "manageExam" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("manageExam")}
                    >
                        <h6 className="sidebar-item">Manage Exam</h6>
                        <div className={`sidebar-animation ${activeButton === "manageExam" ? "active" : ""}`} />
                    </button>

                    <button
                        type="button"
                        className={`sidebar-button ${activeButton === "result" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("result")}
                    >
                        <h6 className="sidebar-item">Manage Results</h6>
                        <div className={`sidebar-animation ${activeButton === "result" ? "active" : ""}`} />
                    </button>

                    <button
                        type="button"
                        className={`sidebar-button ${activeButton === "student" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("student")}
                    >
                        <h6 className="sidebar-item">Manage Students</h6>
                        <div className={`sidebar-animation ${activeButton === "student" ? "active" : ""}`} />
                    </button>
                </div>

                {/* Bottom Menu */}
                <div className="sidebar-bottom">
                    <button type="button" className="bottom-sidebar-button">
                        <FaQuestionCircle className="sidebar-icon" />
                        <h6 className="sidebar-item">Support</h6>
                    </button>
                    <button type="button" className="bottom-sidebar-button">
                        <FaMoneyBillWave className="sidebar-icon" />
                        <h6 className="sidebar-item">Plans</h6>
                    </button>
                    <button type="button" className="bottom-sidebar-button side-active">
                        <FaCog className="sidebar-icon" />
                        <h6 className="sidebar-item">Settings</h6>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
