import React, { useState, useEffect, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import filter from "../assets/filter.png";
import line from "../assets/Line.png";
import { motion } from "framer-motion";
import ViewResult from "./ViewResult";
import ParticularResult from "./PerticularResult";
import { authFetch } from "../scripts/AuthProvider";
import "./ManageResult.css"; // Ensure you have the correct CSS file for styling

const ManageResult = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [resultsData, setResultsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Additional state and refs for the filter popup (similar to ManageExam)
  const [hoveredBranch, setHoveredBranch] = useState(null);
  const [subMenuPosition, setSubMenuPosition] = useState({ top: 0, left: 0 });
  const filterRef = useRef(null);
  const subPopupRef = useRef(null);
  const hoverTimeout = useRef(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(10); // Number of results to display per page

  const toggleFilter = () => {
    setShowFilter(!showFilter);
    setHoveredBranch(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target) &&
        (!subPopupRef.current || !subPopupRef.current.contains(event.target))
      ) {
        setShowFilter(false);
        setHoveredBranch(null);
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

  const handleHover = (event, branch) => {
    clearTimeout(hoverTimeout.current);
    hoverTimeout.current = setTimeout(() => {
      const rect = event.target.getBoundingClientRect();
      const subMenuWidth = 180;
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      let left = rect.right + 10;
      if (left + subMenuWidth > screenWidth) {
        left = rect.left - subMenuWidth - 10;
      }

      let top = rect.top;
      if (top + 180 > screenHeight) {
        top = rect.bottom - 180;
      }

      setHoveredBranch(branch);
      setSubMenuPosition({ top, left });
    }, 200);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setHoveredBranch(null);
    }, 300);
  };

  const handleSubMenuEnter = () => {
    clearTimeout(hoverTimeout.current);
  };

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await authFetch("/admin/results", {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch results data");
        }
        const data = await response.json();
        const results = data.map((res) => ({
          id: res.id,
          category: !res.is_result_declared ? "Active" : "Completed",
          name: res.name,
          startTime: new Date(res.start_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          endTime: new Date(res.end_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          analytics: res.attempts_allowed + " Attempts Allowed",
          status: res.is_result_declared ? "Completed" : "Active",
          studentsAttempted: res.user.length,
        }));
        // Sort results by start time in descending order
        results.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

        setResultsData(results);
        setLoading(false);
        setCurrentPage(1); // Reset to first page on new data fetch
      } catch (error) {
        console.error("Error fetching results data", error);
        setError("Failed to load data. Please try again later.");
        setLoading(false);
      }
    };

    fetchResults();
  }, []);

  if (loading) {
    return <p className="text-center text-lg">Loading data...</p>;
  }

  if (error) {
    return <p className="text-center text-lg text-red-500">{error}</p>;
  }

  // Filtering Results based on Tab Selection & Search Query
  const filteredResults = resultsData
    .filter(
      (row) => activeTab === "all" || row.category.toLowerCase() === activeTab
    )
    .filter(
      (row) =>
        searchQuery === "" ||
        row.id.toString().includes(searchQuery) ||
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.startTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.endTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.analytics.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Pagination Logic
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = filteredResults.slice(
    indexOfFirstResult,
    indexOfLastResult
  );

  const totalPages = Math.ceil(filteredResults.length / resultsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

  const handleViewResult = async (result) => {
    try {
      const response = await authFetch(`/admin/results/${result.id}/`, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch result details");
      }
      const data = await response.json();
      const resultDetails = {
        id: result.id,
        category: result.category,
        name: result.name,
        startTime: result.startTime,
        endTime: result.endTime,
        analytics: result.analytics,
        status: result.status,
        studentsAttempted: data.users_attempted_count,
        studentsUnattempted: data.users_unattempted_count,
        malpractice: data.malpractice_recorded_count,
        averageScore: data.users_average_score,
        students: data.attempts.map((student) => ({
          attempt_id: student.id,
          usn: student.usn,
          name: student.user_name,
          startTime: new Date(student.start_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          endTime: new Date(student.end_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          score: student.score,
          trustScore: student.trust_score,
          // Placeholder for mcqMarks, codingMarks, totalMcqMarks, totalCodingMarks, mcqDetails, codingDetails
          // These fields were present in your mock data but not in the actual API response for now.
          // You'll need to adjust this mapping if your API provides them.
          mcqMarks: 0,
          codingMarks: 0,
          totalMcqMarks: 0,
          totalCodingMarks: 0,
          mcqDetails: [],
          codingDetails: [],
        })),
      };
      console.log("Result Details:", resultDetails);
      setSelectedResult(resultDetails);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error fetching result details", error);
    }
  };

  // Mock data (kept for reference, but actual data comes from API)
  const mock = {
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
      {
        usn: "4NM20EC408",
        name: "Manish Naik",
        startTime: "10:00 AM",
        endTime: "11:30 AM",
        mcqMarks: 8,
        codingMarks: 15,
        score: 85,
        trustScore: 15,
        totalMcqMarks: 10,
        totalCodingMarks: 20,
        mcqDetails: [
          {
            question: "What is the time complexity of binary search?",
            status: "Correct",
            marks: 2,
            yourAnswer: "O(log n)",
            actualAnswer: "O(log n)",
          },
          {
            question:
              "Which sorting algorithm has the best average-case time complexity?",
            status: "Incorrect",
            marks: 0,
            yourAnswer: "Bubble Sort",
            actualAnswer: "Quick Sort",
          },
        ],
        codingDetails: [
          {
            question: "Write a function to reverse a linked list.",
            status: "Correct",
            marks: 15,
            yourAnswer: "function reverseLinkedList(head) {...}",
            actualAnswer: "function reverseLinkedList(head) {...}",
          },
          {
            question: "Implement a binary search tree.",
            status: "Partially Correct",
            marks: 10,
            yourAnswer: "class BST {...}",
            actualAnswer: "class BST {...}",
          },
        ],
      },
      {
        usn: "1AM22CI088",
        name: "Sanath Naik",
        startTime: "10:00 AM",
        endTime: "11:00 AM",
        mcqMarks: 10,
        codingMarks: 14,
        score: 75,
        trustScore: 75,
        totalMcqMarks: 10,
        totalCodingMarks: 20,
        mcqDetails: [
          {
            question: "What is the time complexity of binary search?",
            status: "Correct",
            marks: 2,
            yourAnswer: "O(log n)",
            actualAnswer: "O(log n)",
          },
          {
            question:
              "Which sorting algorithm has the best average-case time complexity?",
            status: "Correct",
            marks: 2,
            yourAnswer: "Quick Sort",
            actualAnswer: "Quick Sort",
          },
        ],
        codingDetails: [
          {
            question: "Write a function to reverse a linked list.",
            status: "Correct",
            marks: 14,
            yourAnswer: "function reverseLinkedList(head) {...}",
            actualAnswer: "function reverseLinkedList(head) {...}",
          },
          {
            question: "Implement a binary search tree.",
            status: "Incorrect",
            marks: 0,
            yourAnswer: "class BST {...}",
            actualAnswer: "class BST {...}",
          },
        ],
      },
    ],
  };

  const handleBack = () => {
    setSelectedResult(null);
    setSelectedStudent(null);
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
  };

  return (
    <div className="lg:w-3xl justify-center flex flex-wrap result-container">
      {selectedStudent ? (
        <ParticularResult student={selectedStudent} onBack={handleBack} />
      ) : selectedResult ? (
        <ViewResult
          result={selectedResult}
          onBack={handleBack}
          onNext={handleViewStudent}
        />
      ) : (
        <div className="result-header">
          <h1>Results</h1>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Left Button Group (Tabs) */}
            <div className="m-btn-left flex flex-wrap justify-center sm:justify-start gap-2">
              <motion.button
                whileTap={{ scale: 1.1 }}
                className={activeTab === "all" ? "m-active" : ""}
                onClick={() => {
                  setActiveTab("all");
                  setCurrentPage(1); // Reset page on tab change
                }}
              >
                All Exams
              </motion.button>
              <motion.button
                whileTap={{ scale: 1.1 }}
                className={activeTab === "active" ? "m-active" : ""}
                onClick={() => {
                  setActiveTab("active");
                  setCurrentPage(1); // Reset page on tab change
                }}
              >
                Active
              </motion.button>
              <motion.button
                whileTap={{ scale: 1.1 }}
                className={activeTab === "completed" ? "m-active" : ""}
                onClick={() => {
                  setActiveTab("completed");
                  setCurrentPage(1); // Reset page on tab change
                }}
              >
                Completed
              </motion.button>
            </div>

            {/* Right Side: Filter Button, Search Bar */}
            <div className="m-btn-right flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
              <button className="filter-btn" onClick={toggleFilter}>
                <img src={filter} alt="Filter" />
              </button>

              {/* Search Bar */}
              <div className="search-box flex items-center w-full sm:w-auto">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search results..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset page on search
                  }}
                  className="w-full sm:w-auto"
                />
              </div>
            </div>
          </div>

          {/* Filter Pop-up */}
          {showFilter && (
            <>
              <div className="filter-popup resultfilter" ref={filterRef}>
                <h3>Branch</h3>
                <div className="flex justify-center w-full">
                  <img src={line} alt="line" className="filter-line" />
                </div>
                <div className="filter-options">
                  {["CSE", "ISE", "AIML", "CSE AIML", "CSE DS", "EC"].map(
                    (branch, index) => (
                      <div
                        key={index}
                        className={`filter-item ${
                          hoveredBranch === branch ? "active-filter-item" : ""
                        }`}
                        onMouseEnter={(e) => handleHover(e, branch)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {branch}
                      </div>
                    )
                  )}
                </div>
                <button className="apply-btn">Apply Filter</button>
              </div>
              {hoveredBranch && (
                <div
                  className="sub-popup"
                  ref={subPopupRef}
                  style={{ top: subMenuPosition.top, left: subMenuPosition.left }}
                  onMouseEnter={handleSubMenuEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <h4>{hoveredBranch} - Year</h4>
                  <button className="sub-item">1st Year</button>
                  <button className="sub-item">2nd Year</button>
                  <button className="sub-item">3rd Year</button>
                  <button className="sub-item">Final Year</button>
                </div>
              )}
            </>
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
                {currentResults.length > 0 ? (
                  currentResults.map((row, index) => (
                    <tr
                      key={row.id}
                      className={index % 2 === 0 ? "even-row" : "odd-row"}
                    >
                      <td>{row.id}</td>
                      <td>{row.name}</td>
                      <td>{row.startTime}</td>
                      <td>{row.endTime}</td>
                      <td>{row.analytics}</td>
                      <td
                        className={
                          row.status === "Expired" ? "text-red-500" : ""
                        }
                      >
                        {row.status}
                      </td>
                      <td>
                        <motion.button
                          className="viewexam-btn"
                          whileTap={{ scale: 1.2 }}
                          onClick={() => handleViewResult(row)}
                        >
                          View Result
                        </motion.button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredResults.length > resultsPerPage && (
            <div className="pagination">
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
      )}
    </div>
  );
};

export default ManageResult;