import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import filter from "../assets/filter.png";
import line from "../assets/Line.png";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { FaDatabase, FaPen, FaUpload } from "react-icons/fa";

import { authFetch, authFetchPayload } from '../scripts/AuthProvider';


const ManageStudents = ({ studentModalOpen, setStudentModalOpen }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const userCount = useRef(0); // to track total students count
  const totalAllowedStudents = useRef(0); // to track max students count
  const [showFilter, setShowFilter] = useState(false);

  const [activeTab, setActiveTab] = useState(""); // default to first branch after load
  const [branchFilter, setBranchFilter] = useState(""); // unused? you can keep or remove
  const [studentsData, setStudentsData] = useState({}); // expect object with branch keys
  const [groups, setGroups] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);  // Store selected student data


  // When data loads, set activeTab to first branch
  const fetchStudentsData = async () => {
    const response = await authFetch('/admin/students/', { method: 'GET' });
    if (response.status === 200) {
      const data = await response.json();
      userCount.current = data.user_count || 0; // total students count
      totalAllowedStudents.current = data.max_users
      setStudentsData(data.data || {}); // your students are under data key
      const firstBranch = Object.keys(data.data || {})[0];
      setActiveTab(firstBranch || "");
    } else {
      console.error("Failed to fetch students data");
    }
  };

  useEffect(() => {
    const loadGroups = async () => {
      const data = await fetchGroups();
      if (data) setGroups(data);
    };
    loadGroups();
    fetchStudentsData();
  }, []);

  // Filter students based on search query
  const filteredStudents = (studentsData[activeTab] || []).filter(student => {
    if (!student.usn) return false;

    const searchLower = searchQuery.toLowerCase();
    return (
      student.usn.toLowerCase().includes(searchLower) ||
      (student.name && student.name.toLowerCase().includes(searchLower)) ||
      (student.email && student.email.toLowerCase().includes(searchLower))
    );
  });

  // Calculate total students and max students from response or props
  const totalStudents = userCount.current;
  const maxStudents = totalAllowedStudents.current || 500;


  // Function to open the modal with selected student data
  const handleEditClick = (student) => {
    setSelectedStudent(student);  // Set the selected student
    setEditModalOpen(true);        // Open the modal
  };

  const fetchGroups = async () => {
    try {
      const response = await authFetch('/admin/groups', { method: 'GET' });
      if (response.ok) {
        const groupsData = await response.json();
        return groupsData;  // assuming JSON array or object of groups
      } else {
        console.error('Failed to fetch groups:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      return null;
    }
  };

  const handleDeleteStudent = async (id) => {
    try {
      const response = await authFetch(`/admin/students/${id}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Student Deleted',
          text: 'Student deleted successfully.',
        });
        fetchStudentsData(); // Refresh data after deletion
      } else {
        const errorData = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorData.error || 'Failed to delete student.',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Network error.',
      });
    }
  }

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

        {/* Branch Tabs */}
        <div className="m-btn-left flex flex-wrap justify-center sm:justify-start gap-2">
          {Object.keys(studentsData).map((branch) => (
            <motion.button
              key={branch}
              whileTap={{ scale: 1.1 }}
              className={activeTab === branch ? "m-active" : ""}
              onClick={() => {
                setSearchQuery("");    // Clear search input on tab change
                setBranchFilter("");
                setActiveTab(branch);
              }}
            >
              {branch}
            </motion.button>
          ))}
        </div>

        {/* Search and Add */}
        <div className="m-btn-right flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
          <button className="filter-btn" onClick={() => setShowFilter(prev => !prev)}>
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

        {/* Students Table */}
        <div className="m-table-container">
          <table>
            <thead>
              <tr>
                <th>#USN</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => (
                  <tr key={student.usn} className={index % 2 === 0 ? "even-row" : "odd-row"}>
                    <td>{student.usn}</td>
                    <td>{student.name || student.email}</td>
                    <td>{student.email}</td>
                    <td>{student.phone || "N/A"}</td>
                    <td>{student.is_active ? "Yes" : "No"}</td>
                    <td className="action-buttons">
                      <motion.button className="edit-btn" whileTap={{ scale: 1.1 }} onClick={() => handleEditClick(student)}>
                        <FaEdit size={14} className="icon" /> Edit
                      </motion.button>
                      <motion.button
                        className="delete-btn"
                        whileTap={{ scale: 1.1 }}
                        onClick={() => {
                          Swal.fire({
                            title: 'Are you sure?',
                            text: "You won't be able to revert this!",
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Yes, delete it!'
                          }).then((result) => {
                            if (result.isConfirmed) {
                              handleDeleteStudent(student.id);
                            }
                          });
                        }}
                      >
                        <FaTrash size={14} className="icon" />
                      </motion.button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">No students found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {studentModalOpen && <AddStudentModal onClose={() => setStudentModalOpen(false)} groups={groups} />}
      {editModalOpen && selectedStudent && (
        <EditStudentModal
          studentId={selectedStudent.id}
          groups={groups}  // Pass groups to modal
          onClose={() => setEditModalOpen(false)}  // Close modal
        />
      )}
    </div>
  );
};

const EditStudentModal = ({ onClose, groups, studentId }) => {
  const [student, setStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    usn: "",
    groupId: "",
    contact: "",
    gender: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Fetch student data if studentId is available
    const fetchStudentData = async () => {
      try {
        const response = await authFetch(`/admin/students/${studentId}`, { method: "GET" });
        if (response.ok) {
          const data = await response.json();

          // Assuming groups is an array and taking the first group
          const groupId = data.groups.length > 0 ? data.groups[0] : null;

          setStudent({
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            usn: data.slNo,
            groupId: groupId,
            contact: data.contact,
            gender: data.gender,
            password: "",
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Student data could not be loaded.",
          });
        }
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch student data.",
        });
      }
    };

    fetchStudentData();
  }, [studentId]);

  const validate = () => {
    const newErrors = {};
    if (!student.email) newErrors.email = "Email is required.";
    if (!student.firstName) newErrors.firstName = "First name is required.";
    if (!student.lastName) newErrors.lastName = "Last name is required.";
    if (!student.usn) newErrors.usn = "USN is required.";
    if (!student.groupId) newErrors.groupId = "Group selection is required.";
    return newErrors;
  };

  const handleEditStudent = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      id: studentId,
      first_name: student.firstName,
      last_name: student.lastName,
      email: student.email,
      username: student.email,
      password: student.password || undefined,
      slNo: student.usn,
      group: student.groupId,
      contact: student.contact,
      gender: student.gender,
    };

    try {
      const response = await authFetch(`/admin/students/${studentId}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Student Updated",
          text: "Student details updated successfully.",
        });
        onClose();
      } else {
        const errData = await response.json();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errData.error || "Failed to update student.",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Network error.",
      });
    }
  };

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };


  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2 className="modal-title">Edit Student</h2>

        <div className="form-group">
          <label>First Name :</label>
          <input
            type="text"
            name="firstName"
            className="form-input"
            placeholder="Enter First Name"
            value={student.firstName}
            onChange={handleChange}
          />
          {errors.firstName && <span className="error-text">{errors.firstName}</span>}
        </div>

        <div className="form-group">
          <label>Last Name :</label>
          <input
            type="text"
            name="lastName"
            className="form-input"
            placeholder="Enter Last Name"
            value={student.lastName}
            onChange={handleChange}
          />
          {errors.lastName && <span className="error-text">{errors.lastName}</span>}
        </div>

        <div className="form-group">
          <label>Email :</label>
          <input
            type="email"
            name="email"
            className="form-input"
            placeholder="Enter email"
            value={student.email}
            onChange={handleChange}
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="form-group">
          <label>Password :</label>
          <input
            type="password"
            name="password"
            className="form-input"
            placeholder="Keep blank to not change"
            placeholder="Enter new password (leave blank to keep current)"
            value={student.password}
            onChange={handleChange}
          />
          {errors.password && <span className="error-text">{errors.password}</span>}
        </div>

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
          <label>Group :</label>
          <select
            name="groupId"
            className="form-input"
            value={student.groupId}
            onChange={handleChange}
          >
            <option value="">Select a group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          {errors.groupId && <span className="error-text">{errors.groupId}</span>}
        </div>

        <div className="form-group">
          <label>Contact :</label>
          <input
            type="text"
            name="contact"
            className="form-input"
            placeholder="Enter phone number"
            value={student.contact}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Gender :</label>
          <select
            name="gender"
            className="form-input"
            value={student.gender}
            onChange={handleChange}
          >
            <option value="">Select gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Others</option>
          </select>
        </div>

        <div className="modal-buttons">
          <motion.button className="back-btn" onClick={onClose}>
            ↩ Back
          </motion.button>
          <motion.button className="create-btn-student" onClick={handleEditStudent}>
            Update
          </motion.button>
        </div>
      </div>
    </div>
  );
};

const AddStudentModal = ({ onClose, groups }) => {
  const [activeTab, setActiveTab] = useState("manual");
  const [student, setStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    usn: "",
    groupId: "",
    contact: "",
    gender: "",
  });
  const [errors, setErrors] = useState({});
  const [file, setFile] = useState(null);


  const validate = () => {
    const newErrors = {};
    if (!student.email) newErrors.email = "Email is required.";
    if (!student.firstName) newErrors.firstName = "First name is required.";
    if (!student.lastName) newErrors.lastName = "Last name is required.";
    if (!student.password) newErrors.password = "Password is required.";
    if (!student.usn) newErrors.usn = "USN is required.";
    if (!student.groupId) newErrors.groupId = "Group selection is required.";
    return newErrors;
  };

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      console.log("Excel File Selected:", selectedFile.name);
    }
  };

  const handleCreateStudent = async () => {
    if (activeTab === "dataset") {
      if (!file) {
        Swal.fire({
          icon: "error",
          title: "No file selected",
          text: "Please select an Excel file to upload.",
        });
        return;
      }
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await authFetchPayload("/admin/student-excel/", formData, "POST");

        if (response.ok) {
          const responseData = await response.json();
            Swal.fire({
            icon: "success",
            title: "Import Successful",
            html: `Successfully imported ${responseData.imported_count} students. Failed to import ${responseData.failed_count} students.<br><br>
                 <a href="${responseData.excel_report_url}" download="import_report.xlsx" class="swal2-confirm swal2-styled" style="background-color: #3085d6; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Download Report</a>`,
            showConfirmButton: true,
            });
          onClose();
        } else {
          const errData = await response.json();
          Swal.fire({
            icon: "error",
            title: "Import Failed",
            text: errData.error || "Failed to import students.",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "Network error.",
        });
      }
    }
    else {
      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      const payload = {
        first_name: student.firstName,
        last_name: student.lastName,
        email: student.email,
        password: student.password,
        username: student.email,
        slNo: student.usn,
        group: student.groupId,  // group id as integer in array
        contact: student.contact,
        gender: student.gender,
      };

      try {
        const response = await authFetch("/admin/students/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Student Created",
            text: "Student added successfully.",
          });
          onClose();
        } else {
          const errData = await response.json();
          Swal.fire({
            icon: "error",
            title: "Error",
            text: errData.error || "Failed to create student.",
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "Network error.",
        });
      }
    }
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
            <motion.button
              className="upload-btn"
              whileTap={{ scale: 1.1 }}
            >
            </motion.button>
          </div>
        )}
        {activeTab === "manual" && (
          <>
            <div className="form-group">
              <label>First Name :</label>
              <input
                type="text"
                name="firstName"
                className="form-input"
                placeholder="Enter First Name"
                value={student.firstName}
                onChange={handleChange}
              />
              {errors.firstName && <span className="error-text">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label>Last Name :</label>
              <input
                type="text"
                name="lastName"
                className="form-input"
                placeholder="Enter Last Name"
                value={student.lastName}
                onChange={handleChange}
              />
              {errors.lastName && <span className="error-text">{errors.lastName}</span>}

            </div>

            <div className="form-group">
              <label>Email :</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="Enter email"
                value={student.email}
                onChange={handleChange}
              />

              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>Password :</label>
              <input
                type="password"
                name="password"
                className="form-input"
                placeholder="Enter password"
                value={student.password}
                onChange={handleChange}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

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
              <label>Group :</label>
              <select
                name="groupId"
                className="form-input"
                value={student.groupId}
                onChange={handleChange}
              >
                <option value="">Select a group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {errors.groupId && <span className="error-text">{errors.groupId}</span>}
            </div>

            <div className="form-group">
              <label>Contact :</label>
              <input
                type="text"
                name="contact"
                className="form-input"
                placeholder="Enter phone number"
                value={student.contact}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Gender :</label>
              <select
                name="gender"
                className="form-input"
                value={student.gender}
                onChange={handleChange}
              >
                <option value="">Select gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Others</option>
              </select>
            </div>
          </>)}
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