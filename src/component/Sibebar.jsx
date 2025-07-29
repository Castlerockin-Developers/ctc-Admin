import React, { useState, useEffect } from "react";
import { FaMoneyBillWave, FaCog, FaSignOutAlt } from "react-icons/fa";
import { motion } from "motion/react";
import "../pages/home.css";
import logo from '../assets/ctc-logo.png';
import { logout } from "../scripts/AuthProvider";
import { Navigate, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Sidebar = ({ activeComponent, setActiveComponent }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const navigate = useNavigate();

    const sidebarVariants = {
        hidden: { x: -280 },
        visible: {
            x: 0,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.05,
                duration: 0.5
            }
        }
    };

    const buttonVariants = {
        hidden: { opacity: 0, x: -16 },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.45,
                ease: "easeOut"
            }
        }
    };



    // Map "newExam" to "manageExam" if needed
    const currentActive = ["newExam", "addQuestion", "addStudents", "newMcq", "newCoding"].includes(activeComponent)
        ? "manageExam"
        : ["partone", "parttwo", "partthree", "viewcourse"].includes(activeComponent)
            ? "custom"
            : activeComponent;


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
        Swal.fire({
            title: 'Are you sure?',
            text: "You will be logged out from your account.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#a294f9',
            cancelButtonColor: '#d33',   // Example: Red for cancel
            confirmButtonText: 'Yes, log me out!',
            background: '#181817',
            color: '#FFFFFF',
            // Apply custom CSS class for the warning icon
            customClass: {
                icon: 'swal2-warning-custom'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // User clicked "Yes, log me out!"
                console.log("User confirmed logout. Initiating logout process...");

                // Call your actual logout function (e.g., clear tokens, session)
                logout();

                // Show a success message to the user
                Swal.fire({
                    title: 'Logged Out!',
                    text: 'You have been successfully logged out.',
                    icon: 'success',
                    background: '#181817', // Apply the same dark background
                    color: '#FFFFFF'       // Apply white text color
                }
                ).then(() => {
                    // Redirect to the login page AFTER the success message is dismissed
                    navigate('/');
                });
            } else {
                // User clicked "Cancel" or dismissed the dialog
                console.log("Logout cancelled by user.");
            }
        });
    };

    return (
        <>
            {isMobile && (
                <motion.button
                    className="menu-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    animate={{ left: isOpen ? "280px" : "0px" }}
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

            <motion.div
                variants={sidebarVariants}
                initial="hidden"
                animate={isOpen || !isMobile ? "visible" : "hidden"}
                className={`sidebar-container ${isOpen && isMobile ? "open" : ""}`}>
                <img src={logo} alt="logo" className="sidebar-logo lg:hidden" />
                <div className="sidebar-top">
                    <motion.button
                        type="button"
                        variants={buttonVariants}
                        className={`sidebar-button ${currentActive === "dashboard" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("dashboard")}
                    >
                        <h6 className="sidebar-item">Home</h6>
                        <div className={`sidebar-animation ${currentActive === "dashboard" ? "active" : ""}`} />
                    </motion.button>

                    <motion.button
                        type="button"
                        variants={buttonVariants}
                        className={`sidebar-button ${currentActive === "manageExam" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("manageExam")}
                    >
                        <h6 className="sidebar-item">Manage Exam</h6>
                        <div className={`sidebar-animation ${currentActive === "manageExam" ? "active" : ""}`} />
                    </motion.button>

                    <motion.button
                        type="button"
                        variants={buttonVariants}
                        className={`sidebar-button ${currentActive === "result" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("result")}
                    >
                        <h6 className="sidebar-item">Manage Results</h6>
                        <div className={`sidebar-animation ${currentActive === "result" ? "active" : ""}`} />
                    </motion.button>

                    <motion.button
                        type="button"
                        variants={buttonVariants}
                        className={`sidebar-button ${currentActive === "student" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("student")}
                    >
                        <h6 className="sidebar-item">Manage Students</h6>
                        <div className={`sidebar-animation ${currentActive === "student" ? "active" : ""}`} />
                    </motion.button>
                    <motion.button
                        type="button"
                        variants={buttonVariants}
                        className={`sidebar-button ${currentActive === "custom" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("custom")}
                    >
                        <h6 className="sidebar-item">Custom Learning</h6>
                        <div className={`sidebar-animation ${currentActive === "custom" ? "active" : ""}`} />
                    </motion.button>
                </div>

                {/* Bottom Menu */}
                <div className="sidebar-bottom">
                    <motion.button
                        type="button"
                        variants={buttonVariants}
                        className={`bottom-sidebar-button ${currentActive === "subcribe" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("subcribe")}
                    >
                        <FaMoneyBillWave className="sidebar-icon" />
                        <h6 className="sidebar-item">Subscription</h6>
                    </motion.button>
                    <motion.button
                        type="button"
                        variants={buttonVariants}
                        className={`bottom-sidebar-button ${currentActive === "settings" ? "side-active" : ""}`}
                        onClick={() => handleNavigation("settings")}
                    >
                        <FaCog className="sidebar-icon" />
                        <h6 className="sidebar-item">Settings</h6>
                    </motion.button>
                    <motion.button
                        type="button"
                        variants={buttonVariants}
                        className={`bottom-sidebar-button ${currentActive === "logout" ? "side-active" : ""}`}
                        onClick={() => handleLogout()}
                    >
                        <FaSignOutAlt className="sidebar-icon" />
                        <h6 className="sidebar-item">Logout</h6>
                    </motion.button>
                </div>
            </motion.div>
        </>
    );
};

export default Sidebar;
