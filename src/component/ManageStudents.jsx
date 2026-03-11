import React, { useState, useEffect, useRef, useCallback } from "react";
import { log, error as logError } from "../utils/logger";
import {
  FaSearch,
  FaPlus,
  FaDatabase,
  FaPen,
  FaUpload,
  FaTrash,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { authFetch, authFetchPayload } from "../scripts/AuthProvider";
import Spinner from "../loader/Spinner";

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
  const [searchInput, setSearchInput] = useState("");
  const totalAllowedStudents = useRef(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeTab, setActiveTab] = useState("all");
  const [studentsData, setStudentsData] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [groups, setGroups] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(() => (typeof window !== "undefined" && window.innerWidth >= 2560 ? 15 : 10));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchDebounceRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isPaginated, setIsPaginated] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleteMode, setDeleteMode] = useState(false);

  useEffect(() => {
    const onResize = () => setStudentsPerPage(window.innerWidth >= 2560 ? 15 : 10);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchInput]);

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

  const fetchStudentsPage = useCallback(async (page, pageSize, group, search) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    if (group && group !== "all") params.set("group", group);
    if (search) params.set("search", search.trim());
    const response = await authFetch(`/admin/students/?${params.toString()}`, { method: "GET" });
    if (!response.ok) throw new Error("Failed to fetch students");
    const data = await response.json();
    if (data && Array.isArray(data.results) && typeof data.count === "number") {
      return {
        paginated: true,
        results: data.results,
        totalCount: data.count,
        user_count: data.user_count,
        max_users: data.max_users,
      };
    }
    if (data && data.data && typeof data.user_count === "number") {
      const grouped = data.data || {};
      const flat = group === "all" || !group
        ? Object.values(grouped).flat()
        : (grouped[group] || []);
      return {
        paginated: false,
        results: flat,
        totalCount: flat.length,
        user_count: data.user_count,
        max_users: data.max_users,
      };
    }
    throw new Error("Unexpected response format");
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchStudentsPage(currentPage, studentsPerPage, activeTab, searchQuery)
      .then(({ paginated, results, totalCount: count, user_count, max_users }) => {
        if (cancelled) return;
        setIsPaginated(paginated);
        setStudentsData(results);
        setTotalCount(count);
        setTotalStudents(user_count ?? 0);
        totalAllowedStudents.current = max_users;
      })
      .catch((err) => {
        if (!cancelled) {
          logError("ManageStudents fetch:", err);
          setError(err);
          setStudentsData(null);
          setTotalCount(0);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentPage, studentsPerPage, activeTab, searchQuery, retryCount, fetchStudentsPage]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage, activeTab, searchQuery]);

  useEffect(() => {
    if (!deleteMode) setSelectedIds(new Set());
  }, [deleteMode]);

  // Load groups on component mount
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const response = await authFetch("/admin/groups/", { method: "GET" });
        if (response.ok) {
          const data = await response.json();
          setGroups(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        logError("Error fetching groups:", e);
      }
    };
    loadGroups();
  }, []);

  const studentsToDisplay = studentsData || [];
  const currentStudents = isPaginated
    ? studentsToDisplay
    : studentsToDisplay.slice(
        (currentPage - 1) * studentsPerPage,
        currentPage * studentsPerPage
      );
  const totalPages = Math.max(1, Math.ceil(totalCount / studentsPerPage));

  const goToNextPage = () => { if (currentPage < totalPages) setCurrentPage((p) => p + 1); };
  const goToPrevPage = () => { if (currentPage > 1) setCurrentPage((p) => p - 1); };

  const refreshStudentsData = useCallback(() => {
    setCurrentPage(1);
    setRetryCount((c) => c + 1);
  }, []);

  const toggleSelectAll = () => {
    if (selectedIds.size === currentStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentStudents.map((s) => s.id).filter(Boolean)));
    }
  };

  const toggleSelect = (id) => {
    if (!id) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteButtonClick = () => {
    if (!deleteMode) {
      setDeleteMode(true);
      return;
    }
    handleDeleteSelected();
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const { value: confirmed } = await Swal.fire({
      title: "Delete Students?",
      html: `Are you sure you want to delete <strong>${selectedIds.size}</strong> student(s)? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#666",
      background: "#181817",
      color: "#fff",
    });
    if (!confirmed) return;
    try {
      let deleted = 0;
      let failed = 0;
      for (const id of selectedIds) {
        const res = await authFetch(`/admin/students/${id}/`, { method: "DELETE" });
        if (res.ok) deleted++;
        else failed++;
      }
      setSelectedIds(new Set());
      setDeleteMode(false);
      refreshStudentsData();
      Swal.fire({
        icon: deleted > 0 ? (failed > 0 ? "warning" : "success") : "error",
        iconColor: "#A294F9",
        title: deleted > 0 ? "Deletion Complete" : "Deletion Failed",
        text: failed > 0
          ? `Deleted ${deleted} student(s). Failed to delete ${failed}.`
          : `Successfully deleted ${deleted} student(s).`,
        background: "#181817",
        color: "#fff",
      });
    } catch (e) {
      logError("Delete students:", e);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: e.message || "Failed to delete students.",
        background: "#181817",
        color: "#fff",
      });
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await authFetch("/admin/groups/", { method: "GET" });
      if (response.ok) {
        const groupsData = await response.json();
        return Array.isArray(groupsData) ? groupsData : [];
      }
      return [];
    } catch (error) {
      logError("Error fetching groups:", error);
      return [];
    }
  };



  return (
    <motion.div
      variants={pageFade}
      initial="initial"
      animate="animate"
      className="flex h-[87vh] min-h-[calc(100dvh-4.5rem)] w-full max-w-full flex-col overflow-hidden rounded-lg bg-[#282828] p-4 sm:p-5 md:h-[87vh] md:min-h-0 md:p-6 md:pb-8"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden pb-6 sm:gap-6 sm:pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
            <motion.h1 variants={itemSlide} className="text-xl font-semibold text-white sm:text-2xl md:text-3xl">
              Manage Students
            </motion.h1>
            <motion.div variants={itemSlide} className="rounded-lg border border-[#666] bg-[#4B4B4B] px-4 py-3">
              <p className="text-xs text-gray-400">Total Students</p>
              <p className="text-lg font-semibold text-white sm:text-xl">
                {totalCount} / {totalAllowedStudents.current || 500}
              </p>
            </motion.div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <select
                value={activeTab}
                onChange={(e) => {
                  setSearchQuery("");
                  setSearchInput("");
                  setActiveTab(e.target.value);
                  setCurrentPage(1);
                }}
                className="min-h-[44px] rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2.5 text-sm text-white outline-none focus:border-[#A294F9] focus:ring-2 focus:ring-[#A294F9]/30"
              >
                <option value="all">All Branches</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex min-h-[44px] flex-1 min-w-0 items-center gap-2 rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2.5 transition-colors focus-within:border-[#A294F9] focus-within:ring-2 focus-within:ring-[#A294F9]/30">
              <FaSearch className="h-5 w-5 shrink-0 text-gray-300" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setCurrentPage(1); }}
                className="min-w-0 flex-1 border-none bg-transparent text-white outline-none placeholder:text-gray-400"
              />
            </div>
            <motion.button
              whileTap={{ scale: 1.05 }}
              variants={itemSlide}
              type="button"
              onClick={handleDeleteButtonClick}
              disabled={deleteMode && selectedIds.size === 0}
              title={deleteMode ? (selectedIds.size === 0 ? "Select students to delete" : `Delete ${selectedIds.size} selected`) : "Click to select students for deletion"}
              className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${deleteMode ? "border-red-500/60 bg-red-500/10 text-red-400 hover:bg-red-500/20" : "border-red-500/60 bg-transparent text-red-400 hover:bg-red-500/20"} disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent`}
            >
              <FaTrash className="h-4 w-4" /> Delete Students
            </motion.button>
            {deleteMode && (
              <motion.button
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                type="button"
                onClick={() => setDeleteMode(false)}
                className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#4a4a4a]"
              >
                Cancel
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 1.05 }}
              variants={itemSlide}
              type="button"
              onClick={() => setStudentModalOpen(true)}
              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8b7ce8]"
            >
              <FaPlus className="h-4 w-4" /> Add New Students
            </motion.button>
          </div>
        </div>

        {loading && studentsData === null && !error ? (
          <Spinner className="min-h-[280px]" />
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-[#5a5a5a] bg-[#353535] py-12">
            <p className="text-center text-red-400">
              {typeof error.message === "string" && error.message.toLowerCase().includes("organization not found")
                ? "We could not find an organization associated with your admin account. Please contact support to get your organization set up."
                : (error.message || "Failed to load students data")}
            </p>
            <button
              type="button"
              onClick={() => { setError(null); setRetryCount((c) => c + 1); }}
              className="rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8b7ce8]"
            >
              Retry
            </button>
          </div>
        ) : currentStudents.length > 0 ? (
          <>
            {/* Mobile: cards */}
            <div className="flex flex-col gap-3 overflow-y-auto pb-2 md:hidden">
              {currentStudents.map((student, index) => (
                <motion.div
                  key={student.id ?? student.email ?? `student-${index}`}
                  custom={index}
                  variants={tableRowSlide}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-3 rounded-lg border border-[#5a5a5a] bg-[#3a3a3a] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    {deleteMode && student.id && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-[#5a5a5a] bg-[#3d3d3d] text-[#A294F9] focus:ring-[#A294F9]"
                      />
                    )}
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
                    <span className="text-right">{student.contact ?? student.phone ?? "—"}</span>
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
                      {deleteMode && (
                        <th className="w-12 border-b border-[#666] px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={currentStudents.filter((s) => s.id).length > 0 && currentStudents.filter((s) => s.id).every((s) => selectedIds.has(s.id))}
                            onChange={toggleSelectAll}
                            className="h-4 w-4 cursor-pointer rounded border-[#5a5a5a] bg-[#3d3d3d] text-[#A294F9] focus:ring-[#A294F9]"
                          />
                        </th>
                      )}
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
                        key={student.id ?? student.email ?? `student-${index}`}
                        custom={index}
                        variants={tableRowSlide}
                        initial="hidden"
                        animate="visible"
                        className={`border-b border-[#555] transition-colors hover:bg-[#404040] ${index % 2 === 0 ? "bg-[#3a3a3a]" : "bg-[#353535]"}`}
                      >
                        {deleteMode && (
                          <td className="w-12 px-4 py-3.5 text-center">
                            {student.id && (
                              <input
                                type="checkbox"
                                checked={selectedIds.has(student.id)}
                                onChange={() => toggleSelect(student.id)}
                                className="h-4 w-4 cursor-pointer rounded border-[#5a5a5a] bg-[#3d3d3d] text-[#A294F9] focus:ring-[#A294F9]"
                              />
                            )}
                          </td>
                        )}
                        <td className="whitespace-nowrap px-4 py-3.5 text-center text-sm text-white">{student.usn}</td>
                        <td className="max-w-[180px] truncate px-4 py-3.5 text-left text-sm text-white" title={student.name || student.email}>{truncateText(student.name || student.email, 30)}</td>
                        <td className="max-w-[200px] truncate px-4 py-3.5 text-left text-sm text-white">{student.email}</td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-center text-sm text-white">{student.contact ?? student.phone ?? "—"}</td>
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

        {totalPages > 1 && totalCount > 0 && (
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
              className="min-h-[44px] cursor-pointer rounded-lg border border-[#5a5a5a] bg-transparent px-4 py-2.5 text-sm text-white transition-colors hover:border-gray-400 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
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
            <p className="mb-3 text-xs text-gray-400">Auto-detects columns: Email, Name/First Name/Last Name, USN/slNo, Phone/Contact, Gender. Use any sheet; sheet name becomes the branch/group.</p>
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
