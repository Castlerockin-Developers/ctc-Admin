import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import filter from "../assets/filter.png";
import line from "../assets/Line.png";
import { motion } from "framer-motion";
import ViewResult from './ViewResult'; // Import ViewResult component

const ManageResult = ({ onNext, onBack }) => {
    const [activeTab, setActiveTab] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilter, setShowFilter] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);

    // Sample Data (Replace with dynamic data if needed)
    const resultsData = [
        {
            id: 1,
            category: "Active",
            name: "DSA Crash Course",
            startTime: "10:00 AM",
            endTime: "11:30 AM",
            analytics: "25% Attempted",
            status: "Expired",
            studentsAttempted: 15,
            studentsUnattempted: 2,
            malpractice: 90,
            averageScore: 572,
            students: [
                { usn: "4NM20EC408", name: "Manish Naik", startTime: "10:00 AM", endTime: "11:30 AM",mcqMarks: 8,codingMarks: 15, score: 85, trustScore: 15 },
                { usn: "1AM22CI088", name: "Sanath Naik", startTime: "10:00 AM", endTime: "11:00 AM",mcqMarks: 10,codingMarks: 14, score: 75, trustScore: 75 },
                // Add more student data as needed
            ]
        },
        {
            id: 2,
            category: "Completed",
            name: "Python Basics",
            startTime: "12:00 PM",
            endTime: "1:30 PM",
            analytics: "80% Attempted",
            status: "Completed",
            studentsAttempted: 20,
            studentsUnattempted: 5,
            malpractice: 10,
            averageScore: 650,
            students: [
                { usn: "4NM20EC409", name: "John Doe", startTime: "12:00 PM", endTime: "1:30 PM",mcqMarks: 8,codingMarks: 15, score: 90, trustScore: 98 },
                // Add more student data as needed
            ]
        },
        // Add more result data as needed
    ];

    // Filtering Results based on Tab Selection & Search Query
    const filteredResults = resultsData
        .filter(row => activeTab === "all" || row.category.toLowerCase() === activeTab)
        .filter(row =>
            searchQuery === "" ||
            row.id.toString().includes(searchQuery) ||
            row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.startTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.endTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.analytics.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.status.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const handleViewResult = (result) => {
        setSelectedResult(result);
    };

    const handleBack = () => {
        setSelectedResult(null);
    };

    return (
        <div className="lg:w-3xl justify-center flex flex-wrap result-container">
            {selectedResult ? (
                <ViewResult result={selectedResult} onBack={handleBack} onNext={onNext} />
            ) : (
                <div className="result-header">
                    <h1>Results</h1>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        {/* Left Button Group (Tabs) */}
                        <div className="m-btn-left flex flex-wrap justify-center sm:justify-start gap-2">
                            <motion.button whileTap={{ scale: 1.1 }} className={activeTab === "all" ? "m-active" : ""} onClick={() => setActiveTab("all")}>
                                All Exams
                            </motion.button>
                            <motion.button whileTap={{ scale: 1.1 }} className={activeTab === "active" ? "m-active" : ""} onClick={() => setActiveTab("active")}>
                                Active
                            </motion.button>
                            <motion.button whileTap={{ scale: 1.1 }} className={activeTab === "completed" ? "m-active" : ""} onClick={() => setActiveTab("completed")}>
                                Completed
                            </motion.button>
                        </div>

                        {/* Right Side: Filter Button, Search Bar */}
                        <div className="m-btn-right flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
                            <button className="filter-btn" onClick={() => setShowFilter(!showFilter)}>
                                <img src={filter} alt="Filter" />
                            </button>

                            {/* Search Bar */}
                            <div className="search-box flex items-center w-full sm:w-auto">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search results..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full sm:w-auto"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filter Pop-up */}
                    {showFilter && (
                        <div className="filter-popup">
                            <h3>Branch</h3>
                            <div className="flex justify-center w-full">
                                <img src={line} alt="line" className="filter-line" />
                            </div>
                            <div className="filter-options">
                                {["CSE", "ISE", "AIML", "CSE AIML", "CSE DS", "EC"].map((branch, index) => (
                                    <div key={index} className="filter-item">
                                        {branch}
                                    </div>
                                ))}
                            </div>
                            <button className="apply-btn">Apply Filter</button>
                        </div>
                    )}

                    {/* Results Table */}
                    <div className="m-table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>#ID</th>
                                    <th>Name</th>
                                    <th className="start-time">Start Time</th>
                                    <th className="start-time">End Time</th>
                                    <th>Analytics</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredResults.length > 0 ? (
                                    filteredResults.map((row, index) => (
                                        <tr key={row.id} className={index % 2 === 0 ? "even-row" : "odd-row"}>
                                            <td>{row.id}</td>
                                            <td>{row.name}</td>
                                            <td>{row.startTime}</td>
                                            <td>{row.endTime}</td>
                                            <td>{row.analytics}</td>
                                            <td className={row.status === "Expired" ? "text-red-500" : ""}>{row.status}</td>
                                            <td>
                                                <motion.button className="viewexam-btn" whileTap={{ scale: 1.2 }} onClick={() => handleViewResult(row)}>
                                                    View Result
                                                </motion.button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="no-data">No results found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageResult;