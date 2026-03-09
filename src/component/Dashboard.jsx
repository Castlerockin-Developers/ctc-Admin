import React, { useState, useCallback } from "react";
import { log, error as logError } from "../utils/logger";
import { FaTimes } from "react-icons/fa";
import { authFetch, SESSION_EXPIRED_MESSAGE } from "../scripts/AuthProvider";
import Spinner from "../loader/Spinner";
import { useCache } from "../hooks/useCache";

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
}) => {
    const [showPopup, setShowPopup] = useState(false);
    const [showCompletedPopup, setShowCompletedPopup] = useState(false);

    const fetchDashboardData = useCallback(async () => {
        log("Dashboard: fetchDashboardData -> calling /admin/home/");
        const params = new URLSearchParams();
        params.set("recent_limit", "10");
        params.set("completed_limit", "10");
        params.set("active_limit", "10");
        const response = await authFetch(`/admin/home/?${params.toString()}`, { method: "GET" });
        const responseData = await response.json();
        return {
            dashboardData: {
                activeContest: responseData.active_exam,
                liveContest: responseData.completed_exams_count,
                credit: responseData.credits,
                totalStudents: responseData.total_users,
            },
            testDetails: responseData.active_exams,
            recentTests: responseData.recent_exams,
            completedResults: responseData.completed_exams,
            notifications: responseData.notifications,
            userData: responseData.logged_in_user,
        };
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
        const isSessionExpired = error.message === SESSION_EXPIRED_MESSAGE;
        return (
            <div className="flex flex-col items-center justify-center p-4 text-center">
                <p className="mb-4 text-lg text-red-500">
                    {isSessionExpired
                        ? "Your session has expired. Please log in again."
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
    const onViewexam = (test) => onManageExam(test);
    const togglePopup = () => setShowPopup((prev) => !prev);
    const closePopup = () => setShowPopup(false);
    const toggleCompletedPopup = () => setShowCompletedPopup((prev) => !prev);
    const closeCompletedPopup = () => setShowCompletedPopup(false);

    const statCardClass =
        "flex min-w-0 flex-1 min-h-[8rem] sm:min-h-[10rem] flex-col rounded-lg border border-gray-300 bg-[#4B4B4B] px-5 pt-5 pb-6 text-left shadow-md cursor-pointer transition-colors hover:bg-[#565656]";
    const statLabelClass = "text-sm text-white sm:text-base md:text-lg lg:text-xl";
    const statValueClass = "mt-5 flex flex-1 items-center justify-center text-2xl font-semibold text-white sm:text-3xl md:text-4xl";

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
                                    <p className="mt-0.5 text-sm text-gray-400">
                                        {dashboardData?.testDetails?.length ?? 0} exam{dashboardData?.testDetails?.length !== 1 ? "s" : ""} currently active
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closePopup}
                                    className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
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
                                                        <p className="mt-1 text-xs text-gray-500">
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
                                        <p className="text-gray-400">No active exams at the moment.</p>
                                        <p className="mt-1 text-sm text-gray-500">New exams will appear here when scheduled.</p>
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
                                    <p className="mt-0.5 text-sm text-gray-400">
                                        {dashboardData?.completedResults?.length ?? 0} exam{dashboardData?.completedResults?.length !== 1 ? "s" : ""} completed
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeCompletedPopup}
                                    className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
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
                                                        <p className="mt-1 text-xs text-gray-500">
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
                                        <p className="text-gray-400">No completed exams yet.</p>
                                        <p className="mt-1 text-sm text-gray-500">Finished exams will appear here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
                    <div className="flex h-[320px] w-full min-w-0 flex-col overflow-hidden rounded-lg bg-[#4B4B4B] sm:col-span-1 sm:h-[360px]">
                        <h4 className="shrink-0 px-4 py-3 text-base font-medium text-white sm:text-lg">Recent Tests</h4>
                        <div className="min-h-0 flex-1 overflow-hidden">
                            <div className="h-full overflow-y-auto px-4 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {dashboardData?.recentTests?.length > 0 ? (
                                    dashboardData.recentTests.map((test) => (
                                        <div
                                            key={test.id}
                                            onClick={() => onViewexam(test)}
                                            className="cursor-pointer border-b border-[#656565] px-2 py-2.5 text-sm text-white last:border-b-0 hover:bg-[#555555] sm:text-base"
                                        >
                                            {test.name}
                                        </div>
                                    ))
                                ) : (
                                    <p className="py-6 text-center text-sm text-gray-400">No recent tests</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex h-[320px] w-full min-w-0 flex-col overflow-hidden rounded-lg bg-[#4B4B4B] sm:col-span-1 sm:h-[360px]">
                        <h4 className="shrink-0 px-4 py-3 text-base font-medium text-white sm:text-lg">Completed Result</h4>
                        <div className="min-h-0 flex-1 overflow-hidden">
                            <div className="h-full overflow-y-auto px-4 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {dashboardData?.completedResults?.length > 0 ? (
                                    dashboardData.completedResults.map((result) => (
                                        <div
                                            key={result.id}
                                            onClick={() => onViewexam(result)}
                                            className="cursor-pointer border-b border-[#656565] px-2 py-2.5 text-sm text-white last:border-b-0 hover:bg-[#555555] sm:text-base"
                                        >
                                            {result.name}
                                        </div>
                                    ))
                                ) : (
                                    <p className="py-6 text-center text-sm text-gray-400">No completed results</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex h-[320px] w-full min-w-0 flex-col overflow-hidden rounded-lg bg-[#4B4B4B] sm:col-span-2 sm:h-[360px] lg:col-span-1">
                        <h4 className="shrink-0 px-4 py-3 text-base font-medium text-white sm:text-lg">Notifications</h4>
                        <div className="min-h-0 flex-1 overflow-hidden">
                            <div className="h-full overflow-y-auto px-4 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                                {dashboardData?.notifications?.length > 0 ? (
                                    dashboardData.notifications.map((notification, index) => (
                                        <div key={index} className="border-b border-[#656565] px-2 py-2.5 text-sm text-white last:border-b-0 sm:text-base">
                                            {notification.title}: {notification.message}
                                        </div>
                                    ))
                                ) : (
                                    <p className="py-6 text-center text-sm text-gray-400">No notifications</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
