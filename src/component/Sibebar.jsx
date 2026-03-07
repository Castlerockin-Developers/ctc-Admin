import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { log } from "../utils/logger";
import { FaMoneyBillWave, FaCog, FaSignOutAlt } from "react-icons/fa";
import logo from "../assets/ctc-logo.png";
import { logout } from "../scripts/AuthProvider";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Sidebar = ({ activeComponent, setActiveComponent, onManageExamClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 1024);
    const navigate = useNavigate();

    const currentActive = ["newExam", "addQuestion", "addStudents", "newMcq", "newCoding"].includes(activeComponent)
        ? "manageExam"
        : ["partone", "parttwo", "partthree", "viewcourse"].includes(activeComponent)
            ? "custom"
            : activeComponent;

    useEffect(() => {
        const handleResize = () => {
            const isNowMobile = window.innerWidth < 1024;
            setIsMobile(isNowMobile);
            if (!isNowMobile && isOpen) setIsOpen(false);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [isOpen]);

    const handleNavigation = (componentName) => {
        if (
            ["newExam", "addQuestion", "addStudents", "newMcq", "newCoding"].includes(activeComponent) &&
            !["newExam", "addQuestion", "addStudents", "newMcq", "newCoding"].includes(componentName)
        ) {
            log("Sidebar - Clearing session storage when navigating away from exam creation");
            const allKeys = [
                "newExam:testName", "newExam:examStartDate", "newExam:startTime", "newExam:examEndDate", "newExam:endTime",
                "newExam:timedTest", "newExam:timer", "newExam:attemptsAllowed", "newExam:instructions",
                "mcqQuestions", "codingQuestions", "sectionTimers",
                "addStudents_allBranch", "addStudents_addedBranch", "addStudents_list",
            ];
            allKeys.forEach((key) => sessionStorage.removeItem(key));
        }
        if (componentName === "manageExam" && onManageExamClick) onManageExamClick();
        setActiveComponent(componentName);
        if (isMobile) setIsOpen(false);
    };

    const handleLogout = () => {
        Swal.fire({
            title: "Are you sure?",
            text: "You will be logged out from your account.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#a294f9",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, log me out!",
            background: "#181817",
            color: "#FFFFFF",
            customClass: { icon: "swal2-warning-custom" },
        }).then((result) => {
            if (result.isConfirmed) {
                log("User confirmed logout. Initiating logout process...");
                logout();
                Swal.fire({
                    title: "Logged Out!",
                    text: "You have been successfully logged out.",
                    icon: "success",
                    iconColor: "#A294F9",
                    background: "#181817",
                    color: "#FFFFFF",
                }).then(() => navigate("/"));
            } else {
                log("Logout cancelled by user.");
            }
        });
    };

    const navButtonClass = (name) =>
        `w-full min-w-0 flex items-center py-2 sm:py-2.5 pl-4 sm:pl-5 pr-3 sm:pr-4 transition-all duration-200 cursor-pointer border-none relative mb-2 rounded-none ${
            currentActive === name
                ? "bg-[#282828] scale-[1.02]"
                : "bg-transparent hover:bg-[#282828]"
        }`;

    const barClass = (name) =>
        `absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 rounded-tl-none rounded-tr-md rounded-bl-md rounded-br-none transition-colors duration-300 ${
            currentActive === name ? "bg-[#A294F9]" : "bg-white/20"
        }`;

    const bottomButtonClass = (name) =>
        `w-full min-w-0 flex items-center py-2 sm:py-2.5 px-3 sm:px-4 rounded-none transition-colors duration-200 cursor-pointer border-none mb-2 ${
            currentActive === name ? "bg-[#282828]" : "hover:bg-white/10"
        }`;

    const mobileBackdrop = isMobile && isOpen && (
        <div
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[999]"
        />
    );

    const mobileHamburger = isMobile && !isOpen && (
        <button
            type="button"
            aria-label="Open menu"
            onClick={() => setIsOpen(true)}
            className="z-[1001] flex h-10 w-10 items-center justify-center border-none bg-transparent text-white"
            style={{ position: "fixed", top: "16px", left: "16px" }}
        >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
        </button>
    );

    return (
        <>
            {isMobile && typeof document !== "undefined" && createPortal(<>{mobileBackdrop}{mobileHamburger}</>, document.body)}

            <style>{`
                .sidebar-panel::-webkit-scrollbar { width: 6px; }
                .sidebar-panel::-webkit-scrollbar-track { background: transparent; }
                .sidebar-panel::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
            `}</style>
            {/* Sidebar panel */}
            <aside
                className={`
                    sidebar-panel flex h-full w-full flex-col justify-between overflow-x-hidden overflow-y-auto bg-[#181817] font-[madina-semibold] transition-transform duration-300 ease-in-out
                    lg:relative lg:min-h-0 lg:pt-0
                    ${isMobile ? "fixed left-0 top-0 z-[1000] h-screen w-1/2 max-w-[320px]" : ""}
                    ${isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"}
                `}
            >
                {/* Top row: logo left, close far right corner - at very top */}
                <div className="flex w-full items-center pl-3 pr-2 pt-2 pb-1 lg:hidden shrink-0 justify-between">
                    <img src={logo} alt="CTC Logo" className="h-8 w-32 sm:h-10 sm:w-36 md:h-10 md:w-40 shrink-0 object-contain" />
                    {isMobile && isOpen && (
                        <button
                            type="button"
                            aria-label="Close menu"
                            onClick={() => setIsOpen(false)}
                            className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center border-none bg-transparent text-white"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="flex flex-1 flex-col pt-3 sm:pt-4 pl-4 sm:pl-5 md:pl-6 lg:pl-12 pr-0 lg:pt-6 lg:flex-shrink-0">
                    <button type="button" className={navButtonClass("dashboard")} onClick={() => handleNavigation("dashboard")}>
                        <div className={barClass("dashboard")} />
                        <h6 className="flex-1 whitespace-nowrap text-left pl-4 text-sm sm:text-base md:text-base lg:text-lg font-semibold text-white">Home</h6>
                    </button>
                    <button type="button" className={navButtonClass("manageExam")} onClick={() => handleNavigation("manageExam")}>
                        <div className={barClass("manageExam")} />
                        <h6 className="flex-1 whitespace-nowrap text-left pl-4 text-sm sm:text-base md:text-base lg:text-lg font-semibold text-white">Manage Exam</h6>
                    </button>
                    <button type="button" className={navButtonClass("result")} onClick={() => handleNavigation("result")}>
                        <div className={barClass("result")} />
                        <h6 className="flex-1 whitespace-nowrap text-left pl-4 text-sm sm:text-base md:text-base lg:text-lg font-semibold text-white">Manage Results</h6>
                    </button>
                    <button type="button" className={navButtonClass("student")} onClick={() => handleNavigation("student")}>
                        <div className={barClass("student")} />
                        <h6 className="flex-1 whitespace-nowrap text-left pl-4 text-sm sm:text-base md:text-base lg:text-lg font-semibold text-white">Manage Students</h6>
                    </button>
                    <button type="button" className={navButtonClass("custom")} onClick={() => handleNavigation("custom")}>
                        <div className={barClass("custom")} />
                        <h6 className="flex-1 whitespace-nowrap text-left pl-4 text-sm sm:text-base md:text-base lg:text-lg font-semibold text-white">Custom Learning</h6>
                    </button>
                </div>

                <div className="mt-auto flex w-full min-w-0 flex-col pt-4 pb-4 pl-4 sm:pl-5 md:pl-6 lg:pl-12 pr-0 lg:flex-shrink-0">
                    <button type="button" className={bottomButtonClass("subcribe")} onClick={() => handleNavigation("subcribe")}>
                        <FaMoneyBillWave className="mr-4 text-lg sm:text-xl text-white shrink-0" />
                        <h6 className="flex-1 whitespace-nowrap text-left pl-6 text-sm sm:text-base md:text-base lg:text-lg font-semibold text-white">Subscription</h6>
                    </button>
                    <button type="button" className={bottomButtonClass("settings")} onClick={() => handleNavigation("settings")}>
                        <FaCog className="mr-4 text-lg sm:text-xl text-white shrink-0" />
                        <h6 className="flex-1 whitespace-nowrap text-left pl-6 text-sm sm:text-base md:text-base lg:text-lg font-semibold text-white">Settings</h6>
                    </button>
                    <button type="button" className={bottomButtonClass("logout")} onClick={handleLogout}>
                        <FaSignOutAlt className="mr-4 text-lg sm:text-xl text-white shrink-0" />
                        <h6 className="flex-1 whitespace-nowrap text-left pl-6 text-sm sm:text-base md:text-base lg:text-lg font-semibold text-white">Logout</h6>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
