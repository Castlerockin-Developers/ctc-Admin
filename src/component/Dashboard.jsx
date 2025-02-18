import React, { useEffect, useState } from "react";
import closeicon from '../assets/close.png';
import { motion } from "motion/react";
// import axios from "axios";
import EditExam from "./EditExam";


const Dashboard = ({ onCreateExam, onAddStudent, onAddUser, onAddCredits }) => {

    // const API_BASE_URL = "http://127.0.0.1:8000/api/";




    // const Dashboard = ({ onCreateExam, onAddStudent }) => {
    //     const [dashboardData, setDashboardData] = useState(null);
    //     const [showPopup, setShowPopup] = useState(false);
    //     const [showEditPopup, setShowEditPopup] = useState(false);
    //     const [selectedExam, setSelectedExam] = useState(null);
    //     const [testDetails, setTestDetails] = useState([]);

    //     useEffect(() => {
    //         fetchDashboardData();
    //         fetchExamData();
    //     }, []);

    //     // Fetch Dashboard Data from Django API
    //     const fetchDashboardData = async () => {
    //         try {
    //             const response = await axios.get(`${API_BASE_URL}dashboard/`);
    //             setDashboardData(response.data[0]); // Assuming only one dashboard entry exists
    //         } catch (error) {
    //             console.error("Error fetching dashboard data:", error);
    //         }
    //     };

    //     // Fetch Exam Data from Django API
    //     const fetchExamData = async () => {
    //         try {
    //             const response = await axios.get(`${API_BASE_URL}exams/`);
    //             setTestDetails(response.data);
    //         } catch (error) {
    //             console.error("Error fetching exams:", error);
    //         }
    //     };

    //     const togglePopup = () => setShowPopup((prev) => !prev);
    //     const closePopup = () => setShowPopup(false);

    //     const openEditPopup = (exam) => {
    //         setSelectedExam(exam);
    //         setShowEditPopup(true);
    //     };
    //     const closeEditPopup = () => setShowEditPopup(false);

    //     useEffect(() => {
    //         const handleKeyDown = (event) => {
    //             if (event.key === "Escape") {
    //                 setShowEditPopup(false);
    //                 setShowPopup(false);
    //             }
    //         };
    //         document.addEventListener("keydown", handleKeyDown);
    //         return () => document.removeEventListener("keydown", handleKeyDown);
    //     }, []);

    //     if (!dashboardData) {
    //         return <p className="text-center text-lg">Loading data...</p>;
    //     }

    //     return (
    //         <div className="lg:w-3xl justify-center flex flex-wrap dashboard">
    //             <div className="greeting">
    //                 <h1>Welcome Admin</h1>
    //                 <div className="grid grid-cols-2 xl:grid-cols-4 lg:grid-cols-2 md:grid-cols-4 gap-4 w-full">
    //                     <motion.div whileTap={{ scale: 1.1 }} className="top-display top-display-clickable" onClick={togglePopup}>
    //                         <h4 className="xl:text-xl lg:text-xl md:text-xl">Active Test</h4>
    //                         <h2 className="xl:text-4xl lg:text-4xl md:text-4xl flex justify-center">
    //                             {dashboardData.active_contest}
    //                         </h2>
    //                     </motion.div>

    //                     {/* Popup Modal */}
    //                     {showPopup && (
    //                         <div className="fixed inset-0 flex items-center justify-center top-display-pop">
    //                             <div className="top-display-pop-card rounded-sm shadow-lg w-3/4 md:w-1/2">
    //                                 <div className="flex justify-between items-center mb-4 top-display-pop-title">
    //                                     <h2 className="font-semibold text-center">Active Exams</h2>
    //                                     <motion.button whileTap={{ scale: 1.2 }} className="text-red-500 text-lg" onClick={closePopup}>
    //                                         <img src={closeicon} alt="Close" />
    //                                     </motion.button>
    //                                 </div>

    //                                 {/* Table */}
    //                                 <div className="flex justify-center rounded-sm">
    //                                     <table className="pop-up-table">
    //                                         <thead>
    //                                             <tr className="bg-gray-200">
    //                                                 <th>#</th>
    //                                                 <th>Name</th>
    //                                                 <th>Start Time</th>
    //                                                 <th>End Time</th>
    //                                                 <th></th>
    //                                             </tr>
    //                                         </thead>
    //                                         <tbody>
    //                                             {testDetails.length > 0 ? (
    //                                                 testDetails.map((test, index) => (
    //                                                     <tr key={test.id}>
    //                                                         <td>{index + 1}</td>
    //                                                         <td>{test.name}</td>
    //                                                         <td>{test.start_time}</td>
    //                                                         <td>{test.end_time}</td>
    //                                                         <td>
    //                                                             <motion.button whileTap={{ scale: 1.1 }} className="viewexam-btn-pop" onClick={() => openEditPopup(test)}>
    //                                                                 View
    //                                                             </motion.button>
    //                                                         </td>
    //                                                     </tr>
    //                                                 ))
    //                                             ) : (
    //                                                 <tr>
    //                                                     <td colSpan="4" className="text-center">No tests available</td>
    //                                                 </tr>
    //                                             )}
    //                                         </tbody>
    //                                     </table>
    //                                 </div>
    //                             </div>
    //                         </div>
    //                     )}
    //                     <div className="top-display">
    //                         <h4>Live Contest</h4>
    //                         <h2>{dashboardData.live_contest}</h2>
    //                     </div>
    //                     <div className="top-display">
    //                         <h4>Remaining Credits</h4>
    //                         <h2>{dashboardData.credit}</h2>
    //                     </div>
    //                     <div className="top-display">
    //                         <h4>Total Students</h4>
    //                         <h2>{dashboardData.total_students}</h2>
    //                     </div>
    //                     {showEditPopup && <EditExam onClose={closeEditPopup} examDetails={selectedExam} />}
    //                 </div>
    //                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mid-container">
    //                     <div className="w-4/10 mid-display">
    //                         <h4>Recent Tests</h4>
    //                         <div className="flex w-full justify-center">
    //                             <div className="tablee">
    //                                 <h5>Recent Tests</h5>
    //                                 {testDetails.map((test) => (
    //                                     <div key={test.id} className="tablee-content">
    //                                         <h6>{test.name}</h6>
    //                                     </div>
    //                                 ))}
    //                             </div>
    //                         </div>
    //                     </div>
    //                     <div className="w-10/10">
    //                         <div className="mid-display2">
    //                             <h4>Quick links</h4>
    //                             <ul className="list-disc">
    //                                 <li onClick={onCreateExam}>Create Exam</li>
    //                                 <li onClick={onAddStudent}>Add Student</li>
    //                                 <li>Add User</li>
    //                                 <li>Buy Credits</li>
    //                             </ul>
    //                         </div>
    //                         <div className="mid-display2">
    //                             <h4>Notifications</h4>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </div>
    //         </div>
    //     );
    // };

    // export default Dashboard;


    // const Dashboard = ({ onCreateExam, onAddStudent }) => {

    const [dashboardData, setDashboardData] = useState(null);
    const [showPopup, setShowPopup] = useState(false);
    const [showEditPopup, setShowEditPopup] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);
    const [testDetails, setTestDetails] = useState([]);

    const togglePopup = () => setShowPopup((prev) => !prev);
    const closePopup = () => setShowPopup(false); // Separate function for closing pop-up

    const openEditPopup = (exam) => {
        setSelectedExam(exam);
        setShowEditPopup(true);
    };
    const closeEditPopup = () => setShowEditPopup(false);

    // Close pop-ups when ESC is pressed
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setShowEditPopup(false);
                setShowPopup(false);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    useEffect(() => {
        setTimeout(() => {
            setDashboardData({
                activeContest: 15,
                liveContest: 2,
                credit: 1000,
                totalStudents: 572
            });

            // Sample test details
            setTestDetails([
                { id: 1, name: "Math Test", startTime: "10:00 AM", endTime: "11:00 AM" },
                { id: 2, name: "Science Quiz", startTime: "12:00 PM", endTime: "1:00 PM" },
                { id: 3, name: "History Exam", startTime: "2:00 PM", endTime: "3:30 PM" }
            ]);
        }, 1000);
    }, []);

    if (!dashboardData) {
        return <p className="text-center text-lg">Loading data...</p>;
    }

    return (
        <div className="lg:w-3xl justify-center flex flex-wrap dashboard">
            <div className="greeting">
                <h1>Welcome Admin</h1>
                <div className="grid grid-cols-2 xl:grid-cols-4 lg:grid-cols-2 md:grid-cols-4 gap-4 w-full">
                    <motion.div whileTap={{ scale: 1.1 }} className="top-display top-display-clickable" onClick={togglePopup}>
                        <h4 className="xl:text-xl lg:text-xl md:text-xl">Active Test</h4>
                        <h2 className="xl:text-4xl lg:text-4xl md:text-4xl flex justify-center">
                            {dashboardData.activeContest}
                        </h2>
                    </motion.div>

                    {/* Popup Modal */}
                    {showPopup && (
                        <div className="fixed inset-0 flex items-center justify-center top-display-pop">
                            <div className="top-display-pop-card rounded-sm shadow-lg w-3/4 md:w-1/2">
                                <div className="flex justify-between items-center mb-4 top-display-pop-title">
                                    <h2 className="font-semibold text-center">Active Exams</h2>
                                    <motion.button whileTap={{ scale: 1.2 }} className="text-red-500 text-lg" onClick={closePopup}><img src={closeicon} alt="" /></motion.button>
                                </div>

                                {/* Table */}
                                <div className="flex justify-center rounded-sm">
                                    <table className="pop-up-table">
                                        <thead>
                                            <tr className="bg-gray-200">
                                                <th className="">#</th>
                                                <th className="">Name</th>
                                                <th className="">Start Time</th>
                                                <th className="">End Time</th>
                                                <th className=""></th>
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
                                                        <td><motion.button whileTap={{ scale: 1.1 }} className="viewexam-btn-pop" onClick={() => openEditPopup(test)}>View</motion.button></td>
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
                    <div className="top-display">
                        <h4 className="xl:text-xl lg:text-xl md:text-xl">Completed Exams</h4>
                        <h2 className="xl:text-4xl lg:text-4xl md:text-4xl flex justify-center">
                            {dashboardData.liveContest}
                        </h2>
                    </div>
                    <div className="top-display">
                        <h4 className="xl:text-xl lg:text-xl md:text-xl">Remaining Credits</h4>
                        <h2 className="xl:text-4xl lg:text-4xl md:text-4xl flex justify-center">
                            {dashboardData.credit}
                        </h2>
                    </div>
                    <div className="top-display">
                        <h4 className="xl:text-xl lg:text-xl md:text-xl">Total Students</h4>
                        <h2 className="xl:text-4xl lg:text-4xl md:text-4xl flex justify-center">
                            {dashboardData.totalStudents}
                        </h2>
                    </div>
                    {/* Second pop-up for Edit Exam */}
                    {showEditPopup && <EditExam onClose={closeEditPopup} examDetails={selectedExam} />}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mid-container">
                    <div className="w-4/10 mid-display">
                        <h4>Recent Tests</h4>
                        <div className="flex w-full justify-center">
                            <div className="tablee">
                                <h5>DSA Crash Course</h5>
                                <div className="tablee-content">
                                    <h6>Hello World</h6>
                                </div>
                                <div className="tablee-content">
                                    <h6>Hello World</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-4/10 mid-display">
                        <h4>Completed Result</h4>
                        <div className="flex w-full justify-center">
                            <div className="tablee">
                                <h5>DSA Crash Course</h5>
                                <div className="tablee-content">
                                    <h6>Hello World</h6>
                                </div>
                                <div className="tablee-content">
                                    <h6>Hello World</h6>
                                </div>
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
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
