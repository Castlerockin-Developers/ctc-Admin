import React from "react";
import { error as logError } from "../utils/logger";
import { FaChevronLeft, FaFilePdf } from "react-icons/fa";
import Swal from "sweetalert2";
import { authFetch } from "../scripts/AuthProvider";

const ParticularResult = ({ student, onBack }) => {
  if (!student) {
    return (
      <div className="flex max-h-[87vh] items-center justify-center rounded-lg bg-[#282828] text-gray-400">
        No student data available
      </div>
    );
  }

  const formatScore = (val) =>
    typeof val === "number" ? val.toFixed(2) : val ?? "N/A";

  const onExportPDF = async () => {
    try {
      const response = await authFetch(
        "/exams/export-result/" + student.attempt_id + "/",
        { method: "GET" }
      );
      if (!response.ok) {
        logError("Failed to fetch PDF for export:", response.statusText);
        Swal.fire({
          title: "Error",
          text: "Failed to export PDF. Please try again later.",
          icon: "error",
          background: "#1F1F1F",
          color: "#fff",
          confirmButtonColor: "#A294F9",
          showCloseButton: true,
        });
        return;
      }
      const blob = await response.blob();
      const fileName = `result_${student.usn}.pdf`;
      const { saveAs } = await import("file-saver");
      saveAs(blob, fileName);
    } catch (err) {
      logError("Error exporting PDF:", err);
      Swal.fire({
        title: "Error",
        text: "An error occurred while exporting PDF.",
        icon: "error",
        background: "#1F1F1F",
        color: "#fff",
        confirmButtonColor: "#A294F9",
        showCloseButton: true,
      });
    }
  };

  return (
    <div className="flex max-h-[87vh] w-full max-w-full flex-col overflow-y-auto rounded-lg bg-[#282828] p-5 sm:p-6 md:p-8 md:pb-8">
      {/* Header: back + breadcrumb + name + USN */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] text-white transition-colors hover:bg-[#4a4a4a]"
            aria-label="Go back"
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-sm text-gray-400">
              Tests / <span className="text-gray-300">#{student.usn}</span>
            </p>
            <h1 className="mt-1 truncate text-xl font-semibold text-white sm:text-2xl">
              {student.name}
            </h1>
            <p className="mt-0.5 text-sm text-gray-400">{student.usn}</p>
          </div>
        </div>
        {/* Score cards */}
        <div className="flex shrink-0 gap-4 sm:gap-6">
          <div className="rounded-lg border border-[#666] bg-[#4B4B4B] px-5 py-4 sm:min-w-[140px]">
            <p className="text-sm text-gray-300">Obtained Score</p>
            <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">
              {formatScore(student.score)}
            </p>
          </div>
          <div className="rounded-lg border border-[#666] bg-[#4B4B4B] px-5 py-4 sm:min-w-[140px]">
            <p className="text-sm text-gray-300">Trust Score</p>
            <p className="mt-2 text-xl font-semibold text-white sm:text-2xl">
              {formatScore(student.trustScore)}
            </p>
          </div>
        </div>
      </div>

      {/* Exam Section */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <h2 className="text-lg font-semibold text-white sm:text-xl">
            Exam Section
          </h2>
          <button
            type="button"
            onClick={onExportPDF}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A294F9] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8b7ce8]"
            title="Export as PDF"
          >
            <FaFilePdf className="h-5 w-5 shrink-0" />
            <span>Export as PDF</span>
          </button>
        </div>

        <div className="rounded-lg border border-[#5a5a5a] bg-[#353535] overflow-hidden">
          <div className="max-h-[50vh] overflow-y-auto">
            {!student.sections?.length ? (
              <div className="px-4 py-8 text-center text-gray-400 sm:px-6">
                No section data available.
              </div>
            ) : (
              student.sections.map((section, sectionIndex) => (
              <div
                key={sectionIndex}
                className="border-b border-[#5a5a5a] last:border-b-0"
              >
                {/* Section header */}
                <div className="sticky top-0 z-10 bg-[#4a4a4a] px-4 py-3 sm:px-6">
                  <h3 className="font-semibold text-white">
                    {section.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-gray-400">
                    {section.obtainedMarks ?? "N/A"} / {section.totalMarks ?? "N/A"} marks
                  </p>
                </div>
                {/* Questions */}
                <div className="divide-y divide-[#555]">
                  {section.questions?.map((detail, qIndex) => (
                    <div
                      key={qIndex}
                      className="bg-[#3a3a3a] px-4 py-3 sm:px-6"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 text-sm text-white">
                          <span className="font-medium text-gray-400">
                            {qIndex + 1}.
                          </span>{" "}
                          {detail.question}
                        </p>
                        <div className="flex shrink-0 items-center gap-3">
                          <span
                            className={
                              detail.status === "Correct"
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {detail.status}
                          </span>
                          <span className="text-sm text-gray-400">
                            {detail.marks} mark{detail.marks !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <details className="group mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-[#A294F9] hover:underline">
                          View Answers
                        </summary>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg border border-[#555] bg-[#303030] p-4">
                            <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                              Your Answer
                            </h4>
                            <p className="text-sm text-white">
                              {detail.yourAnswer || "—"}
                            </p>
                          </div>
                          <div className="rounded-lg border border-[#555] bg-[#303030] p-4">
                            <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                              Actual Answer
                            </h4>
                            <p className="text-sm text-white">
                              {detail.actualAnswer || "—"}
                            </p>
                          </div>
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParticularResult;
