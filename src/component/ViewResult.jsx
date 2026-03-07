import React, { useState, useEffect } from "react";
import { log, error as logError } from "../utils/logger";
import { FaSearch, FaFileExcel, FaChevronLeft } from "react-icons/fa";
import Swal from "sweetalert2";
import { authFetch } from "../scripts/AuthProvider";

const ViewResult = ({ result, onBack, onNext }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const filteredStudents = result.students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.usn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / itemsPerPage)
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const formatScore = (val) =>
    typeof val === "number" ? val.toFixed(2) : val;

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
          {currentStudents.length === 0 ? (
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
                  className="w-full rounded-lg bg-[#8E5DAF] py-3 text-sm font-medium text-white transition-colors hover:bg-[#7421ac]"
                >
                  View
                </button>
              </div>
            ))
          )}
        </div>

        {/* Desktop: table - fixed height for 10 rows, not scrollable */}
        <div className="mt-1 hidden h-[584px] rounded-lg md:block">
          <div className="h-full overflow-x-auto rounded-lg border border-[#5a5a5a]">
            <table className="w-full min-w-[640px] table-auto border-collapse">
              <thead className="sticky top-0 z-10 bg-[#535353]">
                <tr>
                  <th className="whitespace-nowrap border-b border-[#666] px-4 py-3 text-center text-sm font-medium text-white">
                    USN
                  </th>
                  <th className="whitespace-nowrap border-b border-[#666] px-4 py-3 text-left text-sm font-medium text-white">
                    Name
                  </th>
                  <th className="whitespace-nowrap border-b border-[#666] px-4 py-3 text-center text-sm font-medium text-white">
                    Start Time
                  </th>
                  <th className="whitespace-nowrap border-b border-[#666] px-4 py-3 text-center text-sm font-medium text-white">
                    End Time
                  </th>
                  <th className="whitespace-nowrap border-b border-[#666] px-4 py-3 text-center text-sm font-medium text-white">
                    Score
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
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-lg bg-[#8E5DAF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7421ac]"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination - scroll down to reach */}
        {totalPages > 1 && filteredStudents.length > 0 && (
          <div className="flex items-center justify-center gap-5 border-t border-[#5a5a5a] py-6 pt-6 sm:gap-6">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
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
              disabled={currentPage === totalPages}
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
