import React, { useRef, useState, useEffect } from "react";
import { error as logError } from "../utils/logger";
import { motion } from "framer-motion";
import { FaChevronLeft, FaCloudUploadAlt } from "react-icons/fa";
import { authFetch } from "../scripts/AuthProvider";
import Swal from "sweetalert2";

const inputClass =
  "w-full rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#A294F9] focus:ring-2 focus:ring-[#A294F9]/30";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-300";

const ChapterAdding = ({ onBackcc, onNextcc }) => {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [chapterInput, setChapterInput] = useState({
    chapterName: "",
    description: "",
    priority: "",
    question: "",
    expectedOutput: "",
  });
  const [chapterList, setChapterList] = useState([]);
  const [expandedIndex, setExpandedIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState(null);
  const [currentModuleName, setCurrentModuleName] = useState("");

  useEffect(() => {
    const moduleId = localStorage.getItem("currentModuleId");
    const moduleName = localStorage.getItem("currentModuleName");
    if (moduleId) {
      setCurrentModuleId(moduleId);
      setCurrentModuleName(moduleName || "Unknown Module");
    }
  }, []);

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files));
    setChapterList([
      {
        chapterName: "Loops",
        description: "Intro to loops",
        priority: 1,
        question: "Write a for loop",
        expectedOutput: "Loop output",
      },
      {
        chapterName: "Functions",
        description: "Functions in JS",
        priority: 2,
        question: "Create a function",
        expectedOutput: "Function Output",
      },
    ]);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setChapterInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChapter = async () => {
    const { chapterName, description, question, expectedOutput } = chapterInput;
    if (!chapterName?.trim() || !description?.trim() || !question?.trim() || !expectedOutput?.trim()) {
      Swal.fire({
        title: "Error!",
        text: "Please fill out all fields",
        icon: "error",
        background: "#181817",
        color: "#fff",
      });
      return;
    }
    if (!currentModuleId) {
      Swal.fire({
        title: "Error!",
        text: "No module selected. Please go back and create a module first.",
        icon: "error",
        background: "#181817",
        color: "#fff",
      });
      return;
    }

    try {
      setLoading(true);
      const chapterData = {
        module: parseInt(currentModuleId, 10),
        name: chapterName,
        desc: description,
        priority: chapterList.length + 1,
        question,
        expected_output: expectedOutput,
      };
      const response = await authFetch("/learning/chapters/", {
        method: "POST",
        body: JSON.stringify(chapterData),
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result = await response.json();
        const newChapter = {
          id: result.chapter_id,
          chapterName,
          description,
          priority: chapterList.length + 1,
          question,
          expectedOutput,
        };
        setChapterList((prev) => [...prev, newChapter]);
        setChapterInput({
          chapterName: "",
          description: "",
          priority: "",
          question: "",
          expectedOutput: "",
        });
        Swal.fire({
          title: "Success!",
          text: "Chapter added successfully!",
          icon: "success",
          iconColor: "#A294F9",
          background: "#181817",
          color: "#fff",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create chapter");
      }
    } catch (error) {
      logError("Error creating chapter:", error);
      Swal.fire({
        title: "Error!",
        text: error.message || "Failed to create chapter. Please try again.",
        icon: "error",
        background: "#181817",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const toggleExpand = (index) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  };

  const handleFinishAndNext = async () => {
    if (chapterList.length === 0) {
      Swal.fire({
        title: "Warning!",
        text: "Please add at least one chapter before proceeding.",
        icon: "warning",
        background: "#181817",
        color: "#fff",
      });
      return;
    }
    Swal.fire({
      title: "Success!",
      text: `Module "${currentModuleName}" created with ${chapterList.length} chapters!`,
      icon: "success",
      iconColor: "#A294F9",
      background: "#181817",
      color: "#fff",
    }).then(() => {
      onNextcc();
    });
  };

  return (
    <div className="flex min-h-[calc(100vh-6rem)] w-full max-w-full flex-col rounded-lg bg-[#282828] p-4 sm:p-5 md:p-6 md:pb-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBackcc}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] text-white transition-colors hover:bg-[#4a4a4a]"
            aria-label="Back"
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              Add Chapters
            </h1>
            {currentModuleName && (
              <p className="mt-1 text-sm text-gray-400">
                Adding chapters to: <span className="text-white">{currentModuleName}</span>
              </p>
            )}
            <div className="mt-2 h-0.5 w-full rounded bg-[#5a5a5a]" />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="mb-3 text-lg font-medium text-white">
              Import Chapters
            </h2>
            <div className="flex flex-col gap-3 rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] p-4 sm:flex-row sm:items-center sm:gap-4">
              <div className={`min-h-[44px] flex-1 rounded-lg border border-[#5a5a5a] bg-[#353535] px-4 py-2.5 text-sm ${files.length ? "text-white" : "text-gray-500"}`}>
                {files.length === 0
                  ? "Upload here"
                  : files.length === 1
                    ? files[0].name
                    : `${files.length} files selected`}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={handleUploadClick}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8b7ce8]"
              >
                <FaCloudUploadAlt className="h-4 w-4" /> Upload
              </button>
            </div>
            <p className="mt-2 text-center text-sm text-gray-400">Or</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-[#5a5a5a] bg-[#3d3d3d] p-4 sm:p-5">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Create Chapter Manually
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Chapter Name</label>
                  <input
                    name="chapterName"
                    value={chapterInput.chapterName}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="Enter chapter name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <textarea
                    name="description"
                    value={chapterInput.description}
                    onChange={handleInputChange}
                    placeholder="Enter description"
                    rows={3}
                    className={`${inputClass} min-h-[80px] resize-y`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Priority (Chapter No.)</label>
                  <input
                    name="priority"
                    value={chapterInput.priority}
                    onChange={handleInputChange}
                    type="number"
                    placeholder="e.g., 1"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Question</label>
                  <textarea
                    name="question"
                    value={chapterInput.question}
                    onChange={handleInputChange}
                    placeholder="Enter question"
                    rows={3}
                    className={`${inputClass} min-h-[80px] resize-y`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Expected Output</label>
                  <textarea
                    name="expectedOutput"
                    value={chapterInput.expectedOutput}
                    onChange={handleInputChange}
                    placeholder="Enter expected output"
                    rows={3}
                    className={`${inputClass} min-h-[80px] resize-y`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveChapter}
                  disabled={loading}
                  className="rounded-lg cursor-pointer bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8b7ce8] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving..." : "Save Chapter"}
                </button>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto rounded-xl border border-[#5a5a5a] bg-[#3d3d3d] p-4 sm:p-5">
              <h3 className="mb-4 text-lg font-semibold text-white">
                Chapter Preview
              </h3>
              {chapterList.length === 0 ? (
                <p className="text-gray-500 italic">No chapters yet</p>
              ) : (
                <div className="space-y-3">
                  {chapterList.map((item, index) => (
                    <div
                      key={index}
                      onClick={() => toggleExpand(index)}
                      className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                        expandedIndex === index
                          ? "border-[#A294F9] bg-[#4a4a4a]"
                          : "border-[#5a5a5a] bg-[#353535] hover:bg-[#404040]"
                      }`}
                    >
                      <h4 className="font-medium text-white">
                        {item.priority}. {item.chapterName}
                      </h4>
                      {expandedIndex === index && (
                        <div className="mt-3 space-y-2 text-sm">
                          <div>
                            <span className="text-gray-400">Description: </span>
                            <p className="mt-1 rounded bg-[#282828] p-2 text-gray-300">
                              {item.description}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Question: </span>
                            <p className="mt-1 rounded bg-[#282828] p-2 text-gray-300">
                              {item.question}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-400">Expected Output: </span>
                            <p className="mt-1 rounded bg-[#282828] p-2 text-gray-300">
                              {item.expectedOutput}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 border-t border-[#5a5a5a] pt-6 sm:flex-row">
            <button
              type="button"
              onClick={onBackcc}
              className="w-full rounded-lg cursor-pointer border border-[#5a5a5a] bg-transparent py-2.5 text-sm font-medium text-white hover:bg-white/5 sm:w-auto sm:px-6"
            >
              Back
            </button>
            <span className="text-sm text-gray-400">Step 2/3</span>
            <button
              type="button"
              onClick={handleFinishAndNext}
              className="w-full rounded-lg cursor-pointer bg-[#8E5DAF] py-2.5 text-sm font-medium text-white hover:bg-[#7421ac] sm:w-auto sm:px-6"
            >
              Finish & Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterAdding;
