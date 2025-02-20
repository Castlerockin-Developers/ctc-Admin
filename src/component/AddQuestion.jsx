import React, { useEffect, useState } from 'react';
import line from '../assets/Line.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import Swal from "sweetalert2";
import ReactQuill from 'react-quill';
import filter from '../assets/filter.png';

const AddQuestion = ({ onBack, onNexts }) => {
    // State to track window width for responsive truncation
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Helper function to truncate a title after a given number of words
    const truncateTitle = (title, wordLimit = 5) => {
        const words = title.split(" ");
        if (words.length > wordLimit) {
            return words.slice(0, wordLimit).join(" ") + "...";
        }
        return title;
    };

    // Popup states
    const [showEditMCQPopup, setShowEditMCQPopup] = useState(false);
    const [showEditCodingPopup, setShowEditCodingPopup] = useState(false);
    const [showTimerPopup, setShowTimerPopup] = useState(false);

    // MCQ option states
    const [options, setOptions] = useState([{ text: "", isCorrect: false }]);
    const [question, setQuestion] = useState("");
    const [testCases, setTestCases] = useState([{ input: "", output: "" }]);

    // Filter dropdown toggles
    const [showFilterDropdownMCQ, setShowFilterDropdownMCQ] = useState(false);
    const [showFilterDropdownCoding, setShowFilterDropdownCoding] = useState(false);

    // ReactQuill editor state and modules (for coding statement)
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

    // Source questions (Question Bank)
    const [sourceQuestions, setSourceQuestions] = useState([
        {
            id: 1,
            title: "Question Title - Medium Difficulty",
            content: "It is a long established fact that a reader ...",
            type: "mcq"
        },
        {
            id: 2,
            title: "Question Title - Medium Difficulty",
            content: "It is a long established fact that a reader ...",
            type: "coding"
        },
        {
            id: 3,
            title: "Question Title - Medium Difficulty",
            content: "It is a long established fact that a reader ...",
            type: "mcq"
        }
    ]);

    // Questions that have been added (split by type)
    const [mcqQuestions, setMcqQuestions] = useState([]);
    const [codingQuestions, setCodingQuestions] = useState([]);
    const [isQuestionBankVisible, setIsQuestionBankVisible] = useState(true);

    // NEW: Track editing of scores
    const [isEditingScoreMCQ, setIsEditingScoreMCQ] = useState(false);
    const [isEditingScoreCoding, setIsEditingScoreCoding] = useState(false);

    // -------------------- Timer & Dropdown Logic --------------------
    const toggleFilterDropdownMCQ = () => {
        setShowFilterDropdownMCQ(prev => !prev);
    };
    const toggleFilterDropdownCoding = () => {
        setShowFilterDropdownCoding(prev => !prev);
    };
    const handleSectionTimerClick = () => {
        setShowTimerPopup(true);
        // close dropdown
        setShowFilterDropdownMCQ(false);
        setShowFilterDropdownCoding(false);
    };
    const toggleTimerPopup = () => {
        setShowTimerPopup(prev => !prev);
    };

    // (Previously "Randomize" handler) - you can keep or remove as needed
    const handleRandomizeClick = () => {
        console.log("Randomize clicked");
        // close dropdown
        setShowFilterDropdownMCQ(false);
        setShowFilterDropdownCoding(false);
    };

    // -------------------- Score Editing Logic --------------------
    const handleEditScoreMCQ = () => {
        // Toggle the editing state
        setIsEditingScoreMCQ(prev => !prev);
    };
    const handleEditScoreCoding = () => {
        // Toggle the editing state
        setIsEditingScoreCoding(prev => !prev);
    };

    // Handle changes to the score input for MCQ
    const handleScoreChangeMCQ = (questionId, newScore) => {
        const limitedScore = Math.min(10, Math.max(0, newScore)); // Ensure score is between 0 and 10
        setMcqQuestions(prevQuestions =>
            prevQuestions.map(q =>
                q.id === questionId ? { ...q, score: limitedScore } : q
            )
        );
    };

// Handle changes to the score input for Coding
const handleScoreChangeCoding = (questionId, newScore) => {
    const limitedScore = Math.min(10, Math.max(0, newScore)); // Ensure score is between 0 and 10
    setCodingQuestions(prevQuestions =>
        prevQuestions.map(q =>
            q.id === questionId ? { ...q, score: limitedScore } : q
        )
    );
};

    // -------------------- Test Case Handlers for Coding Popup --------------------
    const handleChange = (index, field, value) => {
        const newTestCases = [...testCases];
        newTestCases[index][field] = value;
        setTestCases(newTestCases);
    };
    const addTestCase = () => {
        setTestCases([...testCases, { input: "", output: "" }]);
    };
    const removeTestCase = (index) => {
        const newTestCases = testCases.filter((_, i) => i !== index);
        setTestCases(newTestCases);
    };

    // -------------------- Popup Handlers (MCQ & Coding) --------------------
    const handleCodingEdit = () => {
        setShowEditCodingPopup(true);
    };
    const handleMcqEdit = () => {
        setShowEditMCQPopup(true);
    };
    const handleCloseEditPopup = () => {
        setShowEditMCQPopup(false);
        setShowEditCodingPopup(false);
    };

    // -------------------- MCQ Option Handlers --------------------
    const handleAddOption = () => {
        setOptions([...options, { text: "", isCorrect: false }]);
    };
    const handleOptionChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index].text = value;
        setOptions(newOptions);
    };
    const handleCorrectAnswer = (index) => {
        const newOptions = options.map((option, i) => ({
            ...option,
            isCorrect: i === index,
        }));
        setOptions(newOptions);
    };
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

    const handleSaveChanges = () => {
        console.log("Updated Question:", question);
        console.log("Updated Options:", options);
        setShowEditMCQPopup(false);
        setShowEditCodingPopup(false);
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

    // -------------------- Drag & Drop for Adding Questions --------------------
    const handleDragStart = (e, question) => {
        e.dataTransfer.setData('question', JSON.stringify(question));
        e.target.classList.add('draggable-active');
    };
    const handleDragEnd = (e) => {
        e.target.classList.remove('draggable-active');
    };
    const handleDragOver = (e) => {
        e.preventDefault();
    };
    const handleDrop = (e, containerType) => {
        e.preventDefault();
        const questionData = JSON.parse(e.dataTransfer.getData('question'));
        if (questionData.type === containerType) {
            addSingleQuestion(questionData, containerType);
        }
    };

    const addSingleQuestion = (questionToAdd, targetType) => {
        // If the question doesn't have a score property, initialize it to 0
        if (!('score' in questionToAdd)) {
            questionToAdd.score = 0;
        }

        const isAlreadyAdded = [...mcqQuestions, ...codingQuestions].some(q => q.id === questionToAdd.id);
        if (!isAlreadyAdded && questionToAdd.type === targetType) {
            if (targetType === 'mcq') {
                setMcqQuestions([...mcqQuestions, questionToAdd]);
            } else if (targetType === 'coding') {
                setCodingQuestions([...codingQuestions, questionToAdd]);
            }
            const remainingQuestions = sourceQuestions.filter(q => q.id !== questionToAdd.id);
            setSourceQuestions(remainingQuestions);
            if (remainingQuestions.length === 0) {
                setIsQuestionBankVisible(false);
            }
        }
    };

    const addAllQuestions = () => {
        const mcqToAdd = sourceQuestions.filter(q =>
            q.type === 'mcq' && !mcqQuestions.some(added => added.id === q.id)
        ).map(q => ({ ...q, score: q.score ?? 0 }));

        const codingToAdd = sourceQuestions.filter(q =>
            q.type === 'coding' && !codingQuestions.some(added => added.id === q.id)
        ).map(q => ({ ...q, score: q.score ?? 0 }));

        setMcqQuestions([...mcqQuestions, ...mcqToAdd]);
        setCodingQuestions([...codingQuestions, ...codingToAdd]);

        setSourceQuestions([]);
        setIsQuestionBankVisible(false);
    };

    const handleReturnQuestion = (questionToReturn) => {
        if (questionToReturn.type === 'mcq') {
            setMcqQuestions(mcqQuestions.filter(q => q.id !== questionToReturn.id));
        } else if (questionToReturn.type === 'coding') {
            setCodingQuestions(codingQuestions.filter(q => q.id !== questionToReturn.id));
        }
        setSourceQuestions([...sourceQuestions, questionToReturn]);
        setIsQuestionBankVisible(true);
    };

    // -------------------- Navigation (Next/Back) --------------------
    const handleNextButtonClick = () => {
        // If no question is added in either section, show error
        if (mcqQuestions.length === 0 && codingQuestions.length === 0) {
            Swal.fire({
                title: "Error",
                text: "Please add at least one question from the Question Bank to proceed.",
                icon: "error",
                background: "#181817",
                color: "#fff",
                showConfirmButton: false,
                timer: 1500,
            });
            return;
        }
        // If only MCQ questions are added, warn the user that coding questions are missing
        if (mcqQuestions.length > 0 && codingQuestions.length === 0) {
            Swal.fire({
                title: "Warning",
                text: "You have not added any Coding questions. Do you want to proceed?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                background: "#181817",
                color: "#fff",
            }).then((result) => {
                if (result.isConfirmed) {
                    onNexts();
                }
            });
            return;
        }
        // If only Coding questions are added, warn the user that MCQ questions are missing
        if (codingQuestions.length > 0 && mcqQuestions.length === 0) {
            Swal.fire({
                title: "Warning",
                text: "You have not added any MCQ questions. Do you want to proceed?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                background: "#181817",
                color: "#fff",
            }).then((result) => {
                if (result.isConfirmed) {
                    onNexts();
                }
            });
            return;
        }
        // If both sections have at least one question, proceed
        onNexts();
    };

    return (
        <div className='addq-container justify-center flex flex-wrap'>
            <div className='addquestion-box'>
                <h1>Add Questions</h1>
                <div className='grid lg:grid-cols-2 md:grid-cols-1 add-q-container gap-1.5'>
                    {/* Question Bank */}
                    <div className='questionbank-container'>
                        <div className='question-bank'>
                            <div className='question-bank-head flex justify-between'>
                                <h3>Question Bank</h3>
                                <button>+ Import</button>
                            </div>
                            <div className='question-bank-body'>
                                {isQuestionBankVisible && (
                                    <div className='question-templet-wrapper'>
                                        <div className='question-templet-header flex justify-between'>
                                            <p>Hello World</p>
                                            <div className='flex'>
                                                <span>{sourceQuestions.filter(q => q.type === 'mcq').length} MCQ</span>
                                                <span>{sourceQuestions.filter(q => q.type === 'coding').length} Coding</span>
                                                <button
                                                    className='bg-green-500 rounded-sm hover:bg-green-900 px-2'
                                                    onClick={addAllQuestions}
                                                >
                                                    + Add Bank
                                                </button>
                                            </div>
                                        </div>
                                        <div className='question-templet-body'>
                                            <div className='question'>
                                                {sourceQuestions.map(question => (
                                                    <details
                                                        key={question.id}
                                                        draggable
                                                        onDragStart={(e) => handleDragStart(e, question)}
                                                        onDragEnd={handleDragEnd}
                                                    >
                                                        <summary className='flex justify-between'>
                                                            {windowWidth <= 1024
                                                                ? truncateTitle(question.title, 2)
                                                                : question.title}
                                                            <div className="flex items-center gap-2 exam-type">
                                                                <span className="text-sm">
                                                                    {question.type.toUpperCase()}
                                                                </span>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        addSingleQuestion(question, question.type);
                                                                    }}
                                                                >
                                                                    + Add
                                                                </button>
                                                            </div>
                                                        </summary>
                                                        <p>{question.content}</p>
                                                    </details>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Added Questions */}
                    <div className='questionbank-added-container'>
    {/* MCQ Section */}
    <div className='question-bank'>
        <div className='addedquestion-bank-head flex justify-between'>
            <h3>MCQ</h3>
            <div className='flex relative'>
                <div className="section-timer-desktop">
                    <span>Section timer: </span>
                    <input type="number" placeholder='In minutes' />
                </div>
                {/* Filter button for mobile */}
                <div className='r-filter-btn' onClick={toggleFilterDropdownMCQ}>
                    <img src={filter} alt="filter-options" />
                    {showFilterDropdownMCQ && (
                        <div className="filter-dropdown">
                            <div className="dropdown-item" onClick={handleSectionTimerClick}>
                                Section Timer
                            </div>
                            <div className="r-randomize-btn" onClick={handleRandomizeClick}>
                                Randomize
                            </div>
                        </div>
                    )}
                </div>
                {/* Edit Score Button */}
                <button className='edit-button' onClick={handleEditScoreMCQ}>
                    {isEditingScoreMCQ ? "Save Changes" : "Edit Score"}
                </button>
                <button onClick={handleMcqEdit}>Create</button>
            </div>
        </div>

        {/* Timer Popup Modal (global) */}
        {showTimerPopup && (
            <div className="timer-popup-overlay" onClick={toggleTimerPopup}>
                <div
                    className="timer-popup-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className="close-btn" onClick={toggleTimerPopup}>X</button>
                    <div>
                        <span>Section timer: </span>
                        <input type="number" placeholder='In minutes' />
                    </div>
                </div>
            </div>
        )}

        <div
            className='addedquestion-bank-body'
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'mcq')}
        >
            {mcqQuestions.map(question => (
                <details key={question.id}>
                    <summary className='flex justify-between'>
                        {windowWidth <= 1024
                            ? truncateTitle(question.title, 3)
                            : question.title}
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                max={10}
                                value={question.score ?? 0}
                                disabled={!isEditingScoreMCQ}
                                onChange={(e) => handleScoreChangeMCQ(question.id, e.target.value)}
                                className={`${isEditingScoreMCQ ? 'w-16' : 'w-8'} mr-2 text-black rounded-sm text-white text-center ${isEditingScoreMCQ ? '[background-color:oklch(0.42_0_0)]' : ''}`}
                            />
                            {!isEditingScoreMCQ && <span className="ml-1">score</span>}
                            <button
                                onClick={() => handleReturnQuestion(question)}
                                className="bg-red-500 hover:bg-red-700 px-2 py-1 rounded"
                            >
                                Remove
                            </button>
                        </div>
                    </summary>
                    <p>{question.content}</p>
                </details>
            ))}
        </div>
    </div>

    {/* Coding Section */}
    <div className='question-bank'>
        <div className='addedquestion-bank-head flex justify-between'>
            <h3>Coding</h3>
            <div className='flex relative'>
                <div className='section-timer-desktop'>
                    <span>Section timer: </span>
                    <input type="number" placeholder='In minutes' />
                </div>
                {/* Filter button for mobile */}
                <div className='r-filter-btn' onClick={toggleFilterDropdownCoding}>
                    <img src={filter} alt="filter-options" />
                    {showFilterDropdownCoding && (
                        <div className="filter-dropdown2">
                            <div className="dropdown-item" onClick={handleSectionTimerClick}>
                                Section Timer
                            </div>
                        </div>
                    )}
                </div>
                {/* Edit Score Button */}
                <button className='edit-button' onClick={handleEditScoreCoding}>
                    {isEditingScoreCoding ? "Save Changes" : "Edit Score"}
                </button>
                <button onClick={handleCodingEdit}>Create</button>
            </div>
        </div>

        {/* Timer Popup Modal (same global modal as above) */}
        {showTimerPopup && (
            <div className="timer-popup-overlay" onClick={toggleTimerPopup}>
                <div
                    className="timer-popup-content"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button className="close-btn" onClick={toggleTimerPopup}>X</button>
                    <div>
                        <span>Section timer: </span>
                        <input type="number" placeholder='In minutes' />
                    </div>
                </div>
            </div>
        )}

        <div
            className='addedquestion-bank-body'
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'coding')}
        >
            {codingQuestions.map(question => (
                <details key={question.id}>
                    <summary className='flex justify-between'>
                        {windowWidth <= 1024
                            ? truncateTitle(question.title, 3)
                            : question.title}
                        <div className="flex items-center gap-4">
                            <input
                                type="number"
                                value={question.score ?? 0}
                                disabled={!isEditingScoreCoding}
                                onChange={(e) => handleScoreChangeCoding(question.id, e.target.value)}
                                className={`${isEditingScoreCoding ? 'w-16' : 'w-8'} mr-2 text-black rounded-sm text-white text-center ${isEditingScoreCoding ? '[background-color:oklch(0.42_0_0)]' : ''}`}
                            />
                            {!isEditingScoreCoding && <span className="ml-1">score</span>}
                            <button
                                onClick={() => handleReturnQuestion(question)}
                                className="bg-red-500 hover:bg-red-700 px-2 py-1 rounded"
                            >
                                Remove
                            </button>
                        </div>
                    </summary>
                    <p>{question.content}</p>
                </details>
            ))}
        </div>
    </div>
</div>

                </div>
                <div className='flex justify-center'>
                    <img src={line} alt="line" className='line-bottom' />
                </div>
                <div className='flex w-full justify-end bottom-control gap-1'>
                    <button onClick={onBack} className="exam-previous-btn">
                        <FontAwesomeIcon icon={faRotateLeft} className='left-icon' />back
                    </button>
                    <p>2/3</p>
                    <button className='exam-next-btn' onClick={handleNextButtonClick}>Next</button>
                </div>
            </div>

            {/* MCQ Edit Popup */}
            {showEditMCQPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="MCQ-edit-container text-white p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-semibold mb-4">Edit Question</h2>
                        <div className='flex MCQ-question'>
                            <label className="block text-sm font-medium">Question:</label>
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="rounded-md mt-1 mb-3 border border-gray-600"
                                placeholder="Enter your question"
                            />
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="rounded-md mt-1 mb-3 border border-gray-600"
                                placeholder="Enter your question"
                            ></textarea>
                        </div>
                        <div className='flex MCQ-question-score'>
                            <label className="block text-sm font-medium">Score:</label>
                            <input
                                type="number"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="rounded-md mt-1 mb-3 border border-gray-600"
                                placeholder="Enter Score"
                            />
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="rounded-md mt-1 mb-3 border border-gray-600"
                                placeholder="Enter your question"
                            ></textarea>
                        </div>
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center options-list">
                                <label className="block text-sm font-medium">Options:</label>
                                <div className='flex w-full'>
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        className="MCQ-question-options rounded-md border border-gray-600"
                                        placeholder={`Option ${index + 1}`}
                                    />
                                    <textarea
                                        value={option.text}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        className="rounded-md border border-gray-600"
                                        placeholder={`Option ${index + 1}`}
                                    ></textarea>
                                    <input
                                        type="checkbox"
                                        checked={option.isCorrect}
                                        onChange={() => handleCorrectAnswer(index)}
                                        className="m-checkbox"
                                        title="Mark as correct answer"
                                    />
                                    <button
                                        onClick={() => handleDeleteOption(index)}
                                        className="text-white px-3 py-1 rounded-md e-delete-btn"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={handleAddOption}
                            className="bg-blue-500 hover:bg-blue-800 text-white rounded-md add_options"
                        >
                            <span>+</span> Add Options
                        </button>
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
                    </div>
                </div>
            )}

            {/* Coding Edit Popup */}
            {showEditCodingPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="Coding-edit-container text-white p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-semibold mb-4">Coding Question</h2>
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
                        <img src={line} alt="line" className='e-line-top' />
                        <div className='flex test-case'>
                            <label className="block text-sm font-medium">Sample Test Case:</label>
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="rounded-md mt-1 mb-3 border border-gray-600"
                                placeholder="Enter sample test case"
                            />
                        </div>
                        <div className='flex test-case-output'>
                            <label className="block text-sm font-medium">Sample Test Case Output:</label>
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="rounded-md mt-1 mb-3 border border-gray-600"
                                placeholder="Enter sample output"
                            />
                        </div>
                        <img src={line} alt="line" className='e-line' />
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
                    </div>
                </div>
            )}
        </div>
    );
};
export default AddQuestion;
