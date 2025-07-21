import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import line from '../assets/Line.png';
import './NewExam.css'; // Ensure this CSS file exists and is linked
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Swal from 'sweetalert2';

const STORAGE_KEY = 'newExam';

const NewExam = ({ onBack, onNext, setCreateExamRequest }) => { //
    const [isSubmitted, setIsSubmitted] = useState(false);

    // State variables for form fields
    const [testName, setTestName] = useState(() =>
        sessionStorage.getItem(`${STORAGE_KEY}:testName`) || ''
    );
    const [examStartDate, setExamStartDate] = useState(() =>
        sessionStorage.getItem(`${STORAGE_KEY}:examStartDate`) || ''
    );
    const [startTime, setStartTime] = useState(() =>
        sessionStorage.getItem(`${STORAGE_KEY}:startTime`) || ''
    );
    const [examEndDate, setExamEndDate] = useState(() =>
        sessionStorage.getItem(`${STORAGE_KEY}:examEndDate`) || ''
    );
    const [endTime, setEndTime] = useState(() =>
        sessionStorage.getItem(`${STORAGE_KEY}:endTime`) || ''
    );
    const [timedTest, setTimedTest] = useState(() =>
        sessionStorage.getItem(`${STORAGE_KEY}:timedTest`) === 'true'
    );
    const [timer, setTimer] = useState(() =>
        sessionStorage.getItem(`${STORAGE_KEY}:timer`) || ''
    );
    const [attemptsAllowed, setAttemptsAllowed] = useState(() =>
        sessionStorage.getItem(`${STORAGE_KEY}:attemptsAllowed`) || ''
    );
    const [instructions, setInstructions] = useState(() =>
        sessionStorage.getItem(`${STORAGE_KEY}:instructions`) || ''
    );

    const [errors, setErrors] = useState({}); //

    // compute “YYYY-MM-DD” string for today
  const today = new Date().toISOString().split('T')[0];

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
            color: "#fff"
        });
    };

    // Consolidated validation function that returns an object of errors.
    // This function runs ALL validations and is the single source of truth for errors.
    const runAllValidations = () => {
        const currentErrors = {}; // Start with a fresh, empty error object for each validation run

        // --- Individual Field Validations ---
        if (!testName.trim()) { //
            currentErrors.testName = "Test Name is required."; //
        }
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
        if (!startTime) { //
            currentErrors.startTime = "Start Time is required."; //
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
        if (!endTime) { //
            currentErrors.endTime = "End Time is required."; //
        }
        if (timedTest) { // Only validate timer if timedTest is true
            if (!timer || isNaN(parseInt(timer)) || parseInt(timer) <= 0) { //
                currentErrors.timer = "Timer duration must be a positive number."; //
            }
        }
        if (!attemptsAllowed || isNaN(parseInt(attemptsAllowed)) || parseInt(attemptsAllowed) <= 0) { //
            currentErrors.attemptsAllowed = "Attempts Allowed must be a positive number."; //
        }
        const strippedInstructions = instructions.replace(/<[^>]*>?/gm, '').trim(); //
        if (!strippedInstructions) { //
            currentErrors.instructions = "Instructions are required."; //
        }

        // --- Cross-field Date/Time Validations ---
        // Only run these if the basic date/time fields are present to avoid "Invalid Date" errors
        const isStartDateValidInput = examStartDate && startTime;
        const isEndDateValidInput = examEndDate && endTime;

        if (isStartDateValidInput) { //
            const startDateTime = new Date(`${examStartDate}T${startTime}`); //
            const currentDateTime = new Date(); // Get current date and time

            // To avoid issues with milliseconds, compare at minute level.
            // Adjust current time to remove seconds/milliseconds for comparison clarity.
            const currentDateTimeAdjusted = new Date(currentDateTime.getFullYear(),
                currentDateTime.getMonth(),
                currentDateTime.getDate(),
                currentDateTime.getHours(),
                currentDateTime.getMinutes(),
                0, 0); // Set seconds and milliseconds to 0

            if (startDateTime.getTime() < currentDateTimeAdjusted.getTime() && !currentErrors.examStartDate) { //
                currentErrors.examStartDate = "Start date/time cannot be in the past."; //
            }
        }

        if (isStartDateValidInput && isEndDateValidInput) { //
            const startDateTime = new Date(`${examStartDate}T${startTime}`); //
            const endDateTime = new Date(`${examEndDate}T${endTime}`); //

            // Exam End Date/Time must be strictly after Exam Start Date/Time
            if (endDateTime.getTime() <= startDateTime.getTime() && !currentErrors.examEndDate) { //
                currentErrors.examEndDate = "End date/time must be after start date/time."; //
            }
        }

        // This is the crucial step: Set all collected errors at once.
        // This will cause a re-render and update all inline error messages simultaneously.
        setErrors(currentErrors); //

        // Return true if there are no errors, false otherwise
        return Object.keys(currentErrors).length === 0; //
    };

    // Handler for the "Next" button
    const handleNext = () => { //
        setIsSubmitted(true);
        const formIsValid = runAllValidations(); // Run all validations and update errors state

        if (formIsValid) { //
            setCreateExamRequest({ //
                exam: { //
                    testName, //
                    examStartDate, //
                    examEndDate, //
                    startTime, //
                    endTime, //
                    timedTest, //
                    timer: timedTest ? parseInt(timer) : null, //
                    attemptsAllowed: parseInt(attemptsAllowed), //
                    instructions //
                }
            });
            onNext(); //
        } else {
            // If the form is not valid, the 'errors' state is already updated by runAllValidations().
            // Now, collect unique error messages from the updated 'errors' state for the summary popup.
            const allErrorMessages = Object.values(errors).filter(msg => msg !== ""); //
            const uniqueErrorMessages = [...new Set(allErrorMessages)]; // Ensure no duplicates

            if (uniqueErrorMessages.length > 0) { //
                showErrorSummaryAlert("Validation Errors", uniqueErrorMessages.join("<br/>")); //
            } else {
                // Fallback, ideally should not be hit if runAllValidations works correctly,
                // but acts as a safety net.
                showErrorSummaryAlert("Form Incomplete", "Please fill out all required fields and correct any errors.");
            }
        }
    };

    return (
        <div className='newexam-container justify-center flex flex-wrap'>
            <div className='newexam-box'>
                <h1>Create New Exam</h1>
                <img src={line} alt="line" className='w-full h-0.5' />
                <div className='newexam-entry1'>
                    {/* Test Name Input */}
                    <div className='createexam-col1 flex'>
                        <h4 className='flex justify-between'>
                            Test Name {isSubmitted && errors.testName && (
                                <span style={{ color: 'red' }}>*</span>
                            )}
                        </h4>
                        <input
                            type="text"
                            value={testName}
                            onChange={(e) => {
                                setTestName(e.target.value);
                                runAllValidations(); // Re-run all validations on change
                            }}
                            onBlur={runAllValidations} // Re-run all validations on blur
                            placeholder="e.g., Mid-Term Exam"
                        />
                    </div>

                    {/* Exam Start Date Input (Calendar) */}
                    <div className='createexam-col1 flex'>
                        <h4 className='flex justify-between'>
                            Exam Start Date {isSubmitted && errors.examStartDate && (
                                <span style={{ color: 'red' }}>*</span>
                            )}
                        </h4>
                        <input
                            type="date"
                             min={today}
                            value={examStartDate}
                            onChange={(e) => {
                                setExamStartDate(e.target.value);
                                runAllValidations(); // Re-run all validations on change
                            }}
                            onBlur={runAllValidations} // Re-run all validations on blur
                        />
                    </div>

                    {/* Start Time Input */}
                    <div className='createexam-col1 flex'>
                        <h4 className='flex justify-between'>
                            Start Time {isSubmitted && errors.startTime && (
                                <span style={{ color: 'red' }}>*</span>
                            )}
                        </h4>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => {
                                setStartTime(e.target.value);
                                runAllValidations(); // Re-run all validations on change
                            }}
                            onBlur={runAllValidations} // Re-run all validations on blur
                        />
                    </div>

                    {/* Exam End Date Input (Calendar) */}
                    <div className='createexam-col1 flex'>
                        <h4 className='flex justify-between'>
                            Exam End Date {isSubmitted && errors.examEndDate && (
                                <span style={{ color: 'red' }}>*</span>
                            )}
                        </h4>
                        <input
                            type="date"
                            value={examEndDate}
                             min={today}
                            onChange={(e) => {
                                setExamEndDate(e.target.value);
                                runAllValidations(); // Re-run all validations on change
                            }}
                            onBlur={runAllValidations} // Re-run all validations on blur
                        />
                    </div>

                    {/* End Time Input */}
                    <div className='createexam-col1 flex'>
                        <h4 className='flex justify-between'>
                            End Time {isSubmitted && errors.endTime && (
                                <span style={{ color: 'red' }}>*</span>
                            )}
                        </h4>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => {
                                setEndTime(e.target.value);
                                runAllValidations(); // Re-run all validations on change
                            }}
                            onBlur={runAllValidations} // Re-run all validations on blur
                        />
                    </div>

                    {/* Timed Test Toggle and Timer Input */}
                    <div className='createexam-col1 flex'>
                        <h4 className='flex justify-between'>
                            Timed Test {isSubmitted && errors.timedTest && (
                                <span style={{ color: 'red' }}>*</span>
                            )}
                        </h4>
                        <div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={timedTest}
                                    onChange={(e) => {
                                        setTimedTest(e.target.checked);
                                        if (!e.target.checked) {
                                            setTimer(""); // Clear timer value if toggle is turned off
                                        }
                                        runAllValidations(); // Re-run all validations when toggle changes
                                    }}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                        {timedTest && (
                            <>
                                <h4 className='timer-h4'>
                                    Timer <span>:</span>
                                </h4>
                                <input
                                    type="number"
                                    placeholder="Time in minutes"
                                    min="1"
                                    className='timer-input'
                                    value={timer}
                                    onChange={(e) => {
                                        setTimer(e.target.value);
                                        runAllValidations(); // Re-run all validations on change
                                    }}
                                    onBlur={runAllValidations} // Re-run all validations on blur
                                />
                            </>
                        )}
                    </div>
                </div>
                <br />
                <img src={line} alt="line" className='w-full h-0.5' />

                <div className='newexam-entry1'>
                    {/* Attempts Allowed Input */}
                    <div className='createexam-col1 flex'>
                        <h4 className='flex justify-between'>
                            Attempts Allowed {isSubmitted && errors.attemptsAllowed && (
                                <span style={{ color: 'red' }}>*</span>
                            )}
                        </h4>
                        <input
                            type="number"
                            min="1"
                            value={attemptsAllowed}
                            onChange={(e) => {
                                setAttemptsAllowed(e.target.value);
                                runAllValidations(); // Re-run all validations on change
                            }}
                            onBlur={runAllValidations} // Re-run all validations on blur
                            placeholder="e.g., 1 or 3"
                        />
                    </div>
                    {/* Instructions ReactQuill Editor */}
                    <div className='createexam-col1 flex items-start'>
                        <h4 className='flex justify-between pt-2'>
                            Instructions
                            {isSubmitted && errors.instructions && (
                                <span style={{ color: 'red' }}>*</span>
                            )}
                        </h4>
                        <div className='flex-1 min-w-0 new-exam-quill'>
                        <ReactQuill
                            value={instructions}
                            onChange={(value) => {
                                setInstructions(value);
                                runAllValidations(); // Re-run all validations on change
                            }}
                            onBlur={runAllValidations} // Re-run all validations on blur
                            theme="snow"
                            placeholder="Enter exam instructions here..."
                        />
                        </div>
                    </div>
                </div>

                {/* Navigation Buttons */}
                <div className='flex w-full justify-end'>
                    <div className='flex bottom-btns'>
                        <button className="back-btn-create" onClick={onBack}>Back</button>
                        <p>1/3</p>
                        <button className='next-btn' onClick={handleNext}>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// PropType definitions to resolve ESLint 'missing in props validation' warnings
NewExam.propTypes = {
    onBack: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    setCreateExamRequest: PropTypes.func.isRequired,
};

export default NewExam;