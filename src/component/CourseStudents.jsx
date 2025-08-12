import React, { useEffect, useState } from "react";
import "./CustomLearning.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import line from "../assets/Line.png";
import { motion } from "framer-motion";
import { authFetch } from "../scripts/AuthProvider"; // Adjust import path as needed

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
  const [currentModuleName, setCurrentModuleName] = useState('');

  useEffect(() => {
    // Get module ID from localStorage (set by previous steps)
    const moduleId = localStorage.getItem('currentModuleId');
    const moduleName = localStorage.getItem('currentModuleName');
    if (moduleId) {
      setCurrentModuleId(moduleId);
      setCurrentModuleName(moduleName || 'Unknown Module');
    }
  }, []);

  // Fetch students and initialize state
  useEffect(() => {
    (async () => {
      try {
        const res = await authFetch("/admin/students/", { method: "GET" });
        const data = await res.json();
        const list = Object.keys(data.data).flatMap((branch) =>
          data.data[branch]
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
        setBranches(Object.keys(data.data));
      } catch (e) {
        console.error("Failed to fetch students:", e);
      }
    })();
  }, []);

  // Filter all students
  const filteredAll = allStudents
    .filter(
      (s) =>
        (!allBranchFilter ||
          s.branch.toLowerCase() === allBranchFilter.toLowerCase()) &&
        (s.name.toLowerCase().includes(allSearchQuery.toLowerCase()) ||
          s.id.toLowerCase().includes(allSearchQuery.toLowerCase()))
    )
    .filter((s) => !addedStudents.some((a) => a.studentId === s.studentId)); // Only show not-added students

  // Filter added students
  const filteredAdded = addedStudents.filter(
    (s) =>
      (!addedBranchFilter ||
        s.branch.toLowerCase() === addedBranchFilter.toLowerCase()) &&
      (s.name.toLowerCase().includes(addedSearchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(addedSearchQuery.toLowerCase()))
  );

  // Add all filtered students
  const addAll = () => {
    setAddedStudents((prev) => [...prev, ...filteredAll]);
    setAddedBranchFilter("");
    setAddedSearchQuery("");
    setAllPage(1);
  };

  // Add a single student
  const addOne = (s) =>
    setAddedStudents((prev) =>
      prev.some((a) => a.studentId === s.studentId) ? prev : [...prev, s]
    );

  // Remove a student
  const removeOne = (s) =>
    setAddedStudents((prev) => prev.filter((a) => a.studentId !== s.studentId));

  // Remove all added students with confirmation
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

  // Assign module to selected students
  const assignModuleToStudents = async () => {
    if (addedStudents.length === 0) {
      Swal.fire({
        title: 'No Students Selected',
        text: 'Please add at least one student before creating the assignment.',
        icon: 'warning',
        background: "#181817",
        color: "#fff"
      });
      return;
    }

    if (!currentModuleId) {
      Swal.fire({
        title: 'Error!',
        text: 'No module found. Please go back and create a module first.',
        icon: 'error',
        background: "#181817",
        color: "#fff"
      });
      return;
    }

    try {
      setLoading(true);
      const assignmentData = {
        module_id: parseInt(currentModuleId),
        student_ids: addedStudents.map(s => s.studentId),
        assigned_branch: addedBranchFilter || 'All'
      };

      const response = await authFetch('/learning/assignments/', {
        method: 'POST',
        body: JSON.stringify(assignmentData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        
        Swal.fire({
          title: 'Success!',
          text: `Module "${currentModuleName}" assigned to ${addedStudents.length} students successfully!`,
          icon: 'success',
        iconColor: "#A294F9", // Set the icon color to purple
          background: "#181817",
          color: "#fff"
        }).then(() => {
          // Clear localStorage and go to next step
          localStorage.removeItem('currentModuleId');
          localStorage.removeItem('currentModuleName');
          onNextccc();
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign module');
      }
    } catch (error) {
      console.error('Error assigning module:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to assign module. Please try again.',
        icon: 'error',
        background: "#181817",
        color: "#fff"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="Custom-container">
      <div className="new-c-top">
        <h1>Add Students</h1>
        {currentModuleName && (
          <p style={{color: '#888', marginTop: '8px'}}>
            Assigning module: <strong style={{color: '#fff'}}>{currentModuleName}</strong> to students
          </p>
        )}
        <img src={line} alt="line" className="w-full h-0.5" />
      </div>

      <div className="add-import">
        <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-2.5 add-s-container">
          {/* All Students Section */}
          <div className="all-student learning-all-student">
            <div className="all-s-header flex justify-between">
              <h3>All Students</h3>
              <div className="flex gap-1.5 r-header-search">
                <select
                  className="learning-filter-select-branch filter-select-branch"
                  value={allBranchFilter}
                  onChange={(e) => setAllBranchFilter(e.target.value)}
                >
                  <option value="">Branch</option>
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <div className="flex relative learning-s-search-container s-search-container">
                  <FontAwesomeIcon icon={faSearch} className="s-icon" />
                  <input
                    type="text"
                    placeholder="Search All Students"
                    onChange={(e) => setAllSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="all-s-body">
              <div className="adds-table-wrapper">
                <>
                  <table>
                    <thead>
                      <tr>
                        <td colSpan={2} align="left">
                          All Students
                        </td>
                        <td colSpan={2} align="right">
                          <button
                            onClick={addAll}
                            className="bg-green-500 rounded hover:bg-green-900 adds-branch"
                          >
                            + Add Batch
                          </button>
                        </td>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAll.length > 0 ? (
                        paginateData(filteredAll, allPage).map((s) => (
                          <tr key={s.studentId}>
                            <td>{s.id}</td>
                            <td>{s.name}</td>
                            <td>{s.branch}</td>
                            <td>
                              <button
                                onClick={() => addOne(s)}
                                className="bg-green-500 hover:bg-green-900 rounded adds-btn"
                              >
                                +Add
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center">
                            No students found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* ── Pagination for All Students ── */}
                  <div className="pagination flex justify-center items-center gap-2 mt-2">
                    <button
                      disabled={allPage === 1}
                      onClick={() => setAllPage((p) => p - 1)}
                      className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                    >
                      Prev
                    </button>

                    <span>
                      {allPage} /{" "}
                      {Math.ceil(filteredAll.length / studentsPerPage)}
                    </span>

                    <button
                      disabled={
                        allPage >=
                        Math.ceil(filteredAll.length / studentsPerPage)
                      }
                      onClick={() => setAllPage((p) => p + 1)}
                      className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </>
              </div>
            </div>
          </div>

          {/* Added Students Section */}
          <div className=" learning-all-student-added all-student-added">
            <div className="all-s-header-added flex justify-between">
              <h3>Added</h3>
              <div className="flex gap-1.5 r-header-search">
                <select
                  className="learning-filter-select-branch filter-select-branch"
                  value={addedBranchFilter}
                  onChange={(e) => setAddedBranchFilter(e.target.value)}
                >
                  <option value="">Branch</option>
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <div className="flex relative learning-s-search-container s-search-container">
                  <FontAwesomeIcon icon={faSearch} className="s-icon" />
                  <input
                    type="text"
                    placeholder="Search Added Students"
                    onChange={(e) => setAddedSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="all-s-body">
              <div className="addeds-table-wrapper">
                {filteredAdded.length ? (
                  <>
                    <table>
                      <thead>
                        <tr>
                          <td colSpan={5} align="left">
                            Added Students
                          </td>
                          <td>
                            <button
                              onClick={removeAll}
                              className="bg-red-500 hover:bg-red-900 rounded adds-btn"
                            >
                              Remove all
                            </button>
                          </td>
                        </tr>
                      </thead>
                      <tbody>
                        {paginateData(filteredAdded, addedPage).map((s) => (
                          <tr key={s.studentId}>
                            <td>{s.id}</td>
                            <td className="whitespace-nowrap">{s.name}</td>
                            <td>{s.degree}</td>
                            <td>{s.year}</td>
                            <td>{s.branch}</td>
                            <td>
                              <button
                                onClick={() => removeOne(s)}
                                className="bg-red-500 hover:bg-red-900 rounded adds-btn"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Pagination controls for Added Students */}
                    <div className="pagination flex justify-center items-center gap-2 mt-2">
                      <button
                        disabled={addedPage === 1}
                        onClick={() => setAddedPage((p) => p - 1)}
                        className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                      >
                        Prev
                      </button>

                      <span>
                        {addedPage} /{" "}
                        {Math.ceil(filteredAdded.length / studentsPerPage)}
                      </span>

                      <button
                        disabled={
                          addedPage >=
                          Math.ceil(filteredAdded.length / studentsPerPage)
                        }
                        onClick={() => setAddedPage((p) => p + 1)}
                        className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-white">
                    No students added yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end third-step">
          <div className="flex items-center gap-8 bottom-course">
            <button className="back-btn-create" onClick={onBackccc}>
              Back
            </button>
            <p>3/3</p>
            <button 
              className="next-btn" 
              onClick={assignModuleToStudents}
              disabled={loading}
            >
              {loading ? 'Assigning...' : 'Create & Assign'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseStudents;
