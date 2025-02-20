import React, { useState } from 'react';
// import axios from "axios";
import line from '../assets/Line.png';
import './NewExam.css';
import ReactQuill from 'react-quill';
import Swal from 'sweetalert2';

// const API_BASE_URL = "http://127.0.0.1:8000/api/exams/";

const NewExam = ({ onBack, onNext }) => {
    const [testName, setTestName] = useState("");
    const [examDate, setExamDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [selectedOption, setSelectedOption] = useState("");
    const [customTime, setCustomTime] = useState("");
    const [timedTest, setTimedTest] = useState(false);
    const [timer, setTimer] = useState("");
    const [attemptsAllowed, setAttemptsAllowed] = useState("");
    const [instructions, setInstructions] = useState("");

    // const [examName, setExamName] = useState("");
    // const [startTime, setStartTime] = useState("");
    // const [endTime, setEndTime] = useState("");
    // const [attemptsAllowed, setAttemptsAllowed] = useState("");
    // const [instructions, setInstructions] = useState("");
    // const [timedTest, setTimedTest] = useState(false);
    // const [timerDuration, setTimerDuration] = useState("");

    const handleSelectChange = (event) => {
        setSelectedOption(event.target.value);
        if (event.target.value !== "custom") {
            setCustomTime(""); // Reset custom input when another option is selected
        }
    };

    const handleNext = () => {
        // if (!testName || !startTime || !endTime) {
        //     Swal.fire({
        //         title: "Missing Fields",
        //         text: "Please fill in Test Name, Start Time, and End Time.",
        //         icon: "warning",
        //         confirmButtonText: "OK",
        //         background: "#181817",
        //         color: "#fff"
        //     });
        //     return;
        // }
        // if (selectedOption === "") {
        //     Swal.fire({
        //         title: "Missing Selection",
        //         text: "Please select a Login Window option.",
        //         icon: "warning",
        //         confirmButtonText: "OK",
        //         background: "#181817",
        //         color: "#fff"
        //     });
        //     return;
        // }
        // if (selectedOption === "custom" && !customTime) {
        //     Swal.fire({
        //         title: "Missing Custom Time",
        //         text: "Please enter a custom time for the Login Window.",
        //         icon: "warning",
        //         confirmButtonText: "OK",
        //         background: "#181817",
        //         color: "#fff"
        //     });
        //     return;
        // }
        // if (timedTest && !timer) {
        //     Swal.fire({
        //         title: "Missing Timer Value",
        //         text: "Please provide a timer value for the Timed Test.",
        //         icon: "warning",
        //         confirmButtonText: "OK",
        //         background: "#181817",
        //         color: "#fff"
        //     });
        //     return;
        // }
        // if (!attemptsAllowed) {
        //     Swal.fire({
        //         title: "Missing Attempts Allowed",
        //         text: "Please fill in Attempts Allowed.",
        //         icon: "warning",
        //         confirmButtonText: "OK",
        //         background: "#181817",
        //         color: "#fff"
        //     });
        //     return;
        // }
        // if (!instructions) {
        //     Swal.fire({
        //         title: "Missing Instructions",
        //         text: "Please provide instructions.",
        //         icon: "warning",
        //         confirmButtonText: "OK",
        //         background: "#181817",
        //         color: "#fff"
        //     });
        //     return;
        // }

        // If all validations pass, proceed to next component
        onNext();
    };

    // const handleSubmit = async () => {
    // if (!examName.trim()) {
    //     alert("Test Name is required.");
    //     return;
    // }
    // if (!startTime.trim()) {
    //     alert("Start Time is required.");
    //     return;
    // }
    // if (!endTime.trim()) {
    //     alert("End Time is required.");
    //     return;
    // }
    // if (timedTest && !timerDuration) {
    //     alert("Timer duration is required for a timed test.");
    //     return;
    // }
    //     const examData = {
    //         name: examName,
    //         start_time: startTime,
    //         end_time: endTime,
    //         analytics: "80%", // Can be dynamic later
    //         status: "upcoming",
    //         category: "active",
    //         attempts_allowed: attemptsAllowed,
    //         instructions: instructions,
    //         login_window: selectedOption === "custom" ? customTime : selectedOption,
    //         timed_test: timedTest,
    //         timer_duration: timedTest ? timerDuration : null
    //     };

    //     try {
    //         await axios.post(API_BASE_URL, examData, {
    //             headers: { "Content-Type": "application/json" },
    //         });
    //         alert("Exam created successfully!");
    //         onNext(); // Move to the next step after successful creation
    //     } catch (error) {
    //         console.error("Error creating exam:", error.response?.data || error);
    //         alert("Failed to create exam. Please try again.");
    //     }
    // };

    return (
        <div className='newexam-container justify-center flex flex-wrap'>
            <div className='newexam-box'>
                <h1>Create New Exam</h1>
                <img src={line} alt="line" className='w-full h-0.5' />
                <div className='newexam-entry1'>
                    {/* Test Name */}
                    <div className='createexam-col1 flex'>
                        <h4 className='flex justify-between'>
                            Test Name <span>:</span>
                        </h4>
                        <input
                            type="text"
                            value={testName}
                            onChange={(e) => setTestName(e.target.value)}
                        />
                    </div>
                    {/* Exam Date Field (Calendar) */}
                    <div className='createexam-col1 flex'>
                        <h4 className='flex justify-between'>
                            Exam Date <span>:</span>
                        </h4>
                        <input
                            type="date"
                            value={examDate}
                            onChange={(e) => setExamDate(e.target.value)}
                        />
                    </div>
                    {/* Start Time */}
                    <div className='createexam-col1 flex'>
                        <h4 className='flex justify-between'>
                            Start Time <span>:</span>
                        </h4>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div>
                    {/* End Time */}
                    <div className='createexam-col1 flex'>
                        <h4 className='flex justify-between'>
                            End Time <span>:</span>
                        </h4>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                        />
                    </div>
                    {/* Login Window */}
                    <div className='createexam-col1 flex'>
                        <h4 className='flex justify-between'>
                            Login Window <span>:</span>
                        </h4>
                        <select value={selectedOption} onChange={handleSelectChange}>
                            <option value="">Select</option>
                            <option value="10">10 minutes</option>
                            <option value="15">15 minutes</option>
                            <option value="25">25 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="45">45 minutes</option>
                            <option value="60">1 hour</option>
                            <option value="custom">Custom</option>
                        </select>
                        {selectedOption === "custom" && (
                            <input
                                type="time"
                                placeholder="HH:MM"
                                value={customTime}
                                onChange={(e) => setCustomTime(e.target.value)}
                                className="border p-2 ml-2 custom-input"
                            />
                        )}
                    </div>
                    {/* Timed Test */}
                    <div className='createexam-col1 flex'>
                        <h4 className='flex justify-between'>
                            Timed Test <span>:</span>
                        </h4>
                        <div>
                            <label className="toggle-switch">
                                <input
                                    type="checkbox"
                                    checked={timedTest}
                                    onChange={(e) => setTimedTest(e.target.checked)}
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
                                    type="time"
                                    placeholder="HH:MM"
                                    className='timer-input'
                                    value={timer}
                                    onChange={(e) => setTimer(e.target.value)}
                                />
                            </>
                        )}
                    </div>
                </div>

                <img src={line} alt="line" className='w-full h-0.5' />

                <div className='newexam-entry1'>
                    {/* Attempts Allowed */}
                    <div className='createexam-col1 flex'>
                        <h4 className='flex justify-between'>
                            Attempts Allowed <span>:</span>
                        </h4>
                        <input
                            type="number"
                            value={attemptsAllowed}
                            onChange={(e) => setAttemptsAllowed(e.target.value)}
                        />
                    </div>
                    {/* Instructions */}
                    <div className='createexam-col1 flex'>
                        <h4 className='flex justify-between'>
                            Instructions <span>:</span>
                        </h4>
                        <ReactQuill
                            value={instructions}
                            onChange={setInstructions}
                        />
                    </div>
                </div>

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


// return (
//     <div className="newexam-container justify-center flex flex-wrap">
//         <div className="newexam-box">
//             <h1>Create New Exam</h1>
//             <img src={line} alt="line" className="w-full h-0.5" />
//             <div className="newexam-entry1">
//                 <div className="createexam-col1 flex ">
//                     <h4 className="flex justify-between">Test Name <span>:</span></h4>
//                     <input type="text" value={examName} onChange={(e) => setExamName(e.target.value)} />
//                 </div>
//                 <div className="createexam-col1 flex">
//                     <h4 className="flex justify-between">Start Time <span>:</span></h4>
//                     <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
//                 </div>
//                 <div className="createexam-col1 flex">
//                     <h4 className="flex justify-between">End Time <span>:</span></h4>
//                     <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
//                 </div>
//                 <div className="createexam-col1 flex">
//                     <h4 className="flex justify-between">Login Window <span>:</span></h4>
//                     <select value={selectedOption} onChange={handleSelectChange}>
//                         <option value="">Select</option>
//                         <option value="10">10 minutes</option>
//                         <option value="15">15 minutes</option>
//                         <option value="25">25 minutes</option>
//                         <option value="30">30 minutes</option>
//                         <option value="45">45 minutes</option>
//                         <option value="60">1 hour</option>
//                         <option value="custom">Custom</option>
//                     </select>

//                     {selectedOption === "custom" && (
//                         <input
//                             type="number"
//                             placeholder="Enter custom time (e.g., 90 minutes)"
//                             value={customTime}
//                             onChange={(e) => setCustomTime(e.target.value)}
//                             className="border p-2 ml-2 custom-input"
//                         />
//                     )}
//                 </div>
//                 <div className="createexam-col1 flex">
//                     <h4 className="flex justify-between">Timed Test <span>:</span></h4>
//                     <label className="toggle-switch">
//                         <input type="checkbox" checked={timedTest} onChange={() => setTimedTest(!timedTest)} />
//                         <span className="slider"></span>
//                     </label>
//                     {timedTest && (
//                         <>
//                             <h4 className="timer-h4">Timer <span>:</span></h4>
//                             <input type="number" placeholder="Time in minutes" value={timerDuration} onChange={(e) => setTimerDuration(e.target.value)} className="timer-input" />
//                         </>
//                     )}
//                 </div>
//             </div>

//             <img src={line} alt="line" className="w-full h-0.5" />

//             <div className="newexam-entry1">
//                 <div className="createexam-col1 flex">
//                     <h4 className="flex justify-between">Attempts Allowed <span>:</span></h4>
//                     <input type="number" value={attemptsAllowed} onChange={(e) => setAttemptsAllowed(e.target.value)} />
//                 </div>
//                 <div className="createexam-col1 flex">
//                     <h4 className="flex justify-between">Instructions <span>:</span></h4>
//                     <ReactQuill value={instructions} onChange={setInstructions} />
//                 </div>
//             </div>

//             <div className="flex w-full justify-end">
//                 <div className="flex bottom-btns">
//                     <button className="back-btn-create" onClick={onBack}>Back</button>
//                     <p>1/3</p>
//                     <button className="next-btn" onClick={handleSubmit}>Next</button>
//                 </div>
//             </div>
//         </div>
//     </div>
// );
// }

export default NewExam;