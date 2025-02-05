import React, { useState } from 'react';
import { motion } from 'motion/react';
import closeicon from '../assets/close.png';
import Swal from "sweetalert2";
import DatePicker from "react-date-picker";
import TimePicker from "react-time-picker";
import "react-date-picker/dist/DatePicker.css";
import "react-calendar/dist/Calendar.css";
import "react-time-picker/dist/TimePicker.css";
import 'react-quill/dist/quill.snow.css';
import ReactQuill from 'react-quill';
import Line from '../assets/Line.png';

const EditExam = ({ onClose, examDetails }) => {
    const [date, setDate] = useState(null);
    const [time, setTime] = useState("");
    const [showEditMCQPopup, setShowEditMCQPopup] = useState(false);
    const [showEditSpeechPopup, setShowEditSpeechPopup] = useState(false);
    const [showEditCodingPopup, setShowEditCodingPopup] = useState(false);
    const [question, setQuestion] = useState(""); // Track edited question
    const [options, setOptions] = useState([{ text: "", isCorrect: false }]);
    const [testCases, setTestCases] = useState([{ input: "", output: "" }]);

    // Function to open edit popup
    const handleMcqEdit = () => {
        setShowEditMCQPopup(true);
    };

    const handleSpeechEdit = () => {
        setShowEditSpeechPopup(true);
    }

    const handleCodingEdit = () => {
        setShowEditCodingPopup(true);
    }

    // Function to close edit popup
    const handleCloseEditPopup = () => {
        setShowEditMCQPopup(false);
        setShowEditSpeechPopup(false);
        setShowEditCodingPopup(false);
    };

    // Handle adding new option
    const handleAddOption = () => {
        setOptions([...options, { text: "", isCorrect: false }]);
    };

    // Handle changing option text
    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        setOptions(newOptions);
    };

    // Handle marking an option as correct
    const handleCorrectAnswer = (index) => {
        const newOptions = options.map((option, i) => ({
            ...option,
            isCorrect: i === index, // Only one correct answer
        }));
        setOptions(newOptions);
    };

    // Handle change in input fields
    const handleChange = (index, field, value) => {
        const newTestCases = [...testCases];
        newTestCases[index][field] = value;
        setTestCases(newTestCases);
    };

    // Add a new test case
    const addTestCase = () => {
        setTestCases([...testCases, { input: "", output: "" }]);
    };

    // Remove a test case
    const removeTestCase = (index) => {
        const newTestCases = testCases.filter((_, i) => i !== index);
        setTestCases(newTestCases);
    };

    // Handle saving changes
    const handleSaveChanges = () => {
        console.log("Updated Question:", question);
        console.log("Updated Options:", options);
        setShowEditMCQPopup(false);
        Swal.fire({
            title: "Saved!",
            text: "Your changes have been saved.",
            icon: "success",
            background: "#181817",
            color: "#fff",
            showConfirmButton: false,
            timer: 1500,
        });
    };

    // Handle deleting an option
    const handleDeleteOption = (index) => {
        if (options.length > 1) {
            const newOptions = options.filter((_, i) => i !== index);
            setOptions(newOptions);
        } else {
            Swal.fire({
                title: "Cannot Delete!",
                text: "At least one option is required.",
                icon: "error",
                background: "#181817",
                color: "#fff",
                showConfirmButton: false,
                timer: 1500,
            });
        }
    };

    const handleExamDelete = () => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes",
            background: "#181817",
            color: "#fff"
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: "Deleted!",
                    text: "Your item has been deleted.",
                    icon: "success",
                    background: "#181817", // Keep background color consistent
                    color: "#fff",
                    showConfirmButton: false, // Hide OK button
                    timer: 1000
                });

                // Call your delete function here
            }
        });
    };

    const handleEditDelete = () => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes",
            background: "#181817",
            color: "#fff"
        })
    };

    const [value, setValue] = useState('');

    const modules = {
        toolbar: [
            [{ font: [] }, { size: [] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ color: [] }, { background: [] }],
            [{ script: 'sub' }, { script: 'super' }],
            [{ header: '1' }, { header: '2' }, 'blockquote', 'code-block'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ direction: 'rtl' }],
            [{ align: [] }],
            ['link', 'image', 'video'],
            ['clean']
        ],
    };


    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className='edit-container'>
                <div className="flex justify-between items-center edit-exam-header">
                    <h2>Exam Section</h2>
                    <motion.button
                        whileTap={{ scale: 1.1 }}
                        className="text-red-500 text-lg"
                        onClick={onClose}
                    >
                        <img src={closeicon} alt="close" />
                    </motion.button>
                </div>
                <div className='flex justify-center Edit-exam-body'>
                    {/* Necessary exam data edit */}
                    <div>
                        <div className='exam-creation-edit'>
                            <div className='flex desc'>
                                <p className='text-2xl'>Exam Name:</p>
                                <div className='flex edit-ename-options'>
                                    <input type="text" className='w-lg' placeholder='Enter Descriptions' />
                                    <button className='bg-blue-500 hover:bg-blue-800 rounded-lg'>Save</button>
                                    <button className='bg-gray-500 hover:bg-gray-800 rounded-lg'>Cancel</button>
                                </div>
                            </div>
                            <div className='flex desc'>
                                <p className='text-2xl'>Description:</p>
                                <div className='flex edit-ename-options'>
                                    <input type="text" className='w-lg' placeholder='Enter Descriptions' />
                                    <button className='bg-blue-500 hover:bg-blue-800 rounded-lg'>Save</button>
                                    <button className='bg-gray-500 hover:bg-gray-800 rounded-lg'>Cancel</button>
                                </div>
                            </div>
                            <div className='flex desc'>
                                <p className='text-2xl'>Overall Time:</p>
                                <div className='flex edit-ename-options e-time'>
                                    <input type="text" className='w-29' placeholder='Overall Time' />
                                    <button className='bg-blue-500 hover:bg-blue-800 rounded-lg'>Save</button>
                                    <button className='bg-gray-500 hover:bg-gray-800 rounded-lg'>Cancel</button>
                                </div>
                            </div>
                            <div className='flex desc'>
                                <p className='text-2xl'>Section Time:</p>
                                <div className='flex edit-ename-options e-stime'>
                                    <input type="text" className='w-29' placeholder='Enter Descriptions' />
                                    <button className='bg-blue-500 hover:bg-blue-800 rounded-lg'>Save</button>
                                    <button className='bg-gray-500 hover:bg-gray-800 rounded-lg'>Cancel</button>
                                </div>
                            </div>
                            <div className='flex desc'>
                                <p className='text-2xl'>Start Time:</p>
                                <div className="flex ">
                                    <div className="flex items-center p-3 rounded-lg shadow-md">
                                        {/* Date Picker */}
                                        <DatePicker
                                            onChange={setDate}
                                            value={date}
                                            format="y-MM-dd"
                                            className="custom-date-picker"
                                            clearIcon={null}
                                        />
                                    </div>

                                    {/* Show Time Picker only after selecting a date */}
                                    {date && (
                                        <div className="flex items-center p-3 rounded-lg shadow-md">
                                            <TimePicker
                                                onChange={setTime}
                                                value={time}
                                                disableClock={true} // Removes clock-only selection
                                                className="custom-time-picker"
                                                clearIcon={null}
                                                format="hh:mm a"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Save & Cancel Buttons */}
                                <div className="flex space-x-4">
                                    <button className="bg-blue-500 hover:bg-blue-800 text-white rounded-lg transition">
                                        Save
                                    </button>
                                    <button className="bg-gray-500 hover:bg-gray-800 text-white rounded-lg transition">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                            <div className='flex desc'>
                                <p className='text-2xl'>End Time:</p>
                                <div className="flex ">
                                    <div className="flex items-center rounded-lg shadow-md">
                                        {/* Date Picker */}
                                        <DatePicker
                                            onChange={setDate}
                                            value={date}
                                            format="y-MM-dd"
                                            className="custom-date-picker"
                                            clearIcon={null}
                                        />
                                    </div>

                                    {/* Show Time Picker only after selecting a date */}
                                    {date && (
                                        <div className="flex items-center p-3 rounded-lg shadow-md">
                                            <TimePicker
                                                onChange={setTime}
                                                value={time}
                                                disableClock={true} // Removes clock-only selection
                                                className="custom-time-picker"
                                                clearIcon={null}
                                                format="hh:mm a"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Save & Cancel Buttons */}
                                <div className="flex space-x-4">
                                    <button className="bg-blue-500 hover:bg-blue-800 text-white rounded-lg transition">
                                        Save
                                    </button>
                                    <button className="bg-gray-500 hover:bg-gray-800 text-white rounded-lg transition">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className='edit-section'>
                            <details>
                                <summary>MCQ</summary>
                                <div className="edit-sections-expand">
                                    <div className="edit-sections-content">
                                        <p>
                                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Aspernatur, deleniti deserunt veniam vero nulla praesentium nisi vitae ipsam? Eius optio corrupti, ullam, mollitia, odio officiis a minus veniam ad quasi ducimus voluptatibus eveniet accusamus quo cupiditate quod sequi ea rem temporibus repellat numquam sint consequatur vero amet? Ab vitae quidem facere aut voluptatum, cumque ut?
                                        </p>
                                    </div>
                                    <div className="edit-sections-buttons">
                                        <button onClick={handleMcqEdit}>Edit</button>
                                        <button onClick={handleEditDelete}>Delete</button>
                                    </div>
                                </div>
                            </details>
                        </div>

                        <div className="edit-section">
                            <details>
                                <summary>Speech</summary>
                                <div className="edit-sections-expand">
                                    <div className="edit-sections-content">
                                        <p>
                                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Aspernatur, deleniti deserunt veniam vero nulla praesentium nisi vitae ipsam? Eius optio corrupti, ullam, mollitia, odio officiis a minus veniam ad quasi ducimus voluptatibus eveniet accusamus quo cupiditate quod sequi ea rem temporibus repellat numquam sint consequatur vero amet? Ab vitae quidem facere aut voluptatum, cumque ut?
                                        </p>
                                    </div>
                                    <div className="edit-sections-buttons">
                                        <button onClick={handleSpeechEdit}>Edit</button>
                                        <button onClick={handleEditDelete}>Delete</button>
                                    </div>
                                </div>
                            </details>
                        </div>

                        <div className="edit-section">
                            <details>
                                <summary>Coding</summary>
                                <div className="edit-sections-expand">
                                    <div className="edit-sections-content">
                                        <p>
                                            Lorem ipsum dolor sit amet consectetur adipisicing elit. Aspernatur, deleniti deserunt veniam vero nulla praesentium nisi vitae ipsam? Eius optio corrupti, ullam, mollitia, odio officiis a minus veniam ad quasi ducimus voluptatibus eveniet accusamus quo cupiditate quod sequi ea rem temporibus repellat numquam sint consequatur vero amet? Ab vitae quidem facere aut voluptatum, cumque ut?
                                        </p>
                                    </div>
                                    <div className="edit-sections-buttons">
                                        <button onClick={handleCodingEdit}>Edit</button>
                                        <button onClick={handleEditDelete}>Delete</button>
                                    </div>
                                </div>
                            </details>
                        </div>

                        <div className='e-warning-note flex justify-between'>
                            <p><span>Note:</span> By clicking delete button, exam will deleted from the server</p>
                            <div className='flex gap-5'>
                                <motion.button
                                    whileTap={{ scale: 1.1 }}
                                    className="bg-teal-500 hover:bg-teal-800 text-white px-4 py-2 rounded-md"
                                >
                                    Quick Edit
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 1.1 }}
                                    onClick={handleExamDelete}
                                    className="bg-red-500 hover:bg-red-800 text-white px-4 py-2 rounded-md"
                                >
                                    Delete
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
                {showEditMCQPopup && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="MCQ-edit-container text-white p-6 rounded-lg shadow-lg w-96"
                        >
                            <h2 className="text-xl font-semibold mb-4">Edit Question</h2>

                            {/* Question Input */}
                            <div className='flex MCQ-question'>
                                <label className="block text-sm font-medium">Question:</label>
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    className="rounded-md mt-1 mb-3 border border-gray-600"
                                    placeholder="Enter your question"
                                />
                            </div>

                            {/* Options List */}
                            {options.map((option, index) => (
                                <div key={index} className="flex items-center">
                                    <label className="block text-sm font-medium">Options</label>
                                    <div className='flex w-full'>
                                        <input
                                            type="text"
                                            value={option.text}
                                            onChange={(e) => handleOptionChange(index, e.target.value)}
                                            className=" MCQ-question-options rounded-md border border-gray-600 "
                                            placeholder={`Option ${index + 1}`}
                                        />
                                        <input
                                            type="checkbox"
                                            checked={option.isCorrect}
                                            onChange={() => handleCorrectAnswer(index)}
                                            className="m-checkbox"
                                            title="Mark as correct answer"
                                        />
                                        <motion.button
                                            onClick={() => handleDeleteOption(index)}
                                            className=" text-white px-3 py-1 rounded-md e-delete-btn"
                                            whileTap={{ color: "red" }}
                                        >
                                            🗑️
                                        </motion.button>
                                    </div>
                                </div>
                            ))}

                            {/* Add Option Button */}
                            <button
                                onClick={handleAddOption}
                                className="bg-blue-500 hover:bg-blue-800 text-white rounded-md add_options"
                            >
                                <span>+</span> Add Options
                            </button>

                            {/* Save & Cancel Buttons */}
                            <div className="flex justify-end save-cancel">
                                <button
                                    onClick={handleCloseEditPopup}
                                    className="bg-gray-600 hover:bg-gray-800 text-white px-4 py-2 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveChanges}
                                    className="bg-green-500 hover:bg-green-800 text-white px-4 py-2 rounded-md"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Speech  */}
                {showEditSpeechPopup && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="MCQ-edit-container text-white p-6 rounded-lg shadow-lg w-96"
                        >
                            <h2 className="text-xl font-semibold mb-4">Speech Question</h2>

                            {/* Question Input */}
                            <div className='flex MCQ-question'>
                                <label className="block text-sm font-medium">Question:</label>
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    className="rounded-md mt-1 mb-3 border border-gray-600"
                                    placeholder="Enter your question"
                                />
                            </div>

                            {/* Save & Cancel Buttons */}
                            <div className="flex justify-end save-cancel">
                                <button
                                    onClick={handleCloseEditPopup}
                                    className="bg-gray-600 hover:bg-gray-800 text-white px-4 py-2 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveChanges}
                                    className="bg-green-500 hover:bg-green-800 text-white px-4 py-2 rounded-md"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Coding  */}
                {showEditCodingPopup && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="Coding-edit-container text-white p-6 rounded-lg shadow-lg w-96"
                        >
                            <h2 className="text-xl font-semibold mb-4">Coding Question</h2>

                            {/* Question Input */}
                            <div className='flex Coding-question'>
                                <label className="block text-sm font-medium">Question:</label>
                                <input
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    className="rounded-md mt-1 mb-3 border border-gray-600"
                                    placeholder="Enter your question"
                                />
                            </div>

                            <div className='flex Coding-question-statement'>
                                <label className="block text-sm font-medium">Statement:</label>
                                <ReactQuill theme="snow" value={value} onChange={setValue} modules={modules} />
                            </div>

                            <img src={Line} alt="line" className='e-line-top' />

                            <div className='flex test-case'>
                                <label className="block text-sm font-medium">Sample Test Case:</label>
                                <textarea
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    className="rounded-md mt-1 mb-3 border border-gray-600"
                                    placeholder="Enter your question"
                                />
                            </div>

                            <div className='flex test-case-output'>
                                <label className="block text-sm font-medium">Sample Test Case Output:</label>
                                <textarea
                                    type="text"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    className="rounded-md mt-1 mb-3 border border-gray-600"
                                    placeholder="Enter your question"
                                />
                            </div>

                            <img src={Line} alt="linw" className='e-line' />

                            <h2 className="heading">Test Cases</h2>
                            {testCases.map((testCase, index) => (
                                <div key={index} className="flex test-case-io">
                                    <div className="test-casee">
                                        <label className="block text-sm font-medium">Test Case Input:</label>
                                        <textarea
                                            value={testCase.input}
                                            onChange={(e) => handleChange(index, "input", e.target.value)}
                                            className="rounded-md mt-1 mb-3 border border-gray-600"
                                            placeholder="Enter test case input"
                                        />
                                    </div>
                                    <div className="test-casee">
                                        <label className="block text-sm font-medium">Test Case Output:</label>
                                        <textarea
                                            value={testCase.output}
                                            onChange={(e) => handleChange(index, "output", e.target.value)}
                                            className="rounded-md mt-1 mb-3 border border-gray-600"
                                            placeholder="Enter test case output"
                                        />
                                    </div>
                                    <button className="delete-btn" onClick={() => removeTestCase(index)}>🗑️</button>
                                </div>
                            ))}

                            <button className="add-btn" onClick={addTestCase}>➕ Add Test Case</button>

                            {/* Save & Cancel Buttons */}
                            <div className="flex justify-end save-cancel">
                                <button
                                    onClick={handleCloseEditPopup}
                                    className="bg-gray-600 hover:bg-gray-800 text-white px-4 py-2 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveChanges}
                                    className="bg-green-500 hover:bg-green-800 text-white px-4 py-2 rounded-md"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
            <div>
                <p>Modify details for {examDetails?.name}.</p>
                {/* Add input fields for editing */}
            </div>
        </div>

    )
}

export default EditExam