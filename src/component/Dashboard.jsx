import React, { useEffect, useState, useCallback } from "react";
import closeicon from '../assets/close.png';
import { AnimatePresence, motion } from "framer-motion";
import EditExam from "./EditExam";
import { authFetch } from "../scripts/AuthProvider";
import DashboardLoader from "../loader/DashboardLoader";
import { useCache } from "../hooks/useCache";
import CacheStatusIndicator from "./CacheStatusIndicator";
import "./CacheStatusIndicator.css";
// import axios from 'axios'; // Uncomment and use axios for making HTTP requests when backend is ready

const Dashboard = ({ onCreateExam, onAddStudent, onAddUser, onAddCredits, onManageExam, onSubscription, onManageStudents, cacheAllowed, onBackToDashboard }) => {
    const [showPopup, setShowPopup] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [showSubscription, setShowSubscription] = useState(false);
    const [showCompletedPopup, setShowCompletedPopup] = useState(false);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.12,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 260,
                damping: 20,
            },
        },
    };

    const popupVariants = {
        hidden: { opacity: 0, scale: 0.95, y: -30 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.25,
                type: "spring",
                damping: 18,
                stiffness: 260,
            },
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            y: -30,
            transition: { duration: 0.2 }
        }
    };


    // Dashboard data fetch function
    const fetchDashboardData = useCallback(async () => {
        const response = await authFetch('/admin/home/', {
            method: 'GET',
        });
        const responseData = await response.json();

        return {
            dashboardData: {
                activeContest: responseData.active_exam,
                liveContest: responseData.completed_exams_count,
                credit: responseData.credits,
                totalStudents: responseData.total_users
            },
            testDetails: responseData.active_exams,
            recentTests: responseData.recent_exams,
            completedResults: responseData.completed_exams,
            notifications: responseData.notifications,
            userData: responseData.logged_in_user
        };
    }, []);

    // Cache callbacks
    const onCacheHit = useCallback((data) => {
        console.log('Dashboard data loaded from cache');
    }, []);

    const onCacheMiss = useCallback((data) => {
        console.log('Dashboard data fetched fresh');
    }, []);

    const onError = useCallback((err) => {
        console.error('Dashboard fetch error:', err);
    }, []);

    // Use cache hook for dashboard data
    const {
        data: dashboardData,
        loading,
        error,
        cacheUsed,
        cacheInfo,
        forceRefresh,
        invalidateCache,
        clearAllCache
    } = useCache('dashboard_data', fetchDashboardData, {
        enabled: cacheAllowed,
        expiryMs: 3 * 60 * 1000, // 3 minutes
        autoRefresh: true,
        refreshInterval: 60 * 1000, // Check every minute
        onCacheHit,
        onCacheMiss,
        onError
    });

    if (loading) {
        return <DashboardLoader />;
    }

    if (error) {
        return (
            <div className="text-center">
                <p className="text-lg text-red-500 mb-4">{error.message || "Failed to load dashboard data"}</p>
                <button 
                    onClick={forceRefresh}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    const handleViewExam = (exam) => {
        // Route to ManageExam with the selected exam
        onManageExam(exam);
    };

    const onViewexam = (test) => {
        // Route to ManageExam with the selected test
        onManageExam(test);
    };

    const togglePopup = () => setShowPopup((prev) => !prev);
    const closePopup = () => setShowPopup(false);

    const toggleCompletedPopup = () => setShowCompletedPopup((prev) => !prev);
    const closeCompletedPopup = () => setShowCompletedPopup(false);
    const closeEditPopup = () => setShowEditPopup(false);

    // const toggleSubscription = () => {
    //     setShowSubscription((prev) => !prev);
    // };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:w-full xl:w-3xl justify-center flex flex-wrap dashboard">
                <div className="greeting">
                    <div className="flex justify-between items-center mb-4">
                        <motion.h1
                            variants={itemVariants}
                            className="text-2xl md:text-3xl xl:text-4xl font-semibold text-white">
                            Welcome {dashboardData?.userData}
                        </motion.h1>

                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 w-full">
                        <motion.div
                            variants={itemVariants}
                            whileTap={{ scale: 1.06 }}
                            className="top-display top-display-clickable cursor-pointer greet1"
                            onClick={togglePopup}>
                            <h4 className="xl:text-xl lg:text-xl md:text-xl">Active Test</h4>
                            <h2 className="xl:text-4xl lg:text-4xl md:text-4xl flex justify-center">
                                {dashboardData?.dashboardData?.activeContest || 0}
                            </h2>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            whileTap={{ scale: 1.06 }}
                            className="top-display top-display-clickable cursor-pointer"
                            onClick={toggleCompletedPopup}>
                            <h4 className="xl:text-xl lg:text-xl md:text-xl">Completed Exams</h4>
                            <h2 className="xl:text-4xl lg:text-4xl md:text-4xl flex justify-center">
                                {dashboardData?.dashboardData?.liveContest || 0}
                            </h2>
                        </motion.div>

                        {/* <motion.div
                            whileTap={{ scale: 1.1 }}
                            className="top-display top-display-clickable cursor-pointer"
                            onClick={onSubscription}>
                            <h4 className="xl:text-xl lg:text-xl md:text-xl">Remaining Credits</h4>
                            <h2 className="xl:text-4xl lg:text-4xl md:text-4xl flex justify-center">
                                {dashboardData.credit}
                            </h2>
                        </motion.div> */}

                        <motion.div
                            variants={itemVariants}
                            whileTap={{ scale: 1.06 }}
                            className="top-display top-display-clickable cursor-pointer"
                            onClick={onManageStudents}>
                            <h4 className="xl:text-xl lg:text-xl md:text-xl">Total Students</h4>
                            <h2 className="xl:text-4xl lg:text-4xl md:text-4xl flex justify-center">
                                {dashboardData?.dashboardData?.totalStudents || 0}
                            </h2>
                        </motion.div>

                        <AnimatePresence>
                            {showPopup && (
                                <div className="fixed inset-0 flex items-center justify-center top-display-pop">
                                    <motion.div
                                        variants={popupVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="top-display-pop-card rounded-sm shadow-lg w-11/12 md:w-3/4 lg:w-2/3 xl:w-1/2">
                                        <div className="flex justify-between items-center mb-4 top-display-pop-title">
                                            <h2 className="font-semibold text-center">Active Exams</h2>
                                            <motion.button
                                                whileTap={{ scale: 1.2 }}
                                                className="text-red-500 text-lg"
                                                onClick={closePopup}>
                                                <img src={closeicon} alt="Close" />
                                            </motion.button>
                                        </div>
                                        <div className="flex justify-center rounded-sm">
                                            <table className="pop-up-table">
                                                <thead>
                                                    <tr className="bg-gray-200">
                                                        <th>#</th>
                                                        <th>Name</th>
                                                        <th>Start Time</th>
                                                        <th>End Time</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dashboardData?.testDetails?.length > 0 ? (
                                                        dashboardData.testDetails.map((test, index) => (
                                                            <tr key={test.id}>
                                                                <td>{index + 1}</td>
                                                                <td>{test.name}</td>
                                                                <td>{new Date(test.start_time).toLocaleString('en-US', {
                                                                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                                                                    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
                                                                })}</td>

                                                                <td>{new Date(test.end_time).toLocaleString('en-US', {
                                                                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                                                                    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
                                                                })}</td>
                                                                <td>
                                                                    <motion.button

                                                                        whileTap={{ scale: 1.1 }}
                                                                        className="viewexam-btn-pop"
                                                                        onClick={() => handleViewExam(test)}>
                                                                        View
                                                                    </motion.button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="5" className="text-center">No tests available</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence>
                            {showCompletedPopup && (
                                <div className="fixed inset-0 flex items-center justify-center top-display-pop">
                                    <motion.div
                                        variants={popupVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className="top-display-pop-card rounded-sm shadow-lg w-11/12 md:w-3/4 xl:w-1/2">
                                        <div className="flex justify-between items-center mb-4 top-display-pop-title">
                                            <h2 className="font-semibold text-center">Completed Exams</h2>
                                            <motion.button whileTap={{ scale: 1.2 }} className="text-red-500 text-lg" onClick={closeCompletedPopup}>
                                                <img src={closeicon} alt="Close" />
                                            </motion.button>
                                        </div>
                                        <div className="flex justify-center rounded-sm">
                                            <table className="pop-up-table">
                                                <thead>
                                                    <tr className="bg-gray-200">
                                                        <th>#</th>
                                                        <th>Name</th>
                                                        <th>Start Time</th>
                                                        <th>End Time</th>
                                                        <th></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dashboardData?.completedResults?.length > 0 ? (
                                                        dashboardData.completedResults.map((test, index) => (
                                                            <tr key={test.id}>
                                                                <td>{index + 1}</td>
                                                                <td>{test.name}</td>
                                                                <td>{new Date(test.start_time).toLocaleString('en-US', {
                                                                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                                                                    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
                                                                })}</td>

                                                                <td>{new Date(test.end_time).toLocaleString('en-US', {
                                                                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                                                                    hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true
                                                                })}</td>
                                                                <td>
                                                                    <motion.button
                                                                        whileTap={{ scale: 1.1 }}
                                                                        className="viewexam-btn-pop"
                                                                        onClick={() => handleViewExam(test)}>
                                                                        View
                                                                    </motion.button>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" className="text-center">No tests available</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>
                        {showEditPopup && <EditExam onClose={closeEditPopup} examDetails={selectedExam} />}
                    </div>

                    {showSubscription && <Subscription />}

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4 w-full mid-container">
                        <motion.div
                            variants={itemVariants}
                            className="w-4/10 mid-display">
                            <h4>Recent Tests</h4>
                            <div className="flex w-full justify-center">
                                <div className="tablee">
                                    {dashboardData?.recentTests?.map((test) => (
                                        <div key={test.id} className="tablee-content" onClick={() => onViewexam(test)}>
                                            <h6>{test.name}</h6>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={itemVariants}
                            className="w-4/10 mid-display">
                            <h4>Completed Result</h4>
                            <div className="flex w-full justify-center">
                                <div className="tablee">
                                    {dashboardData?.completedResults?.map((result) => (
                                        <div key={result.id} className="tablee-content" onClick={() => onViewexam(result)}>
                                            <h6>{result.name}</h6>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                        <div className="w-10/10 md:block lg:hidden xl:block">
                            <motion.div
                                variants={itemVariants}
                                className="mid-display2">
                                <h4>Quick links</h4>
                                <ul className="list-disc">
                                    <li onClick={onCreateExam}>
                                        Create Exam
                                    </li>
                                    <li onClick={onAddStudent}>
                                        Add Student
                                    </li>
                                    <li onClick={onAddUser}>
                                        Add User
                                    </li>
                                    {/* <li onClick={onAddCredits}>Buy Credits</li> */}
                                </ul>
                            </motion.div>
                            <motion.div
                                variants={itemVariants}
                                className="mid-display3">
                                <h4>Notifications</h4>
                                <div className="flex justify-center">
                                    <div className="notification-table">
                                        {dashboardData?.notifications?.map((notification, index) => (
                                            <motion.div
                                                key={index}
                                                initial={{ x: 30, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ duration: 0.3, delay: index * 0.08 }}
                                                className="tablee-new">
                                                <h6>{notification.title}: {notification.message}</h6>
                                            </motion.div>
                                        ))}
                                        <br />
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
        </motion.div>
    );
};

export default Dashboard;

