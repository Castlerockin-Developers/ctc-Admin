import { useState, useEffect, useRef, useCallback } from "react";
import { log, error as logError } from "../utils/logger";
import { FaSearch, FaPlus, FaFilter, FaEllipsisV } from "react-icons/fa";
import Swal from "sweetalert2";
import { authFetch } from "../scripts/AuthProvider";
import Spinner from "../loader/Spinner";
import PropTypes from "prop-types";

function mapExamToDisplay(exam) {
  const startTime = new Date(exam.start_time);
  const endTime = new Date(exam.end_time);
  const now = new Date();
  let status;
  if (startTime > now) status = "Upcoming";
  else if (endTime > now && startTime <= now) status = "Ongoing";
  else if (exam.is_result_declared) status = "Results Declared";
  else status = "Completed";
  return {
    id: exam.id,
    name: exam.name,
    startTime: startTime.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short', hour12: true }),
    endTime: endTime.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short', hour12: true }),
    attemptsAllowed: exam.attempts_allowed,
    status,
  };
}

const ManageExam = ({ onCreateNewExam, cacheAllowed, onEditExam, examToView, onBackToDashboard, onClearExamToView }) => {
    const [activeButton, setActiveButton] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [selectedExam, setSelectedExam] = useState(examToView || null);
    const [showFilter, setShowFilter] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const filterRef = useRef(null);
    const actionsMenuRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(() => typeof window !== "undefined" && window.innerWidth >= 2560 ? 15 : 10);
    const [examsData, setExamsData] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const searchDebounceRef = useRef(null);
    const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const onResize = () => setItemsPerPage(window.innerWidth >= 2560 ? 15 : 10);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

    useEffect(() => {
        if (examToView) {
            setSelectedExam(examToView);
        } else {
            setSelectedExam(null);
        }
    }, [examToView]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
      setCurrentPage(1);
    }, 300);
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current); };
  }, [searchInput]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilter(false);
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target)) setShowActionsMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowFilter(false);
        setShowActionsMenu(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const toggleFilter = () => setShowFilter((prev) => !prev);

  const handleFilterSelect = (key) => {
    setActiveButton(key);
    setCurrentPage(1);
    setShowFilter(false);
  };

  const fetchExams = useCallback(async (page, pageSize, status, search) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    if (status && status !== "all") params.set("status", status);
    if (search) params.set("search", search.trim());
    const response = await authFetch(`/admin/exams/?${params.toString()}`, { method: "GET" });
    const data = await response.json();
    if (data && Array.isArray(data.results) && typeof data.count === "number") {
      return { paginated: true, results: data.results.map(mapExamToDisplay), totalCount: data.count };
    }
    if (Array.isArray(data)) {
      return { paginated: false, results: data.map(mapExamToDisplay), totalCount: data.length };
    }
    throw new Error("Unexpected response format");
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchExams(currentPage, itemsPerPage, activeButton, searchQuery)
      .then(({ paginated, results, totalCount: count }) => {
        if (cancelled) return;
        if (paginated) {
          setExamsData(results);
          setTotalCount(count);
        } else {
          const filtered = results
            .filter(row => {
              if (activeButton === "all") return true;
              if (activeButton === "active") return row.status === "Ongoing";
              if (activeButton === "upcoming") return row.status === "Upcoming";
              if (activeButton === "completed") return row.status === "Results Declared" || row.status === "Completed";
              return true;
            })
            .filter(row =>
              !searchQuery ||
              row.id.toString().includes(searchQuery) ||
              row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              row.startTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
              row.endTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
              row.attemptsAllowed.toString().includes(searchQuery) ||
              row.status.toLowerCase().includes(searchQuery.toLowerCase())
            );
          const start = (currentPage - 1) * itemsPerPage;
          setExamsData(filtered.slice(start, start + itemsPerPage));
          setTotalCount(filtered.length);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          logError("fetchExams:", err);
          setError(err);
          setExamsData(null);
          setTotalCount(0);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentPage, itemsPerPage, activeButton, searchQuery, retryCount, fetchExams]);

  const tableData = examsData || [];
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
  };

  const forceRefresh = useCallback(() => {
    // Always go back to first page and bump retry counter to trigger a refetch
    setCurrentPage(1);
    setRetryCount((c) => c + 1);
  }, []);

    const handleViewExam = (exam) => {
        setSelectedExam(exam);
    };

    const handleBack = () => {
        setSelectedExam(null);
        if (onClearExamToView) onClearExamToView();
        if (onBackToDashboard) onBackToDashboard();
        forceRefresh();
    };

    return (
        <div className="flex h-[87vh] min-h-[calc(100dvh-4.5rem)] w-full max-w-full flex-col overflow-hidden rounded-lg bg-[#282828] p-4 sm:p-5 md:h-[87vh] md:min-h-0 md:p-6 md:pb-8">
            {selectedExam ? (
                <ViewExam exam={selectedExam} onBack={handleBack} onEditExam={onEditExam} onRefresh={forceRefresh} />
            ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden sm:gap-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <h1 className="text-xl font-semibold text-white sm:text-2xl md:text-3xl">Exams</h1>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                            <div ref={filterRef} className="relative flex-1 min-w-0">
                                <div className="flex min-h-[44px] items-center gap-2 rounded-lg border border-gray-500 bg-[#3d3d3d] px-4 py-2.5 transition-colors focus-within:border-[#A294F9] focus-within:ring-2 focus-within:ring-[#A294F9]/30">
                                    <FaSearch className="h-5 w-5 shrink-0 text-gray-300" />
                                    <input
                                        type="text"
                                        placeholder="Search exams..."
                                        value={searchInput}
                                        onChange={(e) => setSearchInput(e.target.value)}
                                        className="min-w-0 flex-1 border-none bg-transparent text-white outline-none placeholder:text-gray-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowActionsMenu(false);
                                            toggleFilter();
                                        }}
                                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors sm:h-8 sm:w-8 ${showFilter ? "bg-[#A294F9] text-white" : "bg-[#4a4a4a] text-gray-300 hover:bg-[#5a5a5a]"}`}
                                    >
                                        <FaFilter className="h-4 w-4" />
                                    </button>
                                    {/* Mobile: 3-dot menu with Create New Exam */}
                                    <div ref={actionsMenuRef} className="relative md:hidden">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowFilter(false);
                                                setShowActionsMenu((prev) => !prev);
                                            }}
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors sm:h-8 sm:w-8 ${showActionsMenu ? "bg-[#A294F9] text-white" : "bg-[#4a4a4a] text-gray-300 hover:bg-[#5a5a5a]"}`}
                                        >
                                            <FaEllipsisV className="h-4 w-4" />
                                        </button>
                                        {showActionsMenu && (
                                            <div className="absolute right-0 top-full z-20 mt-2 min-w-[180px] rounded-lg border border-gray-600 bg-[#1F1F1F] py-1 shadow-xl">
                                                <button
                                                    onClick={() => {
                                                        onCreateNewExam();
                                                        setShowActionsMenu(false);
                                                    }}
                                                    className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left text-white transition-colors hover:bg-[#535353]"
                                                >
                                                    <FaPlus className="h-5 w-5  shrink-0" />
                                                    Create New Exam
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {showFilter && (
                                    <div className="absolute left-0 right-0 top-full z-20 mt-2 rounded-lg border border-gray-600 bg-[#1F1F1F] py-1 shadow-xl sm:left-auto sm:right-0 sm:min-w-[160px]">
                                        <ul className="text-white">
                                            {["all", "active", "upcoming", "completed"].map((key) => (
                                                <li
                                                    key={key}
                                                    className={`cursor-pointer px-4 py-3 transition-colors hover:bg-[#535353] ${activeButton === key ? "bg-[#535353] font-semibold" : ""}`}
                                                    onClick={() => handleFilterSelect(key)}
                                                >
                                                    {key === "all" ? "" : key.charAt(0).toUpperCase() + key.slice(1)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            {/* Desktop: Create New Exam button outside search bar */}
                            <button
                                onClick={onCreateNewExam}
                                className="hidden min-h-[44px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#A294F9] px-5 py-2.5 font-medium text-white transition-colors hover:bg-[#8E5DAF] md:flex"
                            >
                                <FaPlus className="h-5 w-5" /> Create New Exam
                            </button>
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-hidden rounded-lg">
                        {loading && examsData === null && !error ? (
                            <Spinner className="min-h-[280px]" />
                        ) : error ? (
                            <div className="flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-lg bg-[#353535] p-6 text-center">
                                <p className="text-red-400">
                                    {typeof error.message === "string" && error.message.toLowerCase().includes("organization not found")
                                        ? "We could not find an organization associated with your admin account. Please contact support to get your organization set up."
                                        : (error.message || "Failed to load exams")}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => { setError(null); setRetryCount(c => c + 1); }}
                                    className="rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : tableData.length > 0 ? (
                            <>
                                {/* Mobile: card layout */}
                                <div className="flex flex-col gap-3 overflow-y-auto pb-2 md:hidden">
                                    {tableData.map((row) => {
                                        const statusColor =
                                            row.status === "Ongoing"
                                                ? "bg-emerald-600/80 text-white"
                                                : row.status === "Upcoming"
                                                  ? "bg-amber-600/80 text-white"
                                                  : row.status === "Results Declared"
                                                    ? "bg-blue-600/80 text-white"
                                                    : "bg-gray-500/80 text-white";
                                        return (
                                            <div
                                                key={row.id}
                                                className="flex flex-col gap-3 rounded-lg border border-[#5a5a5a] bg-[#3a3a3a] p-4 active:bg-[#404040]"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-medium text-white">{row.name}</p>
                                                        <p className="mt-0.5 text-xs text-gray-400">#{row.id}</p>
                                                    </div>
                                                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
                                                        {row.status}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-300">
                                                    <span className="text-gray-500">Start</span>
                                                    <span className="text-right">{row.startTime}</span>
                                                    <span className="text-gray-500">End</span>
                                                    <span className="text-right">{row.endTime}</span>
                                                    <span className="text-gray-500">Attempts</span>
                                                    <span className="text-right text-white">{row.attemptsAllowed}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleViewExam(row)}
                                                    className="mt-1 w-full cursor-pointer rounded-lg bg-[#8E5DAF] py-3 text-sm font-medium text-white transition-colors hover:bg-[#7421ac] active:bg-[#5a1a85]"
                                                >
                                                   View Exam
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Desktop: table layout */}
                                <div className="hidden h-full overflow-x-auto overflow-y-auto rounded-lg border border-[#5a5a5a] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:block">
                                    <table className="w-full min-w-[600px] table-auto border-collapse">
                                        <thead className="sticky top-0 z-10 bg-[#4a4a4a]">
                                            <tr>
                                                <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-center text-sm font-medium text-white">#ID</th>
                                                <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-left text-sm font-medium text-white">Name</th>
                                                <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-center text-sm font-medium text-white">Start Time</th>
                                                <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-center text-sm font-medium text-white">End Time</th>
                                                <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-center text-sm font-medium text-white">Attempts</th>
                                                <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-center text-sm font-medium text-white">Status</th>
                                                <th className="whitespace-nowrap border-b border-[#666] px-4 py-4 text-center text-sm font-medium text-white"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tableData.map((row, idx) => (
                                                <tr
                                                    key={row.id}
                                                    className={`border-b border-[#555] transition-colors hover:bg-[#404040] ${idx % 2 === 0 ? "bg-[#3a3a3a]" : "bg-[#353535]"}`}
                                                >
                                                    <td className="px-4 py-3.5 text-center text-sm text-white">{row.id}</td>
                                                    <td className="max-w-[180px] truncate px-4 py-3.5 text-left text-sm text-white md:max-w-none">{row.name}</td>
                                                    <td className="whitespace-nowrap px-4 py-3.5 text-center text-sm text-white">{row.startTime}</td>
                                                    <td className="whitespace-nowrap px-4 py-3.5 text-center text-sm text-white">{row.endTime}</td>
                                                    <td className="px-4 py-3.5 text-center text-sm text-white">{row.attemptsAllowed}</td>
                                                    <td className="px-4 py-3.5 text-center text-sm text-white">{row.status}</td>
                                                    <td className="px-4 py-3.5">
                                                        <button
                                                            onClick={() => handleViewExam(row)}
                                                            className="whitespace-nowrap cursor-pointer rounded-lg bg-[#8E5DAF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7421ac]"
                                                        >
                                                            View Exam
                                                        </button>
                                                    </td>
                                               </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="flex h-32 items-center justify-center rounded-lg border border-[#5a5a5a] bg-[#353535] text-gray-400 md:h-40">
                                No exams found
                            </div>
                        )}
                    </div>

                    {!loading && tableData.length > 0 && totalPages > 1 && (
                        <div className="flex items-center justify-center gap-4 pt-2 sm:gap-6">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="min-h-[44px] cursor-pointer rounded border border-gray-500 bg-transparent px-4 py-2.5 text-sm text-white transition-colors hover:border-gray-400 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-gray-600 disabled:opacity-50 disabled:hover:bg-transparent"
                            >
                                ‹ Previous
                            </button>
                            <span className="flex min-h-[44px] items-center text-sm text-gray-300">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="min-h-[44px] cursor-pointer rounded border border-gray-500 bg-transparent px-4 py-2.5 text-sm text-white transition-colors hover:border-gray-400 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-gray-600 disabled:opacity-50 disabled:hover:bg-transparent"
                            >
                                Next ›
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const ViewExam = ({ exam, onBack, onEditExam, onRefresh }) => {
    const [examDetails, setExamDetails] = useState(null);

    const isExamCompleted = (examData) => {
        if (!examData) return false;
        if (examData.end_time) {
            return new Date(examData.end_time) < new Date();
        }
        if (examData.is_result_declared !== undefined) return examData.is_result_declared;
        if (examData.status) return ["completed", "finished"].includes(examData.status);
        return false;
    };

    const handleEditClick = () => {
        if (onEditExam && examDetails) onEditExam(examDetails);
    };

    const handleDeleteExam = async () => {
        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!',
                background: '#181817',
                color: '#fff',
            });

            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Deleting...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                    background: '#181817',
                    color: '#fff',
                });

                const response = await authFetch(`/admin/exams/${examDetails.id}/`, { method: "DELETE" });

                if (response.ok) {
                    Swal.fire({
                      icon: "success",
                      title: "Exam Deleted!",
                      text: "The exam has been deleted successfully.",
                      background: '#181817',
                      color: '#fff'
                    }).then(() => {
                      // Trigger a refresh of the exams list as soon as deletion succeeds
                      if (onRefresh) onRefresh();
                      onBack();
                    });
                } else {
                    const errorData = await response.json();
                    Swal.fire({ icon: "error", title: "Error", text: errorData.error || "Failed to delete exam.", background: '#181817', color: '#fff' });
                }
            }
        } catch (error) {
            logError("Error deleting exam:", error);
            Swal.fire({ icon: "error", title: "Error", text: error.message || "Network error.", background: '#181817', color: '#fff' });
        }
    };

    const handleViewExam = async (examData) => {
        try {
            const response = await authFetch(`/admin/exams/${examData.id}/`, { method: "GET" });
            if (!response.ok) throw new Error("Failed to fetch exam details");
            const data = await response.json();
            setExamDetails(data);
        } catch (error) {
            logError("Error fetching exam details:", error);
            alert("Failed to load exam details");
        }
    };

  useEffect(() => {
    if (exam && !examDetails) handleViewExam(exam);
  }, [exam, examDetails]);

  if (!examDetails) return <Spinner className="min-h-[200px]" />;

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-lg bg-[#282828] p-4 sm:p-5 md:p-6">
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#404040] text-2xl font-bold text-white transition-colors hover:bg-[#505050]"
                    >
                        &lt;
                    </button>
                    <h1 className="min-w-0 truncate text-xl font-semibold text-white sm:text-2xl md:text-3xl">
                        #{examDetails.id} {examDetails.name}
                    </h1>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="overflow-hidden rounded-lg border border-[#5a5a5a]">
                        <div className="flex flex-col gap-4 border-b border-[#5a5a5a] bg-[#4a4a4a] p-4 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-lg font-medium text-white sm:text-xl">Exam Section</h2>
                            <div className="flex flex-wrap gap-3">
                                {!isExamCompleted(examDetails) && (
                                    <>
                                        <button
                                            onClick={handleDeleteExam}
                                            className="rounded-lg cursor-pointer bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700"
                                        >
                                            Delete
                                        </button>
                                        <button
                                            onClick={handleEditClick}
                                            className="rounded-lg cursor-pointer bg-[#65979B] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0098a3]"
                                        >
                                            Edit
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto bg-[#353535] p-4">
                            <div className="flex flex-col gap-6">
                                <div className="overflow-hidden rounded-lg border border-[#555]">
                                    <div className="flex items-center justify-between bg-[#404040] px-4 py-3">
                                        <p className="font-medium text-white">MCQ</p>
                                        <span className="rounded-full bg-[#5a5a5a] px-3 py-0.5 text-sm text-white">
                                            {examDetails?.alloted_sections?.length || 0}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-[#555] bg-[#3a3a3a] px-4">
                                        {examDetails?.alloted_sections?.map((section, index) => (
                                            <div key={section.id || index} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                                <p className="text-white">{index + 1}. {section.section_name || "Sample Question"}</p>
                                                <p className="text-sm text-gray-300">
                                                    Timed: {section.is_timed ? "Yes" : "No"} {section.is_timed && `| ${section.section_time} min`} | Total: {section.no_of_question}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="overflow-hidden rounded-lg border border-[#555]">
                                    <div className="flex items-center justify-between bg-[#404040] px-4 py-3">
                                        <p className="font-medium text-white">Coding</p>
                                        <span className="rounded-full bg-[#5a5a5a] px-3 py-0.5 text-sm text-white">
                                            {examDetails.selected_coding_questions?.length || 0}
                                        </span>
                                    </div>
                                    <div className="divide-y divide-[#555] bg-[#3a3a3a] px-4">
                                        {examDetails.selected_coding_questions?.map(({ id, question_name }, index) => (
                                            <div key={id} className="py-3">
                                                <p className="text-white">{index + 1}. {question_name}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-[#5a5a5a]">
                        <div className="border-b border-[#5a5a5a] bg-[#4a4a4a] px-4 py-3">
                            <h2 className="text-lg font-medium text-white sm:text-xl">Assigned Students</h2>
                        </div>
                        <div className="max-h-[40vh] overflow-y-auto bg-[#353535] p-4">
                            <div className="overflow-hidden rounded-lg border border-[#555]">
                                <div className="flex items-center justify-between bg-[#404040] px-4 py-3">
                                    <h2 className="font-medium text-white">Students</h2>
                                    <span className="rounded-full bg-[#5a5a5a] px-3 py-0.5 text-sm text-white">
                                        {examDetails?.students?.length || 0}
                                    </span>
                                </div>
                                <div className="divide-y divide-[#555] bg-[#3a3a3a] px-4">
                                    {examDetails?.students && examDetails.students.length > 0 ? (
                                        examDetails.students.map((student, index) => (
                                            <div key={student.id || index} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                                <p className="text-white">{index + 1}. {student.name || `${student.first_name || ""} ${student.last_name || ""}`.trim()}</p>
                                                <p className="text-sm text-gray-300">
                                                    USN: {student.usn || student.slNo} | {student.email}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="py-8 text-center text-gray-400">No students assigned to this exam</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageExam;

ManageExam.propTypes = {
  onCreateNewExam: PropTypes.func.isRequired,
  cacheAllowed: PropTypes.bool,
  onEditExam: PropTypes.func,
};

ViewExam.propTypes = {
  exam: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string,
  }).isRequired,
  onBack: PropTypes.func.isRequired,
  onEditExam: PropTypes.func,
  onRefresh: PropTypes.func,
};
