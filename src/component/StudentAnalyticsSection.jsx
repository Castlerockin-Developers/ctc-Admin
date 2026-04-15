import React, { useMemo, useId } from "react";
import { FaInfoCircle } from "react-icons/fa";

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
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#5a5a5a] bg-[#404040] text-[#b4a9f5] transition-colors hover:border-[#A294F9]/55 hover:bg-[#4a4a4a] hover:text-[#ddd6fe] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#A294F9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#3a3a3a]"
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

/**
 * Org-wide or branch-scoped student analytics KPIs and charts (same payload as Dashboard `studentAnalytics`).
 */
export default function StudentAnalyticsSection({
    sa,
    scopeSubtitle = null,
    sectionEyebrow = "Student analytics",
    ctcCohortLabel = "Students per band (org cohort)",
    readinessSubtitle = "Share of org students who started each recent exam",
}) {
    return (
        <div className="flex w-full min-w-0 max-w-full flex-col gap-5">
            <div>
                <p className="text-xs font-medium tracking-widest text-white uppercase">{sectionEyebrow}</p>
                {scopeSubtitle ? (
                    <p className="mt-1 text-sm text-gray-400">{scopeSubtitle}</p>
                ) : null}
            </div>

            {sa ? (
                <>
                    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-[#5a5a5a] bg-[#3a3a3a] px-5 py-5 shadow-inner">
                            <p className="text-sm text-white">Avg CTC score</p>
                            <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-white">
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
                        <div className="rounded-xl border border-[#5a5a5a] bg-[#3a3a3a] px-5 py-5 shadow-inner">
                            <p className="text-sm text-white">At risk</p>
                            <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight text-white">
                                {sa.at_risk_student_count ?? "-"}
                            </p>
                            <p className="mt-2 text-sm text-white">Students with proctoring flags (30d)</p>
                        </div>
                        <div className="flex h-full flex-col rounded-xl border border-[#5a5a5a] bg-[#3a3a3a] px-5 py-5 shadow-inner">
                            <div className="flex min-w-0 items-center gap-1.5">
                                <p className="min-w-0 flex-1 text-sm text-white">Module attendance</p>
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
                            <p className="mt-1 text-xs text-gray-400">
                                Skill Center reach by module — use the info icon for full scope.
                            </p>
                            <ul className="mt-3 max-h-20 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 text-sm [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20">
                                {(sa.module_attendance || []).length > 0 ? (
                                    (sa.module_attendance || []).map((m) => (
                                        <li
                                            key={m.id}
                                            className="flex items-baseline justify-between gap-2 border-b border-white/5 pb-2 last:border-0 last:pb-0"
                                        >
                                            <span className="min-w-0 truncate text-white" title={m.name}>
                                                {m.name || `Module ${m.id}`}
                                            </span>
                                            <span
                                                className={`shrink-0 tabular-nums font-semibold ${
                                                    m.student_count > 0 ? "text-[#A294F9]" : "text-white"
                                                }`}
                                            >
                                                {m.student_count}
                                            </span>
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-white">No learning modules in this cohort yet.</li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <p className="text-xs font-medium tracking-widest text-white uppercase">Cohort activity</p>
                        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
                                <p className="text-xs text-white">In exam now</p>
                                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-3xl">
                                    {sa.students_in_live_exam_now ?? "-"}
                                </p>
                                <p className="mt-1 text-[11px] leading-snug text-white sm:text-xs">
                                    Active attempts, live window
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="overflow-hidden rounded-xl border border-[#5a5a5a] bg-[#3a3a3a]">
                            <div className="border-b border-[#5a5a5a] px-5 py-4">
                                <h3 className="text-base font-medium text-white">CTC score distribution</h3>
                                <p className="text-xs text-white">{ctcCohortLabel}</p>
                            </div>
                            <div className="px-3 py-5 sm:px-5">
                                <CTCDistributionLineChart
                                    points={sa.ctc_distribution_chart || []}
                                    valueSuffix=" students"
                                    emptyMessage="No CTC score profiles for this cohort yet."
                                />
                            </div>
                        </div>
                        <div className="rounded-xl border border-[#5a5a5a] bg-[#3a3a3a]">
                            <div className="border-b border-[#5a5a5a] px-5 py-4">
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
                            <div className="overflow-hidden px-3 py-5 sm:px-5">
                                <PerformanceHistoryLineChart
                                    points={sa.performance_history_chart || []}
                                    valueSuffix=" marks"
                                    emptyMessage="No finished exam attempts yet — the line will appear once students submit."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[#5a5a5a] bg-[#3a3a3a]">
                        <div className="flex flex-col gap-3 border-b border-[#5a5a5a] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-white">
                                    Placement readiness
                                    {sa.primary_batch != null ? ` · Batch ${sa.primary_batch}` : ""}
                                </h3>
                                <p className="text-xs text-white">{readinessSubtitle}</p>
                            </div>
                        </div>
                        <div className="px-3 py-5 sm:px-5">
                            <AnalyticsBarChart
                                bars={sa.readiness_chart || []}
                                variant="purple"
                                valueSuffix="%"
                                emptyMessage="Add exams to see participation across your cohort"
                            />
                        </div>
                        <div className="border-t border-[#5a5a5a] px-5 py-3">
                            <p className="text-xs text-white">
                                Tap an exam in Manage Exams for full breakdown. Bars use the same participation % as the
                                export.
                            </p>
                        </div>
                    </div>
                </>
            ) : (
                <div className="rounded-xl border border-dashed border-[#5a5a5a] bg-[#3a3a3a]/50 px-6 py-10 text-center text-sm text-white">
                    Student analytics require an updated API. Deploy the latest backend with{" "}
                    <code className="rounded bg-black/30 px-1.5 py-0.5 text-white">student_analytics</code> on{" "}
                    <code className="rounded bg-black/30 px-1.5 py-0.5 text-white">/admin/home/</code>.
                </div>
            )}
        </div>
    );
}
