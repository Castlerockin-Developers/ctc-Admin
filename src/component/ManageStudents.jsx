import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FaSearch,
  FaPlus,
  FaFilter,
  FaDatabase,
  FaPen,
  FaUpload,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { authFetch, authFetchPayload } from "../scripts/AuthProvider";
import TableSkeleton from "../loader/TableSkeleton";
import { useCache } from "../hooks/useCache";
import CacheStatusIndicator from "./CacheStatusIndicator";
import "./CacheStatusIndicator.css";

// Utility function to truncate text:
// It returns "..." if the text is too long,
// and the full name shows on hover via the 'title' attribute.
const truncateText = (text, maxLength) => {
  if (!text) return "";
  if (text.length <= maxLength) {
    return text;
  } else {
    return text.substring(0, maxLength) + "..."; // Correct truncation logic
  }
};

const ManageStudents = ({ studentModalOpen, setStudentModalOpen, cacheAllowed }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const userCount = useRef(0); // to track total students count
  const totalAllowedStudents = useRef(0); // to track max students count
  const [totalStudents, setTotalStudents] = useState(0); // <-- use only this for total students
  const [activeTab, setActiveTab] = useState("all"); // default to first branch after load
  const [studentsData, setStudentsData] = useState({}); // expect object with branch keys
  const [groups, setGroups] = useState([]);


  // State to track screen width for responsive rendering
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  // const [studentsPerPage] = useState(10); // Number of students to display per page
  // responsive students-per-page: 15 if width ≥2560px, else 10
  const [studentsPerPage, setStudentsPerPage] = useState(
    () => window.innerWidth >= 2560 ? 18 : 10
  );

  const pageFade = {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        duration: 0.4,
        when: "beforeChildren",
        staggerChildren: 0.08,
      },
    },
  };

  const itemSlide = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  const tableRowSlide = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.03,
        duration: 0.3,
      },
    }),
  };

  useEffect(() => {
    const onResize = () => {
      setStudentsPerPage(window.innerWidth >= 2560 ? 15 : 10);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);



  const [loading, setLoading] = useState(true); // State to track loading

  // Effect to update screenWidth on window resize
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Students data fetch function
  const fetchStudentsData = useCallback(async () => {
    const response = await authFetch("/admin/students/", { method: "GET" });
    if (response.status === 200) {
      const data = await response.json();
      return {
        user_count: data.user_count || 0,
        max_users: data.max_users,
        data: data.data || {}
      };
    } else {
      throw new Error("Failed to fetch students data");
    }
  }, []);

  // Cache callbacks
  const onCacheHit = useCallback((data) => {
    console.log('Students data loaded from cache');
  }, []);

  const onCacheMiss = useCallback((data) => {
    console.log('Students data fetched fresh');
  }, []);

  const onError = useCallback((err) => {
    console.error('Students fetch error:', err);
  }, []);

  // Use cache hook for students data
  const {
    data: cachedStudentsData,
    loading: cacheLoading,
    error: cacheError,
    cacheUsed,
    cacheInfo,
    forceRefresh,
    invalidateCache
  } = useCache('students_data', fetchStudentsData, {
    enabled: cacheAllowed,
    expiryMs: 5 * 60 * 1000, // 5 minutes
    autoRefresh: false,
    onCacheHit,
    onCacheMiss,
    onError
  });

  // Create a refresh function that forces cache refresh
  const refreshStudentsData = useCallback(async () => {
    if (cacheAllowed) {
      // First invalidate the cache to ensure fresh data
      invalidateCache();
      // Then force refresh to get new data
      await forceRefresh();
    } else {
      // If cache is disabled, just fetch fresh data
      const freshData = await fetchStudentsData();
      setTotalStudents(freshData.user_count || 0);
      totalAllowedStudents.current = freshData.max_users;
      setStudentsData(freshData.data || {});
      setCurrentPage(1);
    }
  }, [cacheAllowed, forceRefresh, fetchStudentsData, invalidateCache]);

  console.log('Cache debug:', {
    cacheAllowed,
    cacheLoading,
    cacheError,
    cachedStudentsData,
    cacheUsed,
    cacheInfo
  });

  // If cache is disabled, show a message
  if (!cacheAllowed) {
    console.log('Cache is disabled - this might be causing the issue');
  }

  // Add cache status display for debugging
  const cacheStatus = cacheAllowed ? (cacheUsed ? 'Using Cache' : 'Fresh Data') : 'Cache Disabled';

  // Update local state when cache data changes
  useEffect(() => {
    if (cachedStudentsData) {
      console.log('Cached students data:', cachedStudentsData);
      setTotalStudents(cachedStudentsData.user_count || 0);
      totalAllowedStudents.current = cachedStudentsData.max_users;
      setStudentsData(cachedStudentsData.data || {});
      setCurrentPage(1);
    }
  }, [cachedStudentsData]);

  // Load groups on component mount
  useEffect(() => {
    const loadGroups = async () => {
      const data = await fetchGroups();
      if (data) setGroups(data);
    };
    loadGroups();
  }, []);



  // Filter students based on search query
  const filteredAndSortedStudents = () => {
    console.log('Filter function - studentsData:', studentsData);
    console.log('Filter function - activeTab:', activeTab);
    
    if (!studentsData) {
      console.log('No studentsData, returning empty array');
      return [];
    }

    let currentBranchStudents =
      activeTab === "all"
        ? Object.values(studentsData).flat()
        : studentsData[activeTab] || [];
    
    console.log('Current branch students:', currentBranchStudents);

    // Apply search filter first
    const searchLower = searchQuery.toLowerCase();
    const filtered = currentBranchStudents.filter((student) => {
      if (!student || !student.usn) return false;
      return (
        student.usn.toLowerCase().includes(searchLower) ||
        (student.name && student.name.toLowerCase().includes(searchLower)) ||
        (student.email && student.email.toLowerCase().includes(searchLower)) ||
        (student.contact && student.contact.toLowerCase().includes(searchLower))
      );
    });


    return filtered;
  };

  const studentsToDisplay = filteredAndSortedStudents(); // Get the filtered and sorted list

  // Pagination Logic
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = studentsToDisplay.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );

  const totalPages = Math.ceil(studentsToDisplay.length / studentsPerPage);



  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Calculate max students from response or props




  const fetchGroups = async () => {
    try {
      const response = await authFetch("/admin/groups/", { method: "GET" });
      if (response.ok) {
        const groupsData = await response.json();
        return groupsData;
      } else {
        console.error("Failed to fetch groups:", response.status);
        return null;
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      return null;
    }
  };



  return (
    <motion.div
      variants={pageFade}
      initial="initial"
      animate="animate"
      className="lg:w-3xl justify-center flex flex-wrap result-container">
              <div className="result-header">
          <div className="header-wrapper">
            <div className="flex justify-between items-center w-full">
              <div>
                <motion.h1 variants={itemSlide} className="header-title">Manage Students</motion.h1>
              </div>
              <div className="flex items-center gap-4">
                <motion.div variants={itemSlide} className="total-students-card">
                  <p className="total-label">Total Students</p>
                  <p className="total-count">
                    {totalStudents}/{totalAllowedStudents.current || 500}
                  </p>
                </motion.div>

              </div>
            </div>
          </div>

        {/* Search and Add */}
        <div className="m-btn-right flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
          {/* Combined Branch Filter */}
          <motion.div
            variants={itemSlide}
            className="m-btn-left flex flex-wrap justify-center sm:justify-start gap-2">
            <motion.select
              variants={itemSlide}
              className="branch-filter-select" // Add a class for styling
              value={activeTab}
              onChange={(e) => {
                setSearchQuery("");
                setActiveTab(e.target.value);
                setCurrentPage(1); // Reset to first page on branch change
              }}
            >
              <option value="all">All Branches</option>
              {studentsData && Object.keys(studentsData).sort().map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </motion.select>
          </motion.div>
          <motion.div
            variants={itemSlide}
            className="search-box flex items-center w-full sm:w-auto">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
              className="w-full sm:w-auto"
            />
          </motion.div>
          <motion.button
            whileTap={{ scale: 1.1 }}
            variants={itemSlide}
            className="create-btn create-students-btn"
            onClick={() => setStudentModalOpen(true)}
          >
            <FaPlus size={12} className="mr-2" /> Add New Students
          </motion.button>
        </div>

        {/* Students Table */}
        <div className="m-table-container">
          {cacheLoading ? (
            <TableSkeleton />
          ) : cacheError ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{cacheError.message || "Failed to load students data"}</p>
              <button 
                onClick={forceRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : !cachedStudentsData ? (
            <TableSkeleton />
          ) : (
            <table>
              <thead>
                {/* Changed breakpoint to 768px to cover tablets and most mobile devices */}
                {screenWidth <= 768 ? (
                  // Mobile/Tablet Headers (6 columns)
                  <tr>
                    <th
                      className="mobile-usn-col"
                    // onClick={() => handleSort("usn")}
                    >
                      USN
                    </th>
                    <th className="mobile-name-col">Name</th>
                    <th className="mobile-email-col">Email</th>
                    <th className="mobile-phone-col">Phone</th>
                    <th className="mobile-status-col">Active</th>
                  </tr>
                ) : (
                  // Desktop Headers (6 columns)
                  <tr>
                    <th
                      className="desktop-usn-col"
                    // onClick={() => handleSort("usn")}
                    >
                      #USN
                    </th>
                    <th className="desktop-name-col">Name</th>
                    <th className="desktop-email-col">Email</th>
                    <th className="desktop-phone-col">Phone</th>
                    <th className="desktop-active-col">Active</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {currentStudents.length > 0 ? (
                  currentStudents.map((student, index) => (
                    <motion.tr
                      key={student.usn}
                      custom={index}
                      variants={tableRowSlide}
                      initial="hidden"
                      animate="visible"
                      className={index % 2 === 0 ? "even-row" : "odd-row"}
                    >
                      {/* Changed breakpoint to 768px */}
                      {screenWidth <= 768 ? (
                        // Mobile/Tablet Data Cells (6 columns)
                        <>
                          <td className="mobile-usn-col">{student.usn}</td>
                          {/* Name column: Displays "..." if long, full name on hover */}
                          <td
                            className="mobile-name-col"
                            title={student.name || student.email}
                          >
                            {truncateText(student.name, 20)}
                          </td>
                          <td className="mobile-email-col">{student.email}</td>
                          {/* Phone column: Displays content or "-", full number on hover */}
                          <td
                            className="mobile-phone-col"
                            title={student.contact}
                          >
                            {student.contact || "-"}
                          </td>
                          <td className="mobile-status-col">
                            {student.is_active ? "Yes" : "No"}
                          </td>
                        </>
                      ) : (
                        // Desktop Data Cells (6 columns)
                        <>
                          <td className="desktop-usn-col">{student.usn}</td>
                          {/* Name column: Displays "..." if long, full name on hover */}
                          <td
                            className="desktop-name-col"
                            title={student.name || student.email}
                          >
                            {truncateText(student.name || student.email, 30)}
                          </td>
                          <td className="desktop-email-col">{student.email}</td>
                          {/* Phone column: Displays content or "-", full number on hover */}
                          <td
                            className="desktop-phone-col"
                            title={student.contact}
                          >
                            {student.contact || "-"}
                          </td>
                          <td className="desktop-active-col">
                            {student.is_active ? "Yes" : "No"}
                          </td>
                        </>
                      )}
                    </motion.tr>
                  ))
                ) : (
                  <tr>
                    {/* Adjusted colspan to 6 as there are now 6 columns */}
                    <td colSpan="6" className="no-data">
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Controls */}
        {studentsToDisplay.length > studentsPerPage && ( // Only show pagination if there's more than one page
          <div className="pagination-controls flex justify-between items-center mt-4">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </motion.button>
            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              Next
            </motion.button>
          </div>
        )}
      </div>

      {/* Add/Edit Student Modals */}
      {studentModalOpen && (
        <AddStudentModal
          onClose={() => setStudentModalOpen(false)}
          groups={groups}
          refreshTotalStudents={refreshStudentsData} // <-- pass callback
        />
      )}

    </motion.div>
  );
};

// -----------------------------------------------------------------------------
// EditStudentModal Component (no changes needed for this specific request)
// -----------------------------------------------------------------------------
const EditStudentModal = ({ onClose, groups, studentId, refreshTotalStudents }) => {
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
        const response = await authFetch(`/admin/students/${studentId}/`, {
          method: "GET",
        });
        if (response.ok) {
          const data = await response.json();

          // Assuming groups is an array and taking the first group
          const groupId = data.groups.length > 0 ? data.groups[0] : null;

          setStudent({
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            usn: data.slNo,
            groupId: groupId, // Ensure this maps correctly to your group IDs
            contact: data.contact,
            gender: data.gender,
            password: "", // Password is not fetched for security, set to blank
          });
        } else {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Student data could not be loaded.",
            background: '#181817',
            color: '#fff',
          });
        }
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch student data.",
          background: '#181817',
          color: '#fff',
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
      first_name: student.firstName,
      last_name: student.lastName,
      email: student.email,
      username: student.email, // Assuming username is same as email
      slNo: student.usn,
      group: student.groupId, // Send only the group ID
      contact: student.contact,
      gender: student.gender,
    };

    // Only include password if it's not empty, otherwise API might try to change it to empty string
    if (student.password) {
      payload.password = student.password;
    }

    try {
      const response = await authFetch(`/admin/students/${studentId}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Swal.fire({
          icon: "success",
        iconColor: "#A294F9", // Set the icon color to purple
          title: "Student Updated",
          text: "Student details updated successfully.",
          background: '#181817',
          color: '#fff',
        });
        if (refreshTotalStudents) await refreshTotalStudents();
        onClose(); // Close modal
      } else {
        const errData = await response.json();
        Swal.fire({
          icon: "error",
          title: "Error",
          text: errData.error || "Failed to update student.",
          background: '#181817',
          color: '#fff',
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Network error.",
        background: '#181817',
        color: '#fff',
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
          {errors.firstName && (
            <span className="error-text">{errors.firstName}</span>
          )}
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
          {errors.lastName && (
            <span className="error-text">{errors.lastName}</span>
          )}
        </div>

        <div className="form-group">
          <label>Email :</label>
          <input
            type="email"
            name="email"
            className="form-input"
            placeholder="Enter email"
            value={student.email}
            disabled
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
            value={student.password}
            onChange={handleChange}
          />
          {errors.password && (
            <span className="error-text">{errors.password}</span>
          )}
        </div>

        <div className="form-group">
          <label>USN :</label>
          <input
            type="text"
            name="usn"
            className="form-input"
            placeholder="Enter USN"
            value={student.usn}
            disabled
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
            <option value="" disabled>Select a group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          {errors.groupId && (
            <span className="error-text">{errors.groupId}</span>
          )}
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
            Back
          </motion.button>
          <motion.button
            className="create-btn-student"
            onClick={handleEditStudent}
          >
            Update
          </motion.button>
        </div>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// AddStudentModal Component (fixed)
// -----------------------------------------------------------------------------
const AddStudentModal = ({ onClose, groups, refreshTotalStudents }) => {
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
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingStudent, setIsCreatingStudent] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!student.email) newErrors.email = "Email is required.";
    if (!student.firstName) newErrors.firstName = "First name is required.";
    if (!student.lastName) newErrors.lastName = "Last name is required.";
    if (!student.password) newErrors.password = "Password is required.";
    if (!student.usn) newErrors.usn = "USN is required.";
    if (!student.groupId) newErrors.groupId = "Group selection is required.";
    if (isAddingGroup) {
      if (!newGroupName.trim())
        newErrors.newGroupName = "Please enter a group name.";
    } else {
      if (!student.groupId)
        newErrors.groupId = "Group selection is required.";
    }
    return newErrors;
  };

  const modalPopup = {
    initial: { opacity: 0, scale: 0.95, y: -30 },
    animate: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 20 } },
    exit: { opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } },
  };

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
  };
  const handleGroupChange = (e) => {
    if (e.target.value === "add_new") {
      setIsAddingGroup(true);
      setStudent((s) => ({ ...s, groupId: "" }));
    } else {
      setIsAddingGroup(false);
      setStudent((s) => ({ ...s, groupId: e.target.value }));
      setErrors((err) => ({ ...err, groupId: null }));
    }
  };

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      console.log("Excel File Selected:", selectedFile.name);
    }
  };

  const handleCreateStudent = async () => {
    setIsCreatingStudent(true);
    if (activeTab === "dataset") {
      if (!file) {
        Swal.fire({
          icon: "error",
          title: "No file selected",
          text: "Please select an Excel file to upload.",
          background: '#181817',
          color: '#fff',
        });
        setIsCreatingStudent(false);
        return;
      }
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await authFetchPayload(
          "/admin/student-excel/",
          formData,
          "POST"
        );

        if (response.ok) {
          const responseData = await response.json();
          Swal.fire({
            icon: "success",
        iconColor: "#A294F9", // Set the icon color to purple
            title: "Import Successful",
            html: `Successfully imported ${responseData.imported_count} students. Failed to import ${responseData.failed_count} students.<br><br>
                                            <a href="${responseData.excel_report_url}" download="import_report.xlsx" class="swal2-confirm swal2-styled" style="background-color: #3085d6; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none;">Download Report</a>`,
            showConfirmButton: true,
            background: '#181817',
            color: '#fff',
          });
          if (refreshTotalStudents) await refreshTotalStudents();
          onClose();
        } else {
          const errData = await response.json();
          Swal.fire({
            icon: "error",
            title: "Import Failed",
            text: errData.error || "Failed to import students.",
            background: '#181817',
            color: '#fff',
          });
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message || "Network error.",
          background: '#181817',
          color: '#fff',
        });
      }
      setIsCreatingStudent(false);
    } else {
      const validationErrors = validate();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsCreatingStudent(false);
        return;
      }

      if (isAddingGroup) {
        const res = await authFetch("/admin/groups/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newGroupName.trim() }),
        });
        if (!res.ok) {
          const err = await res.json();
          return Swal.fire({
            icon: "error",
            title: "Error",
            text: err.error || "Could not create group.",
            background: '#181817',
            color: '#fff',
          });
          setIsCreatingStudent(false);
        }
        const created = await res.json();
        // overwrite student.groupId with the new group's ID
        student.groupId = created.id;
        // update the local dropdown list
        setGroups(g => [...g, created]);
        setIsAddingGroup(false);
      }
      // ──────────────────────────────────────────────────────────────────────────

      // 3) Build the payload for student creation
      const payload = {
        first_name: student.firstName,
        last_name: student.lastName,
        email: student.email,
        password: student.password,
        username: student.email,
        slNo: student.usn,
        group: student.groupId,   // now either existing or newly created
        contact: student.contact,
        gender: student.gender,
      };

      // const payload = {
      //   first_name: student.firstName,
      //   last_name: student.lastName,
      //   email: student.email,
      //   password: student.password,
      //   username: student.email,
      //   slNo: student.usn,
      //   group: student.groupId, // group id as integer in array
      //   contact: student.contact,
      //   gender: student.gender,
      // };

      try {
        const response = await authFetch("/admin/students/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          Swal.fire({
            icon: "success",
        iconColor: "#A294F9", // Set the icon color to purple
            title: "Student Created",
            text: "Student added successfully.",
            background: '#181817',
            color: '#fff',
          });
          if (refreshTotalStudents) await refreshTotalStudents();
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
          background: '#181817',
          color: '#fff',
        });
      }
      setIsCreatingStudent(false);
    }
  };

  return (
    <motion.div
      variants={modalPopup}
      initial="initial"
      animate="animate"
      exit="exit"
      className="modal-overlay">
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
              onClick={handleCreateStudent} // Changed onClick to handleCreateStudent
              disabled={isCreatingStudent}
            >
              {isCreatingStudent ? (<> <FaUpload className="icon" /> Uploading...</>) : (<> <FaUpload className="icon" /> Upload File</>)}
            </motion.button>
          </div>
        )}
        {activeTab === "manual" && (
          <>
            {" "}
            {/* This fragment is correctly opened here */}
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
              {errors.firstName && (
                <span className="error-text">{errors.firstName}</span>
              )}
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
              {errors.lastName && (
                <span className="error-text">{errors.lastName}</span>
              )}
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

              {errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
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
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
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
              {/* <select
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
              </select> */}
              <select
                name="groupId"
                className="form-input"
                value={student.groupId || ""}
                onChange={handleGroupChange} // ← new handler
              >
                <option value="" disabled>Select a group</option>
                <option value="add_new">Add a group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
              {errors.groupId && (
                <span className="error-text">{errors.groupId}</span>
              )}
            </div>
            {isAddingGroup && (
              <div className="form-group">
                <label>Add a group:</label>
                <input
                  type="text"
                  className="form-input"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter new group name"
                />
                {errors.newGroupName && (
                  <span className="error-text">{errors.newGroupName}</span>
                )}
              </div>
            )}{" "}
            {/* This closes the fragment started on line 925 */}
            {/* The problematic closing fragment was here, removed it. */}
          </>
        )}
        <div className="modal-buttons">
          <motion.button className="back-btn" onClick={onClose}>
            Back
          </motion.button>
          {activeTab === "manual" && (
            <motion.button
              className="create-btn-student"
              onClick={handleCreateStudent}
              disabled={isCreatingStudent}
            >
              {isCreatingStudent ? "Creating..." : "Create Student"}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ManageStudents;
