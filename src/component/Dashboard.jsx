import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { log, error as logError } from "../utils/logger";
import { FaTimes } from "react-icons/fa";
import { SESSION_EXPIRED_MESSAGE } from "../scripts/AuthProvider";
import Spinner from "../loader/Spinner";
import { useCache } from "../hooks/useCache";
import { fetchAdminHomeData } from "../api/adminHome";
import StudentAnalyticsSection from "./StudentAnalyticsSection";

const formatDateTime = (dateStr) =>
  new Date(dateStr).toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

const Dashboard = ({
    onCreateExam,
    onAddStudent,
    onAddUser,
    onAddCredits,
    onManageExam,
    onSubscription,
    onManageStudents,
    cacheAllowed,
    onBackToDashboard,
    isBranchCoordinator = false,
}) => {
    const navigate = useNavigate();
    const [showPopup, setShowPopup] = useState(false);
    const [showCompletedPopup, setShowCompletedPopup] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        log("Dashboard: fetchDashboardData -> calling /admin/home/");
        return fetchAdminHomeData();
    }, []);

    const onCacheHit = useCallback((data) => {
        log("Dashboard data loaded from cache");
    }, []);

    const onCacheMiss = useCallback((data) => {
        log("Dashboard data fetched fresh");
    }, []);

    const onError = useCallback((err) => {
        logError("Dashboard fetch error:", err);
    }, []);

    const {
        data: dashboardData,
        loading,
        error,
        cacheUsed,
        cacheInfo,
        forceRefresh,
        invalidateCache,
        clearAllCache,
    } = useCache("dashboard_data", fetchDashboardData, {
        enabled: cacheAllowed !== false,
        expiryMs: 3 * 60 * 1000,
        autoRefresh: true,
        refreshInterval: 60 * 1000,
        onCacheHit,
        onCacheMiss,
        onError,
    });

    if (loading) return <Spinner className="min-h-[200px]" />;

    if (error) {
        const isOrgMissing =
            typeof error.message === "string" &&
            error.message.toLowerCase().includes("organization not found");

        if (error.status === 403) {
            navigate("/access-denied", { replace: true });
            return null;
        }
        const isSessionExpired = error.message === SESSION_EXPIRED_MESSAGE;
        return (
            <div className="flex flex-col items-center justify-center p-4 text-center">
                <p className="mb-4 text-lg text-red-500">
                    {isSessionExpired
                        ? "Your session has expired. Please log in again."
                        : isOrgMissing
                            ? "We could not find an organization associated with your admin account. Please contact support to get your organization set up."
                            : (error.message || "Failed to load dashboard data")}
                </p>
                {isSessionExpired ? (
                    <a
                        href="/"
                        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                        Log in again
                    </a>
                ) : (
                    <button
                        onClick={forceRefresh}
                        className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                        Retry
                    </button>
                )}
            </div>
        );
    }

    const handleViewExam = (exam) => onManageExam(exam);

    const sa = dashboardData?.studentAnalytics;
    const recentExams = dashboardData?.recentExams ?? [];

    const renderCoordinatorExamList = (tests, emptyMessage) => {
        if (!tests?.length) {
            return (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#252525]/50 py-12 text-center">
                    <p className="text-sm text-white">{emptyMessage}</p>
                </div>
            );
        }
        return (
            <ul className="space-y-3">
                {tests.map((test, index) => (
                    <li key={test.id}>
                        <div className="group flex items-center gap-4 rounded-xl border border-white/5 bg-[#252525] p-4 transition-colors hover:border-[#A294F9]/30 hover:bg-[#2a2a2a]">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#A294F9]/20 text-sm font-semibold text-[#A294F9]">
                                {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-white">{test.name}</p>
                                <p className="mt-1 text-xs text-white">
                                    {formatDateTime(test.start_time)} → {formatDateTime(test.end_time)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleViewExam(test)}
                                className="shrink-0 rounded-xl bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#A294F9]/20 transition-all hover:bg-[#8b7ce8] hover:shadow-[#A294F9]/30"
                            >
                                View
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };

    const togglePopup = () => setShowPopup((prev) => !prev);
    const closePopup = () => setShowPopup(false);
    const toggleCompletedPopup = () => setShowCompletedPopup((prev) => !prev);
    const closeCompletedPopup = () => setShowCompletedPopup(false);

    const statCardClass =
        "flex min-w-0 flex-1 min-h-[6.5rem] sm:min-h-[7.5rem] flex-col rounded-xl border border-[#5a5a5a] bg-[#3a3a3a] px-5 pt-4 pb-4 shadow-md cursor-pointer transition-colors hover:bg-white/5";
    const statLabelClass = "text-sm font-medium text-white";
    const statValueClass = "mt-2 flex flex-1 items-center justify-center text-3xl font-bold tabular-nums text-white sm:text-4xl";

    return (
        <div className="flex h-[calc(100dvh-4.5rem)] w-full max-w-full flex-col overflow-hidden rounded-lg bg-[#282828] p-5 pb-10 sm:p-6 sm:pb-12 md:h-[87vh] md:p-8 md:pb-14 lg:w-full">
            <div className="flex min-h-0 w-full max-w-full flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex justify-between items-center pt-2 sm:pt-4">
                    <h1 className="text-xl font-semibold text-white sm:text-2xl md:text-3xl lg:text-4xl">
                        Welcome {dashboardData?.userData}
                    </h1>
                </div>

                <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
                    <div className={statCardClass} onClick={togglePopup}>
                        <h4 className={statLabelClass}>Active Test</h4>
                        <h2 className={statValueClass}>
                            {dashboardData?.dashboardData?.activeContest || 0}
                        </h2>
                    </div>
                    <div className={statCardClass} onClick={toggleCompletedPopup}>
                        <h4 className={statLabelClass}>Completed Exams</h4>
                        <h2 className={statValueClass}>
                            {dashboardData?.dashboardData?.liveContest || 0}
                        </h2>
                    </div>
                    <div className={statCardClass} onClick={onManageStudents}>
                        <h4 className={statLabelClass}>Total Students</h4>
                        <h2 className={statValueClass}>
                            {dashboardData?.dashboardData?.totalStudents || 0}
                        </h2>
                    </div>
                </div>

                {/* Active Exams Modal */}
                {showPopup && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={closePopup}
                    >
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" aria-hidden />
                        <div
                            className="relative flex max-h-[88vh] w-full flex-col rounded-2xl bg-[#1e1e1e] shadow-2xl ring-1 ring-white/10 sm:max-w-md md:max-w-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#2d2d2d] to-[#252525] px-6 py-5 rounded-t-2xl">
                                <div>
                                    <h2 className="text-xl font-semibold tracking-tight text-white">
                                        Active Exams
                                    </h2>
                                    <p className="mt-0.5 text-sm text-white">
                                        {dashboardData?.testDetails?.length ?? 0} exam{dashboardData?.testDetails?.length !== 1 ? "s" : ""} currently active
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closePopup}
                                    className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 hover:text-white"
                                    aria-label="Close"
                                >
                                    <FaTimes className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="min-h-0 flex-1 overflow-y-auto p-5">
                                {dashboardData?.testDetails?.length > 0 ? (
                                    <ul className="space-y-3">
                                        {dashboardData.testDetails.map((test, index) => (
                                            <li key={test.id}>
                                                <div className="group flex items-center gap-4 rounded-xl border border-white/5 bg-[#252525] p-4 transition-colors hover:border-[#A294F9]/30 hover:bg-[#2a2a2a]">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#A294F9]/20 text-sm font-semibold text-[#A294F9]">
                                                        {index + 1}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-white truncate">{test.name}</p>
                                                        <p className="mt-1 text-xs text-white">
                                                            {formatDateTime(test.start_time)} → {formatDateTime(test.end_time)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewExam(test)}
                                                        className="shrink-0 rounded-xl bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#A294F9]/20 transition-all hover:bg-[#8b7ce8] hover:shadow-[#A294F9]/30"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#252525]/50 py-16 text-center">
                                        <p className="text-white">No active exams at the moment.</p>
                                        <p className="mt-1 text-sm text-white">New exams will appear here when scheduled.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Completed Exams Modal */}
                {showCompletedPopup && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        onClick={closeCompletedPopup}
                    >
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" aria-hidden />
                        <div
                            className="relative flex max-h-[88vh] w-full flex-col rounded-2xl bg-[#1e1e1e] shadow-2xl ring-1 ring-white/10 sm:max-w-md md:max-w-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#2d2d2d] to-[#252525] px-6 py-5 rounded-t-2xl">
                                <div>
                                    <h2 className="text-xl font-semibold tracking-tight text-white">
                                        Completed Exams
                                    </h2>
                                    <p className="mt-0.5 text-sm text-white">
                                        {dashboardData?.completedResults?.length ?? 0} exam{dashboardData?.completedResults?.length !== 1 ? "s" : ""} completed
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeCompletedPopup}
                                    className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 hover:text-white"
                                    aria-label="Close"
                                >
                                    <FaTimes className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="min-h-0 flex-1 overflow-y-auto p-5">
                                {dashboardData?.completedResults?.length > 0 ? (
                                    <ul className="space-y-3">
                                        {dashboardData.completedResults.map((test, index) => (
                                            <li key={test.id}>
                                                <div className="group flex items-center gap-4 rounded-xl border border-white/5 bg-[#252525] p-4 transition-colors hover:border-[#A294F9]/30 hover:bg-[#2a2a2a]">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#A294F9]/20 text-sm font-semibold text-[#A294F9]">
                                                        {index + 1}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-white truncate">{test.name}</p>
                                                        <p className="mt-1 text-xs text-white">
                                                            {formatDateTime(test.start_time)} → {formatDateTime(test.end_time)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewExam(test)}
                                                        className="shrink-0 rounded-xl bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-[#A294F9]/20 transition-all hover:bg-[#8b7ce8] hover:shadow-[#A294F9]/30"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#252525]/50 py-16 text-center">
                                        <p className="text-white">No completed exams yet.</p>
                                        <p className="mt-1 text-sm text-white">Finished exams will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Branch coordinators: tests & results instead of org-wide student analytics */}
                {isBranchCoordinator ? (
                    <div className="flex w-full flex-col gap-6">
                        <div>
                            <p className="text-xs font-medium tracking-widest text-white uppercase">
                                Your tests &amp; results
                            </p>
                            <p className="mt-1 text-sm text-gray-400">
                                Live exams, recent schedule, and assessments with published results for your branches.
                            </p>
                        </div>
                        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="overflow-hidden rounded-xl border border-[#5a5a5a] bg-[#3a3a3a]">
                                <div className="border-b border-[#5a5a5a] px-5 py-4">
                                    <h3 className="text-base font-medium text-white">Live now</h3>
                                    <p className="text-xs text-gray-400">
                                        {dashboardData?.testDetails?.length ?? 0} exam
                                        {(dashboardData?.testDetails?.length ?? 0) !== 1 ? "s" : ""} in the active window
                                    </p>
                                </div>
                                <div className="max-h-[min(28rem,50vh)] overflow-y-auto p-5 [scrollbar-width:thin]">
                                    {renderCoordinatorExamList(
                                        dashboardData?.testDetails,
                                        "No exams are live right now."
                                    )}
                                </div>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-[#5a5a5a] bg-[#3a3a3a]">
                                <div className="border-b border-[#5a5a5a] px-5 py-4">
                                    <h3 className="text-base font-medium text-white">Recent tests</h3>
                                    <p className="text-xs text-gray-400">Latest exams in your scope (by start time)</p>
                                </div>
                                <div className="max-h-[min(28rem,50vh)] overflow-y-auto p-5 [scrollbar-width:thin]">
                                    {renderCoordinatorExamList(
                                        recentExams,
                                        "No exams found for your branches yet."
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="overflow-hidden rounded-xl border border-[#5a5a5a] bg-[#3a3a3a]">
                            <div className="border-b border-[#5a5a5a] px-5 py-4">
                                <h3 className="text-base font-medium text-white">Tests with published results</h3>
                                <p className="text-xs text-gray-400">
                                    Open an exam to review scores and submissions
                                </p>
                            </div>
                            <div className="max-h-[min(28rem,55vh)] overflow-y-auto p-5 [scrollbar-width:thin]">
                                {renderCoordinatorExamList(
                                    dashboardData?.completedResults,
                                    "No completed exams with results published yet."
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* Student analytics (org admins); branch coordinators use Analytics page */}
                {!isBranchCoordinator ? (
                    <StudentAnalyticsSection sa={sa} sectionEyebrow="Student analytics" />
                ) : null}
            </div>
        </div>
    );
};

export default Dashboard;
