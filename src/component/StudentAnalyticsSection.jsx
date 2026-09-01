import React, { useMemo, useId, useState, useEffect, useCallback } from "react";
import { FaInfoCircle, FaSlidersH } from "react-icons/fa";

/**
 * Theme-matched info tooltip (hover + keyboard focus).
 * `align="end"`: anchor to the icon's right edge so the panel grows leftward.
 */
function InfoTooltip({ label, children, align = "start" }) {
    const position = align === "end" ? "right-0 left-auto" : "left-0";
    return (
        <span className="group relative inline-flex align-middle">
            <button
                type="button"
                className="inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#5a5a5a] bg-[#404040] text-[#b4a9f5] transition-colors hover:border-[#A294F9]/55 hover:bg-[#4a4a4a] hover:text-[#ddd6fe] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A294F9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#3a3a3a]"
                aria-label={label}
            >
                <FaInfoCircle className="h-3 w-3" aria-hidden />
            </button>
            <span
                role="tooltip"
                className={`pointer-events-none invisible absolute top-full z-[200] mt-2 w-max max-w-[min(22rem,calc(100vw-1.5rem))] break-words rounded-lg border border-[#555] bg-[#2a2a2a] px-3 py-2.5 text-left text-xs leading-relaxed text-gray-300 shadow-xl ring-1 ring-black/30 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${position}`}
            >
                {children}
            </span>
        </span>
    );
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
            <div className="flex h-52 items-center justify-center rounded-lg bg-[#353535]/80 text-sm text-white">
                {emptyMessage || "No data"}
            </div>
        );
    }

    const allZero = bars.every((b) => Number(b.value) === 0);
    if (allZero && emptyMessage) {
        return (
            <div className="flex h-52 items-center justify-center rounded-lg bg-[#353535]/80 text-sm text-white">
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
                        <span className="line-clamp-2 max-w-full px-0.5 text-center text-[10px] leading-tight text-white sm:text-xs">
                            {b.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

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
            <div className="flex h-52 items-center justify-center rounded-lg bg-[#353535]/80 text-sm text-white">
                {emptyMessage || "No data"}
            </div>
        );
    }

    const allZero = points.every((p) => Number(p.value) === 0);
    if (allZero && emptyMessage) {
        return (
            <div className="flex h-52 items-center justify-center rounded-lg bg-[#353535]/80 text-sm text-white">
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
                            fill="#ffffff"
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
                        <circle cx={c.x} cy={c.y} r="5" fill="#134e4a" stroke="#2dd4bf" strokeWidth="2">
                            <title>{`${c.label}: ${c.v}${valueSuffix}`}</title>
                        </circle>
                        <text
                            x={c.x}
                            y={vbH - 10}
                            textAnchor="middle"
                            fill="#ffffff"
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
            <div className="flex h-52 items-center justify-center rounded-lg bg-[#353535]/80 text-sm text-white">
                {emptyMessage || "No data"}
            </div>
        );
    }

    if (numericValues.length === 0 && emptyMessage) {
        return (
            <div className="flex h-52 items-center justify-center rounded-lg bg-[#353535]/80 text-sm text-white">
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
                            fill="#ffffff"
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
                                          } (each student's monthly avg, then cohort mean)`
                                        : `${c.label}: ${c.v}${valueSuffix}`}
                                </title>
                            </circle>
                        ) : null}
                        <text
                            x={c.x}
                            y={vbH - (tiltLabels ? 4 : 10)}
                            textAnchor={tiltLabels ? "end" : "middle"}
                            fill="#ffffff"
                            fontSize={tiltLabels ? 9 : 11}
                            fontWeight="500"
                            transform={tiltLabels ? `rotate(-42 ${c.x} ${vbH - 4})` : undefined}
                        >
                            {c.label}
                        </text>
                    </g>
                ))}
            </svg>
        </div>
    );
};

const PIE_PALETTE = ["#A294F9", "#2dd4bf", "#fb7185", "#fbbf24", "#60a5fa", "#34d399", "#f472b6", "#94a3b8"];

function polarToCartesian(cx, cy, r, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeDonutSlice(cx, cy, rOuter, rInner, startAngle, endAngle) {
    const sweep = endAngle - startAngle;
    if (sweep >= 359.999) {
        return [
            `M ${cx} ${cy - rOuter}`,
            `A ${rOuter} ${rOuter} 0 1 1 ${cx} ${cy + rOuter}`,
            `A ${rOuter} ${rOuter} 0 1 1 ${cx} ${cy - rOuter}`,
            `M ${cx} ${cy - rInner}`,
            `A ${rInner} ${rInner} 0 1 0 ${cx} ${cy + rInner}`,
            `A ${rInner} ${rInner} 0 1 0 ${cx} ${cy - rInner}`,
        ].join(" ");
    }
    const large = sweep > 180 ? 1 : 0;
    const p1 = polarToCartesian(cx, cy, rOuter, endAngle);
    const p2 = polarToCartesian(cx, cy, rOuter, startAngle);
    const p3 = polarToCartesian(cx, cy, rInner, startAngle);
    const p4 = polarToCartesian(cx, cy, rInner, endAngle);
    return [
        `M ${p1.x.toFixed(3)} ${p1.y.toFixed(3)}`,
        `A ${rOuter} ${rOuter} 0 ${large} 0 ${p2.x.toFixed(3)} ${p2.y.toFixed(3)}`,
        `L ${p3.x.toFixed(3)} ${p3.y.toFixed(3)}`,
        `A ${rInner} ${rInner} 0 ${large} 1 ${p4.x.toFixed(3)} ${p4.y.toFixed(3)}`,
        "Z",
    ].join(" ");
}

function splitCount(took, total) {
    const t = Math.max(0, Number(took) || 0);
    const n = Math.max(0, Number(total) || 0);
    const did = Math.max(0, n - t);
    return { took: Math.min(t, n), didNot: did, total: n };
}

function AnalyticsPieChart({ slices, emptyMessage, size = "md", centerLabel = "Students" }) {
    const mapped = useMemo(
        () =>
            (slices || []).map((s) => ({
                label: s.label,
                value: Math.max(0, Number(s.value) || 0),
                color: s.color,
            })),
        [slices]
    );
    const total = useMemo(() => mapped.reduce((sum, s) => sum + s.value, 0), [mapped]);
    const dim = size === "sm" ? 132 : 176;
    const cx = dim / 2;
    const cy = dim / 2;
    const rOuter = size === "sm" ? 54 : 74;
    const rInner = size === "sm" ? 32 : 44;

    if (!slices?.length || total <= 0) {
        return (
            <div className="flex h-44 items-center justify-center rounded-lg bg-[#353535]/80 text-sm text-white">
                {emptyMessage || "No data"}
            </div>
        );
    }

    let cursor = 0;
    const arcs = mapped.map((s) => {
        const start = (cursor / total) * 360;
        cursor += s.value;
        const end = s.value === 0 ? start : (cursor / total) * 360;
        return { ...s, start, end, pct: Math.round((s.value / total) * 1000) / 10 };
    });

    return (
        <div className={`flex ${size === "sm" ? "flex-col items-center gap-3" : "flex-col items-center gap-4 sm:flex-row sm:items-center"}`}>
            <svg
                viewBox={`0 0 ${dim} ${dim}`}
                className={size === "sm" ? "h-32 w-32 shrink-0" : "h-44 w-44 shrink-0"}
                role="img"
                aria-label={arcs.map((a) => `${a.label} ${a.value}`).join(", ")}
            >
                {arcs.map((a, i) =>
                    a.value <= 0 ? null : (
                    <path
                        key={`${a.label}-${i}`}
                        d={describeDonutSlice(cx, cy, rOuter, rInner, a.start, a.end)}
                        fill={a.color || PIE_PALETTE[i % PIE_PALETTE.length]}
                        fillRule="evenodd"
                    >
                        <title>{`${a.label}: ${a.value} (${a.pct}%)`}</title>
                    </path>
                    )
                )}
                <text
                    x={cx}
                    y={cy - 6}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={size === "sm" ? 16 : 20}
                    fontWeight="700"
                    className="tabular-nums"
                >
                    {total}
                </text>
                <text x={cx} y={cy + 12} textAnchor="middle" fill="#9ca3af" fontSize={size === "sm" ? 8 : 10}>
                    {centerLabel}
                </text>
            </svg>
            <ul className={`min-w-0 ${size === "sm" ? "w-full space-y-1" : "flex-1 space-y-2"}`}>
                {arcs.map((a, i) => (
                    <li key={`${a.label}-${i}`} className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex min-w-0 items-center gap-2 text-white">
                            <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: a.color || PIE_PALETTE[i % PIE_PALETTE.length] }}
                            />
                            <span className="truncate">{a.label}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-gray-300">
                            {a.value} · {a.pct}%
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function PieChartCard({ title, subtitle, slices, emptyMessage, size = "md", centerLabel, headerExtra = null }) {
    return (
        <div className="min-w-0 overflow-hidden rounded-xl border border-[#5a5a5a] bg-[#3a3a3a]">
            <div className="border-b border-[#5a5a5a] px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-base font-medium text-white">{title}</h3>
                        {subtitle ? <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p> : null}
                    </div>
                    {headerExtra}
                </div>
            </div>
            <div className="px-4 py-4 sm:px-5 sm:py-5">
                <AnalyticsPieChart
                    slices={slices}
                    emptyMessage={emptyMessage}
                    size={size}
                    centerLabel={centerLabel}
                />
            </div>
        </div>
    );
}

const CHART_VIS_KEY = "ctc_admin_analytics_chart_vis_v1";

const DEFAULT_CHART_VIS = {
    kpis: true,
    activity: true,
    pieTookExam: true,
    pieCompleted30d: true,
    pieLogin: true,
    pieCtc: true,
    pieRisk: true,
    piePerExam: true,
    ctcDistribution: true,
    performanceHistory: true,
    placementReadiness: true,
    pieCourseStarted: true,
    pieCourseShare: true,
    courseReach: true,
    dailyAttendance: true,
};

const EXAM_CHART_TOGGLES = [
    { id: "kpis", label: "Score & risk" },
    { id: "activity", label: "Exam activity" },
    { id: "pieTookExam", label: "Took exam" },
    { id: "pieCompleted30d", label: "Completed (30d)" },
    { id: "pieLogin", label: "Logged in" },
    { id: "pieCtc", label: "CTC profiles" },
    { id: "pieRisk", label: "At risk" },
    { id: "piePerExam", label: "Per-exam pies" },
    { id: "ctcDistribution", label: "CTC distribution" },
    { id: "performanceHistory", label: "Marks over time" },
    { id: "placementReadiness", label: "Placement readiness" },
];

const COURSE_CHART_TOGGLES = [
    { id: "pieCourseStarted", label: "Started a course" },
    { id: "pieCourseShare", label: "Course mix" },
    { id: "courseReach", label: "Course reach" },
    { id: "dailyAttendance", label: "Daily attendance" },
];

function readChartVis() {
    try {
        const raw = localStorage.getItem(CHART_VIS_KEY);
        if (!raw) return { ...DEFAULT_CHART_VIS };
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_CHART_VIS, ...parsed };
    } catch {
        return { ...DEFAULT_CHART_VIS };
    }
}

function ChartVisibilityBar({ defs, vis, onToggle, onShowAll, onHideAll }) {
    const [open, setOpen] = useState(false);
    const enabledCount = defs.filter((d) => vis[d.id] !== false).length;

    return (
        <div className="rounded-xl border border-[#5a5a5a] bg-[#353535]">
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-white hover:bg-[#404040]"
                    aria-expanded={open}
                >
                    <FaSlidersH className="h-3.5 w-3.5 text-[#A294F9]" aria-hidden />
                    Customize charts
                    <span className="text-xs font-normal text-gray-400">
                        {enabledCount}/{defs.length} shown
                    </span>
                </button>
                <div className="flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={onShowAll}
                        className="rounded-md px-2 py-1 text-xs text-gray-300 hover:bg-[#404040] hover:text-white"
                    >
                        Show all
                    </button>
                    <button
                        type="button"
                        onClick={onHideAll}
                        className="rounded-md px-2 py-1 text-xs text-gray-300 hover:bg-[#404040] hover:text-white"
                    >
                        Hide all
                    </button>
                </div>
            </div>
            {open ? (
                <div className="flex flex-wrap gap-1.5 border-t border-[#5a5a5a] px-3 py-3 sm:px-4">
                    {defs.map((d) => {
                        const on = vis[d.id] !== false;
                        return (
                            <button
                                key={d.id}
                                type="button"
                                role="switch"
                                aria-checked={on}
                                onClick={() => onToggle(d.id)}
                                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                                    on
                                        ? "border-[#A294F9]/70 bg-[#A294F9]/20 text-white"
                                        : "border-[#5a5a5a] bg-[#2f2f2f] text-gray-400 hover:text-gray-200"
                                }`}
                            >
                                {d.label}
                            </button>
                        );
                    })}
                </div>
            ) : null}
        </div>
    );
}

function formatAttendanceDate(isoDate) {
    if (!isoDate) return "";
    try {
        const [y, m, d] = String(isoDate).split("-").map(Number);
        return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return isoDate;
    }
}

function ProgressBar({ percent, className = "" }) {
    const pct = Math.max(0, Math.min(100, Number(percent) || 0));
    const fill =
        pct >= 100 ? "bg-emerald-400" : pct > 0 ? "bg-[#A294F9]" : "bg-white/20";
    return (
        <div className={`h-1.5 w-full overflow-hidden rounded-full bg-white/10 ${className}`}>
            <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

function normalizeCourse(c) {
    return typeof c === "string" ? { name: c } : c || {};
}

function isStartedCourse(c) {
    const course = normalizeCourse(c);
    if (course.status === "in_progress" || course.status === "complete") return true;
    return (Number(course.chapters_completed) || 0) > 0;
}

function courseFilterKey(c) {
    const course = normalizeCourse(c);
    if (course.id != null && course.id !== "") return `id:${course.id}`;
    return `name:${course.name || ""}`;
}

function buildCourseFilterOptions({ assignedCourses = [], modules = [], extraCourses = [] } = {}) {
    const map = new Map();
    const add = (course, { is_assigned = false } = {}) => {
        const normalized = normalizeCourse(course);
        const key = courseFilterKey(normalized);
        if (!key || key === "id:" || key === "name:") return;
        const existing = map.get(key);
        if (!existing) {
            map.set(key, {
                key,
                name: normalized.name || "Course",
                is_custom: Boolean(normalized.is_custom),
                is_assigned: Boolean(is_assigned || normalized.is_assigned),
            });
        } else if (is_assigned || normalized.is_assigned) {
            existing.is_assigned = true;
        }
    };
    for (const course of assignedCourses) add(course, { is_assigned: true });
    for (const module of modules) add({ id: module.id, name: module.name });
    for (const course of extraCourses) add(course);
    return [...map.values()].sort((a, b) => {
        if (Boolean(a.is_custom) !== Boolean(b.is_custom)) return a.is_custom ? -1 : 1;
        if (Boolean(a.is_assigned) !== Boolean(b.is_assigned)) return a.is_assigned ? -1 : 1;
        return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
    });
}

function courseFilterSelectLabel(course) {
    if (!course) return "All courses";
    if (course.is_custom) return `${course.name} (custom)`;
    if (course.is_assigned) return `${course.name} (assigned)`;
    return course.name;
}

function CourseFilterSelect({ value, onChange, options, className = "" }) {
    const selected = options.find((c) => c.key === value);
    return (
        <label className={`text-xs text-gray-400 ${className}`}>
            Course
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                title={courseFilterSelectLabel(selected) || "All courses"}
                className="ml-2 max-w-[16rem] rounded-lg border border-[#5a5a5a] bg-[#404040] px-2.5 py-1.5 text-sm text-white focus:border-[#A294F9] focus:outline-none focus:ring-1 focus:ring-[#A294F9]"
            >
                <option value="">All courses</option>
                {options.map((c) => (
                    <option key={c.key} value={c.key}>
                        {courseFilterSelectLabel(c)}
                    </option>
                ))}
            </select>
        </label>
    );
}

function startedCoursesFromRow(row) {
    return (row?.courses || []).map(normalizeCourse).filter(isStartedCourse);
}

const COURSE_PROGRESS_MODE_KEY = "ctc_admin_course_progress_mode";

function readStoredProgressMode() {
    try {
        return sessionStorage.getItem(COURSE_PROGRESS_MODE_KEY) === "all" ? "all" : "day";
    } catch {
        return "day";
    }
}

const EMPTY_ASSIGNED_COURSES = [];

function DailyCourseAttendanceTable({ attendance }) {
    const payload = attendance && typeof attendance === "object" ? attendance : {};
    const dayRows = Array.isArray(payload.rows) ? payload.rows : [];
    const allTimeRows = Array.isArray(payload.all_time_rows) ? payload.all_time_rows : [];
    const today = payload.today || "";
    const lookbackDays = payload.lookback_days || 14;

    const [progressMode, setProgressMode] = useState(readStoredProgressMode);
    const [selectedDate, setSelectedDate] = useState(today);
    const [query, setQuery] = useState("");
    const [selectedCourse, setSelectedCourse] = useState("");
    const assignedCourses = Array.isArray(payload.available_courses)
        ? payload.available_courses
        : EMPTY_ASSIGNED_COURSES;
    const isAllTime = progressMode === "all";
    const sourceRows = isAllTime ? allTimeRows : dayRows;

    const selectProgressMode = (mode) => {
        setProgressMode(mode);
        try {
            sessionStorage.setItem(COURSE_PROGRESS_MODE_KEY, mode);
        } catch {
            // ignore quota / private-mode failures
        }
    };

    useEffect(() => {
        if (today) setSelectedDate(today);
    }, [today]);

    const minDate = useMemo(() => {
        if (!today) return "";
        const [y, m, d] = String(today).split("-").map(Number);
        const dt = new Date(y, (m || 1) - 1, d || 1);
        dt.setDate(dt.getDate() - (lookbackDays - 1));
        const yy = dt.getFullYear();
        const mm = String(dt.getMonth() + 1).padStart(2, "0");
        const dd = String(dt.getDate()).padStart(2, "0");
        return `${yy}-${mm}-${dd}`;
    }, [today, lookbackDays]);

    const availableCourses = useMemo(() => {
        const extraCourses = [];
        for (const row of sourceRows) {
            if (!isAllTime && selectedDate && row.date !== selectedDate) continue;
            extraCourses.push(...startedCoursesFromRow(row));
        }
        return buildCourseFilterOptions({ assignedCourses, extraCourses });
    }, [sourceRows, selectedDate, assignedCourses, isAllTime]);

    useEffect(() => {
        if (selectedCourse && !availableCourses.some((c) => c.key === selectedCourse)) {
            setSelectedCourse("");
        }
    }, [availableCourses, selectedCourse]);

    const filteredRows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return sourceRows
            .filter((row) => isAllTime || !selectedDate || row.date === selectedDate)
            .map((row) => {
                let courses = startedCoursesFromRow(row);
                if (selectedCourse) {
                    courses = courses.filter((c) => courseFilterKey(c) === selectedCourse);
                }
                return { ...row, courses, course_count: courses.length };
            })
            .filter((row) => row.course_count > 0)
            .filter((row) => {
                if (!q) return true;
                const courseHay = (row.courses || []).map((c) => c?.name || "").join(" ");
                return [row.name, row.email, row.usn, courseHay]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(q));
            });
    }, [sourceRows, selectedDate, query, selectedCourse, isAllTime]);

    const uniqueStudents = filteredRows.length;
    const totalCourses = filteredRows.reduce((sum, row) => sum + (Number(row.course_count) || 0), 0);

    return (
        <div className="flex flex-col gap-4 px-1 pt-1 pb-6 sm:px-2 sm:pt-2 sm:pb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-medium tracking-widest text-white uppercase">
                        {isAllTime ? "All-time course progress" : "Daily course attendance"}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                        {isAllTime ? (
                            <>
                                Lifetime chapter progress for every student who has{" "}
                                <span className="text-white">started</span> a course. The Course
                                filter lists the <span className="text-white">Skill Center catalog</span>{" "}
                                plus courses <span className="text-white">assigned to this college</span>.
                            </>
                        ) : (
                            <>
                                Students active on{" "}
                                <span className="text-white">
                                    {formatAttendanceDate(selectedDate) || "the selected day"}
                                </span>
                                . Lists only courses they have{" "}
                                <span className="text-white">started</span> — custom courses and other Skill
                                Center courses they opened. The Course filter lists the{" "}
                                <span className="text-white">Skill Center catalog</span> plus courses{" "}
                                <span className="text-white">assigned to this college</span>.
                            </>
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-lg border border-[#5a5a5a] bg-[#353535] p-0.5">
                        <button
                            type="button"
                            onClick={() => selectProgressMode("day")}
                            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                                !isAllTime
                                    ? "bg-[#A294F9] text-white"
                                    : "text-gray-300 hover:bg-[#404040] hover:text-white"
                            }`}
                        >
                            That day
                        </button>
                        <button
                            type="button"
                            onClick={() => selectProgressMode("all")}
                            className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:text-sm ${
                                isAllTime
                                    ? "bg-[#A294F9] text-white"
                                    : "text-gray-300 hover:bg-[#404040] hover:text-white"
                            }`}
                        >
                            All time
                        </button>
                    </div>
                    {!isAllTime ? (
                    <label className="text-xs text-gray-400">
                        Day
                        <input
                            type="date"
                            value={selectedDate}
                            min={minDate}
                            max={today}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="ml-2 rounded-lg border border-[#5a5a5a] bg-[#404040] px-2.5 py-1.5 text-sm text-white focus:border-[#A294F9] focus:outline-none focus:ring-1 focus:ring-[#A294F9]"
                        />
                    </label>
                    ) : null}
                    <CourseFilterSelect
                        value={selectedCourse}
                        onChange={setSelectedCourse}
                        options={availableCourses}
                    />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search student or course"
                        className="w-48 rounded-lg border border-[#5a5a5a] bg-[#404040] px-3 py-1.5 text-sm text-white placeholder:text-gray-500 focus:border-[#A294F9] focus:outline-none focus:ring-1 focus:ring-[#A294F9] sm:w-56"
                    />
                </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-[#5a5a5a] bg-[#3a3a3a]">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#5a5a5a] px-5 py-3.5 text-xs text-gray-400 sm:px-6">
                    <span>
                        <span className="font-semibold tabular-nums text-white">{uniqueStudents}</span>{" "}
                        student{uniqueStudents === 1 ? "" : "s"} ·{" "}
                        <span className="font-semibold tabular-nums text-[#A294F9]">{totalCourses}</span>{" "}
                        course{totalCourses === 1 ? "" : "s"} started
                    </span>
                    <span>{isAllTime ? "Lifetime progress" : `Last ${lookbackDays} days available`}</span>
                </div>
                <div className="max-h-[28rem] overflow-auto pb-3 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent">
                    <table className="min-w-full text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-[#333] text-xs uppercase tracking-wide text-gray-400">
                            <tr>
                                <th className="px-5 py-3 font-medium sm:px-6">Student</th>
                                <th className="px-4 py-3 font-medium">USN</th>
                                <th className="min-w-[9rem] px-4 py-3 font-medium">Progress</th>
                                <th className="px-4 py-3 font-medium">Courses</th>
                                <th className="px-5 py-3 font-medium sm:px-6">Started · result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRows.length > 0 ? (
                                filteredRows.map((row) => {
                                    const courses = row.courses || [];
                                    const progress = Number(row.progress_percent) || 0;
                                    return (
                                        <tr
                                            key={`${row.date || "all"}-${row.user_id}`}
                                            className="border-t border-white/5 align-top"
                                        >
                                            <td className="px-5 py-3.5 sm:px-6">
                                                <p className="font-medium text-white">{row.name || "Student"}</p>
                                                {row.email ? (
                                                    <p className="truncate text-xs text-gray-400">{row.email}</p>
                                                ) : null}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-3.5 text-gray-300">
                                                {row.usn || "—"}
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <p className="tabular-nums text-sm font-semibold text-white">
                                                    {progress}%
                                                </p>
                                                <ProgressBar percent={progress} className="mt-1 w-28" />
                                                <p className="mt-1 text-[11px] text-gray-400">
                                                    {row.chapters_completed ?? 0}/{row.chapters_total ?? 0} chapters
                                                </p>
                                            </td>
                                            <td className="px-4 py-3.5">
                                                <span className="tabular-nums font-semibold text-[#A294F9]">
                                                    {row.course_count ?? 0}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 sm:px-6">
                                                {courses.length ? (
                                                    <ul className="max-h-36 space-y-1.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
                                                        {courses.map((c, i) => {
                                                            const pct = Number(c.progress_percent) || 0;
                                                            const done = c.chapters_completed ?? 0;
                                                            const total = c.chapters_total ?? 0;
                                                            const result =
                                                                c.status === "complete"
                                                                    ? "Completed"
                                                                    : total
                                                                      ? `${done}/${total}`
                                                                      : "No chapters";
                                                            return (
                                                                <li
                                                                    key={c.id || `${c.name}-${i}`}
                                                                    className="min-w-0"
                                                                >
                                                                    <div className="flex items-baseline justify-between gap-3">
                                                                        <span
                                                                            className="min-w-0 truncate text-white"
                                                                            title={c.name}
                                                                        >
                                                                            {c.name || "Course"}
                                                                        </span>
                                                                        <span
                                                                            className={`shrink-0 text-[11px] tabular-nums ${
                                                                                c.status === "complete"
                                                                                    ? "text-emerald-400"
                                                                                    : "text-gray-400"
                                                                            }`}
                                                                        >
                                                                            {result}
                                                                            {total ? ` · ${pct}%` : ""}
                                                                        </span>
                                                                    </div>
                                                                    <ProgressBar percent={pct} className="mt-1" />
                                                                </li>
                                                            );
                                                        })}
                                                    </ul>
                                                ) : (
                                                    "—"
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400 sm:px-6">
                                        No students started
                                        {selectedCourse
                                            ? " this course"
                                            : " a custom or Skill Center course"}
                                        {isAllTime ? " yet." : " on this day."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/**
 * Org-wide or branch-scoped student analytics KPIs and charts (same payload as Dashboard `studentAnalytics`).
 */
const ANALYTICS_REPORT_TAB_KEY = "ctc_admin_analytics_report_tab";

function readStoredReportTab() {
    try {
        const v = sessionStorage.getItem(ANALYTICS_REPORT_TAB_KEY);
        return v === "courses" ? "courses" : "exam";
    } catch {
        return "exam";
    }
}

export default function StudentAnalyticsSection({
    sa,
    pageTitle = null,
    scopeSubtitle = null,
    sectionEyebrow = "Student analytics",
    ctcCohortLabel = "Students per band (org cohort)",
    readinessSubtitle = "Share of org students who started each recent exam",
    headerRight = null,
}) {
    const [reportTab, setReportTab] = useState(readStoredReportTab);
    const [chartVis, setChartVis] = useState(readChartVis);
    const containerClass = pageTitle
        ? "flex h-[87vh] min-h-[calc(100dvh-4.5rem)] w-full max-w-full flex-col overflow-hidden rounded-lg bg-[#282828] p-5 pb-10 sm:p-6 sm:pb-12 md:h-[87vh] md:min-h-0 md:p-8 md:pb-14"
        : "flex w-full min-w-0 max-w-full flex-col rounded-lg bg-[#282828] p-5 pb-10 sm:p-6 sm:pb-12 md:p-8 md:pb-14";

    const persistChartVis = useCallback((next) => {
        setChartVis(next);
        try {
            localStorage.setItem(CHART_VIS_KEY, JSON.stringify(next));
        } catch {
            // ignore quota / private-mode failures
        }
    }, []);

    const toggleChart = useCallback(
        (id) => {
            persistChartVis({ ...chartVis, [id]: chartVis[id] === false });
        },
        [chartVis, persistChartVis]
    );

    const chartDefs = reportTab === "courses" ? COURSE_CHART_TOGGLES : EXAM_CHART_TOGGLES;

    const setAllCharts = (on) => {
        const next = { ...chartVis };
        for (const d of chartDefs) next[d.id] = on;
        persistChartVis(next);
    };

    const selectTab = (tab) => {
        setReportTab(tab);
        try {
            sessionStorage.setItem(ANALYTICS_REPORT_TAB_KEY, tab);
        } catch {
            // ignore quota / private-mode failures
        }
    };

    return (
        <div className={containerClass}>
            <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden pb-4">
                <div>
                    {pageTitle ? (
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h1 className="text-xl font-semibold text-white sm:text-2xl">{pageTitle}</h1>
                            {headerRight}
                        </div>
                    ) : headerRight ? (
                        <div className="mb-4 flex justify-end">{headerRight}</div>
                    ) : null}
                    <p className="text-xs font-medium tracking-widest text-white uppercase">{sectionEyebrow}</p>
                    {scopeSubtitle ? (
                        <p className="mt-1 text-sm leading-relaxed text-gray-400">{scopeSubtitle}</p>
                    ) : null}
                    {sa ? (
                        <div className="mt-4 flex w-full max-w-md rounded-xl border border-[#5a5a5a] bg-[#353535] p-1">
                            <button
                                type="button"
                                onClick={() => selectTab("exam")}
                                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                    reportTab === "exam"
                                        ? "bg-[#A294F9] text-white"
                                        : "text-gray-300 hover:bg-[#404040] hover:text-white"
                                }`}
                            >
                                Exam
                            </button>
                            <button
                                type="button"
                                onClick={() => selectTab("courses")}
                                className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                    reportTab === "courses"
                                        ? "bg-[#A294F9] text-white"
                                        : "text-gray-300 hover:bg-[#404040] hover:text-white"
                                }`}
                            >
                                Courses
                            </button>
                        </div>
                    ) : null}
                </div>

                {sa ? (
                    <>
                        <ChartVisibilityBar
                            defs={chartDefs}
                            vis={chartVis}
                            onToggle={toggleChart}
                            onShowAll={() => setAllCharts(true)}
                            onHideAll={() => setAllCharts(false)}
                        />
                        {reportTab === "courses" ? (
                            <CoursesReport sa={sa} chartVis={chartVis} />
                        ) : (
                            <ExamReport
                                sa={sa}
                                chartVis={chartVis}
                                ctcCohortLabel={ctcCohortLabel}
                                readinessSubtitle={readinessSubtitle}
                            />
                        )}
                    </>
                ) : (
                    <div className="rounded-xl border border-dashed border-[#5a5a5a] bg-[#3a3a3a]/50 px-6 py-10 text-center text-sm text-white">
                        Student analytics require an updated API. Deploy the latest backend with{" "}
                        <code className="rounded bg-black/30 px-1.5 py-0.5 text-white">student_analytics</code> on{" "}
                        <code className="rounded bg-black/30 px-1.5 py-0.5 text-white">/admin/home/</code>.
                    </div>
                )}
            </div>
        </div>
    );
}

function shown(vis, id) {
    return vis?.[id] !== false;
}

function HiddenChartsHint() {
    return (
        <div className="rounded-xl border border-dashed border-[#5a5a5a] bg-[#3a3a3a]/50 px-6 py-10 text-center text-sm text-gray-400">
            All charts on this tab are hidden. Use Customize charts to turn some back on.
        </div>
    );
}

function CoursesReport({ sa, chartVis }) {
    const modules = sa.module_attendance || [];
    const totalStudents = Number(sa.total_students) || 0;
    const assignedCourses = Array.isArray(sa.daily_course_attendance?.available_courses)
        ? sa.daily_course_attendance.available_courses
        : EMPTY_ASSIGNED_COURSES;
    const allTimeRows = sa.daily_course_attendance?.all_time_rows || [];
    const [selectedCourseForSplit, setSelectedCourseForSplit] = useState("");

    const courseFilterOptions = useMemo(() => {
        const extraCourses = [];
        for (const row of allTimeRows) {
            extraCourses.push(...startedCoursesFromRow(row));
        }
        return buildCourseFilterOptions({ assignedCourses, modules, extraCourses });
    }, [assignedCourses, modules, allTimeRows]);

    useEffect(() => {
        if (
            selectedCourseForSplit &&
            !courseFilterOptions.some((c) => c.key === selectedCourseForSplit)
        ) {
            setSelectedCourseForSplit("");
        }
    }, [courseFilterOptions, selectedCourseForSplit]);

    const overallCourseStarters =
        sa.students_with_course_activity != null
            ? Number(sa.students_with_course_activity) || 0
            : new Set(allTimeRows.map((r) => r.user_id)).size;

    const selectedCourseMeta = courseFilterOptions.find((c) => c.key === selectedCourseForSplit);

    const courseStartersForSplit = useMemo(() => {
        if (!selectedCourseForSplit) return overallCourseStarters;
        const matchedModule = modules.find(
            (m) => courseFilterKey({ id: m.id, name: m.name }) === selectedCourseForSplit
        );
        if (matchedModule) return Number(matchedModule.student_count) || 0;
        const starterIds = new Set();
        for (const row of allTimeRows) {
            const started = startedCoursesFromRow(row).some(
                (c) => courseFilterKey(c) === selectedCourseForSplit
            );
            if (started && row.user_id != null) starterIds.add(row.user_id);
        }
        return starterIds.size;
    }, [selectedCourseForSplit, overallCourseStarters, modules, allTimeRows]);

    const courseSplit = splitCount(courseStartersForSplit, totalStudents);
    const courseSplitSubtitle = selectedCourseMeta
        ? `Students who viewed or started ${selectedCourseMeta.name}, vs the rest of the cohort.`
        : "Students who viewed or started any Skill Center course, vs the rest of the cohort.";
    const courseShareSlices = useMemo(() => {
        const ranked = [...modules]
            .filter((m) => Number(m.student_count) > 0)
            .sort((a, b) => Number(b.student_count) - Number(a.student_count));
        const top = ranked.slice(0, 6);
        const rest = ranked.slice(6).reduce((sum, m) => sum + Number(m.student_count || 0), 0);
        const slices = top.map((m, i) => ({
            label: m.name || `Module ${m.id}`,
            value: Number(m.student_count) || 0,
            color: PIE_PALETTE[i % PIE_PALETTE.length],
        }));
        if (rest > 0) slices.push({ label: "Other courses", value: rest, color: "#64748b" });
        return slices;
    }, [modules]);

    const anyShown =
        shown(chartVis, "pieCourseStarted") ||
        shown(chartVis, "pieCourseShare") ||
        shown(chartVis, "courseReach") ||
        shown(chartVis, "dailyAttendance");

    if (!anyShown) return <HiddenChartsHint />;

    return (
        <>
            {shown(chartVis, "pieCourseStarted") || shown(chartVis, "pieCourseShare") ? (
                <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
                    {shown(chartVis, "pieCourseStarted") ? (
                        <PieChartCard
                            title="Started a course vs did not"
                            subtitle={courseSplitSubtitle}
                            headerExtra={
                                <CourseFilterSelect
                                    value={selectedCourseForSplit}
                                    onChange={setSelectedCourseForSplit}
                                    options={courseFilterOptions}
                                    className="shrink-0"
                                />
                            }
                            slices={[
                                {
                                    label: selectedCourseMeta ? "Started this course" : "Started a course",
                                    value: courseSplit.took,
                                    color: "#2dd4bf",
                                },
                                { label: "Did not start", value: courseSplit.didNot, color: "#64748b" },
                            ]}
                            emptyMessage="No students in this cohort yet."
                        />
                    ) : null}
                    {shown(chartVis, "pieCourseShare") ? (
                        <PieChartCard
                            title="Course mix"
                            subtitle="Unique students per course. A student can appear in more than one course."
                            slices={courseShareSlices}
                            emptyMessage="No course activity yet."
                            centerLabel="Touches"
                        />
                    ) : null}
                </div>
            ) : null}

            {shown(chartVis, "courseReach") ? (
            <div className="overflow-hidden rounded-xl border border-[#5a5a5a] bg-[#3a3a3a]">
                <div className="flex items-start justify-between gap-2 border-b border-[#5a5a5a] px-4 py-4 sm:px-5">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h3 className="text-base font-medium text-white">Course reach</h3>
                            <InfoTooltip align="end" label="What module attendance includes (Skill Center)">
                                <span className="text-gray-300">
                                    Students who{" "}
                                    <strong className="font-semibold text-gray-200">viewed, opened, or started</strong>{" "}
                                    each module (Skill Center). Includes{" "}
                                    <strong className="font-semibold text-gray-200">global courses</strong>, your
                                    org&apos;s{" "}
                                    <strong className="font-semibold text-gray-200">custom modules</strong>, and
                                    modules <strong className="font-semibold text-gray-200">assigned to students</strong>{" "}
                                    in this view&apos;s cohort.
                                </span>
                            </InfoTooltip>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-400">
                            Lifetime unique students per Skill Center course (not limited to one day).
                        </p>
                    </div>
                </div>
                <div className="max-h-72 overflow-auto [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent">
                    <table className="min-w-full text-left text-sm">
                        <thead className="sticky top-0 bg-[#333] text-xs uppercase tracking-wide text-gray-400">
                            <tr>
                                <th className="px-4 py-2.5 font-medium sm:px-5">Course</th>
                                <th className="px-4 py-2.5 font-medium sm:px-5">Students</th>
                            </tr>
                        </thead>
                        <tbody>
                            {modules.length > 0 ? (
                                modules.map((m) => (
                                    <tr key={m.id} className="border-t border-white/5">
                                        <td className="px-4 py-2.5 text-white sm:px-5">{m.name || `Module ${m.id}`}</td>
                                        <td
                                            className={`px-4 py-2.5 tabular-nums font-semibold sm:px-5 ${
                                                m.student_count > 0 ? "text-[#A294F9]" : "text-white"
                                            }`}
                                        >
                                            {m.student_count}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="px-4 py-8 text-center text-sm text-gray-400 sm:px-5">
                                        No learning modules in this cohort yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            ) : null}
            {shown(chartVis, "dailyAttendance") ? (
                <DailyCourseAttendanceTable attendance={sa.daily_course_attendance} />
            ) : null}
        </>
    );
}

function ExamReport({ sa, chartVis, ctcCohortLabel, readinessSubtitle }) {
    const totalStudents = Number(sa.total_students) || 0;
    const tookEver = sa.distinct_attempters_all_time != null
        ? Number(sa.distinct_attempters_all_time)
        : Number(sa.distinct_attempters_30d ?? sa.distinct_submitters_30d) || 0;
    const took30d = Number(sa.distinct_attempters_30d ?? sa.distinct_submitters_30d) || 0;
    const completed30d = Number(sa.distinct_submitters_30d) || 0;
    const loggedIn30d = Number(sa.students_logged_in_30d) || 0;
    const ctcProfiles = Number(sa.students_with_ctc_profile) || 0;
    const atRisk = Number(sa.at_risk_student_count) || 0;
    const examSplit = splitCount(tookEver, totalStudents);
    const took30Split = splitCount(took30d, totalStudents);
    const completedSplit = splitCount(completed30d, totalStudents);
    const loginSplit = splitCount(loggedIn30d, totalStudents);
    const ctcSplit = splitCount(ctcProfiles, totalStudents);
    const riskSplit = splitCount(atRisk, totalStudents);
    const exams = Array.isArray(sa.exam_participation) ? sa.exam_participation : [];

    const anyShown = EXAM_CHART_TOGGLES.some((d) => shown(chartVis, d.id));
    if (!anyShown) return <HiddenChartsHint />;

    return (
        <>
            {shown(chartVis, "kpis") ? (
            <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="min-w-0 rounded-xl border border-[#5a5a5a] bg-[#3a3a3a] px-4 py-4 shadow-inner sm:px-5 sm:py-5">
                    <p className="text-sm text-white">Avg CTC score</p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white sm:text-4xl">
                        {sa.avg_ctc_score != null ? sa.avg_ctc_score : "-"}
                    </p>
                    <p className="mt-2 text-sm text-white">
                        Scale 0-10 ·{" "}
                        {sa.students_with_ctc_profile != null && sa.total_students != null
                            ? `${sa.students_with_ctc_profile} of ${sa.total_students} with a CTC profile`
                            : "Gamified score from ranked & contest activity"}
                    </p>
                    {sa.avg_combined_score_30d != null ? (
                        <div className="mt-2 border-t border-[#5a5a5a] pt-2 text-xs text-white">
                            {sa.avg_combined_score_prev_30d != null ? (
                                <p>
                                    Prior 30d avg:{" "}
                                    <span className="font-medium text-white">{sa.avg_combined_score_prev_30d}</span>
                                </p>
                            ) : null}
                            <p className={sa.avg_combined_score_prev_30d != null ? "mt-1" : ""}>
                                Avg exam marks (30d):{" "}
                                <span className="font-medium text-white">{sa.avg_combined_score_30d}</span>
                                {sa.cohort_score_delta != null ? (
                                    <span
                                        className={
                                            sa.cohort_score_delta >= 0 ? " text-emerald-400" : " text-rose-400"
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
                        <div className="mt-2 border-t border-[#5a5a5a] pt-2 text-xs text-white">
                            {sa.avg_combined_score_prev_30d != null ? (
                                <p className="text-white">
                                    Prior 30d avg:{" "}
                                    <span className="font-medium text-white">{sa.avg_combined_score_prev_30d}</span>
                                </p>
                            ) : null}
                            <p className={sa.avg_combined_score_prev_30d != null ? "mt-1" : ""}>
                                No completed attempts in the last 30 days for exam mark averages.
                            </p>
                        </div>
                    )}
                </div>
                <div className="min-w-0 rounded-xl border border-[#5a5a5a] bg-[#3a3a3a] px-4 py-4 shadow-inner sm:px-5 sm:py-5">
                    <p className="text-sm text-white">At risk</p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white sm:text-4xl">
                        {sa.at_risk_student_count ?? "-"}
                    </p>
                    <p className="mt-2 text-sm text-white">Students with proctoring flags (30d)</p>
                </div>
                <div className="min-w-0 rounded-xl border border-[#5a5a5a] bg-[#3a3a3a] px-4 py-4 shadow-inner sm:px-5 sm:py-5">
                    <p className="text-sm text-white">In exam now</p>
                    <p className="mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white sm:text-4xl">
                        {sa.students_in_live_exam_now ?? "-"}
                    </p>
                    <p className="mt-2 text-sm text-white">Active attempts in the live window</p>
                    {sa.mcq_accuracy_30d_pct != null ? (
                        <p className="mt-2 border-t border-[#5a5a5a] pt-2 text-xs text-white">
                            MCQ accuracy (30d):{" "}
                            <span className="font-medium text-white">{sa.mcq_accuracy_30d_pct}%</span>
                        </p>
                    ) : null}
                </div>
            </div>
            ) : null}

            {shown(chartVis, "activity") ? (
            <div className="flex flex-col gap-3">
                <p className="text-xs font-medium tracking-widest text-white uppercase">Exam activity</p>
                <div className="grid w-full grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-6">
                    <div className="min-w-0 rounded-xl border border-[#5a5a5a] bg-[#3a3a3a] px-4 py-4 shadow-inner">
                        <p className="text-xs text-white">Logged in (7d)</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
                            {sa.students_logged_in_7d ?? "-"}
                        </p>
                        <p className="mt-1 text-[11px] leading-snug text-white sm:text-xs">
                            Unique students · last 7 days
                        </p>
                    </div>
                    <div className="min-w-0 rounded-xl border border-[#5a5a5a] bg-[#3a3a3a] px-4 py-4 shadow-inner">
                        <p className="text-xs text-white">Logged in (30d)</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
                            {sa.students_logged_in_30d ?? "-"}
                        </p>
                        <p className="mt-1 text-[11px] leading-snug text-white sm:text-xs">
                            Unique students · last 30 days
                        </p>
                    </div>
                    <div className="min-w-0 rounded-xl border border-[#5a5a5a] bg-[#3a3a3a] px-4 py-4 shadow-inner">
                        <p className="text-xs text-white">Inactive (30d)</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
                            {sa.students_inactive_30d ?? "-"}
                        </p>
                        <p className="mt-1 text-[11px] leading-snug text-white sm:text-xs">No login in 30 days</p>
                    </div>
                    <div className="min-w-0 rounded-xl border border-[#5a5a5a] bg-[#3a3a3a] px-4 py-4 shadow-inner">
                        <p className="text-xs text-white">Finished attempts (7d)</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
                            {sa.completed_submissions_7d ?? "-"}
                        </p>
                        <p className="mt-1 text-[11px] leading-snug text-white sm:text-xs">
                            Completed exam submissions
                        </p>
                    </div>
                    <div className="min-w-0 rounded-xl border border-[#5a5a5a] bg-[#3a3a3a] px-4 py-4 shadow-inner">
                        <p className="text-xs text-white">Distinct submitters (30d)</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
                            {sa.distinct_submitters_30d ?? "-"}
                        </p>
                        <p className="mt-1 text-[11px] leading-snug text-white sm:text-xs">≥1 finished attempt</p>
                    </div>
                    <div className="min-w-0 rounded-xl border border-[#5a5a5a] bg-[#3a3a3a] px-4 py-4 shadow-inner">
                        <p className="text-xs text-white">Finished attempts (30d)</p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
                            {sa.finished_attempts_30d ?? "-"}
                        </p>
                        <p className="mt-1 text-[11px] leading-snug text-white sm:text-xs">All completed submissions</p>
                    </div>
                </div>
            </div>
            ) : null}

            {shown(chartVis, "pieTookExam") ||
            shown(chartVis, "pieCompleted30d") ||
            shown(chartVis, "pieLogin") ||
            shown(chartVis, "pieCtc") ||
            shown(chartVis, "pieRisk") ? (
                <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
                    {shown(chartVis, "pieTookExam") ? (
                        <PieChartCard
                            title="Took an exam vs did not"
                            subtitle={
                                sa.distinct_attempters_all_time != null
                                    ? "Students who started any exam, vs those who never started."
                                    : "Students who started an exam in the last 30 days, vs the rest."
                            }
                            slices={[
                                { label: "Took an exam", value: examSplit.took, color: "#A294F9" },
                                { label: "Did not take", value: examSplit.didNot, color: "#64748b" },
                            ]}
                            emptyMessage="No students in this cohort yet."
                        />
                    ) : null}
                    {shown(chartVis, "pieCompleted30d") ? (
                        <PieChartCard
                            title="Completed an exam (30d)"
                            subtitle={`${took30Split.took} started · ${completedSplit.took} finished in the last 30 days.`}
                            slices={[
                                { label: "Completed", value: completedSplit.took, color: "#2dd4bf" },
                                { label: "Did not complete", value: completedSplit.didNot, color: "#64748b" },
                            ]}
                            emptyMessage="No students in this cohort yet."
                        />
                    ) : null}
                    {shown(chartVis, "pieLogin") ? (
                        <PieChartCard
                            title="Logged in vs inactive (30d)"
                            subtitle="Unique students with a login in the last 30 days."
                            slices={[
                                { label: "Logged in", value: loginSplit.took, color: "#2dd4bf" },
                                { label: "Inactive", value: loginSplit.didNot, color: "#64748b" },
                            ]}
                            emptyMessage="No students in this cohort yet."
                        />
                    ) : null}
                    {shown(chartVis, "pieCtc") ? (
                        <PieChartCard
                            title="CTC profile vs none"
                            subtitle="Students with a gamified CTC score profile."
                            slices={[
                                { label: "Has CTC profile", value: ctcSplit.took, color: "#A294F9" },
                                { label: "No profile", value: ctcSplit.didNot, color: "#64748b" },
                            ]}
                            emptyMessage="No students in this cohort yet."
                        />
                    ) : null}
                    {shown(chartVis, "pieRisk") ? (
                        <PieChartCard
                            title="At risk vs not flagged"
                            subtitle="Proctoring flags in the last 30 days."
                            slices={[
                                { label: "Flagged", value: riskSplit.took, color: "#fb7185" },
                                { label: "Not flagged", value: riskSplit.didNot, color: "#34d399" },
                            ]}
                            emptyMessage="No students in this cohort yet."
                        />
                    ) : null}
                </div>
            ) : null}

            {shown(chartVis, "piePerExam") ? (
                <div className="overflow-hidden rounded-xl border border-[#5a5a5a] bg-[#3a3a3a]">
                    <div className="border-b border-[#5a5a5a] px-4 py-4 sm:px-5">
                        <h3 className="text-base font-medium text-white">Took vs did not — recent exams</h3>
                        <p className="mt-0.5 text-xs text-gray-400">
                            Students who started each recent exam, vs the rest of the cohort.
                        </p>
                    </div>
                    {exams.length ? (
                        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-4 sm:p-5">
                            {exams.map((ex) => {
                                const attempted = Number(ex.attempted_count) || 0;
                                const split = splitCount(attempted, totalStudents);
                                return (
                                    <div key={ex.id} className="rounded-lg border border-[#5a5a5a] bg-[#353535] px-3 py-3">
                                        <p className="mb-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium text-white">
                                            {ex.name}
                                        </p>
                                        <AnalyticsPieChart
                                            size="sm"
                                            slices={[
                                                { label: "Took", value: split.took, color: "#A294F9" },
                                                { label: "Did not", value: split.didNot, color: "#64748b" },
                                            ]}
                                            emptyMessage="No students."
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="px-4 py-10 text-center text-sm text-gray-400 sm:px-5">
                            Add exams to see who took each one.
                        </div>
                    )}
                </div>
            ) : null}

            {shown(chartVis, "ctcDistribution") || shown(chartVis, "performanceHistory") ? (
            <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
                {shown(chartVis, "ctcDistribution") ? (
                <div className="min-w-0 overflow-hidden rounded-xl border border-[#5a5a5a] bg-[#3a3a3a]">
                    <div className="border-b border-[#5a5a5a] px-4 py-4 sm:px-5">
                        <h3 className="text-base font-medium text-white">CTC score distribution</h3>
                        <p className="text-xs text-white">{ctcCohortLabel}</p>
                    </div>
                    <div className="px-2 py-4 sm:px-5 sm:py-5">
                        <CTCDistributionLineChart
                            points={sa.ctc_distribution_chart || []}
                            valueSuffix=" students"
                            emptyMessage="No CTC score profiles for this cohort yet."
                        />
                    </div>
                </div>
                ) : null}
                {shown(chartVis, "performanceHistory") ? (
                <div className="min-w-0 rounded-xl border border-[#5a5a5a] bg-[#3a3a3a]">
                    <div className="border-b border-[#5a5a5a] px-4 py-4 sm:px-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-base font-medium text-white">
                                        All students — marks &amp; improvement
                                    </h3>
                                    <InfoTooltip align="end" label="How marks and improvement are calculated">
                                        <span className="text-gray-300">
                                            Each month we average{" "}
                                            <strong className="font-semibold text-gray-200">MCQ + coding</strong> per
                                            student (finished attempts only), then average across{" "}
                                            <strong className="font-semibold text-gray-200">
                                                all students who assessed that month
                                            </strong>{" "}
                                            so everyone counts equally. Timeline:{" "}
                                            <strong className="font-semibold text-gray-200">
                                                first org assessment through today
                                            </strong>
                                            . The badge compares{" "}
                                            <strong className="font-semibold text-gray-200">
                                                early months vs recent months
                                            </strong>{" "}
                                            to signal improvement.
                                        </span>
                                    </InfoTooltip>
                                </div>
                                <p className="mt-0.5 text-xs text-gray-400">Cohort marks over time.</p>
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
                                <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                                    Trend: steady
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <div className="overflow-hidden px-2 py-4 sm:px-5 sm:py-5">
                        <PerformanceHistoryLineChart
                            points={sa.performance_history_chart || []}
                            valueSuffix=" marks"
                            emptyMessage="No finished exam attempts yet — the line will appear once students submit."
                        />
                    </div>
                </div>
                ) : null}
            </div>
            ) : null}

            {shown(chartVis, "placementReadiness") ? (
            <div className="overflow-hidden rounded-xl border border-[#5a5a5a] bg-[#3a3a3a]">
                <div className="flex flex-col gap-3 border-b border-[#5a5a5a] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                        <h3 className="text-base font-medium text-white sm:text-lg">
                            Placement readiness
                            {sa.primary_batch != null ? ` · Batch ${sa.primary_batch}` : ""}
                        </h3>
                        <p className="text-xs text-white">{readinessSubtitle}</p>
                    </div>
                </div>
                <div className="px-2 py-4 sm:px-5 sm:py-5">
                    <AnalyticsBarChart
                        bars={sa.readiness_chart || []}
                        variant="purple"
                        valueSuffix="%"
                        emptyMessage="Add exams to see participation across your cohort"
                    />
                </div>
                <div className="border-t border-[#5a5a5a] px-4 py-3 sm:px-5">
                    <p className="text-xs text-white">
                        Tap an exam in Manage Exams for full breakdown. Bars use the same participation % as the
                        export.
                    </p>
                </div>
            </div>
            ) : null}
        </>
    );
}
