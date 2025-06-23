import React, { useState, useEffect } from "react";
import { FaMoneyBillWave, FaCog, FaSignOutAlt } from "react-icons/fa";
import { motion } from "framer-motion"; // Assuming "motion/react" is framer-motion
import "../pages/home.css"; // Ensure this path is correct for your CSS
import logo from '../assets/ctc-logo.png'; // Ensure this path is correct for your logo
import { logout } from "../scripts/AuthProvider"; // Ensure this path is correct for your logout function
import { useNavigate } from "react-router-dom"; // Correct import for useNavigate
import Swal from 'sweetalert2'; // Import SweetAlert2

const Sidebar = ({ activeComponent, setActiveComponent }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
    const navigate = useNavigate(); // Initialize useNavigate hook

    // Map "newExam" to "manageExam" if needed for active state
    const currentActive = activeComponent === "newExam" ? "manageExam" : activeComponent;

    // Effect for handling window resize and mobile sidebar behavior
    useEffect(() => {
        const handleResize = () => {
            const isNowMobile = window.innerWidth <= 1024;
            setIsMobile(isNowMobile);
            // If not mobile and sidebar is open, close it
            if (!isNowMobile && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener("resize", handleResize);
        // Clean up the event listener on component unmount
        return () => window.removeEventListener("resize", handleResize);
    }, [isOpen]); // Depend on isOpen to re-evaluate on sidebar state change

    // Handler for sidebar navigation clicks
    const handleNavigation = (componentName) => {
        setActiveComponent(componentName); // Update the active component
        if (isMobile) {
            setIsOpen(false); // Close sidebar on mobile after navigation
        }
    };

    // Handler for logout with SweetAlert2 confirmation and redirection
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
            {/* Mobile Menu Toggle Button */}
            {isMobile && (
                <motion.button
                    className="menu-toggle"
                    onClick={() => setIsOpen(!isOpen)}
                    // Framer Motion animations for toggle button position
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
                        {/* Top Bar animation */}
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
                        {/* Middle Bar animation */}
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
                        {/* Bottom Bar animation */}
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

            {/* Main Sidebar Container */}
            <div className={`sidebar-container ${isOpen && isMobile ? "open" : ""}`}>
                <img src={logo} alt="logo" className="sidebar-logo lg:hidden" />
                
                {/* Top Menu Items */}
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

                {/* Bottom Menu Items */}
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
                        className={`bottom-sidebar-button ${currentActive === "logout" ? "side-active" : ""}`}
                        onClick={handleLogout} 
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