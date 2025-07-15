import React, { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import ViewResult from "./ViewResult";
import ParticularResult from "./PerticularResult";
import { authFetch } from "../scripts/AuthProvider";
import "../pages/home.css";
import ManageLoader from "../loader/ManageLoader";

const ManageResult = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [resultsData, setResultsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  // const [resultsPerPage] = useState(10); // Number of results to display per page
  // responsive results-per-page: 15 if width ≥2560px, else 10
  const [resultsPerPage, setResultsPerPage] = useState(() =>
    window.innerWidth >= 2560 ? 15 : 10
  );

  useEffect(() => {
    const onResize = () => {
      setResultsPerPage(window.innerWidth >= 2560 ? 15 : 10);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Fetch results on mount
  useEffect(() => {
    (async () => {
      try {
        const response = await authFetch("/admin/results", { method: "GET" });
        if (!response.ok) throw new Error("Failed to fetch results");
        const data = await response.json();
        const now = new Date();
        const mapped = data.map((res) => {
          const start = new Date(res.start_time);
          const end = new Date(res.end_time);
          let status = "";
          if (start > now) {
            status = "Upcoming";
          } else if (!res.is_result_declared && end > now) {
            status = "Ongoing";
          } else if (res.is_result_declared) {
            status = "Results Declared";
          } else {
            status = "Completed";
          }
          return {
            id: res.id,
            name: res.name,
            startTime: start.toLocaleString([], {
              dateStyle: "short",
              timeStyle: "short",
              hour12: true,
            }),
            endTime: end.toLocaleString([], {
              dateStyle: "short",
              timeStyle: "short",
              hour12: true,
            }),
            analytics: `${res.attempts_allowed} Attempts`,
            status,
          };
        });
        setResultsData(mapped);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ManageLoader />;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  // Filter results by tab and search
  const filteredResults = resultsData
    .filter((row) => {
      if (activeTab === "all") return true;
      if (activeTab === "active") return row.status === "Ongoing";
      if (activeTab === "completed")
        return row.status === "Results Declared" || row.status === "Completed";
      return true;
    })
    .filter((row) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return [row.id, row.name, row.analytics, row.status].some((field) =>
        String(field).toLowerCase().includes(q)
      );
    });

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

  const handleViewResult = async (row) => {
    try {
      const resp = await authFetch(`/admin/results/${row.id}/`, {
        method: "GET",
      });
      if (!resp.ok) throw new Error("Failed to fetch details");
      const details = await resp.json();
      setSelectedResult({
        ...row,
        studentsAttempted: details.users_attempted_count,
        studentsUnattempted: details.users_unattempted_count,
        malpractice: details.malpractice_recorded_count,
        averageScore: details.users_average_score,
        students: details.attempts.map((a) => ({
          attempt_id: a.id,
          usn: a.usn,
          name: a.user_name,
          startTime: new Date(a.start_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          endTime: new Date(a.end_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          score: a.score,
          trustScore: a.trust_score,
        })),
      });
    } catch (err) {
      console.error(err);
    }
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
          {totalPages > 1 && (
            <div className="pagination-controls flex justify-between items-center mt-4">
              <motion.button
                whileTap={{ scale: 1.1 }}
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </motion.button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <motion.button
                whileTap={{ scale: 1.1 }}
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
