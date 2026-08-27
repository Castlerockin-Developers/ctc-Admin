import React, { useState, useEffect } from "react";
import { log, error as logError } from "../utils/logger";
import { FaSearch, FaFileExcel, FaChevronLeft, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import Swal from "sweetalert2";
import { authFetch } from "../scripts/AuthProvider";

const ITEMS_PER_PAGE = 50;

const SORT_OPTIONS = [
  { key: "usn", label: "USN" },
  { key: "name", label: "Name" },
  { key: "marks", label: "Marks" },
];

const mapAttemptToStudent = (a) => ({
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
});

const compareStudents = (a, b, sortBy, sortOrder) => {
  let cmp = 0;
  if (sortBy === "usn") {
    cmp = String(a.usn || "").localeCompare(String(b.usn || ""), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  } else if (sortBy === "name") {
    cmp = String(a.name || "").localeCompare(String(b.name || ""), undefined, {
      sensitivity: "base",
    });
  } else if (sortBy === "marks") {
    cmp = (Number(a.score) || 0) - (Number(b.score) || 0);
  }
  return sortOrder === "desc" ? -cmp : cmp;
};

const ViewResult = ({ result, onBack, onNext }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [students, setStudents] = useState([]);
  const [loadingPage, setLoadingPage] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const itemsPerPage = ITEMS_PER_PAGE;
  const totalAttemptsCount = result?.attemptsCount ?? 0;
  const isServerPaginated = totalAttemptsCount > 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [result?.id, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    if (!result?.id || !isServerPaginated) {
      if (result?.students) setStudents(result.students);
      return;
    }
    let cancelled = false;
    setLoadingPage(true);
    const params = new URLSearchParams();
    params.set("attempts_page", String(currentPage));
    params.set("attempts_page_size", String(itemsPerPage));
    params.set("page_size", String(itemsPerPage));
    if (sortBy) {
      params.set("attempts_sort", sortBy);
      params.set("attempts_order", sortOrder);
    }
    const url = `/admin/results/${result.id}/?${params.toString()}`;
    authFetch(url, { method: "GET" })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("Failed to load")))
      .then((data) => {
        if (!cancelled && data.attempts) {
          setStudents(data.attempts.map(mapAttemptToStudent));
        }
      })
      .catch((err) => {
        if (!cancelled) logError("ViewResult fetch page:", err);
      })
      .finally(() => { if (!cancelled) setLoadingPage(false); });
    return () => { cancelled = true; };
  }, [result?.id, currentPage, itemsPerPage, isServerPaginated, sortBy, sortOrder]);

  if (!result) {
    return (
      <div className="flex h-[87vh] items-center justify-center rounded-lg bg-[#282828] text-gray-400">
        No result selected
      </div>
    );
  }

  const viewExam = async (student) => {
    const response = await authFetch(
      "/admin/results/individual-results/" + student.attempt_id + "/",
      { method: "GET" }
    );
    if (response.ok) {
      const data = await response.json();
      const examData = {
        ...student,
        sections: data.reportData.sections.map((section) => ({
          name: section.sectionName,
          obtainedMarks: section.obtainedMarks,
          totalMarks: section.maxMarks,
          questions: section.questionsAttempted.map((question) => ({
            question: question.question,
            yourAnswer: question.selectedAnswer,
            actualAnswer: question.correctAnswer,
            marks:
              question.correctAnswer === question.selectedAnswer ? 1 : 0,
            status:
              question.correctAnswer === question.selectedAnswer
                ? "Correct"
                : "Incorrect",
          })),
        })),
      };
      log("Exam Data:", examData);
      onNext(examData);
    } else {
      logError("Failed to fetch exam data:", response.statusText);
      Swal.fire({
        title: "Error",
        text: "Failed to fetch exam data. Please try again later.",
        icon: "error",
        background: "#1F1F1F",
        color: "#fff",
        confirmButtonColor: "#A294F9",
        showCloseButton: true,
      });
    }
  };

  const handleExportToExcel = async (resultData) => {
    const response = await authFetch(
      "/admin/results/full-report/" + resultData.id + "/",
      { method: "GET" }
    );
    if (!response.ok) {
      logError("Failed to fetch data for export:", response.statusText);
      Swal.fire({
        title: "Error",
        text: "Failed to export data. Please try again later.",
        icon: "error",
        background: "#1F1F1F",
        color: "#fff",
        confirmButtonColor: "#A294F9",
        showCloseButton: true,
      });
      return;
    }
    const blob = await response.blob();
    const fileName = `result_${resultData.id}.xlsx`;
    const { saveAs } = await import("file-saver");
    saveAs(blob, fileName);
  };

  const filteredStudents = students.map((student) => {
    const safeName = student.name || "N/A";
    const safeUsn = student.usn || "N/A";
    return { ...student, name: safeName, usn: safeUsn };
  }).filter(
    (student) =>
      (student.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.usn || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const sortedStudents = sortBy
    ? [...filteredStudents].sort((a, b) => compareStudents(a, b, sortBy, sortOrder))
    : filteredStudents;

  const totalPages = isServerPaginated
    ? Math.max(1, Math.ceil(totalAttemptsCount / itemsPerPage))
    : Math.max(1, Math.ceil(sortedStudents.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = isServerPaginated
    ? sortedStudents
    : sortedStudents.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const formatScore = (val) =>
    typeof val === "number" ? val.toFixed(2) : val;

  const sortIcon = (field) => {
    if (sortBy !== field) return <FaSort className="h-3 w-3 text-gray-400" />;
    return sortOrder === "asc" ? (
      <FaSortUp className="h-3 w-3 text-[#A294F9]" />
    ) : (
      <FaSortDown className="h-3 w-3 text-[#A294F9]" />
    );
  };

  return (
    <div className="flex max-h-[87vh] w-full max-w-full flex-col overflow-y-auto rounded-lg bg-[#282828] p-5 sm:p-6 md:p-8 md:pb-8">
      {/* Header: back + title + times */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] text-xl text-white transition-colors hover:bg-[#4a4a4a]"
            aria-label="Go back"
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 truncate text-lg font-semibold text-white sm:text-xl md:text-2xl">
            {result.id} – {result.name}
          </h1>
        </div>
        <div className="flex shrink-0 gap-8 text-sm text-white">
          <div className="space-y-1">
            <p className="text-gray-400">Start Time</p>
            <p className="font-medium">{result.startTime}</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-400">End Time</p>
            <p className="font-medium">{result.endTime}</p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4 md:gap-6">
        {[
          { label: "Students Attempted", value: result.studentsAttempted },
          { label: "Students Unattempted", value: result.studentsUnattempted },
          { label: "Malpractice", value: result.malpractice },
          {
            label: "Average Score",
            value: formatScore(result.averageScore),
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-[#666] bg-[#4B4B4B] p-5 sm:p-6"
          >
            <p className="text-sm text-gray-300">{label}</p>
            <p className="mt-3 text-xl font-semibold text-white sm:text-2xl">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Students section: label + search + export + table + pagination */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <p className="border-b-4 border-[#A294F9] pb-2 text-base font-bold text-white sm:text-lg">
            Students
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <div className="flex min-h-[44px] flex-1 min-w-0 items-center gap-2 rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2.5 transition-colors focus-within:border-[#A294F9] focus-within:ring-2 focus-within:ring-[#A294F9]/30">
              <FaSearch className="h-5 w-5 shrink-0 text-gray-300" />
              <input
                type="text"
                placeholder="Search results..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 border-none bg-transparent text-white outline-none placeholder:text-gray-400"
              />
            </div>
            <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setSortOrder("asc");
                }}
                aria-label="Sort by"
                className="min-h-[44px] rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-[#A294F9] focus:ring-2 focus:ring-[#A294F9]/30"
              >
                <option value="">Sort by</option>
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            <button
              type="button"
              onClick={() => handleExportToExcel(result)}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#9B005D] px-5 py-2.5 font-medium text-white shadow-md transition-colors hover:bg-[#8A004A]"
            >
              <FaFileExcel className="h-5 w-5 shrink-0" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Mobile: cards */}
        <div className="mt-1 flex flex-col gap-4 overflow-y-auto pb-2 md:hidden">
          {loadingPage ? (
            <div className="rounded-lg border border-[#5a5a5a] bg-[#353535] py-12 text-center text-gray-400">
              Loading…
            </div>
          ) : currentStudents.length === 0 ? (
            <div className="rounded-lg border border-[#5a5a5a] bg-[#353535] py-8 text-center text-gray-400">
              No students found
            </div>
          ) : (
            currentStudents.map((student, index) => (
              <div
                key={student.usn + index}
                className="flex flex-col gap-3 rounded-lg border border-[#5a5a5a] bg-[#3a3a3a] p-4 sm:p-5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">
                      {student.name}
                    </p>
                    <p className="text-xs text-gray-400">{student.usn}</p>
                  </div>
                  <span className="shrink-0 text-sm text-white">
                    Score: {formatScore(student.score)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-300">
                  <span className="text-gray-500">Start</span>
                  <span className="text-right">{student.startTime}</span>
                  <span className="text-gray-500">End</span>
                  <span className="text-right">{student.endTime}</span>
                  <span className="text-gray-500">Trust Score</span>
                  <span className="text-right text-white">
                    {formatScore(student.trustScore)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => viewExam(student)}
                  className="w-full cursor-pointer rounded-lg bg-[#8E5DAF] py-3 text-sm font-medium text-white transition-colors hover:bg-[#7421ac]"
                >
                  View
                </button>
              </div>
            ))
          )}
        </div>

        {/* Desktop: table — up to 50 rows per page, page scrolls if needed */}
        <div className="mt-1 hidden rounded-lg md:block">
          <div className="overflow-x-auto rounded-lg border border-[#5a5a5a]">
            {loadingPage ? (
              <div className="flex h-full items-center justify-center text-gray-400">
                Loading…
              </div>
            ) : (
            <table className="w-full min-w-[640px] table-auto border-collapse">
              <thead className="sticky top-0 z-10 bg-[#535353]">
                <tr>
                  <th className="whitespace-nowrap border-b border-[#666] px-4 py-3 text-center text-sm font-medium text-white">
                    <button
                      type="button"
                      onClick={() => handleSort("usn")}
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 text-white hover:text-[#A294F9]"
                    >
                      USN
                      {sortIcon("usn")}
                    </button>
                  </th>
                  <th className="whitespace-nowrap border-b border-[#666] px-4 py-3 text-left text-sm font-medium text-white">
                    <button
                      type="button"
                      onClick={() => handleSort("name")}
                      className="inline-flex cursor-pointer items-center gap-1.5 text-white hover:text-[#A294F9]"
                    >
                      Name
                      {sortIcon("name")}
                    </button>
                  </th>
                  <th className="whitespace-nowrap border-b border-[#666] px-4 py-3 text-center text-sm font-medium text-white">
                    Start Time
                  </th>
                  <th className="whitespace-nowrap border-b border-[#666] px-4 py-3 text-center text-sm font-medium text-white">
                    End Time
                  </th>
                  <th className="whitespace-nowrap border-b border-[#666] px-4 py-3 text-center text-sm font-medium text-white">
                    <button
                      type="button"
                      onClick={() => handleSort("marks")}
                      className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 text-white hover:text-[#A294F9]"
                    >
                      Score
                      {sortIcon("marks")}
                    </button>
                  </th>
                  <th className="whitespace-nowrap border-b border-[#666] px-4 py-3 text-center text-sm font-medium text-white">
                    Trust Score
                  </th>
                  <th className="whitespace-nowrap border-b border-[#666] px-4 py-3 text-center text-sm font-medium text-white">
                    {" "}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-gray-400"
                    >
                      No students found
                    </td>
                  </tr>
                ) : (
                  currentStudents.map((student, index) => (
                    <tr
                      key={student.usn + index}
                      className={`border-b border-[#555] transition-colors hover:bg-[#404040] ${
                        index % 2 === 0 ? "bg-[#393939]" : "bg-[#424242]"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-white">
                        {student.usn}
                      </td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-left text-sm text-white">
                        {student.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-white">
                        {student.startTime}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-white">
                        {student.endTime}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-white">
                        {formatScore(student.score)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-white">
                        {formatScore(student.trustScore)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => viewExam(student)}
                          className="inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-lg bg-[#8E5DAF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7421ac]"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            )}
          </div>
        </div>

        {/* Pagination - scroll down to reach */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-5 border-t border-[#5a5a5a] py-6 pt-6 sm:gap-6">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loadingPage}
              className="min-h-[44px] rounded-lg border border-[#5a5a5a] bg-transparent px-4 py-2.5 text-sm text-white transition-colors hover:border-gray-400 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="flex min-h-[44px] items-center text-sm text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loadingPage}
              className="min-h-[44px] rounded-lg border border-[#5a5a5a] bg-transparent px-4 py-2.5 text-sm text-white transition-colors hover:border-gray-400 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewResult;
