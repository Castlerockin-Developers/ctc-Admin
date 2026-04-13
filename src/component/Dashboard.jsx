import React, { useState, useCallback, useMemo, useId } from "react";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import { log, error as logError } from "../utils/logger";
import { FaTimes } from "react-icons/fa";
import { authFetch, SESSION_EXPIRED_MESSAGE } from "../scripts/AuthProvider";
import Spinner from "../loader/Spinner";
import { useCache } from "../hooks/useCache";

const ANALYTICS_EXPORTS_KEY = "ctc_admin_analytics_exports_v1";

function loadStoredExports() {
    try {
        const raw = localStorage.getItem(ANALYTICS_EXPORTS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function persistExports(items) {
    try {
        localStorage.setItem(ANALYTICS_EXPORTS_KEY, JSON.stringify(items.slice(0, 12)));
    } catch {
        /* ignore quota */
    }
}

const BAR_GRADIENTS = {
    purple: "from-[#5b4fd9] via-[#7c6cf0] to-[#A294F9] shadow-[0_0_20px_rgba(162,148,249,0.25)]",
    teal: "from-[#0f766e] via-[#14b8a6] to-[#2dd4bf] shadow-[0_0_18px_rgba(45,212,191,0.2)]",
    slate: "from-[#334155] via-[#64748b] to-[#94a3b8] shadow-[0_0_14px_rgba(148,163,184,0.15)]",
};

const AnalyticsBarChart = ({ bars, variant = "purple", valueSuffix = "", emptyMessage }) => {
    const max = useMemo(() => Math.max(1, ...bars.map((b) => b.value)), [bars]);
    const grad = BAR_GRADIENTS[variant] || BAR_GRADIENTS.purple;

    if (!bars.length) {
        return (
            <div className="flex h-52 items-center justify-center rounded-lg bg-[#353535]/80 text-sm text-gray-500">
                {emptyMessage || "No data"}
            </div>
        );
    }

    const allZero = bars.every((b) => Number(b.value) === 0);
    if (allZero && emptyMessage) {
        return (
            <div className="flex h-52 items-center justify-center rounded-lg bg-[#353535]/80 text-sm text-gray-500">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="flex h-52 items-end gap-1.5 px-1 sm:gap-2 sm:px-3">
            {bars.map((b, i) => {
                const hPct = Math.max(2, (Number(b.value) / max) * 100);
                return (
                    <div key={`${b.label}-${i}`} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                        <div className="flex h-44 w-full items-end justify-center">
                            <div
                                className={`w-full max-w-[44px] rounded-t-md bg-gradient-to-t ${grad}`}
                                style={{ height: `${hPct}%` }}
                                title={`${b.label}: ${b.value}${valueSuffix}`}
                            />
                        </div>
                        <span className="line-clamp-2 max-w-full px-0.5 text-center text-[10px] leading-tight text-gray-500 sm:text-xs">
                            {b.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

/** Line + area under curve for CTC band counts (discrete x = score bands). */
const CTCDistributionLineChart = ({ points, valueSuffix = " students", emptyMessage }) => {
    const reactId = useId().replace(/:/g, "");
    const gradLine = `ctc-line-${reactId}`;
    const gradArea = `ctc-area-${reactId}`;

    const vbW = 420;
    const vbH = 228;
    const padL = 40;
    const padR = 16;
    const padT = 12;
    const padB = 40;

    const max = useMemo(() => Math.max(1, ...(points || []).map((p) => Number(p.value))), [points]);

    if (!points?.length) {
        return (
            <div className="flex h-52 items-center justify-center rounded-lg bg-[#353535]/80 text-sm text-gray-500">
                {emptyMessage || "No data"}
            </div>
        );
    }

    const allZero = points.every((p) => Number(p.value) === 0);
    if (allZero && emptyMessage) {
        return (
            <div className="flex h-52 items-center justify-center rounded-lg bg-[#353535]/80 text-sm text-gray-500">
                {emptyMessage}
            </div>
        );
    }

    const innerW = vbW - padL - padR;
    const innerH = vbH - padT - padB;
    const n = points.length;

    const coords = points.map((p, i) => {
        const x = n === 1 ? padL + innerW / 2 : padL + (i / (n - 1)) * innerW;
        const v = Number(p.value);
        const y = vbH - padB - (v / max) * innerH;
        return { x, y, label: p.label, v };
    });

    const linePath = coords
        .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
        .join(" ");

    const first = coords[0];
    const last = coords[coords.length - 1];
    const areaPath = [
        `M ${first.x.toFixed(2)} ${vbH - padB}`,
        `L ${first.x.toFixed(2)} ${first.y.toFixed(2)}`,
        ...coords.slice(1).map((c) => `L ${c.x.toFixed(2)} ${c.y.toFixed(2)}`),
        `L ${last.x.toFixed(2)} ${vbH - padB}`,
        "Z",
    ].join(" ");

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = vbH - padB - t * innerH;
        const val = Math.round(max * t);
        return { y, val, t };
    });

    return (
        <div className="w-full">
            <svg
                viewBox={`0 0 ${vbW} ${vbH}`}
                className="h-56 w-full overflow-visible"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="CTC score distribution line chart"
            >
                <defs>
                    <linearGradient id={gradLine} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0f766e" />
                        <stop offset="50%" stopColor="#14b8a6" />
                        <stop offset="100%" stopColor="#2dd4bf" />
                    </linearGradient>
                    <linearGradient id={gradArea} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(212, 170, 241)" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="rgb(156, 30, 240)" stopOpacity="0.02" />
                    </linearGradient>
                </defs>

                {yTicks.map(({ y, val, t }) => (
                    <g key={t}>
                        <line
                            x1={padL}
                            x2={vbW - padR}
                            y1={y}
                            y2={y}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="1"
                        />
                        <text
                            x={padL - 6}
                            y={y + 4}
                            textAnchor="end"
                            fill="#6b7280"
                            fontSize="10"
                            className="tabular-nums"
                        >
                            {val}
                        </text>
                    </g>
                ))}

                <path d={areaPath} fill={`url(#${gradArea})`} stroke="none" />

                <path
                    d={linePath}
                    fill="none"
                    stroke={`url(#${gradLine})`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: "drop-shadow(0 0 6px rgba(45,212,191,0.35))" }}
                />

                {coords.map((c, i) => (
                    <g key={`${c.label}-${i}`}>
                        <circle
                            cx={c.x}
                            cy={c.y}
                            r="5"
                            fill="#134e4a"
                            stroke="#2dd4bf"
                            strokeWidth="2"
                        >
                            <title>{`${c.label}: ${c.v}${valueSuffix}`}</title>
                        </circle>
                        <text
                            x={c.x}
                            y={vbH - 10}
                            textAnchor="middle"
                            fill="#9ca3af"
                            fontSize="11"
                            fontWeight="500"
                        >
                            {c.label}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

/** Time series of numeric values; `value` may be null — line breaks across gaps. */
const PerformanceHistoryLineChart = ({ points, valueSuffix = " marks", emptyMessage }) => {
    const reactId = useId().replace(/:/g, "");
    const gradLine = `perf-line-${reactId}`;
    const gradArea = `perf-area-${reactId}`;

    const vbW = 420;
    const vbH = 228;
    const padL = 44;
    const padR = 16;
    const padT = 12;

    const numericValues = useMemo(
        () =>
            (points || [])
                .map((p) => p.value)
                .filter((v) => v != null && !Number.isNaN(Number(v)))
                .map(Number),
        [points],
    );
    const max = useMemo(() => Math.max(1, ...numericValues), [numericValues]);

    if (!points?.length) {
        return (
            <div className="flex h-52 items-center justify-center rounded-lg bg-[#353535]/80 text-sm text-gray-500">
                {emptyMessage || "No data"}
            </div>
        );
    }

    if (numericValues.length === 0 && emptyMessage) {
        return (
            <div className="flex h-52 items-center justify-center rounded-lg bg-[#353535]/80 text-sm text-gray-500">
                {emptyMessage}
            </div>
        );
    }

    const n = points.length;
    const tiltLabels = n > 10;
    const padB = tiltLabels ? 56 : 40;

    const innerW = vbW - padL - padR;
    const innerH = vbH - padT - padB;

    const coords = points.map((p, i) => {
        const x = n === 1 ? padL + innerW / 2 : padL + (i / (n - 1)) * innerW;
        if (p.value == null) {
            return { x, y: null, label: p.label, v: null, studentCount: p.student_count };
        }
        const v = Number(p.value);
        const y = vbH - padB - (v / max) * innerH;
        return { x, y, label: p.label, v, studentCount: p.student_count };
    });

    const segments = [];
    let cur = [];
    for (const c of coords) {
        if (c.y != null) cur.push(c);
        else if (cur.length) {
            segments.push(cur);
            cur = [];
        }
    }
    if (cur.length) segments.push(cur);

    const lineD = segments
        .map((seg) => seg.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`).join(" "))
        .join(" ");

    const areaDs = segments.map((seg) => {
        const first = seg[0];
        const last = seg[seg.length - 1];
        return [
            `M ${first.x.toFixed(2)} ${vbH - padB}`,
            ...seg.map((c) => `L ${c.x.toFixed(2)} ${c.y.toFixed(2)}`),
            `L ${last.x.toFixed(2)} ${vbH - padB}`,
            "Z",
        ].join(" ");
    });

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
        const y = vbH - padB - t * innerH;
        const val = Math.round(max * t);
        return { y, val, t };
    });

    return (
        <div className="w-full">
            <svg
                viewBox={`0 0 ${vbW} ${vbH}`}
                className="h-56 w-full overflow-visible"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label="Exam marks over time chart"
            >
                <defs>
                    <linearGradient id={gradLine} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#475569" />
                        <stop offset="50%" stopColor="#64748b" />
                        <stop offset="100%" stopColor="#94a3b8" />
                    </linearGradient>
                    <linearGradient id={gradArea} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgb(148,163,184)" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="rgb(51,65,85)" stopOpacity="0.04" />
                    </linearGradient>
                </defs>

                {yTicks.map(({ y, val, t }) => (
                    <g key={t}>
                        <line
                            x1={padL}
                            x2={vbW - padR}
                            y1={y}
                            y2={y}
                            stroke="rgba(255,255,255,0.06)"
                            strokeWidth="1"
                        />
                        <text
                            x={padL - 6}
                            y={y + 4}
                            textAnchor="end"
                            fill="#6b7280"
                            fontSize="10"
                            className="tabular-nums"
                        >
                            {val}
                        </text>
                    </g>
                ))}

                {areaDs.map((d, i) => (
                    <path key={i} d={d} fill={`url(#${gradArea})`} stroke="none" />
                ))}

                <path
                    d={lineD}
                    fill="none"
                    stroke={`url(#${gradLine})`}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: "drop-shadow(0 0 5px rgba(148,163,184,0.25))" }}
                />

                {coords.map((c, i) => (
                    <g key={`${c.label}-${i}`}>
                        {c.y != null ? (
                            <circle cx={c.x} cy={c.y} r="5" fill="#1e293b" stroke="#94a3b8" strokeWidth="2">
                                <title>
                                    {c.studentCount != null
                                        ? `${c.label}: ${c.v}${valueSuffix} · ${c.studentCount} student${
                                              c.studentCount === 1 ? "" : "s"
                                          } (each student’s monthly avg, then cohort mean)`
                                        : `${c.label}: ${c.v}${valueSuffix}`}
                                </title>
                            </circle>
                        ) : null}
                        <text
                            x={c.x}
                            y={vbH - (tiltLabels ? 4 : 10)}
                            textAnchor={tiltLabels ? "end" : "middle"}
                            fill="#9ca3af"
                            fontSize={tiltLabels ? 9 : 11}
                            fontWeight="500"
                            transform={
                                tiltLabels
                                    ? `rotate(-42 ${c.x} ${vbH - 4})`
                                    : undefined
                            }
                        >
                            {c.label}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

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
    const navigate = useNavigate();
    const [showPopup, setShowPopup] = useState(false);
    const [showCompletedPopup, setShowCompletedPopup] = useState(false);
    const [recentExports, setRecentExports] = useState(loadStoredExports);

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
            completedResults: responseData.completed_exams,
            userData: responseData.logged_in_user,
            studentAnalytics: responseData.student_analytics ?? null,
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

    const handleExportAnalyticsCsv = useCallback(() => {
        const analytics = dashboardData?.studentAnalytics;
        if (!analytics) return;
        const esc = (c) => `"${String(c ?? "").replace(/"/g, '""')}"`;
        const rows = [
            ["Metric", "Value"],
            ["Total students", analytics.total_students ?? ""],
            ["Avg CTC score (0–10)", analytics.avg_ctc_score ?? ""],
            ["Students with CTC profile", analytics.students_with_ctc_profile ?? ""],
            ["Avg exam marks (MCQ + coding, 30d)", analytics.avg_combined_score_30d ?? ""],
            ["Prior 30d avg", analytics.avg_combined_score_prev_30d ?? ""],
            ["Delta vs prior 30d", analytics.cohort_score_delta ?? ""],
            ["At-risk students (proctoring flags, 30d)", analytics.at_risk_student_count ?? ""],
            ["Malpractice incidents (30d)", analytics.malpractice_incidents_30d ?? ""],
            ["", ""],
            ["Module", "Students (viewed, opened, or started)"],
            ...(analytics.module_attendance || []).map((m) => [m.name || `Module ${m.id}`, m.student_count]),
            ["", ""],
            ["Logged in (7d)", analytics.students_logged_in_7d ?? ""],
            ["Logged in (30d)", analytics.students_logged_in_30d ?? ""],
            ["Distinct submitters (30d)", analytics.distinct_submitters_30d ?? ""],
            ["Inactive students (no login, 30d)", analytics.students_inactive_30d ?? ""],
            ["Finished attempts (7d)", analytics.completed_submissions_7d ?? ""],
            ["Students in live exam now", analytics.students_in_live_exam_now ?? ""],
            ["", ""],
            ["Exam", "Participation %", "Attempted", "Completed"],
            ...(analytics.exam_participation || []).map((e) => [
                e.name,
                e.participation_pct,
                e.attempted_count,
                e.completed_count,
            ]),
            ["", ""],
            ["Cohort marks trend (early vs recent months)", analytics.performance_trend_direction ?? ""],
            ["Cohort marks trend delta", analytics.performance_trend_delta ?? ""],
            ["", ""],
            ["Month", "Cohort avg marks (equal weight/student)", "Students assessed that month"],
            ...(analytics.performance_history_chart || []).map((w) => [
                w.label,
                w.value ?? "",
                w.student_count ?? "",
            ]),
        ];
        const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const stamp = new Date().toISOString().slice(0, 10);
        const filename = `student-analytics-${stamp}.csv`;
        saveAs(blob, filename);
        const entry = {
            id: `${Date.now()}`,
            title: `Org analytics · ${analytics.total_students ?? 0} learners`,
            format: "csv",
            filename,
            at: new Date().toISOString(),
        };
        setRecentExports((prev) => {
            const next = [entry, ...prev.filter((e) => e.filename !== filename)].slice(0, 12);
            persistExports(next);
            return next;
        });
    }, [dashboardData]);

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

                {/* Student analytics — layout aligned with product preview (KPIs, readiness chart, exports) */}
                <div className="flex w-full flex-col gap-5">
                    <p className="text-xs font-medium tracking-widest text-gray-500 uppercase">Student analytics</p>

                    {sa ? (
                        <>
                            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="rounded-xl border border-white/10 bg-[#3a3a3a] px-5 py-5 shadow-inner">
                                    <p className="text-sm text-gray-400">Avg CTC score</p>
                                    <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-white">
                                        {sa.avg_ctc_score != null ? sa.avg_ctc_score : "—"}
                                    </p>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Scale 0–10 ·{" "}
                                        {sa.students_with_ctc_profile != null && sa.total_students != null
                                            ? `${sa.students_with_ctc_profile} of ${sa.total_students} with a CTC profile`
                                            : "Gamified score from ranked & contest activity"}
                                    </p>
                                    {sa.avg_combined_score_30d != null ? (
                                        <div className="mt-2 border-t border-white/10 pt-2 text-xs text-gray-500">
                                            {sa.avg_combined_score_prev_30d != null ? (
                                                <p>
                                                    Prior 30d avg:{" "}
                                                    <span className="font-medium text-gray-300">
                                                        {sa.avg_combined_score_prev_30d}
                                                    </span>
                                                </p>
                                            ) : null}
                                            <p className={sa.avg_combined_score_prev_30d != null ? "mt-1" : ""}>
                                                Avg exam marks (30d):{" "}
                                                <span className="font-medium text-gray-300">
                                                    {sa.avg_combined_score_30d}
                                                </span>
                                                {sa.cohort_score_delta != null ? (
                                                    <span
                                                        className={
                                                            sa.cohort_score_delta >= 0
                                                                ? " text-emerald-400"
                                                                : " text-rose-400"
                                                        }
                                                    >
                                                        {" "}
                                                        ({sa.cohort_score_delta >= 0 ? "+" : ""}
                                                        {sa.cohort_score_delta} vs prior 30d)
                                                    </span>
                                                ) : null}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="mt-2 border-t border-white/10 pt-2 text-xs text-gray-600">
                                            {sa.avg_combined_score_prev_30d != null ? (
                                                <p className="text-gray-500">
                                                    Prior 30d avg:{" "}
                                                    <span className="font-medium text-gray-300">
                                                        {sa.avg_combined_score_prev_30d}
                                                    </span>
                                                </p>
                                            ) : null}
                                            <p className={sa.avg_combined_score_prev_30d != null ? "mt-1" : ""}>
                                                No completed attempts in the last 30 days for exam mark averages.
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="rounded-xl border border-white/10 bg-[#3a3a3a] px-5 py-5 shadow-inner">
                                    <p className="text-sm text-gray-400">At risk</p>
                                    <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-amber-300">
                                        {sa.at_risk_student_count ?? "—"}
                                    </p>
                                    <p className="mt-2 text-sm text-gray-500">Students with proctoring flags (30d)</p>
                                </div>
                                <div className="flex min-h-[12rem] flex-col rounded-xl border border-white/10 bg-[#3a3a3a] px-5 py-5 shadow-inner">
                                    <p className="text-sm text-gray-400">Module attendance</p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Org students who viewed, opened, or started each module (Skill Center).
                                        Includes global courses, your org’s custom modules, and modules assigned to
                                        your students.
                                    </p>
                                    <ul className="mt-3 max-h-64 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 text-sm [scrollbar-width:thin]">
                                        {(sa.module_attendance || []).length > 0 ? (
                                            (sa.module_attendance || []).map((m) => (
                                                <li
                                                    key={m.id}
                                                    className="flex items-baseline justify-between gap-2 border-b border-white/5 pb-2 last:border-0 last:pb-0"
                                                >
                                                    <span className="min-w-0 truncate text-gray-200" title={m.name}>
                                                        {m.name || `Module ${m.id}`}
                                                    </span>
                                                    <span
                                                        className={`shrink-0 tabular-nums font-semibold ${
                                                            m.student_count > 0 ? "text-[#A294F9]" : "text-gray-500"
                                                        }`}
                                                    >
                                                        {m.student_count}
                                                    </span>
                                                </li>
                                            ))
                                        ) : (
                                            <li className="text-gray-500">
                                                No learning modules available for your organization.
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <p className="text-xs font-medium tracking-widest text-gray-500 uppercase">
                                    Cohort activity
                                </p>
                                <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                                    <div className="min-w-0 rounded-xl border border-white/10 bg-[#3a3a3a] px-4 py-4 shadow-inner">
                                        <p className="text-xs text-gray-400">Logged in (7d)</p>
                                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
                                            {sa.students_logged_in_7d ?? "—"}
                                        </p>
                                        <p className="mt-1 text-[11px] leading-snug text-gray-500 sm:text-xs">
                                            Unique students · last 7 days
                                        </p>
                                    </div>
                                    <div className="min-w-0 rounded-xl border border-white/10 bg-[#3a3a3a] px-4 py-4 shadow-inner">
                                        <p className="text-xs text-gray-400">Logged in (30d)</p>
                                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
                                            {sa.students_logged_in_30d ?? "—"}
                                        </p>
                                        <p className="mt-1 text-[11px] leading-snug text-gray-500 sm:text-xs">
                                            Unique students · last 30 days
                                        </p>
                                    </div>
                                    <div className="min-w-0 rounded-xl border border-white/10 bg-[#3a3a3a] px-4 py-4 shadow-inner">
                                        <p className="text-xs text-gray-400">Inactive (30d)</p>
                                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
                                            {sa.students_inactive_30d ?? "—"}
                                        </p>
                                        <p className="mt-1 text-[11px] leading-snug text-gray-500 sm:text-xs">
                                            No login in 30 days
                                        </p>
                                    </div>
                                    <div className="min-w-0 rounded-xl border border-white/10 bg-[#3a3a3a] px-4 py-4 shadow-inner">
                                        <p className="text-xs text-gray-400">Finished attempts (7d)</p>
                                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
                                            {sa.completed_submissions_7d ?? "—"}
                                        </p>
                                        <p className="mt-1 text-[11px] leading-snug text-gray-500 sm:text-xs">
                                            Completed exam submissions
                                        </p>
                                    </div>
                                    <div className="min-w-0 rounded-xl border border-white/10 bg-[#3a3a3a] px-4 py-4 shadow-inner">
                                        <p className="text-xs text-gray-400">Distinct submitters (30d)</p>
                                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
                                            {sa.distinct_submitters_30d ?? "—"}
                                        </p>
                                        <p className="mt-1 text-[11px] leading-snug text-gray-500 sm:text-xs">
                                            ≥1 finished attempt
                                        </p>
                                    </div>
                                    <div className="min-w-0 rounded-xl border border-white/10 bg-[#3a3a3a] px-4 py-4 shadow-inner">
                                        <p className="text-xs text-gray-400">In exam now</p>
                                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
                                            {sa.students_in_live_exam_now ?? "—"}
                                        </p>
                                        <p className="mt-1 text-[11px] leading-snug text-gray-500 sm:text-xs">
                                            Active attempts, live window
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
                                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#3a3a3a]">
                                    <div className="border-b border-white/10 px-5 py-4">
                                        <h3 className="text-base font-medium text-white">CTC score distribution</h3>
                                        <p className="text-xs text-gray-500">Students per band (org cohort)</p>
                                    </div>
                                    <div className="px-3 py-5 sm:px-5">
                                        <CTCDistributionLineChart
                                            points={sa.ctc_distribution_chart || []}
                                            valueSuffix=" students"
                                            emptyMessage="No CTC score profiles for this organization yet."
                                        />
                                    </div>
                                </div>
                                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#3a3a3a]">
                                    <div className="border-b border-white/10 px-5 py-4">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <h3 className="text-base font-medium text-white">All students — marks &amp; improvement</h3>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    Each month we average <span className="text-gray-400">MCQ + coding</span> per
                                                    student (finished attempts only), then average across{" "}
                                                    <span className="text-gray-400">all students who assessed that month</span> so
                                                    everyone counts equally. Timeline:{" "}
                                                    <span className="text-gray-400">first org assessment through today</span>. The
                                                    badge compares <span className="text-gray-400">early months vs recent months</span>{" "}
                                                    to signal improvement.
                                                </p>
                                                {sa.performance_history_chart?.length === 1 ? (
                                                    <p className="mt-1.5 text-xs text-amber-200/90">
                                                        One month on file — the line fills in as more months arrive, then the
                                                        improvement trend activates.
                                                    </p>
                                                ) : null}
                                            </div>
                                            {sa.performance_trend_direction === "up" ? (
                                                <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                                                    Trend: improving
                                                    {sa.performance_trend_delta != null
                                                        ? ` (+${sa.performance_trend_delta})`
                                                        : ""}
                                                </span>
                                            ) : sa.performance_trend_direction === "down" ? (
                                                <span className="shrink-0 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-400">
                                                    Trend: declining
                                                    {sa.performance_trend_delta != null ? ` (${sa.performance_trend_delta})` : ""}
                                                </span>
                                            ) : sa.performance_trend_direction === "steady" ? (
                                                <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-gray-400">
                                                    Trend: steady
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="px-3 py-5 sm:px-5">
                                        <PerformanceHistoryLineChart
                                            points={sa.performance_history_chart || []}
                                            valueSuffix=" marks"
                                            emptyMessage="No finished exam attempts yet — the line will appear once students submit."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#3a3a3a]">
                                <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h3 className="text-lg font-medium text-white">
                                            Placement readiness
                                            {sa.primary_batch != null ? ` · Batch ${sa.primary_batch}` : ""}
                                        </h3>
                                        <p className="text-xs text-gray-500">Share of org students who started each recent exam</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleExportAnalyticsCsv}
                                        className="shrink-0 text-sm font-medium text-[#A294F9] underline-offset-4 hover:underline"
                                    >
                                        Export CSV
                                    </button>
                                </div>
                                <div className="px-3 py-5 sm:px-5">
                                    <AnalyticsBarChart
                                        bars={sa.readiness_chart || []}
                                        variant="purple"
                                        valueSuffix="%"
                                        emptyMessage="Add exams to see participation across your cohort"
                                    />
                                </div>
                                <div className="border-t border-white/10 px-5 py-3">
                                    <p className="text-xs text-gray-500">
                                        Tap an exam in Manage Exams for full breakdown. Bars use the same participation % as the
                                        export.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-[#3a3a3a] px-5 py-4">
                                <h3 className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Recent exports</h3>
                                {recentExports.length === 0 ? (
                                    <p className="mt-3 text-sm text-gray-500">CSV downloads from this dashboard will appear here.</p>
                                ) : (
                                    <ul className="mt-3 divide-y divide-white/10">
                                        {recentExports.slice(0, 5).map((ex) => (
                                            <li key={ex.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0">
                                                <span className="text-sm text-white">{ex.title}</span>
                                                <span className="text-xs tabular-nums text-gray-500">
                                                    .{ex.format} · {new Date(ex.at).toLocaleString()}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="rounded-xl border border-dashed border-white/20 bg-[#3a3a3a]/50 px-6 py-10 text-center text-sm text-gray-400">
                            Student analytics require an updated API. Deploy the latest backend with{" "}
                            <code className="rounded bg-black/30 px-1.5 py-0.5 text-gray-300">student_analytics</code> on{" "}
                            <code className="rounded bg-black/30 px-1.5 py-0.5 text-gray-300">/admin/home/</code>.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
