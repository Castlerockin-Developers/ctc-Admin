import React, { useState, useEffect, useRef, useCallback } from "react";
import { log, error as logError } from "../utils/logger";
import {
  FaSearch,
  FaPlus,
  FaDatabase,
  FaPen,
  FaUpload,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { authFetch, authFetchPayload } from "../scripts/AuthProvider";
import Spinner from "../loader/Spinner";
import { useCache } from "../hooks/useCache";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(() => (typeof window !== "undefined" && window.innerWidth >= 2560 ? 15 : 10));

  useEffect(() => {
    const onResize = () => setStudentsPerPage(window.innerWidth >= 2560 ? 15 : 10);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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
    log('Students data loaded from cache');
  }, []);

  const onCacheMiss = useCallback((data) => {
    log('Students data fetched fresh');
  }, []);

  const onError = useCallback((err) => {
    logError('Students fetch error:', err);
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

  log('Cache debug:', {
    cacheAllowed,
    cacheLoading,
    cacheError,
    cachedStudentsData,
    cacheUsed,
    cacheInfo
  });

  // If cache is disabled, show a message
  if (!cacheAllowed) {
    log('Cache is disabled - this might be causing the issue');
  }

  // Update local state when cache data changes
  useEffect(() => {
    if (cachedStudentsData) {
      log('Cached students data:', cachedStudentsData);
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
    log('Filter function - studentsData:', studentsData);
    log('Filter function - activeTab:', activeTab);
    
    if (!studentsData) {
      log('No studentsData, returning empty array');
      return [];
    }

    let currentBranchStudents =
      activeTab === "all"
        ? Object.values(studentsData).flat()
        : studentsData[activeTab] || [];
    
    log('Current branch students:', currentBranchStudents);

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

  const studentsToDisplay = filteredAndSortedStudents();
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = studentsToDisplay.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(studentsToDisplay.length / studentsPerPage);

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };




  const fetchGroups = async () => {
    try {
      const response = await authFetch("/admin/groups/", { method: "GET" });
      if (response.ok) {
        const groupsData = await response.json();
        return groupsData;
      } else {
        logError("Failed to fetch groups:", response.status);
        return null;
      }
    } catch (error) {
      logError("Error fetching groups:", error);
      return null;
    }
  };



  return (
    <motion.div
      variants={pageFade}
      initial="initial"
      animate="animate"
      className="flex h-[87vh] min-h-[calc(100dvh-4.5rem)] w-full max-w-full flex-col overflow-hidden rounded-lg bg-[#282828] p-4 sm:p-5 md:p-6 md:pb-8"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden sm:gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <motion.h1 variants={itemSlide} className="text-xl font-semibold text-white sm:text-2xl md:text-3xl">
              Manage Students
            </motion.h1>
            <motion.div variants={itemSlide} className="rounded-lg border border-[#666] bg-[#4B4B4B] px-4 py-3">
              <p className="text-xs text-gray-400">Total Students</p>
              <p className="text-lg font-semibold text-white sm:text-xl">
                {studentsToDisplay.length} / {totalAllowedStudents.current || 500}
              </p>
            </motion.div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <select
              value={activeTab}
              onChange={(e) => {
                setSearchQuery("");
                setActiveTab(e.target.value);
                setCurrentPage(1);
              }}
              className="min-h-[44px] rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2.5 text-sm text-white outline-none focus:border-[#A294F9] focus:ring-2 focus:ring-[#A294F9]/30"
            >
              <option value="all">All Branches</option>
              {studentsData && Object.keys(studentsData).sort().map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            <div className="flex min-h-[44px] flex-1 min-w-0 items-center gap-2 rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2.5 transition-colors focus-within:border-[#A294F9] focus-within:ring-2 focus-within:ring-[#A294F9]/30">
              <FaSearch className="h-5 w-5 shrink-0 text-gray-300" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="min-w-0 flex-1 border-none bg-transparent text-white outline-none placeholder:text-gray-400"
              />
            </div>
            <motion.button
              whileTap={{ scale: 1.05 }}
              variants={itemSlide}
              type="button"
              onClick={() => setStudentModalOpen(true)}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8b7ce8]"
            >
              <FaPlus className="h-4 w-4" /> Add New Students
            </motion.button>
          </div>
        </div>

        {cacheLoading ? (
          <Spinner className="min-h-[280px]" />
        ) : cacheError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-[#5a5a5a] bg-[#353535] py-12">
            <p className="text-center text-red-400">{cacheError.message || "Failed to load students data"}</p>
            <button
              type="button"
              onClick={forceRefresh}
              className="rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8b7ce8]"
            >
              Retry
            </button>
          </div>
        ) : !cachedStudentsData ? (
          <Spinner className="min-h-[280px]" />
        ) : currentStudents.length > 0 ? (
          <>
            {/* Mobile: cards */}
            <div className="flex flex-col gap-3 overflow-y-auto pb-2 md:hidden">
              {currentStudents.map((student, index) => (
                <motion.div
                  key={student.usn}
                  custom={index}
                  variants={tableRowSlide}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-3 rounded-lg border border-[#5a5a5a] bg-[#3a3a3a] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-white" title={student.name || student.email}>
                        {truncateText(student.name || student.email, 24)}
                      </p>
                      <p className="text-xs text-gray-400">{student.usn}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${student.is_active ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {student.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-300">
                    <span className="text-gray-500">Email</span>
                    <span className="truncate text-right">{student.email}</span>
                    <span className="text-gray-500">Phone</span>
                    <span className="text-right">{student.contact || "—"}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden min-h-0 flex-1 overflow-hidden rounded-lg md:block">
              <div className="h-full overflow-x-auto overflow-y-auto rounded-lg border border-[#5a5a5a]">
                <table className="w-full min-w-[640px] table-auto border-collapse">
                  <thead className="sticky top-0 z-10 bg-[#4a4a4a]">
                    <tr>
                      <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-center text-sm font-medium text-white">#USN</th>
                      <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-left text-sm font-medium text-white">Name</th>
                      <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-left text-sm font-medium text-white">Email</th>
                      <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-center text-sm font-medium text-white">Phone</th>
                      <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-center text-sm font-medium text-white">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStudents.map((student, index) => (
                      <motion.tr
                        key={student.usn}
                        custom={index}
                        variants={tableRowSlide}
                        initial="hidden"
                        animate="visible"
                        className={`border-b border-[#555] transition-colors hover:bg-[#404040] ${index % 2 === 0 ? "bg-[#3a3a3a]" : "bg-[#353535]"}`}
                      >
                        <td className="whitespace-nowrap px-4 py-3.5 text-center text-sm text-white">{student.usn}</td>
                        <td className="max-w-[180px] truncate px-4 py-3.5 text-left text-sm text-white" title={student.name || student.email}>{truncateText(student.name || student.email, 30)}</td>
                        <td className="max-w-[200px] truncate px-4 py-3.5 text-left text-sm text-white">{student.email}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-center text-sm text-white">{student.contact || "—"}</td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={student.is_active ? "text-green-400" : "text-gray-400"}>{student.is_active ? "Yes" : "No"}</span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-[#5a5a5a] bg-[#353535] text-gray-400 md:min-h-[200px]">
            No students found
          </div>
        )}

        {totalPages > 1 && studentsToDisplay.length > 0 && (
          <div className="flex shrink-0 items-center justify-center gap-4 pt-2 sm:gap-6">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="min-h-[44px] rounded-lg border border-[#5a5a5a] bg-transparent px-4 py-2.5 text-sm text-white transition-colors hover:border-gray-400 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </motion.button>
            <span className="flex min-h-[44px] items-center text-sm text-gray-300">
              {currentPage} / {totalPages}
            </span>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="min-h-[44px] rounded-lg border border-[#5a5a5a] bg-transparent px-4 py-2.5 text-sm text-white transition-colors hover:border-gray-400 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
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
        logError(error);
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

  const inputClass = "w-full rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#A294F9] focus:ring-2 focus:ring-[#A294F9]/30 disabled:opacity-60";
  const labelClass = "mb-1.5 block text-sm font-medium text-gray-300";
  const fieldClass = "mb-4";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#5a5a5a] bg-[#282828] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-6 text-xl font-semibold text-white">Edit Student</h2>

        <div className={fieldClass}>
          <label className={labelClass}>First Name</label>
          <input type="text" name="firstName" className={inputClass} placeholder="Enter first name" value={student.firstName} onChange={handleChange} />
          {errors.firstName && <span className="mt-1 block text-xs text-red-400">{errors.firstName}</span>}
        </div>
        <div className={fieldClass}>
          <label className={labelClass}>Last Name</label>
          <input type="text" name="lastName" className={inputClass} placeholder="Enter last name" value={student.lastName} onChange={handleChange} />
          {errors.lastName && <span className="mt-1 block text-xs text-red-400">{errors.lastName}</span>}
        </div>
        <div className={fieldClass}>
          <label className={labelClass}>Email</label>
          <input type="email" name="email" className={inputClass} placeholder="Enter email" value={student.email} disabled onChange={handleChange} />
          {errors.email && <span className="mt-1 block text-xs text-red-400">{errors.email}</span>}
        </div>
        <div className={fieldClass}>
          <label className={labelClass}>Password</label>
          <input type="password" name="password" className={inputClass} placeholder="Keep blank to not change" value={student.password} onChange={handleChange} />
          {errors.password && <span className="mt-1 block text-xs text-red-400">{errors.password}</span>}
        </div>
        <div className={fieldClass}>
          <label className={labelClass}>USN</label>
          <input type="text" name="usn" className={inputClass} placeholder="Enter USN" value={student.usn} disabled onChange={handleChange} />
          {errors.usn && <span className="mt-1 block text-xs text-red-400">{errors.usn}</span>}
        </div>
        <div className={fieldClass}>
          <label className={labelClass}>Group</label>
          <select name="groupId" className={inputClass} value={student.groupId} onChange={handleChange}>
            <option value="" disabled>Select a group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          {errors.groupId && <span className="mt-1 block text-xs text-red-400">{errors.groupId}</span>}
        </div>
        <div className={fieldClass}>
          <label className={labelClass}>Contact</label>
          <input type="text" name="contact" className={inputClass} placeholder="Enter phone number" value={student.contact} onChange={handleChange} />
        </div>
        <div className={fieldClass}>
          <label className={labelClass}>Gender</label>
          <select name="gender" className={inputClass} value={student.gender} onChange={handleChange}>
            <option value="">Select gender</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="O">Others</option>
          </select>
        </div>

        <div className="mt-6 flex gap-3">
          <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onClose} className="flex-1 rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] py-2.5 text-sm font-medium text-white hover:bg-[#4a4a4a]">
            Back
          </motion.button>
          <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={handleEditStudent} className="flex-1 rounded-lg bg-[#A294F9] py-2.5 text-sm font-medium text-white hover:bg-[#8b7ce8]">
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
      log("Excel File Selected:", selectedFile.name);
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

  const inputClass = "w-full rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#A294F9] focus:ring-2 focus:ring-[#A294F9]/30";
  const labelClass = "mb-1.5 block text-sm font-medium text-gray-300";
  const fieldClass = "mb-4";

  return (
    <motion.div
      variants={modalPopup}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#5a5a5a] bg-[#282828] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-6 text-xl font-semibold text-white">Add Student</h2>

        <div className="mb-6 flex rounded-lg border border-[#5a5a5a] bg-[#353535] p-1">
          <motion.button
            type="button"
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors ${activeTab === "dataset" ? "bg-[#A294F9] text-white" : "text-gray-400 hover:text-white"}`}
            onClick={() => setActiveTab("dataset")}
          >
            <FaDatabase className="h-4 w-4" /> Dataset
          </motion.button>
          <motion.button
            type="button"
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium transition-colors ${activeTab === "manual" ? "bg-[#A294F9] text-white" : "text-gray-400 hover:text-white"}`}
            onClick={() => setActiveTab("manual")}
          >
            <FaPen className="h-4 w-4" /> Add Manually
          </motion.button>
        </div>

        {activeTab === "dataset" && (
          <div className="mb-6 space-y-4">
            <label className={labelClass}>Import from Excel</label>
            <input
              type="file"
              accept=".xls,.xlsx"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-[#A294F9] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:hover:bg-[#8b7ce8]"
            />
            <motion.button
              type="button"
              whileTap={{ scale: 1.02 }}
              onClick={handleCreateStudent}
              disabled={isCreatingStudent}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#A294F9] py-3 text-sm font-medium text-white hover:bg-[#8b7ce8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingStudent ? <><span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Uploading...</> : <><FaUpload className="h-4 w-4" /> Upload File</>}
            </motion.button>
          </div>
        )}

        {activeTab === "manual" && (
          <>
            <div className={fieldClass}>
              <label className={labelClass}>First Name</label>
              <input type="text" name="firstName" className={inputClass} placeholder="Enter first name" value={student.firstName} onChange={handleChange} />
              {errors.firstName && <span className="mt-1 block text-xs text-red-400">{errors.firstName}</span>}
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>Last Name</label>
              <input type="text" name="lastName" className={inputClass} placeholder="Enter last name" value={student.lastName} onChange={handleChange} />
              {errors.lastName && <span className="mt-1 block text-xs text-red-400">{errors.lastName}</span>}
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>Email</label>
              <input type="email" name="email" className={inputClass} placeholder="Enter email" value={student.email} onChange={handleChange} />
              {errors.email && <span className="mt-1 block text-xs text-red-400">{errors.email}</span>}
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>Password</label>
              <input type="password" name="password" className={inputClass} placeholder="Enter password" value={student.password} onChange={handleChange} />
              {errors.password && <span className="mt-1 block text-xs text-red-400">{errors.password}</span>}
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>USN</label>
              <input type="text" name="usn" className={inputClass} placeholder="Enter USN" value={student.usn} onChange={handleChange} />
              {errors.usn && <span className="mt-1 block text-xs text-red-400">{errors.usn}</span>}
            </div>
            <div className={fieldClass}>
              <label className={labelClass}>Group</label>
              <select name="groupId" className={inputClass} value={student.groupId || ""} onChange={handleGroupChange}>
                <option value="" disabled>Select a group</option>
                <option value="add_new">Add a group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              {errors.groupId && <span className="mt-1 block text-xs text-red-400">{errors.groupId}</span>}
            </div>
            {isAddingGroup && (
              <div className={fieldClass}>
                <label className={labelClass}>New group name</label>
                <input type="text" className={inputClass} value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Enter new group name" />
                {errors.newGroupName && <span className="mt-1 block text-xs text-red-400">{errors.newGroupName}</span>}
              </div>
            )}
          </>
        )}

        <div className="mt-6 flex gap-3">
          <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={onClose} className="flex-1 rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] py-2.5 text-sm font-medium text-white hover:bg-[#4a4a4a]">
            Back
          </motion.button>
          {activeTab === "manual" && (
            <motion.button type="button" whileTap={{ scale: 0.98 }} onClick={handleCreateStudent} disabled={isCreatingStudent} className="flex-1 rounded-lg bg-[#A294F9] py-2.5 text-sm font-medium text-white hover:bg-[#8b7ce8] disabled:opacity-50 disabled:cursor-not-allowed">
              {isCreatingStudent ? "Creating..." : "Create Student"}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ManageStudents;
