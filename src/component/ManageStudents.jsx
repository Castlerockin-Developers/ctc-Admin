import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import filter from "../assets/filter.png";
import line from "../assets/Line.png";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { FaDatabase, FaPen, FaUpload } from "react-icons/fa";

const ManageStudents = ({ studentModalOpen, setStudentModalOpen }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [activeTab, setActiveTab] = useState("I Year");
  const [branchFilter, setBranchFilter] = useState("");

  const filterRef = useRef(null);

  const toggleFilter = () => {
    setShowFilter(prev => !prev);
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilter(false);
      }
    };

    if (showFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilter]);

  const handleFilterSelect = (branch) => {
    setBranchFilter(branch);
    setShowFilter(false);
  };

  const fetchStudentsData = async() => {
    console.log("Fetch");
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
      {
        usn: "1AB25CS001",
        name: "Jane Doe",
        batch: "2025",
        branch: "ISE",
        placeholder1: "Sample",
        placeholder2: "Sample",
      },
      {
        usn: "1AB25CS002",
        name: "Bob Smith",
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

  // Filter students based on search query and branch filter
  const filteredStudents =
    studentsData[activeTab]?.filter((student) => {
      const matchesSearch =
        searchQuery === "" ||
        student.usn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.batch.includes(searchQuery) ||
        student.branch.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBranch =
        branchFilter === "" ||
        student.branch.toLowerCase() === branchFilter.toLowerCase();
      return matchesSearch && matchesBranch;
    }) || [];

  return (
    <div className="lg:w-3xl justify-center flex flex-wrap result-container">
      <div className="result-header">
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
          {/* Left Tabs for Year */}
          <div className="m-btn-left flex flex-wrap justify-center sm:justify-start gap-2">
            {Object.keys(studentsData).map((year) => (
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
            <button className="filter-btn" onClick={toggleFilter}>
              <img src={filter} alt="Filter" />
            </button>
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
            <motion.button
              whileTap={{ scale: 1.1 }}
              className="create-btn"
              onClick={() => setStudentModalOpen(true)}
            >
              <FaPlus size={12} className="mr-2" /> Add New Students
            </motion.button>
          </div>
        </div>
        
        {/* Filter Popup for Branch Selection */}
        {showFilter && (
          <div className="filter-popup" ref={filterRef}>
            <h3>Branch</h3>
            <div className="flex justify-center w-full">
              <img src={line} alt="line" className="filter-line" />
            </div>
            <div className="filter-options">
              {["CSE", "ISE", "AIML", "CSE AIML", "CSE DS", "EC"].map((branch, index) => (
                <div
                  key={index}
                  className={`filter-item ${branchFilter === branch ? "active" : ""}`}
                  onClick={() => handleFilterSelect(branch)}
                >
                  {branch}
                </div>
              ))}
            </div>
            {/* Button to clear the branch filter */}
            <button className="apply-btn" onClick={() => setBranchFilter("")}>
              Clear Branch Filter
            </button>
          </div>
        )}
        
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
  const [activeTab, setActiveTab] = useState("manual");
  const [student, setStudent] = useState({
    usn: "",
    name: "",
    batch: "",
    branch: "",
    placeholder1: "",
    placeholder2: "",
  });
  const [errors, setErrors] = useState({});

  // Function to create a JSON request for adding a student
  const handleCreateStudent = async () => {
    // Validate required fields
    const newErrors = {};
    if (!student.usn) newErrors.usn = "USN is required.";
    if (!student.name) newErrors.name = "Name is required.";
    if (!student.batch) newErrors.batch = "Batch is required.";
    if (!student.branch) newErrors.branch = "Branch is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return; // Stop the submission if there are validation errors
    }
    
    const studentData = { ...student };
    
    // The following axios request is commented out because the backend is not ready.
    // try {
    //   await axios.post("http://your-backend-url/api/students/", studentData, {
    //     headers: { "Content-Type": "application/json" },
    //   });
    //   alert("Student added successfully!");
    //   onClose();
    // } catch (error) {
    //   console.error("Error adding student:", error);
    //   alert("Failed to add student. Please try again.");
    // }
    
    // For now, simply log the JSON to the console
    console.log("Student Data (JSON):", JSON.stringify(studentData));
    onClose();
  };

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
    // Remove error message for the field as soon as the user starts typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    console.log("Excel File Selected:", file.name);
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
              {errors.usn && <span className="error-text">{errors.usn}</span>}
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
              {errors.name && <span className="error-text">{errors.name}</span>}
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
              {errors.batch && <span className="error-text">{errors.batch}</span>}
            </div>
            <div className="form-group">
              <label>Branch :</label>
              <input
                type="text"
                name="branch"
                className="form-input"
                placeholder="Enter branch"
                value={student.branch}
                onChange={handleChange}
              />
              {errors.branch && <span className="error-text">{errors.branch}</span>}
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
          <motion.button className="create-btn-student" onClick={handleCreateStudent}>
            Create
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ManageStudents;