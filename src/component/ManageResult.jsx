import React, { useState, useEffect, useCallback } from "react";
import { log, error as logError } from "../utils/logger";
import { FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import ViewResult from "./ViewResult";
import ParticularResult from "./PerticularResult";
import { authFetch } from "../scripts/AuthProvider";
import Spinner from "../loader/Spinner";
import { useCache } from "../hooks/useCache";

const ManageResult = ({ onNext, cacheAllowed }) => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(() =>
    typeof window !== "undefined" && window.innerWidth >= 2560 ? 15 : 10
  );
  const [loadingResultId, setLoadingResultId] = useState(null);

  useEffect(() => {
    const onResize = () =>
      setResultsPerPage(window.innerWidth >= 2560 ? 15 : 10);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const pageVariant = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3, when: "beforeChildren", staggerChildren: 0.08 },
    },
  };

  const itemVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  };

  const rowVariant = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.03, duration: 0.5 },
    }),
  };

  const fetchResultData = useCallback(async () => {
    log("fetchResultData: Starting API call...");
    try {
      const response = await authFetch("/admin/results/", { method: "GET" });
      if (!response.ok) throw new Error("Failed to fetch results");
      const data = await response.json();
      const now = new Date();
      const mapped = data.map((res) => {
        const start = new Date(res.start_time);
        const end = new Date(res.end_time);
        let status = "";
        if (start > now) status = "Upcoming";
        else if (!res.is_result_declared && end > now) status = "Ongoing";
        else if (res.is_result_declared) status = "Results Declared";
        else status = "Completed";
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
      return mapped;
    } catch (error) {
      logError("fetchResultData:", error);
      throw error;
    }
  }, []);

  const onCacheHit = useCallback(() => log("Results data loaded from cache"), []);
  const onCacheMiss = useCallback(() => log("Results data fetched fresh"), []);
  const onError = useCallback((err) => logError("Results fetch error:", err), []);

  const {
    data: resultsData,
    loading,
    error,
    forceRefresh,
  } = useCache("result_data", fetchResultData, {
    enabled: cacheAllowed !== false,
    expiryMs: 5 * 60 * 1000,
    autoRefresh: false,
    onCacheHit,
    onCacheMiss,
    onError,
  });

  const [fallbackData, setFallbackData] = useState(null);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [fallbackError, setFallbackError] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!resultsData && !loading && !error) {
        setFallbackLoading(true);
        try {
          const data = await fetchResultData();
          setFallbackData(data);
          setFallbackError(null);
        } catch (err) {
          setFallbackError(err);
        } finally {
          setFallbackLoading(false);
        }
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [resultsData, loading, error, fetchResultData]);

  const effectiveData = resultsData || fallbackData;
  const effectiveLoading = loading || fallbackLoading;
  const effectiveError = error || fallbackError;

  if (effectiveLoading) return <Spinner className="min-h-[200px]" />;

  if (effectiveError) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg bg-[#282828] p-6 text-center">
        <p className="text-red-400">
          {effectiveError.message || "Failed to load results"}
        </p>
        <button
          onClick={forceRefresh}
          className="rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8E5DAF]"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!effectiveData) return <Spinner className="min-h-[200px]" />;

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

  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = filteredResults.slice(
    indexOfFirstResult,
    indexOfLastResult
  );
  const totalPages = Math.max(1, Math.ceil(filteredResults.length / resultsPerPage));

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };
  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleViewResult = async (row) => {
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
      logError(err);
    } finally {
      setLoadingResultId(null);
    }
  };

  const handleBack = () => {
    setSelectedResult(null);
    setSelectedStudent(null);
  };

  const handleViewStudent = (student) => setSelectedStudent(student);

  const getStatusColor = (status) => {
    if (status === "Ongoing") return "bg-emerald-600/80 text-white";
    if (status === "Upcoming") return "bg-amber-600/80 text-white";
    if (status === "Results Declared") return "bg-blue-600/80 text-white";
    if (status === "Expired") return "bg-red-600/80 text-white";
    return "bg-gray-500/80 text-white";
  };

  return (
    <motion.div
      variants={pageVariant}
      initial="hidden"
      animate="visible"
      className="flex h-[87vh] min-h-[calc(100dvh-4.5rem)] w-full max-w-full flex-col overflow-hidden rounded-lg bg-[#282828] p-4 sm:p-5 md:h-[87vh] md:min-h-0 md:p-6 md:pb-8"
    >
      {selectedStudent ? (
        <ParticularResult student={selectedStudent} onBack={handleBack} />
      ) : selectedResult ? (
        <ViewResult
          result={selectedResult}
          onBack={handleBack}
          onNext={handleViewStudent}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden sm:gap-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-xl font-semibold text-white sm:text-2xl md:text-3xl">
              Results
            </h1>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex min-h-[44px] flex-1 min-w-0 items-center gap-2 rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2.5 transition-colors focus-within:border-[#A294F9] focus-within:ring-2 focus-within:ring-[#A294F9]/30">
                <FaSearch className="h-5 w-5 shrink-0 text-gray-300" />
                <input
                  type="text"
                  placeholder="Search results..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="min-w-0 flex-1 border-none bg-transparent text-white outline-none placeholder:text-gray-400"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: "all", label: "All Exams" },
                  { key: "active", label: "Active" },
                  { key: "completed", label: "Completed" },
                ].map(({ key, label }) => (
                  <motion.button
                    key={key}
                    variants={itemVariant}
                    whileTap={{ scale: 1.05 }}
                    type="button"
                    onClick={() => {
                      setActiveTab(key);
                      setCurrentPage(1);
                    }}
                    className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      activeTab === key
                        ? "bg-[#A294F9] text-white"
                        : "border border-[#5a5a5a] bg-[#404040] text-gray-300 hover:bg-[#4a4a4a]"
                    }`}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {effectiveData && currentResults.length > 0 ? (
            <>
              {/* Mobile: card layout */}
              <div className="flex flex-col gap-3 overflow-y-auto pb-2 md:hidden">
                {currentResults.map((row, index) => (
                  <motion.div
                    key={row.id}
                    custom={index}
                    variants={rowVariant}
                    initial="hidden"
                    animate="visible"
                    className="flex flex-col gap-3 rounded-lg border border-[#5a5a5a] bg-[#3a3a3a] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">
                          {row.name}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">#{row.id}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-300">
                      <span className="text-gray-500">Start</span>
                      <span className="text-right">{row.startTime}</span>
                      <span className="text-gray-500">End</span>
                      <span className="text-right">{row.endTime}</span>
                      <span className="text-gray-500">Analytics</span>
                      <span className="text-right text-white">
                        {row.analytics}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleViewResult(row)}
                      disabled={loadingResultId === row.id}
                      className="w-full rounded-lg bg-[#8E5DAF] py-3 text-sm font-medium text-white transition-colors hover:bg-[#7421ac] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loadingResultId === row.id ? (
                        <>
                          <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "View Result"
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Desktop: table layout */}
              <div className="hidden min-h-0 flex-1 overflow-hidden rounded-lg md:block">
                <div className="h-full overflow-x-auto overflow-y-auto rounded-lg border border-[#5a5a5a]">
                  <table className="w-full min-w-[640px] table-auto border-collapse">
                    <thead className="sticky top-0 z-10 bg-[#4a4a4a]">
                      <tr>
                        <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-center text-sm font-medium text-white">
                          #ID
                        </th>
                        <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-left text-sm font-medium text-white">
                          Name
                        </th>
                        <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-center text-sm font-medium text-white">
                          Start Time
                        </th>
                        <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-center text-sm font-medium text-white">
                          End Time
                        </th>
                        <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-center text-sm font-medium text-white">
                          Analytics
                        </th>
                        <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-center text-sm font-medium text-white">
                          Status
                        </th>
                        <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-center text-sm font-medium text-white">
                          {" "}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentResults.map((row, index) => (
                        <motion.tr
                          key={row.id}
                          custom={index}
                          variants={rowVariant}
                          initial="hidden"
                          animate="visible"
                          className={`border-b border-[#555] transition-colors hover:bg-[#404040] ${
                            index % 2 === 0 ? "bg-[#3a3a3a]" : "bg-[#353535]"
                          }`}
                        >
                          <td className="px-4 py-3.5 text-center text-sm text-white">
                            {row.id}
                          </td>
                          <td className="max-w-[180px] truncate px-4 py-3.5 text-left text-sm text-white md:max-w-none">
                            {row.name}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-center text-sm text-white">
                            {row.startTime}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-center text-sm text-white">
                            {row.endTime}
                          </td>
                          <td className="px-4 py-3.5 text-center text-sm text-white">
                            {row.analytics}
                          </td>
                          <td className="px-4 py-3.5 text-center text-sm">
                            <span
                              className={
                                row.status === "Expired"
                                  ? "text-red-400"
                                  : "text-white"
                              }
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <motion.button
                              type="button"
                              whileTap={{ scale: 1.05 }}
                              onClick={() => handleViewResult(row)}
                              disabled={loadingResultId === row.id}
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#8E5DAF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7421ac] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {loadingResultId === row.id ? (
                                <>
                                  <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                  Loading...
                                </>
                              ) : (
                                "View Result"
                              )}
                            </motion.button>
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
              No results found
            </div>
          )}

          {totalPages > 1 && effectiveData && filteredResults.length > 0 && (
            <div className="flex shrink-0 items-center justify-center gap-4 pt-2 sm:gap-6">
              <button
                type="button"
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="min-h-[44px] rounded-lg border border-[#5a5a5a] bg-transparent px-4 py-2.5 text-sm text-white transition-colors hover:border-gray-400 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ‹ Previous
              </button>
              <span className="flex min-h-[44px] items-center text-sm text-gray-300">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="min-h-[44px] rounded-lg border border-[#5a5a5a] bg-transparent px-4 py-2.5 text-sm text-white transition-colors hover:border-gray-400 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next ›
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ManageResult;
