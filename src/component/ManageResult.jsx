import React, { useState, useEffect, useCallback } from "react";
import { FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import ViewResult from "./ViewResult";
import ParticularResult from "./PerticularResult";
import { authFetch } from "../scripts/AuthProvider";
import "../pages/home.css";
import ManageLoader from "../loader/ManageLoader";
import { useCache } from "../hooks/useCache";
import CacheStatusIndicator from "./CacheStatusIndicator";
import "./CacheStatusIndicator.css";

const ManageResult = ({ onNext, cacheAllowed }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(() =>
    window.innerWidth >= 2560 ? 15 : 10
  );
  const [loadingResultId, setLoadingResultId] = useState(null);

  const pageVariant = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2 },
    },
  };

  const rowVariant = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.03,
        duration: 0.5,
      },
    }),
  };


  useEffect(() => {
    const onResize = () => {
      setResultsPerPage(window.innerWidth >= 2560 ? 15 : 10);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Results data fetch function
  const fetchResultData = useCallback(async () => {
    console.log('fetchResultData: Starting API call...');
    try {
      const response = await authFetch("/admin/results", { method: "GET" });
      console.log('fetchResultData: Response status:', response.status);
      
      if (!response.ok) {
        console.error('fetchResultData: Response not ok:', response.status, response.statusText);
        throw new Error("Failed to fetch results");
      }
      
      const data = await response.json();
      console.log('fetchResultData: Raw data received:', data);
      
      // Map and format data
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
      
      console.log('fetchResultData: Mapped data:', mapped);
      return mapped;
    } catch (error) {
      console.error('fetchResultData: Error occurred:', error);
      throw error;
    }
  }, []);

  // Cache callbacks
  const onCacheHit = useCallback((data) => {
    console.log('Results data loaded from cache');
  }, []);

  const onCacheMiss = useCallback((data) => {
    console.log('Results data fetched fresh');
  }, []);

  const onError = useCallback((err) => {
    console.error('Results fetch error:', err);
  }, []);

  // Use cache hook for results data
  const {
    data: resultsData,
    loading,
    error,
    cacheUsed,
    cacheInfo,
    forceRefresh,
    invalidateCache,
    clearAllCache
  } = useCache('result_data', fetchResultData, {
    enabled: cacheAllowed !== false, // Allow cache if not explicitly disabled
    expiryMs: 5 * 60 * 1000, // 5 minutes
    autoRefresh: false,
    onCacheHit,
    onCacheMiss,
    onError
  });

  // Debug logging
  console.log('ManageResult render:', {
    cacheAllowed,
    loading,
    error: error?.message,
    resultsData: resultsData ? resultsData.length : null,
    cacheUsed,
    cacheInfo
  });

  // Fallback: If cache is taking too long or failing, try direct fetch
  const [fallbackData, setFallbackData] = useState(null);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackError, setFallbackError] = useState(null);

  useEffect(() => {
    // If cache is not working after 5 seconds, try direct fetch
    const timeout = setTimeout(async () => {
      if (!resultsData && !loading && !error) {
        console.log('ManageResult: Cache taking too long, trying direct fetch...');
        setFallbackLoading(true);
        try {
          const data = await fetchResultData();
          setFallbackData(data);
          setFallbackError(null);
        } catch (err) {
          setFallbackError(err);
          console.error('ManageResult: Direct fetch failed:', err);
        } finally {
          setFallbackLoading(false);
        }
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [resultsData, loading, error, fetchResultData]);

  // Use fallback data if cache data is not available
  const effectiveData = resultsData || fallbackData;
  const effectiveLoading = loading || fallbackLoading;
  const effectiveError = error || fallbackError;

  if (effectiveLoading) {
    console.log('ManageResult: Loading...');
    return <ManageLoader />;
  }
  
  if (effectiveError) {
    console.log('ManageResult: Error occurred:', effectiveError);
    return (
      <div className="text-center">
        <p className="text-red-500 mb-4">{effectiveError.message || "Failed to load results"}</p>
        <button 
          onClick={forceRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Don't render the main content if data is not available yet
  if (!effectiveData) {
    console.log('ManageResult: No results data available');
    return <ManageLoader />;
  }

  // Filter results by tab and search
  const filteredResults = effectiveData
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
    // Prevent multiple clicks
    if (loadingResultId === row.id) return;
    
    setLoadingResultId(row.id);
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
    } finally {
      setLoadingResultId(null);
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
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      className="lg:w-3xl justify-center flex flex-wrap result-container">
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
          <div className="flex justify-between items-center mb-4">
            <h1>Results</h1>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Left Button Group (Tabs) */}
            <div className="m-btn-left flex flex-wrap justify-center sm:justify-start gap-2">
              <motion.button
                variants={itemVariant}
                whileTap={{ scale: 1.1 }}
                className={activeTab === "all" ? "m-active" : ""}
                onClick={() => setActiveTab("all")}
              >
                All Exams
              </motion.button>
              <motion.button
                variants={itemVariant}
                whileTap={{ scale: 1.1 }}
                className={activeTab === "active" ? "m-active" : ""}
                onClick={() => setActiveTab("active")}
              >
                Active
              </motion.button>
              <motion.button
                variants={itemVariant}
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
              <motion.div
                variants={itemVariant}
                className="search-box flex items-center w-full sm:w-auto">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search results..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </motion.div>
            </div>
          </div>

          {/* Results Table */}
          {effectiveData ? (
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
                      <motion.tr
                        custom={index}
                        variants={rowVariant}
                        initial="hidden"
                        animate="visible"
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
                            disabled={loadingResultId === row.id}
                          >
                            {loadingResultId === row.id ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Loading...</span>
                              </div>
                            ) : (
                              "View Result"
                            )}
                          </motion.button>
                        </td>
                      </motion.tr>
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
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading results...</p>
            </div>
          )}
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
    </motion.div>
  );
};

export default ManageResult;
