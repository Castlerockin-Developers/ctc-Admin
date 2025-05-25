import React, { useState, useEffect, useRef } from "react";
import { FaSearch } from "react-icons/fa";
import filter from "../assets/filter.png";
import line from "../assets/Line.png";
import { motion } from "framer-motion";
import ViewResult from "./ViewResult";
import ParticularResult from "./PerticularResult";
//import axios from 'axios';

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
        // Uncomment and update the endpoint once your backend is ready
        // const response = await axios.get('https://api.example.com/results');
        // setResultsData(response.data);

        // Mock data for now
        const mockData = [
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
              {
                usn: "4NM20EC409",
                name: "John Doe",
                startTime: "12:00 PM",
                endTime: "1:30 PM",
                mcqMarks: 10,
                codingMarks: 14,
                score: 90,
                trustScore: 98,
                totalMcqMarks: 10,
                totalCodingMarks: 20,
                mcqDetails: [
                  {
                    question: "What is the output of print(2 + 3)?",
                    status: "Correct",
                    marks: 2,
                    yourAnswer: "5",
                    actualAnswer: "5",
                  },
                  {
                    question: "How do you define a function in Python?",
                    status: "Correct",
                    marks: 2,
                    yourAnswer: "def function_name():",
                    actualAnswer: "def function_name():",
                  },
                ],
                codingDetails: [
                  {
                    question:
                      "Write a Python function to check if a number is prime.",
                    status: "Correct",
                    marks: 14,
                    yourAnswer: "def is_prime(n): ...",
                    actualAnswer: "def is_prime(n): ...",
                  },
                  {
                    question: "Implement a Python class for a stack.",
                    status: "Correct",
                    marks: 14,
                    yourAnswer: "class Stack: ...",
                    actualAnswer: "class Stack: ...",
                  },
                ],
              },
            ],
          },
        ];

        setResultsData(mockData);
        setLoading(false);
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

  const handleViewResult = (result) => {
    setSelectedResult(result);
    setSelectedStudent(null);
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
                onClick={() => setActiveTab("all")}
              >
                All Exams
              </motion.button>
              <motion.button
                whileTap={{ scale: 1.1 }}
                className={activeTab === "active" ? "m-active" : ""}
                onClick={() => setActiveTab("active")}
              >
                Active
              </motion.button>
              <motion.button
                whileTap={{ scale: 1.1 }}
                className={activeTab === "completed" ? "m-active" : ""}
                onClick={() => setActiveTab("completed")}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                        className={`filter-item ${hoveredBranch === branch ? "active-filter-item" : ""
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
                {filteredResults.length > 0 ? (
                  filteredResults.map((row, index) => (
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
        </div>
      )}
    </div>
  );
};

export default ManageResult;
