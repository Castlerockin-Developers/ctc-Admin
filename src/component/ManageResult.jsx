import React, { useState, useEffect, useCallback, useRef } from "react";
import { log, error as logError } from "../utils/logger";
import { FaSearch, FaFilter } from "react-icons/fa";
import { motion } from "framer-motion";
import ViewResult from "./ViewResult";
import ParticularResult from "./PerticularResult";
import { authFetch } from "../scripts/AuthProvider";
import Spinner from "../loader/Spinner";

function mapApiRowToDisplay(res) {
  const now = new Date();
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
    endTimeRaw: end,
    startTimeRaw: start,
    isResultDeclared: Boolean(res.is_result_declared),
    analytics: `${res.attempts_allowed} Attempts`,
    status,
  };
}

const STATUS_OPTIONS = [
  { key: "all", label: "All Exams" },
  { key: "active", label: "Active" },
  { key: "upcoming", label: "Upcoming" },
  { key: "results_declared", label: "Results Declared" },
  { key: "completed", label: "Completed" },
];

const SORT_OPTIONS = [
  { key: "modified_desc", label: "Newest Modified" },
  { key: "modified_asc", label: "Oldest Modified" },
  { key: "start_desc", label: "Newest Start Time" },
  { key: "start_asc", label: "Oldest Start Time" },
];

function matchesStatusFilter(row, status) {
  if (!status || status === "all") return true;
  if (status === "active") return row.status === "Ongoing";
  if (status === "upcoming") return row.status === "Upcoming";
  if (status === "results_declared") return row.status === "Results Declared";
  if (status === "completed") {
    return row.status === "Results Declared" || row.status === "Completed";
  }
  return true;
}

function matchesDateModifiedFilter(row, from, to) {
  const endDate = row.endTimeRaw;
  if (!endDate || Number.isNaN(endDate.getTime())) return true;
  if (from) {
    const fromDate = new Date(`${from}T00:00:00`);
    if (endDate < fromDate) return false;
  }
  if (to) {
    const toDate = new Date(`${to}T23:59:59.999`);
    if (endDate > toDate) return false;
  }
  return true;
}

function sortRows(rows, sortKey) {
  const sorted = [...rows];
  const compareDates = (a, b, field, direction) => {
    const av = a[field]?.getTime?.() ?? 0;
    const bv = b[field]?.getTime?.() ?? 0;
    if (av === bv) return direction * (a.id - b.id);
    return direction * (av - bv);
  };
  switch (sortKey) {
    case "modified_asc":
      sorted.sort((a, b) => compareDates(a, b, "endTimeRaw", 1));
      break;
    case "start_desc":
      sorted.sort((a, b) => compareDates(a, b, "startTimeRaw", -1));
      break;
    case "start_asc":
      sorted.sort((a, b) => compareDates(a, b, "startTimeRaw", 1));
      break;
    case "modified_desc":
    default:
      sorted.sort((a, b) => compareDates(a, b, "endTimeRaw", -1));
      break;
  }
  return sorted;
}

const ManageResult = ({ onNext, cacheAllowed }) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("modified_desc");
  const [modifiedFrom, setModifiedFrom] = useState("");
  const [modifiedTo, setModifiedTo] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(() =>
    typeof window !== "undefined" && window.innerWidth >= 2560 ? 15 : 10
  );
  const [loadingResultId, setLoadingResultId] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchDebounceRef = useRef(null);
  const filterRef = useRef(null);

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

  const rowVariant = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.03, duration: 0.5 },
    }),
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setShowFilter(false);
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const fetchResults = useCallback(
    async (page, pageSize, filters, search) => {
      log(
        "fetchResults: page=%s pageSize=%s status=%s sort=%s modifiedFrom=%s modifiedTo=%s search=%s",
        page,
        pageSize,
        filters.status,
        filters.sort,
        filters.modifiedFrom || "",
        filters.modifiedTo || "",
        search || ""
      );
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(pageSize));
      if (filters.status && filters.status !== "all") {
        params.set("status", filters.status);
      }
      if (filters.sort && filters.sort !== "modified_desc") {
        params.set("sort", filters.sort);
      }
      if (filters.modifiedFrom) params.set("modified_from", filters.modifiedFrom);
      if (filters.modifiedTo) params.set("modified_to", filters.modifiedTo);
      if (search) params.set("search", search.trim());
      const url = `/admin/results/?${params.toString()}`;
      const response = await authFetch(url, { method: "GET" });
      if (!response.ok) throw new Error("Failed to fetch results");
      const data = await response.json();
      if (data && Array.isArray(data.results) && typeof data.count === "number") {
        const mapped = data.results.map(mapApiRowToDisplay);
        return { paginated: true, results: mapped, totalCount: data.count };
      }
      if (Array.isArray(data)) {
        const mapped = data.map(mapApiRowToDisplay);
        return { paginated: false, results: mapped, totalCount: mapped.length };
      }
      throw new Error("Unexpected response format");
    },
    []
  );

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const filters = {
      status: statusFilter,
      sort: sortBy,
      modifiedFrom,
      modifiedTo,
    };
    fetchResults(currentPage, resultsPerPage, filters, searchQuery)
      .then(({ paginated, results, totalCount: count }) => {
        if (cancelled) return;
        if (paginated) {
          setResultsData(results);
          setTotalCount(count);
        } else {
          const filtered = sortRows(
            results
              .filter((row) => matchesStatusFilter(row, statusFilter))
              .filter((row) =>
                matchesDateModifiedFilter(row, modifiedFrom, modifiedTo)
              )
              .filter((row) => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                return [row.id, row.name, row.analytics, row.status].some((field) =>
                  String(field).toLowerCase().includes(q)
                );
              }),
            sortBy
          );
          const start = (currentPage - 1) * resultsPerPage;
          setResultsData(filtered.slice(start, start + resultsPerPage));
          setTotalCount(filtered.length);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          logError("fetchResults:", err);
          setError(err);
          setResultsData(null);
          setTotalCount(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    resultsPerPage,
    statusFilter,
    sortBy,
    modifiedFrom,
    modifiedTo,
    searchQuery,
    fetchResults,
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / resultsPerPage));
  const currentResults = resultsData || [];
  const hasResults = currentResults.length > 0;

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((p) => p + 1);
  };
  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage((p) => p - 1);
  };

  const handleRetry = () => {
    setError(null);
    setCurrentPage(1);
  };

  const handleViewResult = async (row) => {
    if (loadingResultId === row.id) return;
    setLoadingResultId(row.id);
    const pageSize = 50;
    try {
      const url = `/admin/results/${row.id}/?attempts_page=1&attempts_page_size=${pageSize}&page_size=${pageSize}`;
      const resp = await authFetch(url, { method: "GET" });
      if (!resp.ok) throw new Error("Failed to fetch details");
      const details = await resp.json();
      const mapAttempt = (a) => ({
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
        campusScore: a.campus_score,
      });
      setSelectedResult({
        ...row,
        studentsAttempted: details.users_attempted_count,
        studentsUnattempted: details.users_unattempted_count,
        malpractice: details.malpractice_recorded_count,
        averageScore: details.users_average_score,
        topScore: details.top_score,
        topScorer: details.top_scorer,
        campusScoreLeaderboard: details.campus_score_leaderboard || [],
        examScoreLeaderboard: details.exam_score_leaderboard || [],
        students: details.attempts.map(mapAttempt),
        attemptsCount: details.attempts_count ?? details.attempts?.length,
        attemptsPageSize: pageSize,
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

  const hasActiveFilters =
    statusFilter !== "all" ||
    sortBy !== "modified_desc" ||
    Boolean(modifiedFrom) ||
    Boolean(modifiedTo);

  const handleClearFilters = () => {
    setStatusFilter("all");
    setSortBy("modified_desc");
    setModifiedFrom("");
    setModifiedTo("");
    setCurrentPage(1);
  };

  const handleFilterChange = (updater) => {
    updater();
    setCurrentPage(1);
  };

  if (loading && !resultsData) return <Spinner className="min-h-[200px]" />;

  if (error) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg bg-[#282828] p-6 text-center">
        <p className="text-red-400">
          {error.message || "Failed to load results"}
        </p>
        <button
          onClick={handleRetry}
          className="rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8E5DAF]"
        >
          Retry
        </button>
      </div>
    );
  }

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
            <h1 className="text-xl cursor-pointer font-semibold text-white sm:text-2xl md:text-3xl">
              Results
            </h1>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div ref={filterRef} className="relative flex-1 min-w-0">
                <div className="flex min-h-[44px] flex-1 min-w-0 items-center gap-2 rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2.5 transition-colors focus-within:border-[#A294F9] focus-within:ring-2 focus-within:ring-[#A294F9]/30">
                  <FaSearch className="h-5 w-5 shrink-0 text-gray-300" />
                  <input
                    type="text"
                    placeholder="Search results..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="min-w-0 flex-1 border-none bg-transparent text-white outline-none placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFilter((prev) => !prev)}
                    aria-label="Filter results"
                    className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors sm:h-8 sm:w-8 ${
                      showFilter || hasActiveFilters
                        ? "bg-[#A294F9] text-white"
                        : "bg-[#4a4a4a] text-gray-300 hover:bg-[#5a5a5a]"
                    }`}
                  >
                    <FaFilter className="h-4 w-4" />
                    {hasActiveFilters && !showFilter && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-white" />
                    )}
                  </button>
                </div>
                {showFilter && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-lg border border-gray-600 bg-[#1F1F1F] p-4 shadow-xl sm:left-auto sm:min-w-[320px] sm:max-w-[360px]">
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400">
                          Date Modified
                        </label>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <input
                            type="date"
                            value={modifiedFrom}
                            onChange={(e) =>
                              handleFilterChange(() => setModifiedFrom(e.target.value))
                            }
                            className="w-full rounded-lg border border-[#5a5a5a] bg-[#353535] px-3 py-2 text-sm text-white outline-none focus:border-[#A294F9]"
                          />
                          <input
                            type="date"
                            value={modifiedTo}
                            onChange={(e) =>
                              handleFilterChange(() => setModifiedTo(e.target.value))
                            }
                            className="w-full rounded-lg border border-[#5a5a5a] bg-[#353535] px-3 py-2 text-sm text-white outline-none focus:border-[#A294F9]"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">From / To</p>
                      </div>
                      <div>
                        <label
                          htmlFor="results-status-filter"
                          className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400"
                        >
                          Status
                        </label>
                        <select
                          id="results-status-filter"
                          value={statusFilter}
                          onChange={(e) =>
                            handleFilterChange(() => setStatusFilter(e.target.value))
                          }
                          className="w-full rounded-lg border border-[#5a5a5a] bg-[#353535] px-3 py-2 text-sm text-white outline-none focus:border-[#A294F9]"
                        >
                          {STATUS_OPTIONS.map(({ key, label }) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label
                          htmlFor="results-sort-filter"
                          className="mb-2 block text-xs font-medium uppercase tracking-wide text-gray-400"
                        >
                          Sort By
                        </label>
                        <select
                          id="results-sort-filter"
                          value={sortBy}
                          onChange={(e) =>
                            handleFilterChange(() => setSortBy(e.target.value))
                          }
                          className="w-full rounded-lg border border-[#5a5a5a] bg-[#353535] px-3 py-2 text-sm text-white outline-none focus:border-[#A294F9]"
                        >
                          {SORT_OPTIONS.map(({ key, label }) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleClearFilters}
                          className="w-full cursor-pointer rounded-lg border border-[#5a5a5a] px-3 py-2 text-sm text-gray-300 transition-colors hover:bg-[#353535]"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading && resultsData ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner className="h-8 w-8" />
            </div>
          ) : hasResults ? (
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
                      className="w-full cursor-pointer rounded-lg bg-[#8E5DAF] py-3 text-sm font-medium text-white transition-colors hover:bg-[#7421ac] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                              className="inline-flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer rounded-lg bg-[#8E5DAF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7421ac] disabled:opacity-50 disabled:cursor-not-allowed"
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

          {totalPages > 1 && hasResults && (
            <div className="flex shrink-0 items-center justify-center gap-4 pt-2 sm:gap-6">
              <button
                type="button"
                onClick={goToPrevPage}
                disabled={currentPage === 1 || loading}
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
                disabled={currentPage === totalPages || loading}
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
