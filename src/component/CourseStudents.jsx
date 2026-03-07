import React, { useEffect, useState } from "react";
import { error as logError } from "../utils/logger";
import { FaSearch, FaChevronLeft } from "react-icons/fa";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import { authFetch } from "../scripts/AuthProvider";

const CourseStudents = ({ onBackccc, onNextccc }) => {
  const [allStudents, setAllStudents] = useState([]);
  const [addedStudents, setAddedStudents] = useState([]);
  const [allSearchQuery, setAllSearchQuery] = useState("");
  const [addedSearchQuery, setAddedSearchQuery] = useState("");
  const [allBranchFilter, setAllBranchFilter] = useState("");
  const [addedBranchFilter, setAddedBranchFilter] = useState("");
  const [branches, setBranches] = useState([]);
  const [allPage, setAllPage] = useState(1);
  const [addedPage, setAddedPage] = useState(1);
  const studentsPerPage = 20;
  const [loading, setLoading] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState(null);
  const [currentModuleName, setCurrentModuleName] = useState("");

  useEffect(() => {
    const moduleId = localStorage.getItem("currentModuleId");
    const moduleName = localStorage.getItem("currentModuleName");
    if (moduleId) {
      setCurrentModuleId(moduleId);
      setCurrentModuleName(moduleName || "Unknown Module");
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/admin/students/", { method: "GET" });
        const data = await res.json();
        const list = Object.keys(data.data || {}).flatMap((branch) =>
          (data.data[branch] || [])
            .filter((s) => s.usn)
            .map((s) => ({
              studentId: s.id,
              id: s.usn,
              name: s.name,
              degree: s.degree || "",
              year: s.year || "",
              branch,
            }))
        );
        setAllStudents(list);
        setBranches(Object.keys(data.data || {}));
      } catch (e) {
        logError("Failed to fetch students:", e);
      }
    })();
  }, []);

  const filteredAll = allStudents
    .filter(
      (s) =>
        (!allBranchFilter ||
          s.branch?.toLowerCase() === allBranchFilter.toLowerCase()) &&
        (s.name?.toLowerCase().includes(allSearchQuery.toLowerCase()) ||
          s.id?.toLowerCase().includes(allSearchQuery.toLowerCase()))
    )
    .filter((s) => !addedStudents.some((a) => a.studentId === s.studentId));

  const filteredAdded = addedStudents.filter(
    (s) =>
      (!addedBranchFilter ||
        s.branch?.toLowerCase() === addedBranchFilter.toLowerCase()) &&
      (s.name?.toLowerCase().includes(addedSearchQuery.toLowerCase()) ||
        s.id?.toLowerCase().includes(addedSearchQuery.toLowerCase()))
  );

  const addAll = () => {
    setAddedStudents((prev) => [...prev, ...filteredAll]);
    setAddedBranchFilter("");
    setAddedSearchQuery("");
    setAllPage(1);
  };

  const addOne = (s) =>
    setAddedStudents((prev) =>
      prev.some((a) => a.studentId === s.studentId) ? prev : [...prev, s]
    );

  const removeOne = (s) =>
    setAddedStudents((prev) => prev.filter((a) => a.studentId !== s.studentId));

  const removeAll = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will remove all added students.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, remove all",
      cancelButtonText: "Cancel",
      background: "#181817",
      color: "#fff",
    }).then((result) => {
      if (result.isConfirmed) {
        setAddedStudents([]);
        setAddedPage(1);
      }
    });
  };

  const paginateData = (data, page) => {
    const start = (page - 1) * studentsPerPage;
    return data.slice(start, start + studentsPerPage);
  };

  const assignModuleToStudents = async () => {
    if (addedStudents.length === 0) {
      Swal.fire({
        title: "No Students Selected",
        text: "Please add at least one student before creating the assignment.",
        icon: "warning",
        background: "#181817",
        color: "#fff",
      });
      return;
    }
    if (!currentModuleId) {
      Swal.fire({
        title: "Error!",
        text: "No module found. Please go back and create a module first.",
        icon: "error",
        background: "#181817",
        color: "#fff",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await authFetch("/learning/assignments/", {
        method: "POST",
        body: JSON.stringify({
          module_id: parseInt(currentModuleId, 10),
          student_ids: addedStudents.map((s) => s.studentId),
          assigned_branch: addedBranchFilter || "All",
        }),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        Swal.fire({
          title: "Success!",
          text: `Module "${currentModuleName}" assigned to ${addedStudents.length} students successfully!`,
          icon: "success",
          iconColor: "#A294F9",
          background: "#181817",
          color: "#fff",
        }).then(() => {
          localStorage.removeItem("currentModuleId");
          localStorage.removeItem("currentModuleName");
          onNextccc();
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to assign module");
      }
    } catch (error) {
      logError("Error assigning module:", error);
      Swal.fire({
        title: "Error!",
        text: error.message || "Failed to assign module. Please try again.",
        icon: "error",
        background: "#181817",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchInputClass =
    "min-h-[40px] w-full min-w-0 rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-3 py-2 pl-9 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#A294F9] focus:ring-2 focus:ring-[#A294F9]/30";
  const selectClass =
    "min-h-[40px] rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-3 py-2 text-sm text-white outline-none focus:border-[#A294F9]";

  return (
    <div className="flex h-[87vh] min-h-[calc(100dvh-4.5rem)] w-full max-w-full flex-col overflow-y-auto rounded-lg bg-[#282828] p-4 sm:p-5 md:p-6 md:pb-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBackccc}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] text-white transition-colors hover:bg-[#4a4a4a]"
            aria-label="Back"
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              Add Students
            </h1>
            {currentModuleName && (
              <p className="mt-1 text-sm text-gray-400">
                Assigning module: <span className="text-white">{currentModuleName}</span> to students
              </p>
            )}
            <div className="mt-2 h-0.5 w-full rounded bg-[#5a5a5a]" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* All Students */}
          <div className="flex flex-col rounded-xl border border-[#5a5a5a] bg-[#353535] overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#5a5a5a] p-4 sm:flex-row sm:items-center sm:gap-4">
              <h3 className="font-semibold text-white">All Students</h3>
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  className={selectClass}
                  value={allBranchFilter}
                  onChange={(e) => setAllBranchFilter(e.target.value)}
                >
                  <option value="">Branch</option>
                  {branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search all students"
                    value={allSearchQuery}
                    onChange={(e) => setAllSearchQuery(e.target.value)}
                    className={searchInputClass}
                  />
                </div>
                <motion.button
                  whileTap={{ scale: 1.02 }}
                  type="button"
                  onClick={addAll}
                  className="whitespace-nowrap rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  + Add Batch
                </motion.button>
              </div>
            </div>
            <div className="min-h-[200px] overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#4a4a4a]">
                  <tr>
                    <th className="border-b border-[#666] px-3 py-2 text-left font-medium text-white">USN</th>
                    <th className="border-b border-[#666] px-3 py-2 text-left font-medium text-white">Name</th>
                    <th className="border-b border-[#666] px-3 py-2 text-left font-medium text-white">Branch</th>
                    <th className="border-b border-[#666] px-3 py-2 text-right font-medium text-white"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAll.length > 0 ? (
                    paginateData(filteredAll, allPage).map((s) => (
                      <tr key={s.studentId} className="border-b border-[#555] hover:bg-[#404040]">
                        <td className="px-3 py-2 text-white">{s.id}</td>
                        <td className="max-w-[120px] truncate px-3 py-2 text-white">{s.name}</td>
                        <td className="px-3 py-2 text-gray-300">{s.branch}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => addOne(s)}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                          >
                            + Add
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-gray-400">
                        No students found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {filteredAll.length > studentsPerPage && (
              <div className="flex items-center justify-center gap-2 border-t border-[#5a5a5a] p-2">
                <button
                  type="button"
                  disabled={allPage === 1}
                  onClick={() => setAllPage((p) => p - 1)}
                  className="rounded-lg border border-[#5a5a5a] bg-transparent px-3 py-1.5 text-sm text-white hover:bg-white/5 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-sm text-gray-400">
                  {allPage} / {Math.ceil(filteredAll.length / studentsPerPage)}
                </span>
                <button
                  type="button"
                  disabled={allPage >= Math.ceil(filteredAll.length / studentsPerPage)}
                  onClick={() => setAllPage((p) => p + 1)}
                  className="rounded-lg border border-[#5a5a5a] bg-transparent px-3 py-1.5 text-sm text-white hover:bg-white/5 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Added Students */}
          <div className="flex flex-col rounded-xl border border-[#5a5a5a] bg-[#353535] overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-[#5a5a5a] p-4 sm:flex-row sm:items-center sm:gap-4">
              <h3 className="font-semibold text-white">Added</h3>
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  className={selectClass}
                  value={addedBranchFilter}
                  onChange={(e) => setAddedBranchFilter(e.target.value)}
                >
                  <option value="">Branch</option>
                  {branches.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search added students"
                    value={addedSearchQuery}
                    onChange={(e) => setAddedSearchQuery(e.target.value)}
                    className={searchInputClass}
                  />
                </div>
                <button
                  type="button"
                  onClick={removeAll}
                  className="whitespace-nowrap rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Remove all
                </button>
              </div>
            </div>
            <div className="min-h-[200px] overflow-x-auto">
              {filteredAdded.length > 0 ? (
                <>
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-[#4a4a4a]">
                      <tr>
                        <th className="border-b border-[#666] px-3 py-2 text-left font-medium text-white">USN</th>
                        <th className="border-b border-[#666] px-3 py-2 text-left font-medium text-white">Name</th>
                        <th className="border-b border-[#666] px-3 py-2 text-left font-medium text-white">Branch</th>
                        <th className="border-b border-[#666] px-3 py-2 text-right font-medium text-white"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginateData(filteredAdded, addedPage).map((s) => (
                        <tr key={s.studentId} className="border-b border-[#555] hover:bg-[#404040]">
                          <td className="px-3 py-2 text-white">{s.id}</td>
                          <td className="max-w-[120px] truncate px-3 py-2 text-white">{s.name}</td>
                          <td className="px-3 py-2 text-gray-300">{s.branch}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => removeOne(s)}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredAdded.length > studentsPerPage && (
                    <div className="flex items-center justify-center gap-2 border-t border-[#5a5a5a] p-2">
                      <button
                        type="button"
                        disabled={addedPage === 1}
                        onClick={() => setAddedPage((p) => p - 1)}
                        className="rounded-lg border border-[#5a5a5a] bg-transparent px-3 py-1.5 text-sm text-white hover:bg-white/5 disabled:opacity-50"
                      >
                        Prev
                      </button>
                      <span className="text-sm text-gray-400">
                        {addedPage} / {Math.ceil(filteredAdded.length / studentsPerPage)}
                      </span>
                      <button
                        type="button"
                        disabled={addedPage >= Math.ceil(filteredAdded.length / studentsPerPage)}
                        onClick={() => setAddedPage((p) => p + 1)}
                        className="rounded-lg border border-[#5a5a5a] bg-transparent px-3 py-1.5 text-sm text-white hover:bg-white/5 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center py-12 text-gray-400">
                  No students added yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#5a5a5a] pt-6 sm:flex-row">
          <button
            type="button"
            onClick={onBackccc}
            className="w-full rounded-lg border border-[#5a5a5a] bg-transparent py-2.5 text-sm font-medium text-white hover:bg-white/5 sm:w-auto sm:px-6"
          >
            Back
          </button>
          <span className="text-sm text-gray-400">Step 3/3</span>
          <button
            type="button"
            onClick={assignModuleToStudents}
            disabled={loading}
            className="w-full rounded-lg bg-[#8E5DAF] py-2.5 text-sm font-medium text-white hover:bg-[#7421ac] disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:px-6"
          >
            {loading ? "Assigning..." : "Create & Assign"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseStudents;
