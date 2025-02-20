import React, { useEffect, useState } from "react";
// import axios from "axios"; // Commented out since backend is not ready
import closeicon from '../assets/close.png';
import { motion } from "motion/react";
import EditExam from "./EditExam";

const Dashboard = ({ onCreateExam, onAddStudent, onAddUser, onAddCredits, onViewexam, onManageExam, onSubscription , onManageStudents }) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [testDetails, setTestDetails] = useState([]);
    const [showSubscription, setShowSubscription] = useState(false);
    const [showCompletedPopup, setShowCompletedPopup] = useState(false);
    const [recentTests, setRecentTests] = useState([]);
    const [completedResults, setCompletedResults] = useState([]);
    const [notifications, setNotifications] = useState([]); // State for notifications
    const [error, setError] = useState(null);

    const togglePopup = () => setShowPopup((prev) => !prev);
    const closePopup = () => setShowPopup(false);

    const toggleCompletedPopup = () => setShowCompletedPopup((prev) => !prev);
    const closeCompletedPopup = () => setShowCompletedPopup(false);

    const openEditPopup = (exam) => {
        setSelectedExam(exam);
        setShowEditPopup(true);
    };
    const closeEditPopup = () => setShowEditPopup(false);

    const toggleSubscription = () => {
        setShowSubscription((prev) => !prev);
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Commenting out the API calls for now
                // const [dashboardResponse, recentTestsResponse, completedResultsResponse, notificationsResponse] = await Promise.all([
                //     axios.get("http://backend-url/api/dashboard/"),
                //     axios.get("http://backend-url/api/recent-tests/"),
                //     axios.get("http://backend-url/api/completed-results/"),
                //     axios.get("http://backend-url/api/notifications/") // New endpoint for notifications
                // ]);

                // Simulate dashboard data (temporary mock data while the backend is not available)
                const mockDashboardData = {
                    activeContest: 5,
                    liveContest: 3,
                    credit: 2000,
                    totalStudents: 150,
                    testDetails: [
                        { id: 1, name: "Math Test", startTime: "10:00 AM", endTime: "11:00 AM" },
                        { id: 2, name: "Science Quiz", startTime: "1:00 PM", endTime: "2:00 PM" }
                    ]
                };
                const mockRecentTests = [
                    { id: 1, title: "DSA Course", description: "sample", status: "Ongoing" },
                    { id: 2, title: "JavaScript Basics", description: "sample", status: "Upcoming" }
                ];
                const mockCompletedResults = [
                    { id: 1, title: "DSA Course", description: "sample", status: "Completed" },
                    { id: 2, title: "React 101", description: "sample", status: "Completed" }
                ];
                const mockNotifications = [
                    { id: 1, message: "📢 Reminder: Your subscription is about to expire! Renew now to continue enjoying uninterrupted service." },
                    { id: 2, message: "🎉 Special Festive Offer! Get 50% off on all premium plans. Limited time only—grab the deal now!" },
                    { id: 3, message: "💰 Credits Reminder: You have 200 credits left in your account. Use them before they expire!" },
                    { id: 4, message: "⚠️ Low Credit Alert: You are running low on credits! Recharge now to avoid service interruptions." },
                    { id: 5, message: "🎓 Congratulations! You have successfully completed your exam. Check your results soon!" }
                ];

                setDashboardData(mockDashboardData);
                setTestDetails(mockDashboardData.testDetails);
                setRecentTests(mockRecentTests);
                setCompletedResults(mockCompletedResults);
                setNotifications(mockNotifications); // Set mock notifications
            } catch (error) {
                console.error("Error fetching dashboard data", error);
                setError("Failed to load data. Please try again later.");
            }
        };

        fetchDashboardData();
    }, []);

    if (error) {
        return <p className="text-center text-lg text-red-500">{error}</p>;
    }

    if (!dashboardData) {
        return <p className="text-center text-lg">Loading data...</p>;
    }

    return (
        <div className="lg:w-3xl justify-center flex flex-wrap dashboard">
            <div className="greeting">
                <h1>Welcome Admin</h1>
                <div className="grid grid-cols-2 xl:grid-cols-4 lg:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                    <motion.div
                        whileTap={{ scale: 1.1 }}
                        className="top-display top-display-clickable cursor-pointer"
                        onClick={togglePopup}>
                        <h4 className="xl:text-xl lg:text-xl md:text-xl">Active Test</h4>
                        <h2 className="xl:text-4xl lg:text-4xl md:text-4xl flex justify-center">
                            {dashboardData.activeContest}
                        </h2>
                    </motion.div>

                    <motion.div
                        whileTap={{ scale: 1.1 }}
                        className="top-display top-display-clickable cursor-pointer"
                        onClick={toggleCompletedPopup}>
                        <h4 className="xl:text-xl lg:text-xl md:text-xl">Completed Exams</h4>
                        <h2 className="xl:text-4xl lg:text-4xl md:text-4xl flex justify-center">
                            {dashboardData.activeContest}
                        </h2>
                    </motion.div>

                    <motion.div
                        whileTap={{ scale: 1.1 }}
                        className="top-display top-display-clickable cursor-pointer"
                        onClick={onSubscription}>
                        <h4 className="xl:text-xl lg:text-xl md:text-xl">Remaining Credits</h4>
                        <h2 className="xl:text-4xl lg:text-4xl md:text-4xl flex justify-center">
                            {dashboardData.credit}
                        </h2>
                    </motion.div>

                    <motion.div
                        whileTap={{ scale: 1.1 }}
                        className="top-display top-display-clickable cursor-pointer"
                        onClick={onManageStudents}>
                        <h4 className="xl:text-xl lg:text-xl md:text-xl">Total Students</h4>
                        <h2 className="xl:text-4xl lg:text-4xl md:text-4xl flex justify-center">
                            {dashboardData.totalStudents}
                        </h2>
                    </motion.div>

                    {showPopup && (
                        <div className="fixed inset-0 flex items-center justify-center top-display-pop">
                            <div className="top-display-pop-card rounded-sm shadow-lg w-3/4 md:w-1/2">
                                <div className="flex justify-between items-center mb-4 top-display-pop-title">
                                    <h2 className="font-semibold text-center">Active Exams</h2>
                                    <motion.button whileTap={{ scale: 1.2 }} className="text-red-500 text-lg" onClick={closePopup}>
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
                                            {testDetails.length > 0 ? (
                                                testDetails.map((test, index) => (
                                                    <tr key={test.id}>
                                                        <td>{index + 1}</td>
                                                        <td>{test.name}</td>
                                                        <td>{test.startTime}</td>
                                                        <td>{test.endTime}</td>
                                                        <td><motion.button whileTap={{ scale: 1.1 }} className="viewexam-btn-pop" onClick={onViewexam}>View</motion.button></td>
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
                            </div>
                        </div>
                    )}
                    {showCompletedPopup && (
                        <div className="fixed inset-0 flex items-center justify-center top-display-pop">
                            <div className="top-display-pop-card rounded-sm shadow-lg w-3/4 md:w-1/2">
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
                                            {testDetails.length > 0 ? (
                                                testDetails.map((test, index) => (
                                                    <tr key={test.id}>
                                                        <td>{index + 1}</td>
                                                        <td>{test.name}</td>
                                                        <td>{test.startTime}</td>
                                                        <td>{test.endTime}</td>
                                                        <td>
                                                            <motion.button
                                                                whileTap={{ scale: 1.1 }}
                                                                className="viewexam-btn-pop"
                                                                onClick={() => openEditPopup(test)}>
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
                            </div>
                        </div>
                    )}
                    {showEditPopup && <EditExam onClose={closeEditPopup} examDetails={selectedExam} />}
                </div>

                {showSubscription && <Subscription />}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mid-container">
                    <div className="w-4/10 mid-display">
                        <h4>Recent Tests</h4>
                        <div className="flex w-full justify-center">
                            <div className="tablee">
                                {recentTests.map((test, index) => (
                                    <div key={index} className="tablee-content" onClick={onViewexam}>
                                        <h6>{test.title}</h6>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="w-4/10 mid-display">
                        <h4>Completed Result</h4>
                        <div className="flex w-full justify-center">
                            <div className="tablee">
                                {completedResults.map((result, index) => (
                                    <div key={index} className="tablee-content" onClick={onViewexam}>
                                        <h6>{result.title}</h6>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="w-10/10">
                        <div className="mid-display2">
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
                                <li onClick={onAddCredits}>Buy Credits</li>
                            </ul>
                        </div>
                        <div className="mid-display2">
                            <h4>Notifications</h4>
                            <div className="flex justify-center">
                                <div className="notification-table">
                                    {notifications.map((notification, index) => (
                                        <div key={index} className="tablee-new">
                                            <h6>{notification.message}</h6>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
