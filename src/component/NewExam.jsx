import { useEffect, useRef, useState } from "react";
import { log } from "../utils/logger";
import PropTypes from "prop-types";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Swal from "sweetalert2";
import { FaInfoCircle } from "react-icons/fa";

const STORAGE_KEY = "newExam";

const InfoTip = ({ text }) => (
  <span className="group relative inline-flex cursor-help" role="note" tabIndex={0}>
    <FaInfoCircle className="h-4 w-4 text-gray-400 hover:text-gray-300" aria-hidden="true" />
    <span className="absolute left-1/2 bottom-full z-10 mb-2 hidden w-48 -translate-x-1/2 rounded-lg border border-gray-600 bg-[#1F1F1F] px-3 py-2 text-xs text-white shadow-lg group-hover:block group-focus-within:block">
      {text}
    </span>
  </span>
);

const NewExam = ({
  onBack,
  onNext,
  setCreateExamRequest,
  isEditing = false,
  editExamData = null,
}) => {
  //
  const [isSubmitted, setIsSubmitted] = useState(false);

  // State variables for form fields
  const [testName, setTestName] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY}:testName`) || ""
  );
  const [examStartDate, setExamStartDate] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY}:examStartDate`) || ""
  );
  const [startTime, setStartTime] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY}:startTime`) || ""
  );
  const [examEndDate, setExamEndDate] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY}:examEndDate`) || ""
  );
  const [endTime, setEndTime] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY}:endTime`) || ""
  );
  const [timedTest, setTimedTest] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY}:timedTest`) === "true"
  );
  const [timer, setTimer] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY}:timer`) || ""
  );
  const [attemptsAllowed, setAttemptsAllowed] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY}:attemptsAllowed`) || ""
  );
  const [instructions, setInstructions] = useState(
    () => sessionStorage.getItem(`${STORAGE_KEY}:instructions`) || ""
  );

  const [errors, setErrors] = useState({});
  const startTimeInputRef = useRef(null);
  const endTimeInputRef = useRef(null);

  // compute "YYYY-MM-DD" string for today
  const today = new Date().toISOString().split("T")[0];
  const setNowTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // Populate form with existing exam data when editing
  useEffect(() => {
    if (isEditing && editExamData) {
      const startDateTime = new Date(editExamData.start_time);
      const endDateTime = new Date(editExamData.end_time);

      setTestName(editExamData.name || "");
      setExamStartDate(startDateTime.toISOString().split("T")[0]);
      setStartTime(startDateTime.toTimeString().slice(0, 5));
      setExamEndDate(endDateTime.toISOString().split("T")[0]);
      setEndTime(endDateTime.toTimeString().slice(0, 5));
      setTimedTest(editExamData.is_timed || false);
      setTimer(editExamData.timer ? editExamData.timer.toString() : "");
      setAttemptsAllowed(
        editExamData.attempts_allowed
          ? editExamData.attempts_allowed.toString()
          : ""
      );
      setInstructions(editExamData.instructions || "");
    }
    // When !isEditing, keep state from useState initializer (sessionStorage) so returning from step 2 preserves data
  }, [isEditing, editExamData]);

  // Clear session storage only on page unload (do not clear on unmount so step 2 -> back preserves data)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isEditing) clearSessionStorage();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isEditing]);

  // 2) Write back on every change
  useEffect(() => {
    sessionStorage.setItem(`${STORAGE_KEY}:testName`, testName);
  }, [testName]);
  useEffect(() => {
    sessionStorage.setItem(`${STORAGE_KEY}:examStartDate`, examStartDate);
  }, [examStartDate]);
  useEffect(() => {
    sessionStorage.setItem(`${STORAGE_KEY}:startTime`, startTime);
  }, [startTime]);
  useEffect(() => {
    sessionStorage.setItem(`${STORAGE_KEY}:examEndDate`, examEndDate);
  }, [examEndDate]);
  useEffect(() => {
    sessionStorage.setItem(`${STORAGE_KEY}:endTime`, endTime);
  }, [endTime]);
  useEffect(() => {
    sessionStorage.setItem(`${STORAGE_KEY}:timedTest`, String(timedTest));
  }, [timedTest]);
  useEffect(() => {
    sessionStorage.setItem(`${STORAGE_KEY}:timer`, timer);
  }, [timer]);
  useEffect(() => {
    sessionStorage.setItem(`${STORAGE_KEY}:attemptsAllowed`, attemptsAllowed);
  }, [attemptsAllowed]);
  useEffect(() => {
    sessionStorage.setItem(`${STORAGE_KEY}:instructions`, instructions);
  }, [instructions]);

  // Helper to show SweetAlert2 warning/error messages for the summary popup
  const showErrorSummaryAlert = (title, text) => {
    Swal.fire({
      title,
      html: `<span style="color: #ff4d4f;">${text}</span>`, // Red text for summary popup
      icon: "warning",
      confirmButtonText: "OK",
      background: "#181817",
      color: "#fff",
    });
  };

  // Consolidated validation function that returns an object of errors.
  // This function runs ALL validations and is the single source of truth for errors.
  const runAllValidations = () => {
    const currentErrors = {}; // Start with a fresh, empty error object for each validation run

    // --- Individual Field Validations ---
    if (!testName.trim()) {
      //
      currentErrors.testName = "Test Name is required."; //
    }

    // Skip start date and start time validation when editing
    if (!isEditing) {
      if (!examStartDate) {
        currentErrors.examStartDate = "Exam Start Date is required.";
      } else {
        const startDate = new Date(examStartDate);
        if (isNaN(startDate.getTime())) {
          currentErrors.examStartDate = "Invalid Start Date format.";
        } else if (startDate.getFullYear() > 9999) {
          currentErrors.examStartDate = "Year in Start Date must be 4 digits.";
        }
      }
      if (!startTime) {
        //
        currentErrors.startTime = "Start Time is required."; //
      }
    }
    if (!examEndDate) {
      currentErrors.examEndDate = "Exam End Date is required.";
    } else {
      const endDate = new Date(examEndDate);
      if (isNaN(endDate.getTime())) {
        currentErrors.examEndDate = "Invalid End Date format.";
      } else if (endDate.getFullYear() > 9999) {
        currentErrors.examEndDate = "Year in End Date must be 4 digits.";
      }
    }
    if (!endTime) {
      //
      currentErrors.endTime = "End Time is required."; //
    }
    if (timedTest) {
      // Only validate timer if timedTest is true
      if (!timer || isNaN(parseInt(timer)) || parseInt(timer) <= 0) {
        //
        currentErrors.timer = "Timer duration must be a positive number."; //
      }
    }
    if (
      !attemptsAllowed ||
      isNaN(parseInt(attemptsAllowed)) ||
      parseInt(attemptsAllowed) <= 0
    ) {
      //
      currentErrors.attemptsAllowed =
        "Attempts Allowed must be a positive number."; //
    }
    const strippedInstructions = instructions.replace(/<[^>]*>?/gm, "").trim(); //
    if (!strippedInstructions) {
      //
      currentErrors.instructions = "Instructions are required."; //
    }

    // --- Cross-field Date/Time Validations ---
    // Only run these if the basic date/time fields are present to avoid "Invalid Date" errors
    const isStartDateValidInput = examStartDate && startTime;
    const isEndDateValidInput = examEndDate && endTime;

    // Skip start date/time validation when editing
    if (isStartDateValidInput && !isEditing) {
      //
      const startDateTime = new Date(`${examStartDate}T${startTime}`); //
      const currentDateTime = new Date(); // Get current date and time

      // To avoid issues with milliseconds, compare at minute level.
      // Adjust current time to remove seconds/milliseconds for comparison clarity.
      const currentDateTimeAdjusted = new Date(
        currentDateTime.getFullYear(),
        currentDateTime.getMonth(),
        currentDateTime.getDate(),
        currentDateTime.getHours(),
        currentDateTime.getMinutes(),
        0,
        0
      ); // Set seconds and milliseconds to 0

      if (
        startDateTime.getTime() < currentDateTimeAdjusted.getTime() &&
        !currentErrors.examStartDate
      ) {
        //
        currentErrors.examStartDate = "Start date/time cannot be in the past."; //
      }
    }

    if (isStartDateValidInput && isEndDateValidInput) {
      //
      const startDateTime = new Date(`${examStartDate}T${startTime}`); //
      const endDateTime = new Date(`${examEndDate}T${endTime}`); //

      // Exam End Date/Time must be strictly after Exam Start Date/Time
      if (
        endDateTime.getTime() <= startDateTime.getTime() &&
        !currentErrors.examEndDate
      ) {
        //
        currentErrors.examEndDate =
          "End date/time must be after start date/time."; //
      }
    }

    setErrors(currentErrors);
    return { valid: Object.keys(currentErrors).length === 0, errors: currentErrors };
  };

  const handleNext = () => {
    setIsSubmitted(true);
    const { valid: formIsValid, errors: validationErrors } = runAllValidations();

    if (formIsValid) {
      setCreateExamRequest({
        exam: {
          testName,
          examStartDate,
          examEndDate,
          startTime,
          endTime,
          timedTest,
          timer: timedTest ? parseInt(timer) : null,
          attemptsAllowed: parseInt(attemptsAllowed),
          instructions,
        },
      });
      // Do not clear session storage here so returning from step 2 keeps step 1 data
      onNext();
    } else {
      const uniqueErrorMessages = [...new Set(Object.values(validationErrors).filter((msg) => msg !== ""))];
      if (uniqueErrorMessages.length > 0) {
        showErrorSummaryAlert("Validation Errors", uniqueErrorMessages.join("<br/>"));
      } else {
        showErrorSummaryAlert("Form Incomplete", "Please fill out all required fields and correct any errors.");
      }
    }
  };

  // Function to clear all session storage data related to exam creation
  const clearSessionStorage = () => {
    log("NewExam - Clearing session storage data");

    // Clear NewExam component session storage
    const newExamKeys = [
      `${STORAGE_KEY}:testName`,
      `${STORAGE_KEY}:examStartDate`,
      `${STORAGE_KEY}:startTime`,
      `${STORAGE_KEY}:examEndDate`,
      `${STORAGE_KEY}:endTime`,
      `${STORAGE_KEY}:timedTest`,
      `${STORAGE_KEY}:timer`,
      `${STORAGE_KEY}:attemptsAllowed`,
      `${STORAGE_KEY}:instructions`,
    ];

    // Clear AddQuestion component session storage
    const addQuestionKeys = [
      "mcqQuestions",
      "codingQuestions",
      "sectionTimers",
    ];

    // Clear AddStudents component session storage
    const addStudentsKeys = [
      "addStudents_allBranch",
      "addStudents_addedBranch",
      "addStudents_list",
    ];

    // Clear all keys
    [...newExamKeys, ...addQuestionKeys, ...addStudentsKeys].forEach((key) => {
      sessionStorage.removeItem(key);
      log(`NewExam - Cleared session storage key: ${key}`);
    });

    log("NewExam - Session storage cleared successfully");
  };

  const inputBase = "w-full rounded-lg border border-gray-500 bg-[#3d3d3d] px-4 py-3 text-white placeholder:text-gray-500 focus:border-[#A294F9] focus:ring-2 focus:ring-[#A294F9]/30 outline-none transition-colors";
  const labelBase = "mb-1.5 block text-sm font-medium text-gray-300";
  const FieldError = ({ name }) => (isSubmitted && errors[name] ? <p className="mt-1 text-xs text-red-400">{errors[name]}</p> : null);

  return (
    <>
    <style>{`
      /* Override external NewExam.css .ql-toolbar/.ql-container (left, margin-left, width) and make responsive */
      [data-new-exam-quill] .quill,
      [data-new-exam-quill] .ql-snow {
        max-width: 100% !important; width: 100% !important; box-sizing: border-box;
        padding: 0 !important; margin: 0 !important; padding-left: 0 !important; margin-left: 0 !important;
        left: 0 !important; position: relative !important;
      }
      [data-new-exam-quill] .ql-toolbar.ql-snow,
      [data-new-exam-quill] .ql-container.ql-snow { border: none !important; }
      [data-new-exam-quill] .ql-container {
        max-width: 100% !important; width: 100% !important; min-width: 0; box-sizing: border-box;
        padding: 0 !important; margin: 0 !important; padding-left: 0 !important; margin-left: 0 !important;
        left: 0 !important; position: relative !important;
        border-radius: 0 0 0.5rem 0.5rem;
      }
      [data-new-exam-quill] .ql-toolbar {
        max-width: 100% !important; width: 100% !important;
        border: none !important; border-bottom: 1px solid #525252 !important; border-radius: 0.5rem 0.5rem 0 0;
        padding: 10px 12px !important; padding-left: 12px !important; margin: 0 !important; margin-left: 0 !important;
        left: 0 !important; position: relative !important;
        background: #404040 !important;
      }
      [data-new-exam-quill] .ql-toolbar .ql-formats:first-child { margin-left: 0 !important; }
      [data-new-exam-quill] .ql-editor {
        min-width: 0 !important; width: 100% !important; max-width: 100% !important; box-sizing: border-box;
        min-height: 140px; padding: 12px !important; color: #fff; background: #3d3d3d;
      }
      [data-new-exam-quill] .ql-editor.ql-blank::before { color: #9ca3af; font-style: normal; }
      [data-new-exam-quill] .ql-toolbar .ql-stroke { stroke: #a1a1aa; fill: none; }
      [data-new-exam-quill] .ql-toolbar .ql-fill { fill: #a1a1aa; stroke: none; }
      [data-new-exam-quill] .ql-toolbar .ql-picker { color: #e4e4e7; }
      [data-new-exam-quill] .ql-toolbar .ql-picker.ql-expanded .ql-picker-label { color: #a1a1aa; }
      [data-new-exam-quill] .ql-toolbar button:hover .ql-stroke,
      [data-new-exam-quill] .ql-toolbar button:focus .ql-stroke,
      [data-new-exam-quill] .ql-toolbar button.ql-active .ql-stroke { stroke: #a78bfa; }
      [data-new-exam-quill] .ql-toolbar button:hover .ql-fill,
      [data-new-exam-quill] .ql-toolbar button:focus .ql-fill,
      [data-new-exam-quill] .ql-toolbar button.ql-active .ql-fill { fill: #a78bfa; }
      [data-new-exam-quill] .ql-toolbar .ql-picker-options { background: #3f3f46; color: #e4e4e7; border: 1px solid #525252; }
      @media (max-width: 768px) {
        [data-new-exam-quill] .ql-editor { min-height: 120px; padding: 10px !important; }
        [data-new-exam-quill] .ql-toolbar { padding: 8px 10px !important; padding-left: 10px !important; }
      }
      @media (max-width: 425px) {
        [data-new-exam-quill] .ql-editor { min-height: 100px; padding: 8px !important; }
        [data-new-exam-quill] .ql-toolbar { padding: 6px 8px !important; padding-left: 8px !important; }
      }
      [data-new-exam-form] input[type="date"],
      [data-new-exam-form] input[type="time"],
      .new-exam-date-input,
      .new-exam-time-input {
        color-scheme: dark;
      }
      [data-new-exam-form] input[type="date"]::-webkit-calendar-picker-indicator,
      [data-new-exam-form] input[type="time"]::-webkit-calendar-picker-indicator,
      .new-exam-date-input::-webkit-calendar-picker-indicator,
      .new-exam-time-input::-webkit-calendar-picker-indicator {
        filter: brightness(0) invert(1) !important;
        opacity: 0.9 !important;
        cursor: pointer;
      }
      [data-new-exam-form] input[type="date"]::-webkit-date-and-time-value,
      [data-new-exam-form] input[type="time"]::-webkit-date-and-time-value {
        color: #fff;
      }
    `}</style>
    <div className="flex min-h-0 w-full flex-col overflow-x-hidden bg-[#282828] px-4 py-5 sm:px-6 md:py-6 md:px-8">
      <div className="flex w-full justify-center">
        <div className="w-full max-w-2xl min-w-0" data-new-exam-form>
        <div className="pb-4 flex gap-4 items-center justify-between">
          <h1 className="text-xl font-semibold text-white sm:text-2xl">{isEditing ? "Edit Exam" : "Create New Exam"}</h1>
          <span className="shrink-0 rounded-full bg-[#404040] px-3 py-1 text-sm text-gray-300">Step 1 of 3</span>
        </div>

        <div className="space-y-6 sm:space-y-8 flex flex-col gap-2">
          <section className="rounded-xl border border-[#5a5a5a] bg-[#353535] px-4 py-5 sm:px-5 sm:py-5">
            <h2 className="pb-1 text-base font-medium text-white">Exam details</h2>
            <div>
              <label className={labelBase}>Test name {isSubmitted && errors.testName && <span className="text-red-400">*</span>}</label>
              <input
                type="text"
                value={testName}
                onChange={(e) => { setTestName(e.target.value); runAllValidations(); }}
                onBlur={runAllValidations}
                placeholder="e.g., Mid-Term Exam"
                className={`${inputBase} ${isSubmitted && errors.testName ? "border-red-500" : ""}`}
              />
              <FieldError name="testName" />
            </div>
          </section>

          <section className="rounded-xl border border-[#5a5a5a] bg-[#353535] px-4 py-5 sm:px-5 sm:py-5">
            <h2 className="pb-1 text-base font-medium text-white">Schedule</h2>
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
              <div>
                <label className={labelBase}>Start date {isSubmitted && errors.examStartDate && <span className="text-red-400">*</span>}</label>
                <div className="flex gap-2">
                  <input type="date" min={today} value={examStartDate} onChange={(e) => { setExamStartDate(e.target.value); runAllValidations(); }} onBlur={runAllValidations} className={`new-exam-date-input ${inputBase} flex-1 min-w-0 ${isSubmitted && errors.examStartDate ? "border-red-500" : ""}`} disabled={isEditing} />
                  <button type="button" onClick={() => { setExamStartDate(today); runAllValidations(); }} disabled={isEditing} className="shrink-0 rounded-lg border border-gray-500 bg-[#404040] px-3 py-3 text-sm font-medium text-gray-200 transition-colors hover:bg-[#4a4a4a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">Now</button>
                </div>
                <FieldError name="examStartDate" />
              </div>
              <div>
                <label className={labelBase}>Start time {isSubmitted && errors.startTime && <span className="text-red-400">*</span>}</label>
                <div className="flex gap-2">
                  <input ref={startTimeInputRef} type="time" value={startTime} onChange={(e) => { setStartTime(e.target.value); runAllValidations(); }} onBlur={runAllValidations} className={`new-exam-time-input ${inputBase} flex-1 min-w-0 ${isSubmitted && errors.startTime ? "border-red-500" : ""}`} disabled={isEditing} />
                  <button type="button" onClick={() => { setStartTime(setNowTime()); runAllValidations(); }} disabled={isEditing} className="shrink-0 rounded-lg border border-gray-500 bg-[#404040] px-3 py-3 text-sm font-medium text-gray-200 transition-colors hover:bg-[#4a4a4a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">Now</button>
                </div>
                <FieldError name="startTime" />
              </div>
              <div>
                <label className={labelBase}>End date {isSubmitted && errors.examEndDate && <span className="text-red-400">*</span>}</label>
                <input type="date" min={today} value={examEndDate} onChange={(e) => { setExamEndDate(e.target.value); runAllValidations(); }} onBlur={runAllValidations} className={`new-exam-date-input ${inputBase} ${isSubmitted && errors.examEndDate ? "border-red-500" : ""}`} />
                <FieldError name="examEndDate" />
              </div>
              <div>
                <label className={labelBase}>End time {isSubmitted && errors.endTime && <span className="text-red-400">*</span>}</label>
                <div className="flex gap-2">
                  <input ref={endTimeInputRef} type="time" value={endTime} onChange={(e) => { setEndTime(e.target.value); runAllValidations(); }} onBlur={runAllValidations} className={`new-exam-time-input ${inputBase} flex-1 min-w-0 ${isSubmitted && errors.endTime ? "border-red-500" : ""}`} />
                  <button type="button" onClick={() => { setEndTime(setNowTime()); runAllValidations(); }} className="shrink-0 rounded-lg border border-gray-500 bg-[#404040] px-3 py-3 text-sm font-medium text-gray-200 transition-colors hover:bg-[#4a4a4a] hover:text-white">Now</button>
                </div>
                <FieldError name="endTime" />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#5a5a5a] bg-[#353535] px-4 py-5 sm:px-5 sm:py-5">
            <h2 className="mb-4 text-base font-medium text-white">Settings</h2>
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-300 shrink-0 mr-5 py-2">
                  Timed test
                  <InfoTip text="If checked, a single timer applies to the whole exam. If unchecked, each section can have its own timer." />
                </label>
                <label className="relative inline-flex cursor-pointer shrink-0 ml-1">
                  <input type="checkbox" checked={timedTest} onChange={(e) => { setTimedTest(e.target.checked); if (!e.target.checked) setTimer(""); runAllValidations(); }} className="peer sr-only" />
                  <div className="h-6 w-11 rounded-full bg-[#4a4a4a] transition-colors peer-checked:bg-[#A294F9]" />
                  <div className="pointer-events-none absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-[22px]" />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                <div>
                  <label className={labelBase}>Timer (minutes) {timedTest && isSubmitted && errors.timer && <span className="text-red-400">*</span>}</label>
                  <input
                    type="number"
                    placeholder={timedTest ? "e.g., 60" : "—"}
                    min={1}
                    value={timer}
                    onChange={(e) => { setTimer(e.target.value); runAllValidations(); }}
                    onBlur={runAllValidations}
                    disabled={!timedTest}
                    className={`${inputBase} ${!timedTest ? "cursor-not-allowed opacity-60" : ""} ${isSubmitted && errors.timer ? "border-red-500" : ""}`}
                  />
                  <FieldError name="timer" />
                </div>
                <div>
                  <label className={labelBase}>Attempts allowed {isSubmitted && errors.attemptsAllowed && <span className="text-red-400">*</span>}</label>
                  <input type="number" min={1} value={attemptsAllowed} onChange={(e) => { setAttemptsAllowed(e.target.value); runAllValidations(); }} onBlur={runAllValidations} placeholder="e.g., 1 or 3" className={`${inputBase} ${isSubmitted && errors.attemptsAllowed ? "border-red-500" : ""}`} />
                  <FieldError name="attemptsAllowed" />
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-[#5a5a5a] bg-[#353535] px-4 py-5 sm:px-5 sm:py-5">
            <h2 className={`${labelBase} block pb-1 text-base font-medium text-white`}>Instructions {isSubmitted && errors.instructions && <span className="text-red-400">*</span>}</h2>
            <div data-new-exam-quill className="min-w-0 w-full overflow-hidden rounded-xl border border-gray-500 bg-[#353535]">
              <ReactQuill value={instructions} onChange={(v) => { setInstructions(v); runAllValidations(); }} onBlur={runAllValidations} theme="snow" placeholder="Enter exam instructions here..." className="min-w-0 w-full new-exam-quill-editor" />
            </div>
            <FieldError name="instructions" />
          </section>
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#5a5a5a] pt-6">
          <button type="button" onClick={() => { if (!isEditing) clearSessionStorage(); onBack(); }} className="rounded-lg border border-gray-500 bg-transparent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/5 cursor-pointer">Back</button>
          <button type="button" onClick={handleNext} className="rounded-lg bg-[#A294F9] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8E5DAF] cursor-pointer">Next</button>
        </div>
        </div>
      </div>
    </div>
    </>
  );
};

// PropType definitions to resolve ESLint 'missing in props validation' warnings
NewExam.propTypes = {
  onBack: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  setCreateExamRequest: PropTypes.func.isRequired,
  isEditing: PropTypes.bool,
  editExamData: PropTypes.object,
};

export default NewExam;
