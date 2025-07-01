import React, { useEffect, useState } from "react";
import closeicon from '../assets/close.png';
import { motion } from "framer-motion";
import EditExam from "./EditExam";
import ViewExam from "./ViewExam"; // Import ViewExam component
import { authFetch } from "../scripts/AuthProvider";
// import axios from 'axios'; // Uncomment and use axios for making HTTP requests when backend is ready

const Dashboard = ({ onCreateExam, onAddStudent, onAddUser, onAddCredits, onManageExam, onSubscription, onManageStudents }) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [testDetails, setTestDetails] = useState([]);
    const [showSubscription, setShowSubscription] = useState(false);
    const [showCompletedPopup, setShowCompletedPopup] = useState(false);
    const [recentTests, setRecentTests] = useState([]);
    const [completedResults, setCompletedResults] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true); // State to manage loading
    const [userData, setUserData] = useState(null);



    useEffect(() => {
        const fetchDashboardData = async () => {
            // try {
            //     // Uncomment and update the endpoint once your backend is ready
            //     // const response = await axios.get('https://api.example.com/dashboard');
            //     // setDashboardData(response.data);

            //     // Simulate dashboard data (temporary mock data while the backend is not available)
            //     const mockDashboardData = {
            //         activeContest: 5,
            //         liveContest: 3,
            //         credit: 2000,
            //         totalStudents: 150,
            //         testDetails: [
            //             { id: 1, name: "Math Test", startTime: "10:00 AM", endTime: "11:00 AM" },
            //             { id: 2, name: "Science Quiz", startTime: "1:00 PM", endTime: "2:00 PM" }
            //         ]
            //     };
            //     const mockRecentTests = [
            //         { id: 1, title: "DSA Course", description: "sample", status: "Ongoing" },
            //         { id: 2, title: "JavaScript Basics", description: "sample", status: "Upcoming" }
            //     ];
            //     const mockCompletedResults = [
            //         { id: 1, title: "DSA Course", description: "sample", status: "Completed" },
            //         { id: 2, title: "React 101", description: "sample", status: "Completed" }
            //     ];
            //     const mockNotifications = [
            //         { id: 1, message: "📢 Reminder: Your subscription is about to expire! Renew now to continue enjoying uninterrupted service." },
            //         { id: 2, message: "🎉 Special Festive Offer! Get 50% off on all premium plans. Limited time only—grab the deal now!" },
            //         { id: 3, message: "💰 Credits Reminder: You have 200 credits left in your account. Use them before they expire!" },
            //         { id: 4, message: "⚠️ Low Credit Alert: You are running low on credits! Recharge now to avoid service interruptions." },
            //         { id: 5, message: "🎓 Congratulations! You have successfully completed your exam. Check your results soon!" }
            //     ];

            //     setDashboardData(mockDashboardData);
            //     setTestDetails(mockDashboardData.testDetails);
            //     setRecentTests(mockRecentTests);
            //     setCompletedResults(mockCompletedResults);
            //     setNotifications(mockNotifications);
            //     setLoading(false);
            // } catch (error) {
            //     console.error("Error fetching dashboard data", error);
            //     setError("Failed to load data. Please try again later.");
            //     setLoading(false);
            // }

            const resposeData = await authFetch('/admin/home/',{
                method: 'GET',
            });
            const raesponseData = await resposeData.json();

                setDashboardData({
                    activeContest: raesponseData.active_exam,
                    liveContest: raesponseData.completed_exams_count,
                    credit: raesponseData.credits,   
                    totalStudents: raesponseData.total_users});
                
                setTestDetails(raesponseData.active_exams);
                setRecentTests(raesponseData.recent_exams);
                setCompletedResults(raesponseData.completed_exams);
                setNotifications(raesponseData.notifications);
                setLoading(false);
                setUserData(raesponseData.logged_in_user);
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <p className="text-center text-lg">Loading data...</p>;
    }

    if (error) {
        return <p className="text-center text-lg text-red-500">{error}</p>;
    }

    const handleViewExam = (exam) => {
        setSelectedExam(exam);
    };

    const handleBack = () => {
        setSelectedExam(null);
    };

    const onViewexam = (test) => {
        setSelectedExam({ id: test.id, title: test.title });
    };

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

    return (
        <div className="lg:w-full xl:w-3xl justify-center flex flex-wrap dashboard">
            {selectedExam ? (
                <ViewExam exam={selectedExam} onBack={handleBack} />
            ) : (
                <div className="greeting">
                    <h1 className="text-2xl md:text-3xl xl:text-4xl font-semibold text-white">Welcome {userData}</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
                        <motion.div
                            whileTap={{ scale: 1.1 }}
                            className="top-display top-display-clickable cursor-pointer greet1"
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
                                {dashboardData.liveContest}
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
                                <div className="top-display-pop-card rounded-sm shadow-lg w-11/12 md:w-3/4 lg:w-1/2">
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
                                                {testDetails.length > 0 ? (
                                                    testDetails.map((test, index) => (
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
                                </div>
                            </div>
                        )}
                        {showCompletedPopup && (
                            <div className="fixed inset-0 flex items-center justify-center top-display-pop">
                                <div className="top-display-pop-card rounded-sm shadow-lg w-11/12 md:w-3/4 xl:w-1/2">
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
                                                {completedResults.length > 0 ? (
                                                    completedResults.map((test, index) => (
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
                                    {recentTests.map((test) => (
                                        <div key={test.id} className="tablee-content" onClick={() => onViewexam(test)}>
                                            <h6>{test.name}</h6>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="w-4/10 mid-display">
                            <h4>Completed Result</h4>
                            <div className="flex w-full justify-center">
                                <div className="tablee">
                                    {completedResults.map((result) => (
                                        <div key={result.id} className="tablee-content" onClick={() => onViewexam(result)}>
                                            <h6>{result.name}</h6>
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
                            <div className="mid-display3">
                                <h4>Notifications</h4>
                                <div className="flex justify-center">
                                    <div className="notification-table">
                                        {notifications.map((notification, index) => (
                                            <div key={index} className="tablee-new">
                                                <h6>{notification.title}: {notification.message}</h6>
                                            </div>
                                        ))}
                                        <br />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

