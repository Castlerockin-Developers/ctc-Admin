import React, { useState } from "react";
import { FaSearch, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import filter from "../assets/filter.png";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { FaDatabase, FaPen, FaUpload } from "react-icons/fa";




// import { useEffect, useState } from "react";
// import axios from "axios";

// const API_BASE_URL = "http://127.0.0.1:8000/api/";

// const [studentsData, setStudentsData] = useState({});

// const fetchStudents = async () => {
//     try {
//         const response = await axios.get(`${API_BASE_URL}students/`);
//         const groupedData = {
//             "I Year": response.data.filter(student => student.batch === "2025"),
//             "II Year": response.data.filter(student => student.batch === "2024"),
//             "III Year": response.data.filter(student => student.batch === "2023"),
//             "IV Year": response.data.filter(student => student.batch === "2022"),
//         };
//         setStudentsData(groupedData);
//     } catch (error) {
//         console.error("Error fetching students:", error);
//     }
// };

// useEffect(() => {
//     fetchStudents();
// }, []);


// const handleCreateStudent = async () => {
//     try {
//         await axios.post(`${API_BASE_URL}students/`, student, {
//             headers: { "Content-Type": "application/json" },
//         });

//         alert("Student added successfully!");
//         fetchStudents(); // Refresh student list after adding
//         onClose();
//     } catch (error) {
//         console.error("Error adding student:", error);
//         alert("Failed to add student. Please try again.");
//     }
// };

// const handleDeleteStudent = async (usn) => {
//     try {
//         await axios.delete(`${API_BASE_URL}students/${usn}/`);
//         alert("Student deleted successfully!");
//         fetchStudents();
//     } catch (error) {
//         console.error("Error deleting student:", error);
//         alert("Failed to delete student.");
//     }
// };


// <motion.button className="delete-btn" whileTap={{ scale: 1.1 }} onClick={() => handleDeleteStudent(student.usn)}>
//     <FaTrash size={14} className="icon" />
// </motion.button>



const ManageStudents = ({ studentModalOpen, setStudentModalOpen }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilter, setShowFilter] = useState(false);
    const [activeTab, setActiveTab] = useState("I Year"); // Active tab for year selection

    const totalStudents = 123;
    const maxStudents = 500;

    const studentsData = {
        "I Year": [
            {
                usn: "1AB25CS000",
                name: "John Doe",
                batch: "2025",
                branch: "CSE",
                placeholder1: "Sample",
                placeholder2: "Sample",
            },
        ],
        "II Year": [
            {
                usn: "1AB24CS001",
                name: "Jane Smith",
                batch: "2024",
                branch: "ISE",
                placeholder1: "Data",
                placeholder2: "Info",
            },
        ],
        "III Year": [
            {
                usn: "1AB23CS002",
                name: "Alice Brown",
                batch: "2023",
                branch: "AIML",
                placeholder1: "Notes",
                placeholder2: "Study",
            },
        ],
        "IV Year": [
            {
                usn: "1AB22CS003",
                name: "Bob Johnson",
                batch: "2022",
                branch: "CSE",
                placeholder1: "Projects",
                placeholder2: "Research",
            },
        ],
    };

    const fetchStudentsData = async() => {

        console.log("Fetch")
    };

    // Function to handle student deletion
    const handleDeleteStudent = async (usn) => {
        Swal.fire({
            title: "Warning",
            text: "Are you sure you want to delete this item? ",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes",
            cancelButtonText: "No",
            background: "#181817",
            color: "#fff",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Send delete request to backend
                    const response = await fetch(`http://your-backend-url/api/students/${usn}`, {
                        method: "DELETE",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    });
    
                    if (!response.ok) {
                        fetchStudentsData();
                        throw new Error("Failed to delete student");
                        
                    }
    
                    // Show success alert
                    Swal.fire({
                        title: "Deleted!",
                        text: "Student has been removed.",
                        icon: "success",
                        background: "#181817",
                        color: "#fff",
                    });
    
                    // Refresh the state by fetching updated data
                    fetchStudentsData();
    
                } catch (error) {
                    Swal.fire({
                        title: "Error!",
                        text: "Failed to delete student. Please try again.",
                        icon: "error",
                        background: "#181817",
                        color: "#fff",
                    });
                }
            }
        });
    };
    

    const filteredStudents =
        studentsData[activeTab]?.filter(
            (student) =>
                searchQuery === "" ||
                student.usn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.batch.includes(searchQuery) ||
                student.branch.toLowerCase().includes(searchQuery.toLowerCase())
        ) || [];

    return (
        <div className="lg:w-3xl justify-center flex flex-wrap result-container">
            <div className="result-header">
                {/* Header with Total Students aligned to the right */}
                <div className="header-wrapper">
                    <h1 className="header-title">Manage Students</h1>
                    <div className="total-students-card">
                        <p className="total-label">Total Students</p>
                        <p className="total-count">
                            {totalStudents}/{maxStudents}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    {/* Left Tabs */}
                    <div className="m-btn-left flex flex-wrap justify-center sm:justify-start gap-2">
                        {["I Year", "II Year", "III Year", "IV Year"].map((year) => (
                            <motion.button
                                key={year}
                                whileTap={{ scale: 1.1 }}
                                className={activeTab === year ? "m-active" : ""}
                                onClick={() => setActiveTab(year)}
                            >
                                {year}
                            </motion.button>
                        ))}
                    </div>
                    {/* Search & Add Students Button */}
                    <div className="m-btn-right flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
                        <button
                            className="filter-btn"
                            onClick={() => setShowFilter(!showFilter)}
                        >
                            <img src={filter} alt="Filter" />
                        </button>

                        {/* Search Bar */}
                        <div className="search-box flex items-center w-full sm:w-auto">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full sm:w-auto"
                            />
                        </div>

                        {/* Add Students Button */}
                        <motion.button
                            whileTap={{ scale: 1.1 }}
                            className="create-btn"
                            onClick={() => setStudentModalOpen(true)}
                        >
                            <FaPlus size={12} className="mr-2" /> Add New Students
                        </motion.button>
                    </div>
                </div>

                {/* Students Table */}
                <div className="m-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>#USN</th>
                                <th>Name</th>
                                <th>Batch</th>
                                <th>Branch</th>
                                <th>Placeholder</th>
                                <th>Placeholder</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student, index) => (
                                    <tr
                                        key={student.usn}
                                        className={index % 2 === 0 ? "even-row" : "odd-row"}
                                    >
                                        <td>{student.usn}</td>
                                        <td>{student.name}</td>
                                        <td>{student.batch}</td>
                                        <td>{student.branch}</td>
                                        <td>{student.placeholder1}</td>
                                        <td>{student.placeholder2}</td>
                                        <td className="action-buttons">
                                            <motion.button
                                                className="edit-btn"
                                                whileTap={{ scale: 1.1 }}
                                            >
                                                <FaEdit size={14} className="icon" /> Edit
                                            </motion.button>
                                            <motion.button
                                                className="delete-btn"
                                                whileTap={{ scale: 1.1 }}
                                                onClick={() => handleDeleteStudent(student.usn)}
                                            >
                                                <FaTrash size={14} className="icon" />
                                            </motion.button>
                                            
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="no-data">
                                        No students found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Modal */}
            {studentModalOpen && (
                <AddStudentModal onClose={() => setStudentModalOpen(false)} />
            )}
        </div>
    );
};

const AddStudentModal = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState("manual"); // Default to Add Manually
    const [student, setStudent] = useState({
        usn: "",
        name: "",
        batch: "",
        branch: "",
        placeholder1: "",
        placeholder2: "",
    });

    const handleChange = (e) => {
        setStudent({ ...student, [e.target.name]: e.target.value });
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        console.log("Excel File Selected:", file.name); // Handle file processing here
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <h2 className="modal-title">Add Student</h2>

                {/* Tab Slider for Dataset & Add Manually */}
                <div className="toggle-buttons">
                    <motion.button
                        className={`toggle-btn ${activeTab === "dataset" ? "active" : ""}`}
                        onClick={() => setActiveTab("dataset")}
                    >
                        <FaDatabase className="icon" /> Dataset
                    </motion.button>
                    <motion.button
                        className={`toggle-btn ${activeTab === "manual" ? "active" : ""}`}
                        onClick={() => setActiveTab("manual")}
                    >
                        <FaPen className="icon" /> Add Manually
                    </motion.button>
                </div>

                {/* Dataset (Excel Upload) Section */}
                {activeTab === "dataset" && (
                    <div className="upload-section">
                        <label className="upload-label">Import from Excel:</label>
                        <input
                            type="file"
                            accept=".xls,.xlsx"
                            className="file-input"
                            onChange={handleFileUpload}
                        />
                        <FaUpload className="upload-icon" />
                    </div>
                )}

                {/* Manual Entry Form */}
                {activeTab === "manual" && (
                    <>
                        <div className="form-group">
                            <label>USN :</label>
                            <input
                                type="text"
                                name="usn"
                                className="form-input"
                                placeholder="Enter USN"
                                value={student.usn}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Name :</label>
                            
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                placeholder="Enter name"
                                value={student.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Batch :</label>
                            <input
                                type="text"
                                name="batch"
                                className="form-input"
                                placeholder="Enter batch"
                                value={student.batch}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label> Branch :</label>
                            <input
                                type="text"
                                name="branch"
                                className="form-input"
                                placeholder="Enter branch"
                                value={student.branch}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Placeholder 1 :</label>
                            <input
                                type="text"
                                name="placeholder1"
                                className="form-input"
                                placeholder="Enter value"
                                value={student.placeholder1}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Placeholder 2 :</label>
                            <input
                                type="text"
                                name="placeholder2"
                                className="form-input"
                                placeholder="Enter value"
                                value={student.placeholder2}
                                onChange={handleChange}
                            />
                        </div>
                    </>
                )}

                {/* Buttons */}
                <div className="modal-buttons">
                    <motion.button className="back-btn" onClick={onClose}>
                        ↩ Back
                    </motion.button>
                    <motion.button className="create-btn-student">Create</motion.button>
                </div>
            </div>
        </div>
    );
};

export default ManageStudents;
