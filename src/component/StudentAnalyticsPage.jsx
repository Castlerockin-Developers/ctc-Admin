/* eslint-disable react/prop-types */
import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FaChartLine, FaCheckCircle, FaChevronLeft, FaExclamationTriangle } from "react-icons/fa";
import Swal from "sweetalert2";
import { authFetch } from "../scripts/AuthProvider";
import { error as logError } from "../utils/logger";
import Spinner from "../loader/Spinner";
import ParticularResult from "./PerticularResult";

function formatDt(iso) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "short",
      timeStyle: "short",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function statusLabel(s) {
  const m = {
    upcoming: "Upcoming",
    ongoing: "Ongoing",
    completed: "Completed",
    results_declared: "Results declared",
    submitted: "Submitted",
    in_progress: "In progress",
    not_started: "Not started",
  };
  return m[s] || s;
}

function assessmentTypeLabel(t) {
  const m = {
    ranked: "Ranked",
    campus: "Campus",
    contest: "Contest",
    practice: "Practice",
  };
  return m[t] || (t ? String(t) : "-");
}

/** Normalize API series to points { label, value, date }; sort by date when present. */
function normalizeScoreSeries(raw) {
  const list = [...(raw || [])].map((p) => ({
    label: (p.label || "").trim() || "Attempt",
    value: Number(p.score) || 0,
    date: p.date || null,
  }));
  const dated = list.filter((p) => p.date);
  if (dated.length === list.length && list.length > 0) {
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  return list;
}

function yExtent(values) {
  if (!values.length) return [0, 1];
  let lo = Math.min(...values);
  let hi = Math.max(...values);
  if (lo === hi) {
    lo = Math.max(0, lo - 5);
    hi = hi + 5;
  } else {
    const pad = (hi - lo) * 0.08;
    lo -= pad;
    hi += pad;
    if (lo < 0 && Math.min(...values) >= 0) lo = 0;
  }
  return [lo, hi];
}

function shortDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/** Line chart with Y grid, labels, and points (exam / contest). */
function ScoreLineChart({ points, color, footnote }) {
  const W = 520;
  const H = 200;
  const margin = { top: 16, right: 16, bottom: 44, left: 44 };
  const cw = W - margin.left - margin.right;
  const ch = H - margin.top - margin.bottom;

  if (!points?.length) {
    return (
      <div className="font-[madina-regular] flex min-h-[200px] items-center justify-center rounded-lg border border-[#5a5a5a] bg-[#2d2d2d] text-sm text-white">
        No data yet
      </div>
    );
  }

  const vals = points.map((p) => p.value);
  const [yMin, yMax] = yExtent(vals);
  const ySpan = yMax - yMin || 1;
  const n = points.length;
  const xAt = (i) => margin.left + (n === 1 ? cw / 2 : (i / (n - 1)) * cw);
  const yAt = (v) => margin.top + ch - ((v - yMin) / ySpan) * ch;
  const lineD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p.value)}`)
    .join(" ");
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => yMin + (i / ticks) * (yMax - yMin));

  const xLabelIdx =
    n <= 3
      ? points.map((_, i) => i)
      : [0, Math.floor((n - 1) / 2), n - 1];
  const xTick = (i) => (points[i].date ? shortDate(points[i].date) : `#${i + 1}`);

  return (
    <div className="font-[madina-regular] rounded-lg border border-[#5a5a5a] bg-[#2d2d2d] p-2 sm:p-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="font-[madina-regular] h-[200px] w-full max-w-full"
        role="img"
        aria-label="Score trend line chart"
      >
        {tickVals.map((tv, i) => {
          const y = yAt(tv);
          return (
            <g key={i}>
              <line
                x1={margin.left}
                y1={y}
                x2={margin.left + cw}
                y2={y}
                stroke="#4a4a4a"
                strokeDasharray="4 5"
                strokeWidth="1"
              />
              <text x={margin.left - 8} y={y + 4} textAnchor="end" fill="#ffffff" fontSize="11">
                {Math.round(tv * 10) / 10}
              </text>
            </g>
          );
        })}
        <line
          x1={margin.left}
          y1={margin.top + ch}
          x2={margin.left + cw}
          y2={margin.top + ch}
          stroke="#666"
          strokeWidth="1"
        />
        <path d={lineD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={xAt(i)} cy={yAt(p.value)} r="4" fill={color} stroke="#1f1f1f" strokeWidth="1" />
        ))}
        {xLabelIdx.map((i) => (
          <text
            key={i}
            x={xAt(i)}
            y={H - 12}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="10"
            transform={`rotate(-18 ${xAt(i)} ${H - 12})`}
          >
            {xTick(i)}
          </text>
        ))}
      </svg>
      <p className="mt-1 text-center text-[11px] text-white">
        {footnote ?? "Chronological total score per completed attempt"}
      </p>
    </div>
  );
}

/** Vertical bar chart for same series. */
function ScoreBarChart({ points, color, footnote }) {
  const W = 520;
  const H = 200;
  const margin = { top: 16, right: 12, bottom: 48, left: 44 };
  const cw = W - margin.left - margin.right;
  const ch = H - margin.top - margin.bottom;

  if (!points?.length) {
    return (
      <div className="font-[madina-regular] flex min-h-[200px] items-center justify-center rounded-lg border border-[#5a5a5a] bg-[#2d2d2d] text-sm text-white">
        No data yet
      </div>
    );
  }

  const vals = points.map((p) => p.value);
  const [yMin, yMax] = yExtent(vals);
  const ySpan = yMax - yMin || 1;
  const n = points.length;
  const bw = Math.max(6, (cw / n) * 0.55);
  const xAt = (i) => margin.left + (i + 0.5) * (cw / n) - bw / 2;
  const y0 = margin.top + ch;
  const yAt = (v) => margin.top + ch - ((v - yMin) / ySpan) * ch;
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => yMin + (i / ticks) * (yMax - yMin));

  return (
    <div className="font-[madina-regular] rounded-lg border border-[#5a5a5a] bg-[#2d2d2d] p-2 sm:p-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="font-[madina-regular] h-[200px] w-full max-w-full"
        role="img"
        aria-label="Score bar chart"
      >
        {tickVals.map((tv, i) => {
          const y = yAt(tv);
          return (
            <g key={i}>
              <line
                x1={margin.left}
                y1={y}
                x2={margin.left + cw}
                y2={y}
                stroke="#3d3d3d"
                strokeDasharray="3 4"
                strokeWidth="1"
              />
              <text x={margin.left - 8} y={y + 4} textAnchor="end" fill="#ffffff" fontSize="11">
                {Math.round(tv * 10) / 10}
              </text>
            </g>
          );
        })}
        <line x1={margin.left} y1={y0} x2={margin.left + cw} y2={y0} stroke="#666" strokeWidth="1" />
        {points.map((p, i) => {
          const x = xAt(i);
          const y1 = yAt(p.value);
          const h = y0 - y1;
          const tip = `${p.label}: ${p.value}${p.date ? ` (${p.date})` : ""}`;
          return (
            <g key={i}>
              <rect x={x} y={y1} width={bw} height={Math.max(1, h)} rx="2" fill={color} opacity="0.9">
                <title>{tip}</title>
              </rect>
            </g>
          );
        })}
        {points.map((p, i) => (
          <text
            key={`l-${i}`}
            x={margin.left + (i + 0.5) * (cw / n)}
            y={H - 10}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="9"
          >
            {n > 8 ? i + 1 : p.date ? shortDate(p.date).slice(0, 8) : `#${i + 1}`}
          </text>
        ))}
      </svg>
      <p className="mt-1 text-center text-[11px] text-white">
        {footnote ??
          (n > 8 ? "Each bar is one attempt in order (1 … n)" : "Each bar is one attempt (date under bar)")}
      </p>
    </div>
  );
}

function avg(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/** Split learning modules into completed vs ongoing (partial / in progress) vs not started. */
function partitionLearningModules(modules) {
  const completed = [];
  const ongoing = [];
  const notStarted = [];
  for (const m of modules || []) {
    const total = Number(m.chapters_total) || 0;
    const done = Number(m.chapters_completed) || 0;
    const pct = Number(m.progress_percent) || 0;
    const inProgressCh = Number(m.chapters_in_progress) || 0;
    const isComplete = total > 0 && (done >= total || pct >= 99.5);
    const isOngoing =
      total > 0 && !isComplete && (done > 0 || pct > 0 || inProgressCh > 0);
    if (isComplete) completed.push(m);
    else if (isOngoing) ongoing.push(m);
    else notStarted.push(m);
  }
  return { completed, ongoing, notStarted };
}

/**
 * Heuristic progress narrative from analytics payload.
 * Returns { tone, title, lines, disclaimer } - tone: positive | attention | neutral
 */
function buildProgressComment(data) {
  if (!data) {
    return {
      tone: "neutral",
      title: "Progress summary",
      lines: ["No analytics loaded yet."],
      disclaimer:
        "This summary is generated from available metrics only and is not a formal academic judgment.",
    };
  }

  const examPts = normalizeScoreSeries(data.exam_score_series);
  const contestPts = normalizeScoreSeries(data.contest_score_series);
  const examScores = examPts.map((p) => p.value);
  const contestScores = contestPts.map((p) => p.value);

  const trendFromScores = (scores) => {
    if (scores.length < 2) return { key: "insufficient", diff: 0 };
    const k = Math.max(1, Math.ceil(scores.length / 3));
    const early = avg(scores.slice(0, k));
    const recent = avg(scores.slice(-k));
    const spread = Math.max(...scores) - Math.min(...scores);
    const threshold = Math.max(2, spread * 0.06, Math.abs(early) * 0.03);
    const diff = recent - early;
    if (diff > threshold) return { key: "improving", diff };
    if (diff < -threshold) return { key: "declining", diff };
    return { key: "steady", diff };
  };

  const exTrend = trendFromScores(examScores);
  const coTrend = trendFromScores(contestScores);

  const eligible = data.exam_participation?.eligible_exams ?? 0;
  const noShow = data.exam_participation?.no_show_eligible ?? 0;
  const noShowRatio = eligible > 0 ? noShow / eligible : 0;

  const streak = data.login_regularity?.current_streak_days ?? 0;
  const logins30 = data.login_regularity?.logins_last_30_days ?? 0;
  const distinct30 = data.login_regularity?.distinct_login_days_last_30 ?? 0;

  const submittedAttempts = data.performance_overview?.submitted_attempts_count ?? 0;
  const avgExam = data.performance_overview?.average_submitted_exam_score;
  const modulesAssigned = data.custom_learning?.modules_assigned_count ?? 0;
  const modulesDone = data.custom_learning?.modules_fully_completed_count ?? 0;
  const lowTrust = data.integrity?.low_trust_attempts_count ?? 0;

  const lines = [];

  if (examScores.length >= 2) {
    if (exTrend.key === "improving") {
      lines.push(
        "Exam performance shows an upward trend: recent completed attempts score higher on average than earlier ones."
      );
    } else if (exTrend.key === "declining") {
      lines.push(
        "Exam scores have softened recently compared with this student’s earlier attempts. Worth reviewing weak topics or timing."
      );
    } else {
      lines.push("Exam scores are relatively steady across completed attempts, with consistent performance without a strong up or down drift.");
    }
  } else if (examScores.length === 1) {
    lines.push(
      "Only one completed exam attempt is on record, so a trend line is not meaningful yet. Collect a few more assessments to judge progress."
    );
  } else {
    lines.push("There are no completed exam attempts with scores in this window, so exam progress cannot be assessed from graphs.");
  }

  if (contestScores.length >= 2) {
    if (coTrend.key === "improving") {
      lines.push("Contest totals are trending upward over time.");
    } else if (coTrend.key === "declining") {
      lines.push("Contest totals have dipped in recent finishes versus earlier ones.");
    } else {
      lines.push("Contest scores look stable across recorded finishes.");
    }
  } else if (contestScores.length === 1) {
    lines.push("Only one finished contest score is recorded; more contests are needed to comment on contest progress.");
  } else {
    lines.push("No finished contest attempts with scores were found for this student.");
  }

  if (noShowRatio > 0.35 && eligible >= 3) {
    lines.push(
      `Participation: a notable share of eligible exams (${noShow} of ${eligible}) were not started. Progress also depends on showing up for assigned tests.`
    );
  } else if (eligible > 0 && noShow === 0) {
    lines.push("Participation: the student has started every eligible exam listed, showing good engagement with assigned assessments.");
  }

  if (streak >= 5 || distinct30 >= 12) {
    lines.push("Login activity looks healthy: regular sign-ins suggest steady engagement with the platform.");
  } else if (submittedAttempts >= 3 && logins30 === 0 && distinct30 <= 2) {
    lines.push(
      "Login activity is sparse in the last 30 days despite some exam attempts. Encourage consistent sign-in so habits and reminders stay aligned."
    );
  } else if (logins30 > 0) {
    lines.push("The student has signed in during the last 30 days; use streak and distinct-day counts above for finer engagement context.");
  }

  if (modulesAssigned > 0) {
    if (modulesDone >= modulesAssigned) {
      lines.push("Custom learning: all assigned modules are fully completed, with strong follow-through on coursework.");
    } else if (modulesDone > 0) {
      lines.push(
        `Custom learning: ${modulesDone} of ${modulesAssigned} assigned module(s) fully completed. There is room to push remaining modules to completion.`
      );
    } else {
      lines.push(
        "Custom learning: modules are assigned but none are fully completed yet; progress on self-paced content is still building."
      );
    }
  }

  if (lowTrust >= 2 && submittedAttempts >= 2) {
    lines.push(
      "Several low-trust attempts were flagged. Review proctoring notes alongside scores before drawing conclusions about skill gains."
    );
  }

  if (avgExam != null && avgExam !== "" && !Number.isNaN(Number(avgExam))) {
    const v = Number(avgExam);
    lines.push(`Overall average total score across submitted exam attempts is ${v.toFixed(2)}.`);
  }

  let tone = "neutral";
  const positiveSignals =
    (exTrend.key === "improving" ? 1 : 0) +
    (coTrend.key === "improving" ? 1 : 0) +
    (noShowRatio <= 0.2 && eligible >= 2 ? 1 : 0) +
    (streak >= 4 || distinct30 >= 10 ? 1 : 0) +
    (modulesAssigned > 0 && modulesDone >= modulesAssigned ? 1 : 0);
  const riskSignals =
    (exTrend.key === "declining" ? 1 : 0) +
    (coTrend.key === "declining" ? 1 : 0) +
    (noShowRatio > 0.4 && eligible >= 3 ? 1 : 0) +
    (lowTrust >= 2 ? 1 : 0);

  if (positiveSignals >= 3 && riskSignals <= 1) tone = "positive";
  else if (riskSignals >= 2 || noShowRatio > 0.45) tone = "attention";

  const title =
    tone === "positive"
      ? "Overall: signs of progress"
      : tone === "attention"
        ? "Overall: mixed signals; needs attention"
        : "Overall: steady or early-stage";

  const disclaimer =
    "This commentary is automated from scores, participation, logins, and course completion in this dashboard. It is guidance for coaches and admins, not a definitive verdict on the student.";

  return { tone, title, lines, disclaimer };
}

/** Sentiment-aware shell for the automated progress summary (professional, dark UI). */
const PROGRESS_SUMMARY_UI = {
  positive: {
    shell:
      "border-emerald-500/40 bg-[linear-gradient(152deg,rgba(4,47,46,0.55)_0%,rgba(32,32,32,0.97)_38%,#2d2d2d_100%)] shadow-[inset_0_1px_0_0_rgba(52,211,153,0.18)]",
    rail: "from-emerald-400 to-emerald-600",
    railMobile: "from-emerald-400 via-emerald-500 to-teal-700",
    iconBox: "border-emerald-400/35 bg-emerald-500/12 text-emerald-200",
    listTop: "border-emerald-500/20",
    bullet: "bg-emerald-300 shadow-[0_0_0_1px_rgba(6,95,70,0.5),0_0_12px_rgba(52,211,153,0.35)]",
    disclaimerRule: "border-emerald-800/35",
    Icon: FaCheckCircle,
  },
  attention: {
    shell:
      "border-amber-500/40 bg-[linear-gradient(152deg,rgba(69,26,3,0.5)_0%,rgba(36,34,30,0.98)_40%,#2d2d2d_100%)] shadow-[inset_0_1px_0_0_rgba(251,191,36,0.12)]",
    rail: "from-amber-300 to-amber-600",
    railMobile: "from-amber-300 via-amber-500 to-orange-800",
    iconBox: "border-amber-400/40 bg-amber-500/12 text-amber-100",
    listTop: "border-amber-500/25",
    bullet: "bg-amber-300 shadow-[0_0_0_1px_rgba(120,53,15,0.45),0_0_12px_rgba(251,191,36,0.28)]",
    disclaimerRule: "border-amber-800/35",
    Icon: FaExclamationTriangle,
  },
  neutral: {
    shell:
      "border-[#6b5ea8]/45 bg-[linear-gradient(152deg,rgba(55,48,82,0.42)_0%,rgba(32,32,32,0.97)_40%,#2d2d2d_100%)] shadow-[inset_0_1px_0_0_rgba(162,148,249,0.14)]",
    rail: "from-[#c4b5fd] to-[#7c6bb8]",
    railMobile: "from-[#dcd4ff] via-[#A294F9] to-[#5b4d8a]",
    iconBox: "border-[#A294F9]/40 bg-[#A294F9]/12 text-[#e8e4ff]",
    listTop: "border-white/10",
    bullet: "bg-[#c9bffd] shadow-[0_0_0_1px_rgba(90,75,140,0.45),0_0_10px_rgba(162,148,249,0.3)]",
    disclaimerRule: "border-white/12",
    Icon: FaChartLine,
  },
};

/**
 * Full-page student analytics (Manage Students → row). Matches ctc-admin dark UI.
 */
const StudentAnalyticsPage = ({ student, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [detailRow, setDetailRow] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const studentId = student?.id;

  useEffect(() => {
    if (!studentId) {
      setData(null);
      setError(null);
      setDetailRow(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    authFetch(`/admin/students/${studentId}/analytics/`, { method: "GET" })
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) {
          logError("StudentAnalyticsPage:", err);
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const examSeries = useMemo(() => {
    const ranked = data?.ranked_exam_score_series;
    if (Array.isArray(ranked) && ranked.length > 0) {
      return normalizeScoreSeries(ranked);
    }
    return normalizeScoreSeries(data?.exam_score_series);
  }, [data]);

  const contestSeries = useMemo(() => normalizeScoreSeries(data?.contest_score_series), [data]);

  const skillCenter = useMemo(
    () =>
      partitionLearningModules(
        data?.skill_center_activity?.modules ?? data?.custom_learning?.modules
      ),
    [data]
  );

  const progressComment = useMemo(() => {
    if (!data) return buildProgressComment(null);
    const examForTrend =
      data.ranked_exam_score_series?.length > 0
        ? data.ranked_exam_score_series
        : data.exam_score_series;
    return buildProgressComment({ ...data, exam_score_series: examForTrend });
  }, [data]);

  const progressSummaryUi = useMemo(
    () => PROGRESS_SUMMARY_UI[progressComment.tone] ?? PROGRESS_SUMMARY_UI.neutral,
    [progressComment.tone]
  );

  const loadAttemptDetail = useCallback(async (row) => {
    setDetailLoading(true);
    try {
      const response = await authFetch(
        `/admin/results/individual-results/${row.attempt_id}/`,
        { method: "GET" }
      );
      if (!response.ok) throw new Error("Failed to load attempt");
      const resJson = await response.json();
      const report = resJson.reportData || {};
      const examData = {
        attempt_id: row.attempt_id,
        usn: report.usn || data?.identity?.usn || "N/A",
        name: report.name || data?.identity?.name || "N/A",
        score: row.total_score,
        trustScore: row.trust_score,
        sections: (report?.sections || []).map((section) => ({
          name: section.sectionName,
          obtainedMarks: section.obtainedMarks,
          totalMarks: section.maxMarks,
          questions: (section.questionsAttempted || []).map((question) => ({
            question: question.question,
            yourAnswer: question.selectedAnswer,
            actualAnswer: question.correctAnswer,
            marks: question.correctAnswer === question.selectedAnswer ? 1 : 0,
            status:
              question.correctAnswer === question.selectedAnswer
                ? "Correct"
                : "Incorrect",
          })),
        })),
      };
      setDetailRow(examData);
    } catch (e) {
      logError(e);
      Swal.fire({
        title: "Error",
        text: "Could not load attempt details.",
        icon: "error",
        background: "#1F1F1F",
        color: "#fff",
        confirmButtonColor: "#A294F9",
        showCloseButton: true,
      });
    } finally {
      setDetailLoading(false);
    }
  }, [data]);

  if (!student?.id) {
    return (
      <motion.div
        className="font-[madina-regular] flex h-[87vh] min-h-[calc(100dvh-4.5rem)] w-full max-w-full flex-col overflow-hidden rounded-lg bg-[#282828] p-4 sm:p-5 md:h-[87vh] md:min-h-0 md:p-6 md:pb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto overflow-x-hidden pb-6 text-white sm:pb-8">
          <p>No student selected.</p>
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2 font-[madina-semibold] text-sm text-white hover:bg-[#4a4a4a]"
          >
            Back to students
          </button>
        </div>
      </motion.div>
    );
  }

  const id = data?.identity;

  return (
    <motion.div
      className="font-[madina-regular] flex h-[87vh] min-h-[calc(100dvh-4.5rem)] w-full max-w-full flex-col overflow-hidden rounded-lg bg-[#282828] p-4 sm:p-5 md:h-[87vh] md:min-h-0 md:p-6 md:pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden pb-6 sm:gap-6 sm:pb-8">
        <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => {
                setDetailRow(null);
                onBack();
              }}
              className="inline-flex cursor-pointer w-fit shrink-0 items-center gap-2 self-start rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-3 py-2 font-[madina-semibold] text-sm text-white transition-colors hover:bg-[#4a4a4a] sm:self-auto"
            >
              <FaChevronLeft className="h-4 w-4" />
              Back to Manage Students
            </button>
            <div className="min-w-0 border-l border-transparent pl-0 sm:border-[#5a5a5a] sm:pl-6">
              <p className="font-[madina-semibold] text-xs uppercase tracking-wide text-white">
                Student analytics
              </p>
              <h1 className="mt-1 font-[madina-semibold] text-2xl tracking-tight text-white sm:text-3xl">
                {id?.name || student.name || student.email || "Student"}
              </h1>
              <p className="mt-1 text-sm text-white sm:text-base">
                {id?.usn || student.usn || student.slNo || "-"}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1">
          {detailRow ? (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setDetailRow(null)}
                className="inline-flex items-center gap-2 rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2 font-[madina-semibold] text-sm text-white hover:bg-[#4a4a4a]"
              >
                <FaChevronLeft className="h-3 w-3" /> Back to analytics overview
              </button>
              <ParticularResult student={detailRow} onBack={() => setDetailRow(null)} />
            </div>
          ) : loading ? (
            <Spinner className="min-h-[320px]" />
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <p className="text-center text-white">
                {error.message || "Failed to load analytics"}
              </p>
              <button
                type="button"
                onClick={onBack}
                className="rounded-lg bg-[#A294F9] px-4 py-2 font-[madina-semibold] text-sm text-white hover:bg-[#8b7ce8]"
              >
                Back to students
              </button>
            </div>
          ) : data ? (
            <div className="flex flex-col gap-8">
              <section className="rounded-lg border border-[#5a5a5a] bg-[#353535] p-4 sm:p-5">
                <h2 className="mb-4 font-[madina-semibold] text-base text-white">Identity & account</h2>
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="font-[madina-semibold] text-white">Email</dt>
                    <dd className="mt-0.5 text-white">{id?.email || "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-[madina-semibold] text-white">Phone</dt>
                    <dd className="mt-0.5 text-white">{id?.phone || "-"}</dd>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <dt className="font-[madina-semibold] text-white">Branch / group</dt>
                    <dd className="mt-0.5 text-white">
                      {(id?.branch_groups || []).length
                        ? id.branch_groups.join(", ")
                        : "-"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-[madina-semibold] text-white">Batch</dt>
                    <dd className="mt-0.5 text-white">{id?.batch ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="font-[madina-semibold] text-white">Active</dt>
                    <dd className="mt-0.5 text-white">
                      {id?.is_active ? "Yes" : "No"}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-[madina-semibold] text-white">Created</dt>
                    <dd className="mt-0.5 text-white">{formatDt(id?.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="font-[madina-semibold] text-white">Updated</dt>
                    <dd className="mt-0.5 text-white">{formatDt(id?.updated_at)}</dd>
                  </div>
                  <div>
                    <dt className="font-[madina-semibold] text-white">Last login</dt>
                    <dd className="mt-0.5 text-white">
                      {formatDt(id?.last_login || id?.last_login_timestamp)}
                    </dd>
                  </div>
                </dl>
              </section>

              <section className="rounded-lg border border-[#5a5a5a] bg-[#353535] p-4 sm:p-5">
                <h2 className="mb-4 font-[madina-semibold] text-base text-white">Login regularity</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-[#3a3a3a] p-4">
                    <p className="text-xs text-white">Streak (days)</p>
                    <p className="mt-1 font-[madina-semibold] text-2xl text-white">
                      {data.login_regularity?.current_streak_days ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#3a3a3a] p-4">
                    <p className="text-xs text-white">Logins (30d)</p>
                    <p className="mt-1 font-[madina-semibold] text-2xl text-white">
                      {data.login_regularity?.logins_last_30_days ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#3a3a3a] p-4">
                    <p className="text-xs text-white">Distinct days (30d)</p>
                    <p className="mt-1 font-[madina-semibold] text-2xl text-white">
                      {data.login_regularity?.distinct_login_days_last_30 ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#3a3a3a] p-4">
                    <p className="text-xs text-white">Total logins recorded</p>
                    <p className="mt-1 font-[madina-semibold] text-2xl text-white">
                      {data.login_regularity?.total_logins_recorded ?? 0}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-white">
                  Streak and login counts use the student app login history when available.
                </p>
              </section>

              <section className="rounded-lg border border-[#5a5a5a] bg-[#353535] p-4 sm:p-5">
                <h2 className="mb-4 font-[madina-semibold] text-base text-white">How results look</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-[#3a3a3a] p-4">
                    <p className="text-xs text-white">Avg exam score</p>
                    <p className="mt-1 font-[madina-semibold] text-xl text-white sm:text-2xl">
                      {data.performance_overview?.average_submitted_exam_score ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#3a3a3a] p-4">
                    <p className="text-xs text-white">Submitted attempts</p>
                    <p className="mt-1 font-[madina-semibold] text-xl text-white sm:text-2xl">
                      {data.performance_overview?.submitted_attempts_count ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#3a3a3a] p-4">
                    <p className="text-xs text-white">Contests (live)</p>
                    <p className="mt-1 font-[madina-semibold] text-xl text-white sm:text-2xl">
                      {data.performance_overview?.contests_completed_live ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#3a3a3a] p-4">
                    <p className="text-xs text-white">Contests (practice)</p>
                    <p className="mt-1 font-[madina-semibold] text-xl text-white sm:text-2xl">
                      {data.performance_overview?.contests_completed_practice ?? 0}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-[#5a5a5a] bg-[#353535] p-4 sm:p-5">
                <h2 className="mb-4 font-[madina-semibold] text-base text-white">Exam participation</h2>
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg bg-[#3a3a3a] px-4 py-3">
                    <span className="text-xs text-white">Eligible</span>
                    <p className="font-[madina-semibold] text-lg text-white">
                      {data.exam_participation?.eligible_exams ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#3a3a3a] px-4 py-3">
                    <span className="text-xs text-white">Started</span>
                    <p className="font-[madina-semibold] text-lg text-white">
                      {data.exam_participation?.exams_started ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#3a3a3a] px-4 py-3">
                    <span className="text-xs text-white">Submitted</span>
                    <p className="font-[madina-semibold] text-lg text-white">
                      {data.exam_participation?.exams_with_submission ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#3a3a3a] px-4 py-3">
                    <span className="text-xs text-white">No-show (eligible)</span>
                    <p className="font-[madina-semibold] text-lg text-white">
                      {data.exam_participation?.no_show_eligible ?? 0}
                    </p>
                  </div>
                </div>
                <h3 className="mb-2 font-[madina-semibold] text-sm text-white">Assessments attempted</h3>
                <p className="mb-3 text-xs text-white">
                  Campus exams, ranked assessments, and contests (practice and job-only exams are excluded). Each row
                  is an attempt; totals are MCQ + coding. In-progress rows show scores so far.
                </p>
                <div className="max-h-72 overflow-auto rounded-lg border border-[#555] sm:max-h-96">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="sticky top-0 z-[1] bg-[#4a4a4a] font-[madina-semibold] text-white">
                      <tr>
                        <th className="px-3 py-3">Exam</th>
                        <th className="px-3 py-3">Type</th>
                        <th className="px-3 py-3">#</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3">Marks obtained</th>
                        <th className="px-3 py-3">MCQ</th>
                        <th className="px-3 py-3">Coding</th>
                        <th className="px-3 py-3">Finished</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.ranked_exam_attempts || []).length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="px-3 py-10 text-center text-white"
                          >
                            No assessment attempts yet (submitted or in progress) for this student in your
                            organization.
                          </td>
                        </tr>
                      ) : (
                        (data.ranked_exam_attempts || []).map((row) => (
                          <tr key={row.attempt_id} className="border-t border-[#555] text-white">
                            <td className="max-w-[200px] truncate px-3 py-2.5" title={row.exam_name}>
                              {row.exam_name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-white">
                              {assessmentTypeLabel(row.assessment_type)}
                              {row.is_ranked_flag ? (
                                <span className="ml-1 font-[madina-semibold] text-[10px] text-white">(CTC)</span>
                              ) : null}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5">{row.attempt_number}</td>
                            <td className="whitespace-nowrap px-3 py-2.5">
                              {statusLabel(row.status)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 font-[madina-semibold] text-white">
                              {row.marks_obtained}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-white">{row.mcq_score}</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-white">{row.coding_score}</td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-white">
                              {row.end_time ? formatDt(row.end_time) : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rounded-lg border border-[#5a5a5a] bg-[#353535] p-4 sm:p-5">
                <h2 className="mb-1 font-[madina-semibold] text-base text-white">Assessment score progress: graphs</h2>
                <p className="mb-4 text-xs text-white">
                  Same scope as the table above: <strong className="text-white">campus, ranked, and contest</strong>{" "}
                  finishes (submitted attempts, total score). Line = score over time; bars = finishes in order. If
                  none, charts fall back to all exam types including practice.
                </p>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <div>
                    <h3 className="mb-2 font-[madina-semibold] text-sm text-white">Trend (line)</h3>
                    <ScoreLineChart
                      points={examSeries}
                      color="#A294F9"
                      footnote="Total score (MCQ + coding) at each submitted finish, oldest → newest."
                    />
                  </div>
                  <div>
                    <h3 className="mb-2 font-[madina-semibold] text-sm text-white">Per finish (bars)</h3>
                    <ScoreBarChart
                      points={examSeries}
                      color="#A294F9"
                      footnote="Each bar is one submitted assessment in chronological order."
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-[#5a5a5a] bg-[#353535] p-4 sm:p-5">
                <h2 className="mb-1 font-[madina-semibold] text-base text-white">Contest scores: graphs</h2>
                <p className="mb-4 text-xs text-white">
                  Based on finished contest attempts (live and practice). Same layout as exams.
                </p>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <div>
                    <h3 className="mb-2 font-[madina-semibold] text-sm text-white">Trend (line)</h3>
                    <ScoreLineChart points={contestSeries} color="#34d399" />
                  </div>
                  <div>
                    <h3 className="mb-2 font-[madina-semibold] text-sm text-white">Per finish (bars)</h3>
                    <ScoreBarChart points={contestSeries} color="#34d399" />
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-[#5a5a5a] bg-[#353535] p-4 sm:p-5">
                <h2 className="mb-4 font-[madina-semibold] text-base text-white">Section strengths</h2>
                <div className="max-h-72 overflow-auto rounded-lg border border-[#555]">
                  {(data.section_breakdown || []).length === 0 ? (
                    <p className="p-4 text-sm text-white">No graded section data yet.</p>
                  ) : (
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 z-[1] bg-[#4a4a4a] font-[madina-semibold] text-white">
                        <tr>
                          <th className="px-3 py-3">Section</th>
                          <th className="px-3 py-3">Marks</th>
                          <th className="px-3 py-3">Accuracy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.section_breakdown.map((s) => (
                          <tr key={s.section} className="border-t border-[#555]">
                            <td className="px-3 py-2.5 text-white">{s.section}</td>
                            <td className="px-3 py-2.5 text-white">
                              {s.obtained}/{s.max}
                            </td>
                            <td className="px-3 py-2.5 text-white">{s.accuracy}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-[#5a5a5a] bg-[#353535] p-4 sm:p-5">
                <h2 className="mb-1 font-[madina-semibold] text-base text-white">Custom learning</h2>
                <p className="mb-4 text-sm text-white">
                  Courses assigned to this student from admin (Custom Learning assignments only).
                </p>
                <div className="mb-4 flex flex-wrap gap-4 text-sm">
                  <span className="text-white">
                    Assigned:{" "}
                    <strong className="text-white">
                      {data.custom_learning?.modules_assigned_count ?? 0}
                    </strong>
                  </span>
                  <span className="text-white">
                    Fully completed:{" "}
                    <strong className="text-white">
                      {data.custom_learning?.modules_fully_completed_count ?? 0}
                    </strong>
                  </span>
                </div>
                {(data.custom_learning?.modules || []).length === 0 ? (
                  <p className="text-sm text-white">No admin-assigned custom courses for this student yet.</p>
                ) : (
                  <div className="max-h-48 space-y-2 overflow-y-auto">
                    {(data.custom_learning?.modules || []).map((m) => (
                      <div
                        key={m.module_id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-[#555] bg-[#3a3a3a] px-4 py-3 text-sm"
                      >
                        <span className="truncate text-white" title={m.name}>
                          {m.name}
                        </span>
                        <span className="shrink-0 font-[madina-semibold] text-white">
                          {m.chapters_completed}/{m.chapters_total} ({m.progress_percent}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-[#5a5a5a] bg-[#353535] p-4 sm:p-5">
                <h2 className="mb-1 font-[madina-semibold] text-base text-white">Skill center</h2>
                <p className="mb-4 text-sm text-white">
                  All modules this student has activity in (admin-assigned custom courses plus catalog /
                  self-serve). Completed vs in progress uses chapter state from StudyLog.
                </p>
                <p className="mb-4 text-xs text-white">
                  Modules on file:{" "}
                  <strong className="text-white">
                    {data.skill_center_activity?.modules_tracked_count ??
                      (
                        data.skill_center_activity?.modules ??
                        data.custom_learning?.modules ??
                        []
                      ).length}
                  </strong>
                </p>
                <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="rounded-lg border border-emerald-700/30 bg-[#2a2a2a] px-4 py-4 text-center sm:px-5 sm:py-5">
                    <p className="font-[madina-semibold] text-xs uppercase tracking-wide text-white">
                      Courses completed
                    </p>
                    <p className="mt-2 font-[madina-semibold] text-3xl tabular-nums text-white sm:text-4xl">
                      {skillCenter.completed.length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#A294F9]/35 bg-[#2a2a2a] px-4 py-4 text-center sm:px-5 sm:py-5">
                    <p className="font-[madina-semibold] text-xs uppercase tracking-wide text-white">Ongoing</p>
                    <p className="mt-2 font-[madina-semibold] text-3xl tabular-nums text-white sm:text-4xl">
                      {skillCenter.ongoing.length}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="flex min-h-[200px] flex-col rounded-lg border border-[#555] bg-[#2d2d2d] p-4">
                    <h3 className="mb-3 font-[madina-semibold] text-sm text-white">Completed courses</h3>
                    {skillCenter.completed.length === 0 ? (
                      <p className="text-sm text-white">No fully completed modules yet.</p>
                    ) : (
                      <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
                        {skillCenter.completed.map((m) => (
                          <li
                            key={m.module_id}
                            className="flex items-center justify-between gap-2 rounded-md bg-[#353535] px-3 py-2 text-white"
                          >
                            <span className="truncate font-[madina-regular]" title={m.name}>
                              {m.name}
                              {m.admin_assigned ? (
                                <span className="ml-2 shrink-0 rounded bg-emerald-900/40 px-1.5 py-0.5 font-[madina-semibold] text-[10px] uppercase tracking-wide text-white">
                                  Admin
                                </span>
                              ) : (
                                <span className="ml-2 shrink-0 rounded bg-gray-600/50 px-1.5 py-0.5 font-[madina-semibold] text-[10px] uppercase tracking-wide text-white">
                                  Catalog
                                </span>
                              )}
                            </span>
                            <span className="shrink-0 text-xs text-white">
                              {m.chapters_completed}/{m.chapters_total} ch.
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex min-h-[200px] flex-col rounded-lg border border-[#555] bg-[#2d2d2d] p-4">
                    <h3 className="mb-3 font-[madina-semibold] text-sm text-white">Ongoing courses</h3>
                    {skillCenter.ongoing.length === 0 ? (
                      <p className="text-sm text-white">
                        No courses in progress (no chapters in progress or partially completed).
                      </p>
                    ) : (
                      <ul className="max-h-56 space-y-3 overflow-y-auto text-sm">
                        {skillCenter.ongoing.map((m) => (
                          <li key={m.module_id} className="rounded-md bg-[#353535] px-3 py-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate font-[madina-regular] text-white" title={m.name}>
                                {m.name}
                                {m.admin_assigned ? (
                                  <span className="ml-2 shrink-0 rounded bg-[#A294F9]/20 px-1.5 py-0.5 font-[madina-semibold] text-[10px] uppercase tracking-wide text-white">
                                    Admin
                                  </span>
                                ) : (
                                  <span className="ml-2 shrink-0 rounded bg-gray-600/50 px-1.5 py-0.5 font-[madina-semibold] text-[10px] uppercase tracking-wide text-white">
                                    Catalog
                                  </span>
                                )}
                              </span>
                              <span className="shrink-0 text-xs text-white">
                                {m.chapters_completed}/{m.chapters_total} · {m.progress_percent}%
                              </span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1f1f1f]">
                              <div
                                className="h-full rounded-full bg-[#A294F9] transition-all"
                                style={{
                                  width: `${Math.min(100, Math.max(0, Number(m.progress_percent) || 0))}%`,
                                }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {skillCenter.notStarted.length > 0 ? (
                  <p className="mt-4 text-xs text-white">
                    No chapter progress yet:{" "}
                    <span className="text-white">{skillCenter.notStarted.length}</span> module(s) on file
                    (e.g. catalog enrolled or assigned) with no completed or in-progress chapter.
                  </p>
                ) : null}
              </section>

              <section className="rounded-lg border border-[#5a5a5a] bg-[#353535] p-4 sm:p-5">
                <h2 className="mb-4 font-[madina-semibold] text-base text-white">Attempt history</h2>
                {detailLoading ? (
                  <p className="mb-2 text-sm text-white">Loading attempt…</p>
                ) : null}
                <div className="max-h-96 overflow-auto rounded-lg border border-[#555]">
                  <table className="w-full min-w-[480px] text-left text-sm">
                    <thead className="sticky top-0 z-[1] bg-[#4a4a4a] font-[madina-semibold] text-white">
                      <tr>
                        <th className="px-3 py-3">Exam</th>
                        <th className="px-3 py-3">#</th>
                        <th className="px-3 py-3">Total</th>
                        <th className="px-3 py-3">Trust</th>
                        <th className="px-3 py-3">Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.attempt_history || []).map((row) => (
                        <tr key={row.attempt_id} className="border-t border-[#555]">
                          <td
                            className="max-w-[200px] truncate px-3 py-2.5 text-white"
                            title={row.exam_name}
                          >
                            {row.exam_name}
                          </td>
                          <td className="px-3 py-2.5 text-white">{row.attempt_number}</td>
                          <td className="px-3 py-2.5 text-white">{row.total_score}</td>
                          <td className="px-3 py-2.5 text-white">{row.trust_score}</td>
                          <td className="px-3 py-2.5">
                            {row.status === "submitted" ? (
                              <button
                                type="button"
                                onClick={() => loadAttemptDetail(row)}
                                className="font-[madina-semibold] text-white hover:underline"
                              >
                                View
                              </button>
                            ) : (
                              <span className="text-white">{row.status}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section
                className={`relative overflow-hidden rounded-xl border p-0 ${progressSummaryUi.shell}`}
              >
                <div className="relative flex flex-col sm:flex-row sm:gap-1">
                  <div
                    className={`h-1 w-full shrink-0 bg-gradient-to-r sm:hidden ${progressSummaryUi.railMobile}`}
                    aria-hidden
                  />
                  <div
                    className={`hidden w-1.5 shrink-0 bg-gradient-to-b sm:block ${progressSummaryUi.rail}`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${progressSummaryUi.iconBox}`}
                        aria-hidden
                      >
                        {createElement(progressSummaryUi.Icon, {
                          className: "h-5 w-5 sm:h-6 sm:w-6",
                        })}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-[madina-semibold] text-[11px] uppercase tracking-[0.14em] text-white/75">
                          {progressComment.tone === "positive"
                            ? "Positive outlook"
                            : progressComment.tone === "attention"
                              ? "Needs attention"
                              : "Balanced view"}
                        </p>
                        <h2 className="mt-1 font-[madina-semibold] text-base text-white sm:text-lg">
                          Progress summary (comment)
                        </h2>
                        <p className="mt-3 font-[madina-semibold] text-sm leading-snug text-white sm:text-[15px]">
                          {progressComment.title}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`mt-6 space-y-3.5 border-t pt-5 text-sm leading-relaxed text-white sm:space-y-4 ${progressSummaryUi.listTop}`}
                    >
                      {progressComment.lines.map((line, idx) => (
                        <p key={idx} className="flex gap-3 sm:gap-3.5">
                          <span
                            className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full sm:mt-2.5 ${progressSummaryUi.bullet}`}
                            aria-hidden
                          />
                          <span className="min-w-0 font-[madina-regular]">{line}</span>
                        </p>
                      ))}
                    </div>

                    <p
                      className={`mt-6 border-t pt-4 text-xs leading-relaxed text-white/90 ${progressSummaryUi.disclaimerRule}`}
                    >
                      {progressComment.disclaimer}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

export default StudentAnalyticsPage;
