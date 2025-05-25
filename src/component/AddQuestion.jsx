import React, { useEffect, useState } from 'react';
import line from '../assets/Line.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { faListCheck, faCode } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import ReactQuill from 'react-quill';
import filter from '../assets/filter.png';
import { motion } from "motion/react";
import closeicon from '../assets/close.png';
import { useDropzone } from "react-dropzone";


const AddQuestion = ({ onBack, onNexts }) => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const [sourceQuestions, setSourceQuestions] = useState([
        {
            id: 1,
            title: "Question Title - Medium Difficulty",
            content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is",
            type: "mcq",
            dataset: "google"
        },
        {
            id: 2,
            title: "Question Title - Medium Difficulty",
            content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is",
            type: "coding",
            dataset: "google"
        },
        {
            id: 3,
            title: "Question Title - Medium Difficulty",
            content: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is",
            type: "mcq",
            dataset: "microsoft"
        },
        {
            id: 4,
            title: "Question Title - Internals Exam",
            content: "This is a sample question for internals exam.",
            type: "mcq",
            dataset: "internals exams"
        },
        {
            id: 5,
            title: "Coding Question - Internals Exam",
            content: "This is a sample coding question for internals exam.",
            type: "coding",
            dataset: "internals exams"
        },
        {
            id: 6,
            title: "Final Exam MCQ",
            content: "This is a sample MCQ for the final exam.",
            type: "mcq",
            dataset: "final exams"
        },
        {
            id: 7,
            title: "Final Exam Coding",
            content: "This is a sample coding question for the final exam.",
            type: "coding",
            dataset: "final exams"
        }
    ]);
    // Popup states
    const [showEditMCQPopup, setShowEditMCQPopup] = useState(false);
    const [showEditCodingPopup, setShowEditCodingPopup] = useState(false);
    const [showTimerPopup, setShowTimerPopup] = useState(false);

    //   Import Question Bank Popup
    const [showImportPopup, setShowImportPopup] = useState(false)

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

    //  Track editing of scores
    const [isEditingScoreMCQ, setIsEditingScoreMCQ] = useState(false);
    const [isEditingScoreCoding, setIsEditingScoreCoding] = useState(false);

    const [mcqQuestions, setMcqQuestions] = useState([]);
    const [codingQuestions, setCodingQuestions] = useState([]);
    const [isQuestionBankVisible, setIsQuestionBankVisible] = useState(true);

    // Import Question bank
    const toggleImportPopup = () => setShowImportPopup((prev) => !prev);
    const closeImportPopup = () => setShowImportPopup(false);
    const [file, setFile] = useState(null);

    const [showRandomizePopup, setShowRandomizePopup] = useState(false);
    const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
    const [selectedNumberOfQuestions, setSelectedNumberOfQuestions] = useState(1);
    const [selectedQuestionType, setSelectedQuestionType] = useState('mcq');

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const truncateTitle = (title, wordLimit = 5) => {
        const words = title.split(" ");
        if (words.length > wordLimit) {
            return words.slice(0, wordLimit).join(" ") + "...";
        }
        return title;
    };

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

    const addAllQuestions = (dataset, type) => {
        const questionsToAdd = sourceQuestions.filter(q => q.dataset === dataset && q.type === type && !mcqQuestions.some(added => added.id === q.id) && !codingQuestions.some(added => added.id === q.id));
        questionsToAdd.forEach(question => {
            if (question.type === 'mcq') {
                setMcqQuestions(prev => [...prev, question]);
            } else if (question.type === 'coding') {
                setCodingQuestions(prev => [...prev, question]);
            }
        });
        setSourceQuestions(sourceQuestions.filter(q => !(q.dataset === dataset && q.type === type)));
        if (sourceQuestions.filter(q => !(q.dataset === dataset && q.type === type)).length === 0) {
            setIsQuestionBankVisible(false);
        }
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

    const toggleFilterDropdownMCQ = () => {
        setShowFilterDropdownMCQ(prev => !prev);
    };

    const toggleFilterDropdownCoding = () => {
        setShowFilterDropdownCoding(prev => !prev);
    };

    const handleSectionTimerClick = () => {
        setShowTimerPopup(true);
        setShowFilterDropdownMCQ(false);
        setShowFilterDropdownCoding(false);
    };

    const handleRandomizeClick = () => {
        setShowFilterDropdownMCQ(false);
        setShowFilterDropdownCoding(false);
        setShowRandomizePopup(true);
    };

    const toggleTimerPopup = () => {
        setShowTimerPopup(prev => !prev);
    };

    //     Drop questionbank dataset logic
    const onDrop = (acceptedFiles) => {
        setFile(acceptedFiles[0]);
    };

    const { getRootProps, getInputProps } = useDropzone({ onDrop });

    const handleNextButtonClick = () => {
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
        onNexts();
    };

    const uniqueDatasets = [...new Set(sourceQuestions.map(q => q.dataset))];
    const handleRandomizePopupClose = () => {
        setShowRandomizePopup(false);
    };

    const handleAddRandomizedQuestions = () => {
        console.log("Adding randomized questions:", selectedNumberOfQuestions, selectedDifficulty, selectedQuestionType);
        setShowRandomizePopup(false);
    };

    return (
        <div className='addq-container justify-center flex flex-wrap'>
            <style>
                {`
                    .card-gap {
                        margin-bottom: 10px; /* Adjust the value to control the gap size */
                    }
                `}
            </style>
            <div className='addquestion-box'>
                <h1>Add Questions</h1>
                <div className='grid xl:grid-cols-2 lg:grid-cols-1 md:grid-cols-1 add-q-container xl:gap-1.5 lg:gap-10 gap-14'>
                    <div className='questionbank-container'>
                        <div className='question-bank'>
                            <div className='question-bank-head flex justify-between'>
                                <h3>Question Bank</h3>
                                <div className='flex gap-2'>
                                    <button onClick={toggleImportPopup}>+ Import</button>
                                    <button onClick={handleRandomizeClick} className="randomize-button">
                                        Randomize
                                    </button>
                                </div>
                            </div>
                            <div className='question-bank-body'>
                                {isQuestionBankVisible && (
                                    <div>
                                        {uniqueDatasets.map(dataset => (
                                            <div key={dataset}>
                                                {/* MCQ Section */}
                                                <div className='dataset-section card-gap'>
                                                    <div className='question-templet-wrapper'>
                                                        <div className='question-templet-header flex justify-between'>
                                                            <p>{dataset.charAt(0).toUpperCase() + dataset.slice(1)} - MCQ</p>
                                                            <div className='flex'>
                                                                <span>{sourceQuestions.filter(q => q.dataset === dataset && q.type === 'mcq').length} MCQ</span>
                                                                <button
                                                                    className='bg-green-500 rounded-sm hover:bg-green-900 px-2'
                                                                    onClick={() => addAllQuestions(dataset, 'mcq')}
                                                                >
                                                                    + Add All
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className='question-templet-body'>
                                                            <div className='question'>
                                                                {sourceQuestions.filter(q => q.dataset === dataset && q.type === 'mcq').map(question => (
                                                                    <details
                                                                        key={question.id}
                                                                        draggable
                                                                        onDragStart={(e) => handleDragStart(e, question)}
                                                                        onDragEnd={handleDragEnd}
                                                                        className='card-gap'
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
                                                </div>
                                                {/* Coding Section */}
                                                <div className='dataset-section card-gap'>
                                                    <div className='question-templet-wrapper'>
                                                        <div className='question-templet-header flex justify-between'>
                                                            <p>{dataset.charAt(0).toUpperCase() + dataset.slice(1)} - Coding</p>
                                                            <div className='flex'>
                                                                <span>{sourceQuestions.filter(q => q.dataset === dataset && q.type === 'coding').length} Coding</span>
                                                                <button
                                                                    className='bg-green-500 rounded-sm hover:bg-green-900 px-2'
                                                                    onClick={() => addAllQuestions(dataset, 'coding')}
                                                                >
                                                                    + Add All
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className='question-templet-body'>
                                                            <div className='question'>
                                                                {sourceQuestions.filter(q => q.dataset === dataset && q.type === 'coding').map(question => (
                                                                    <details
                                                                        key={question.id}
                                                                        draggable
                                                                        onDragStart={(e) => handleDragStart(e, question)}
                                                                        onDragEnd={handleDragEnd}
                                                                        className='card-gap'
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
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className='questionbank-added-container'>
                        <div className='question-bank'>
                            <div className='addedquestion-bank-head flex justify-between'>
                                <h3>MCQ</h3>
                                <div className='flex relative'>
                                    <div className="section-timer-desktop">
                                        <span>Section timer: </span>
                                        <input type="number" placeholder='In minutes' />
                                    </div>
                                    <div className='r-filter-btn' onClick={toggleFilterDropdownMCQ}>
                                        <img src={filter} alt="filter-options" />
                                        {showFilterDropdownMCQ && (
                                            <div className="filter-dropdown">
                                                <div className="dropdown-item" onClick={handleSectionTimerClick}>
                                                    Section Timer
                                                </div>
                                                <button className='edit-button' onClick={handleEditScoreMCQ}>
                                                    {isEditingScoreMCQ ? "Save Changes" : "Edit Score"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button className='edit-button' onClick={handleEditScoreMCQ}>
                                        {isEditingScoreMCQ ? "Save Changes" : "Edit Score"}
                                    </button>
                                    <button onClick={handleMcqEdit}>Create</button>
                                </div>
                            </div>

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
            {showImportPopup && (
                <div className="fixed inset-0 flex items-center justify-center top-display-pop">
                    <div className="top-display-pop-card rounded-sm shadow-lg w-3/4 md:w-1/2 min-h-[500px]">
                        <div className="flex justify-between items-center mb-4 top-display-pop-title">
                            <h2 className="font-semibold text-center">Import Questionbank</h2>
                            <motion.button whileTap={{ scale: 1.2 }} className="text-red-500 text-lg" onClick={closeImportPopup}>
                                <img src={closeicon} alt="Close" />
                            </motion.button>

                        </div>

                        <div>
                            <div
                                {...getRootProps()}
                                className="border-2 border-dashed border-gray-500 p-6 rounded-lg text-center cursor-pointer hover:border-gray-300 transition"
                            >
                                <input {...getInputProps()} />
                                <div className="flex flex-col items-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-12 h-12 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 16v-4m0 0V8m0 4h4m-4 0H8m12 4v4H4v-4M4 16l8-8 8 8"
                                        />
                                    </svg>
                                    <h2 className="mt-2 text-white text-3xl">Drag the dataset</h2>
                                    <p className="text-sm text-gray-400 text-3xl">or <span className="text-blue-400 cursor-pointer">upload from device</span></p>
                                </div>
                            </div>
                            {file && (
                                <p className="mt-3 text-sm text-green-400">Selected: {file.name}</p>
                            )}

                        </div>

                    </div>
                </div>

            )}

            {showEditMCQPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="MCQ-edit-container text-white p-8 rounded-lg shadow-lg w-[600px]">
                        <h2 className="text-2xl font-semibold mb-6">Edit Question</h2>
                        <div className='mb-6'>
                            <label className="block text-sm font-medium mb-2">Question:</label>
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="rounded-md w-full border border-gray-600 p-2 bg-[#333] text-white"
                                placeholder="Enter your question"
                            ></textarea>
                        </div>
                        <div className='mb-6'>
                            <label className="block text-sm font-medium mb-2">Score:</label>
                            {/* // <input
                            //     type="number"
                            //     value={question}
                            //     onChange={(e) => setQuestion(e.target.value)}
                            //     className="rounded-md w-full border border-gray-600 p-2 bg-[#333] text-white"
                            //     placeholder="Enter Score"
                            // /> */}
                            <textarea
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="rounded-md mt-1 mb-3 border border-gray-600"
                                placeholder="Enter your question"
                            ></textarea>
                        </div>
                        {options.map((option, index) => (
                            <div key={index} className="mb-4">
                                <label className="block text-sm font-medium mb-2">Option {index + 1}:</label>
                                <div className='flex items-center space-x-4'>
                                    {/* // <input
                                    //     type="text"
                                    //     value={option.text}
                                    //     onChange={(e) => handleOptionChange(index, e.target.value)}
                                    //     className="flex-1 rounded-md border border-gray-600 p-2 bg-[#333] text-white"
                                    //     placeholder={`Option ${index + 1}`}
                                    // /> */}
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
                            className="bg-blue-500 hover:bg-blue-800 text-white rounded-md add-option"
                        >
                            <span>+</span> Add Option
                        </button>
                        <div className="flex justify-end gap-3 mt-6 eq-button">
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
                    <div className="Coding-edit-container text-white p-8 rounded-lg shadow-lg w-[600px]">
                        <h2 className="text-2xl font-semibold mb-6">Coding Question</h2>
                        <div className='mb-6'>
                            <label className="block text-sm font-medium mb-2">Question:</label>
                            <textarea
                                value={question}
                                rows={6}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="rounded-md w-full border border-gray-600 p-2 bg-[#333] text-white"
                                placeholder="Enter your question"
                            ></textarea>
                        </div>
                        <div className='mb-6'>
                            <label className="block text-sm font-medium mb-2">Statement:</label>
                            <ReactQuill theme="snow" value={value} onChange={setValue} />
                        </div>
                        <div className='mb-6'>
                            <label className="block text-sm font-medium mb-2">Sample Test Case:</label>
                            <textarea
                                value={question}
                                rows={6}
                                onChange={(e) => setQuestion(e.target.value)}
                                className="rounded-md w-full border border-gray-600 p-2 bg-[#333] text-white"
                                placeholder="Enter your question"
                            ></textarea>
                        </div>
                        <div className='mb-6'>
                            <label className="block text-sm font-medium mb-2">Sample Test Case Output:</label>
                            <textarea
                                value={question}
                                rows={6}
                                onChange={(e) => setQuestion(e.target.value)}
                                //     className="rounded-md mt-1 mb-3 border border-gray-600"
                                //     placeholder="Enter sample output"
                                // />
                                className="rounded-md w-full border border-gray-600 p-2 bg-[#333] text-white"
                                placeholder="Enter your question"
                            ></textarea>
                        </div>
                        <h2 className="text-xl font-semibold mb-4">Test Cases</h2>
                        {testCases.map((testCase, index) => (
                            <div key={index} className="mb-4">
                                <div className='mb-4'>
                                    <label className="block text-sm font-medium mb-2">Test Case Input:</label>
                                    <textarea
                                        value={testCase.input}
                                        rows={6}
                                        onChange={(e) => handleChange(index, "input", e.target.value)}
                                        className="rounded-md w-full border border-gray-600 p-2 bg-[#333] text-white"
                                        placeholder="Enter test case input"
                                    ></textarea>
                                </div>
                                <div className='mb-4'>
                                    <label className="block text-sm font-medium mb-2">Test Case Output:</label>
                                    <textarea
                                        value={testCase.output}
                                        rows={6}
                                        onChange={(e) => handleChange(index, "output", e.target.value)}
                                        className="rounded-md w-full border border-gray-600 p-2 bg-[#333] text-white"
                                        placeholder="Enter test case output"
                                    ></textarea>
                                    <button className="" onClick={() => removeTestCase(index)}>🗑️</button>

                                </div>
                            </div>
                        ))}
                        <div className=''>
                            <button className="add-btn" onClick={addTestCase}>➕ Add Test Case</button>
                        </div>
                        <div className="flex justify-end space-x-4 mt-6 save-cancel">
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
            {showRandomizePopup && (
                <div className="fixed inset-0 flex items-center justify-center top-display-pop">
                    <div className="rounded-sm shadow-lg w-[700px]  flex flex-col bg-[#1e1e1e] text-white">
                        <div className="flex justify-between gap-55 items-center top-display-pop-title randomize-head">
                            <h2 className="font-semibold text-2xl text-center text-white">Randomize Questions</h2>
                            <motion.button whileTap={{ scale: 1.2 }} className="text-red-500 text-2xl" onClick={handleRandomizePopupClose}>
                                <img src={closeicon} alt="Close" />
                            </motion.button>
                        </div>

                        <div className="flex flex-col justify-center random-data form-content">
                            <div className="flex">
                                <div className="flex">
                                    <label className="block text-xl font-medium mb-6 text-white">Number of Questions </label><span>:</span>
                                </div>
                                <input
                                    type="number"
                                    value={selectedNumberOfQuestions}
                                    onChange={(e) => setSelectedNumberOfQuestions(Number(e.target.value))}
                                    className="rounded-md w-sm border border-gray-600 p-4 bg-[#333] text-white text-xl"
                                    placeholder="Enter number of questions"
                                    min="1"
                                />
                            </div>
                            <div className="flex-grow">
                                <div className="flex">
                                    <label className="block text-xl font-medium mb-6 text-white">Question Type:</label>
                                    <div className="flex flex-col space-y-4">
                                        <div className="toggle-buttons flex space-x-4">
                                            <motion.button
                                                className={`toggle-btn ${selectedQuestionType === "mcq" ? "active" : ""}`}
                                                onClick={() => setSelectedQuestionType("mcq")}
                                            >
                                                <FontAwesomeIcon icon={faListCheck} className="icon" /> MCQ
                                            </motion.button>
                                            <motion.button
                                                className={`toggle-btn ${selectedQuestionType === "coding" ? "active" : ""}`}
                                                onClick={() => setSelectedQuestionType("coding")}
                                            >
                                                <FontAwesomeIcon icon={faCode} className="icon" /> Coding
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-grow">
                                <div className="flex">
                                    <label className="block text-xl font-medium mb-6 text-white">Difficulty Level:</label>
                                    <div className="flex flex-col space-y-4">
                                        <div className="toggle-buttons flex space-x-4 mt-4">
                                            <motion.button
                                                className={`toggle-btn ${selectedDifficulty === "easy" ? "active" : ""}`}
                                                onClick={() => setSelectedDifficulty("easy")}
                                            >
                                                Easy
                                            </motion.button>
                                            <motion.button
                                                className={`toggle-btn ${selectedDifficulty === "medium" ? "active" : ""}`}
                                                onClick={() => setSelectedDifficulty("medium")}
                                            >
                                                Medium
                                            </motion.button>
                                            <motion.button
                                                className={`toggle-btn ${selectedDifficulty === "hard" ? "active" : ""}`}
                                                onClick={() => setSelectedDifficulty("hard")}
                                            >
                                                Hard
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-6 mt-6">
                            <button
                                onClick={handleAddRandomizedQuestions}
                                className=" text-white px-7 py-4 rounded-md text-lg  default-btn"
                            >
                                Add Questions
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
export default AddQuestion;