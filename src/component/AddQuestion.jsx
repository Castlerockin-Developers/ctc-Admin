import React, { useEffect, useState } from 'react';
import line from '../assets/Line.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import Swal from "sweetalert2";
import { authFetch } from '../scripts/AuthProvider';


const AddQuestion = ({ onBack, onNexts, onCreateMCQ, onCreateCoding }) => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [sourceQuestions, setSourceQuestions] = useState([]);
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                const response = await authFetch('/admin/sections', { method: 'GET' });
                if (response.ok) {
                    const data = await response.json();
                    const questions = data.map(q => ({
                        id: q.id,
                        title: q.title,
                        content: q.content,
                        type: q.type,
                        dataset: q.dataset,
                        group_id: q.group_id
                    }));
                    setSourceQuestions(questions || []);
                } else {
                    console.error("Failed to fetch questions:", response.statusText);
                }
            } catch (error) {
                console.error("Error fetching questions:", error);
            }
        };
        fetchQuestions();
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Popup states
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [showImportPopup, setShowImportPopup] = useState(false);
    const [selectedQuestionType, setSelectedQuestionType] = useState(null);

    //   Import Question Bank Popup
    const [sectionTimers, setSectionTimers] = useState({});

    const [isEditingScoreCoding, setIsEditingScoreCoding] = useState(false);

    const [mcqQuestions, setMcqQuestions] = useState([]);
    const [codingQuestions, setCodingQuestions] = useState([]);
    const [isQuestionBankVisible, setIsQuestionBankVisible] = useState(true);

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

    const handleCreateClick = () => {
        setShowCreatePopup(true);
    };

    const handleImport = () => {
        setShowImportPopup(true);
    };

    const handleCloseCreatePopup = () => {
        setShowCreatePopup(false);
        setShowImportPopup(false);

    };

    const handleCreateType = (type) => {
        setShowCreatePopup(false);
        if (type === 'mcq') {
            onCreateMCQ();          // ← navigate to NewMcq
        } else {
            onCreateCoding();
        }
    };


    // -------------------- Score Editing Logic --------------------
    // near the top, alongside your other handlers
    // at top of component
    const handleEditSectionScore = (groupId) => {
        // find a “default” current score
        const current = mcqQuestions.find(q => q.group_id === groupId)?.score ?? 0;

        Swal.fire({
            title: 'Set score for this section',
            text: 'Enter a score between 0 and 10',
            input: 'number',
            inputValue: current,
            inputAttributes: { min: 0, max: 10, step: 1 },
            showCancelButton: true,
            confirmButtonText: 'Apply',
            background: "#181817",
            color: "#fff",
        }).then(result => {
            if (!result.isConfirmed) return;
            const newScore = parseInt(result.value, 10);
            if (isNaN(newScore) || newScore < 0 || newScore > 10) {
                return Swal.fire({ title: 'Invalid', text: 'Must be 0–10', icon: 'error', background: "#181817", color: "#fff" });
            }
            setMcqQuestions(prev =>
                prev.map(q =>
                    q.group_id === groupId
                        ? { ...q, score: newScore }
                        : q
                )
            );
            Swal.fire({ title: 'Done!', text: `All set to ${newScore}`, icon: 'success', background: "#181817", color: "#fff", timer: 1200 });
        });
    };


    const handleEditCodingSectionScore = () => {
        // get a sensible default (first question’s score or 0)
        const current = codingQuestions.length
            ? codingQuestions[0].score ?? 0
            : 0;

        Swal.fire({
            title: `Set score for all coding questions`,
            text: 'Enter a score between 0 and 10:',
            input: 'number',
            inputValue: current,
            inputAttributes: { min: 0, max: 10, step: 1 },
            showCancelButton: true,
            confirmButtonText: 'Apply',
            cancelButtonText: 'Cancel',
            background: "#181817",
            color: "#fff",
        }).then(result => {
            if (result.isConfirmed) {
                const newScore = parseInt(result.value, 10);
                if (isNaN(newScore) || newScore < 0 || newScore > 10) {
                    Swal.fire({
                        title: 'Invalid score',
                        text: 'Please enter a number from 0 to 10.',
                        icon: 'error',
                        background: "#181817",
                        color: "#fff",
                    });
                    return;
                }
                // apply to all coding questions
                setCodingQuestions(prev =>
                    prev.map(q => ({ ...q, score: newScore }))
                );
                Swal.fire({
                    title: 'Done!',
                    text: `All coding questions set to ${newScore}.`,
                    icon: 'success',
                    background: "#181817",
                    color: "#fff",
                    timer: 1500,
                });
            }
        });
    };

    const handleFileSelection = (questionType) => {
        setSelectedQuestionType(questionType);  // Store the selected question type (MCQ or Coding)
        document.getElementById('excelFileInput').click();  // Trigger file input click
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Handle the file processing based on the selected question type (MCQ or Coding)
            if (selectedQuestionType === 'mcq') {
                // Process MCQ file
                console.log('Uploading MCQ questions file:', file);
            } else if (selectedQuestionType === 'coding') {
                // Process Coding file
                console.log('Uploading Coding questions file:', file);
            }
            // Optionally, you can close the popup after file selection
            handleCloseCreatePopup();
        }
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

    // Truncate content
    const truncateContent = (text, limit = 10) => {
        const words = text.split(' ');
        return words.length > limit ? `${words.slice(0, limit).join(' ')}...` : text;
    };

    // Add single
    const addSingleQuestion = (q, type) => {
        if (!('score' in q)) q.score = 0;
        const exists = [...mcqQuestions, ...codingQuestions].some(x => x.id === q.id);
        if (!exists) {
            if (type === 'mcq') setMcqQuestions(prev => [...prev, q]);
            else setCodingQuestions(prev => [...prev, q]);
            setSourceQuestions(prev => prev.filter(x => x.id !== q.id));
            if (sourceQuestions.length - 1 === 0) setIsQuestionBankVisible(false);
        }
    };

    // 1) Prompt & count
    const handleAddAllClick = (sectionId, type) => {
        // choose the right base list
        const base = sectionId != null
            ? sourceQuestions.filter(q => q.group_id === sectionId && q.type === type)
            : sourceQuestions.filter(q => q.type === type);

        const total = base.length;
        if (total === 0) {
            Swal.fire({
                title: "Error",
                text: "No questions available in this section.",
                icon: "error",
                background: "#181817",
                color: "#fff",
                showConfirmButton: true,
            });
            return;
        }

        Swal.fire({
            title: 'How many questions to add?',
            input: 'number',
            inputAttributes: { min: 1, max: total, step: 1 },
            showDenyButton: true,
            confirmButtonText: 'Add Number',
            denyButtonText: 'Add All',
            showCancelButton: true,
            background: "#181817",
            color: "#fff",
        }).then(result => {
            if (result.isDenied) {
                addMultipleQuestions(sectionId, type, total);
            } else if (result.isConfirmed && result.value) {
                const count = Math.min(parseInt(result.value, 10) || 0, total);
                if (count < 1) {
                    Swal.fire({ title: "Invalid Input!", text: "Enter a positive number.", icon: "error", background: "#181817", color: "#fff" });
                    return;
                }
                addMultipleQuestions(sectionId, type, count);
            }
        });
    };

    // 2) Actually grab & add
    const addMultipleQuestions = (sectionId, type, count) => {
        const filtered = sectionId != null
            ? sourceQuestions.filter(q => q.group_id === sectionId && q.type === type)
            : sourceQuestions.filter(q => q.type === type);

        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        shuffled.slice(0, count).forEach(q => addSingleQuestion(q, type));
    };

    const handleDragStart = (e, q) => {
        e.dataTransfer.setData('question', JSON.stringify(q));
        e.target.classList.add('draggable-active');
    };
    const handleDragEnd = (e) => {
        e.target.classList.remove('draggable-active');
    };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, type) => {
        e.preventDefault();
        const questionData = JSON.parse(e.dataTransfer.getData('question'));
        if (questionData.type === type) {
            addSingleQuestion(questionData, type);
        }
    };

    const handleReturnQuestion = (questionToReturn) => {
        if (questionToReturn.type === 'mcq') {
            setMcqQuestions(mcqQuestions.filter(q => q.id !== questionToReturn.id));
        } else if (questionToReturn.type === 'coding') {
            setCodingQuestions(codingQuestions.filter(q => q.id !== questionToReturn.id));
        }
        setSourceQuestions(prev => [...prev, questionToReturn]);
        setIsQuestionBankVisible(true);
    };

    const handleRemoveSection = (groupId) => {
        const toReturn = mcqQuestions.filter(q => q.group_id === groupId);
        setMcqQuestions(prev => prev.filter(q => q.group_id !== groupId));
        setSourceQuestions(prev => [...prev, ...toReturn]);
        setIsQuestionBankVisible(true);
    };

    const handleTimerChange = (groupId, value) => {
        setSectionTimers(prev => ({ ...prev, [groupId]: value }));
    };


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

    const uniqueSections = [...new Set(sourceQuestions.map(q => q.group_id))];
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
                <div className='flex gap-4 new-question-buttons'>
                    <button onClick={handleCreateClick}>Create MCQ/Coding</button>
                    <button onClick={handleImport}>Import MCQ/Coding</button>
                    {showCreatePopup && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="create-popup">
                                <button
                                    onClick={handleCloseCreatePopup}
                                    className="absolute top-1 right-2 text-white font-bold hover:text-gray-700"
                                >
                                    ✕
                                </button>
                                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                                    Create new question
                                </h2>
                                <div className="flex gap-2 justify-between create-popup-btn">
                                    <button
                                        onClick={() => handleCreateType('mcq')}
                                        className="flex-1"
                                    >
                                        MCQ
                                    </button>
                                    <button
                                        onClick={() => handleCreateType('coding')}
                                        className="flex-1"
                                    >
                                        Coding
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showImportPopup && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="create-popup">
                                <button
                                    onClick={handleCloseCreatePopup}
                                    className="absolute top-1 right-2 text-white font-bold hover:text-gray-700"
                                >
                                    ✕
                                </button>
                                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                                    Import questions from excel
                                </h2>

                                <div className='flex gap-2 import-btn'>
                                    {/* MCQ Button */}
                                    <button
                                        className="px-4 py-2 bg-blue-500 text-white rounded-md mb-2 w-full"
                                        onClick={() => handleFileSelection('mcq')}
                                    >
                                        MCQ Questions
                                    </button>

                                    {/* Coding Button */}
                                    <button
                                        className="px-4 py-2 bg-green-500 text-white rounded-md w-full"
                                        onClick={() => handleFileSelection('coding')}
                                    >
                                        Coding Questions
                                    </button>
                                </div>

                                {/* File Input (hidden, triggered by buttons) */}
                                <input
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileUpload}
                                    id="excelFileInput"
                                    className="hidden"
                                />
                            </div>
                        </div>
                    )}


                </div>
                <div className='grid xl:grid-cols-2 lg:grid-cols-1 md:grid-cols-1 add-q-container xl:gap-1.5 lg:gap-10 gap-14'>
                    <div className='questionbank-container'>
                        <div className='question-bank'>
                            <div className='question-bank-head flex justify-between'>
                                <h3>Question Bank</h3>
                            </div>
                            <div className='question-bank-body'>
                                {isQuestionBankVisible && (
                                    <>
                                        {/* MCQ Sections by group_id */}
                                        {uniqueSections.map(sectionId => {
                                            const sectionQs = sourceQuestions.filter(q => q.group_id === sectionId && q.type === 'mcq');
                                            if (!sectionQs.length) return null;
                                            const sectionName = sectionQs[0].title;
                                            const total = sectionQs.length;
                                            const list = sectionQs.slice(0, 10);
                                            return (
                                                <div key={sectionId} className="dataset-section card-gap">
                                                    <div className="question-templet-wrapper">
                                                        <div className="question-templet-header flex justify-between">
                                                            <p>{`${sectionName} - ${total} questions`}</p>
                                                            <button
                                                                className="bg-green-500 rounded-sm hover:bg-green-900 px-2"
                                                                onClick={() => handleAddAllClick(sectionId, 'mcq')}
                                                            >
                                                                + Add All
                                                            </button>
                                                        </div>
                                                        <div className="question-templet-body">
                                                            {list.map(q => (
                                                                <p key={q.id} className="cardin-q">
                                                                    {windowWidth <= 1024
                                                                        ? truncateContent(q.content, 10)
                                                                        : q.content}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Coding Section once, outside the loop */}
                                        <div className="dataset-section card-gap">
                                            <div className="question-templet-wrapper">
                                                <div className="question-templet-header flex justify-between">
                                                    <p>{`Coding Questions - ${sourceQuestions.filter(q => q.type === 'coding').length} questions`}</p>
                                                    <button
                                                        className="bg-green-500 rounded-sm hover:bg-green-900 px-2"
                                                        onClick={() => handleAddAllClick(null, 'coding')}
                                                    >
                                                        + Add All
                                                    </button>
                                                </div>
                                                <div className="question-templet-body">
                                                    <div className="question">
                                                        {sourceQuestions
                                                            .filter(q => q.type === 'coding')
                                                            .slice(0, 10)
                                                            .map(question => (
                                                                <details
                                                                    key={question.id}
                                                                    draggable
                                                                    onDragStart={e => handleDragStart(e, question)}
                                                                    onDragEnd={handleDragEnd}
                                                                >
                                                                    <summary className="flex justify-between">
                                                                        {windowWidth <= 1024
                                                                            ? truncateTitle(question.title, 2)
                                                                            : question.title}
                                                                        <div className="flex items-center gap-2 exam-type">
                                                                            <span className="text-sm">
                                                                                {question.type.toUpperCase()}
                                                                            </span>
                                                                        </div>
                                                                    </summary>
                                                                    <p>{question.content}</p>
                                                                </details>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className='questionbank-added-container'>
                        <div className='question-bank'>
                            <div className='addedquestion-bank-head flex justify-between'>
                                <h3>MCQ</h3>
                            </div>
                            <div className='addedquestion-bank-body'>
                                {[...new Set(mcqQuestions.map(q => q.group_id))].map(groupId => {
                                    const sectionQs = mcqQuestions.filter(q => q.group_id === groupId);
                                    const sectionName = sectionQs[0]?.title || 'Unnamed Section'; // Safeguard for missing title

                                    return (
                                        <details key={groupId} className="mb-4 border rounded p-2">
                                            <summary className="flex justify-between items-center cursor-pointer">
                                                <p>{`${sectionName} — ${sectionQs.length} questions`}</p>
                                                <div className="flex items-center gap-2">
                                                    {/* Timer input */}
                                                    <input
                                                        type="number"
                                                        placeholder="Timer"
                                                        value={sectionTimers[groupId] || ''}
                                                        onChange={e => handleTimerChange(groupId, e.target.value)}
                                                        className="section-timer"
                                                    />

                                                    {/* Edit Score */}
                                                    <button
                                                        onClick={() => handleEditSectionScore(groupId)}
                                                        className="bg-[#A294F9] hover:bg-[#826fff] px-2 py-1 rounded text-sm text-white"
                                                    >
                                                        Edit Score
                                                    </button>

                                                    {/* Remove */}
                                                    <button
                                                        onClick={() => handleRemoveSection(groupId, 'mcq')}
                                                        className="bg-red-500 hover:bg-red-700 px-2 py-1 rounded text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </summary>

                                            {/* Display the content of each question in the section */}
                                            <div>
                                                {sectionQs.map((question, index) => (
                                                    <div key={question.id} className="score-alloted">
                                                        <p>{`${index + 1}. ${question.content || 'No content available'}`}</p>
                                                        <p className="text-sm text-white-500">Score: {question.score !== undefined ? question.score : 'N/A'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    );
                                })}

                            </div>
                        </div>

                        {/* Coding Section */}
                        <div className='question-bank'>
                            <div className='addedquestion-bank-head flex justify-between'>
                                <h3>Coding</h3>
                                <div className='flex items-center gap-2'>
                                    <button
                                        onClick={handleEditCodingSectionScore}
                                        className="bg-blue-500 hover:bg-blue-700 px-2 py-1 rounded text-sm text-white"
                                    >
                                        Edit Score
                                    </button>
                                    <div className='section-timer-desktop'>
                                        <span>Section timer: </span>
                                        <input type="number" placeholder='In minutes' />
                                    </div>
                                </div>
                            </div>

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
        </div>
    );
};
export default AddQuestion;