import React, { useRef, useState, useEffect } from 'react';
import './CustomLearning.css';
import { motion } from "framer-motion";
import line from '../assets/Line.png'
import { authFetch } from '../scripts/AuthProvider';
import Swal from 'sweetalert2';

const ChapterAdding = ({ onBackcc, onNextcc }) => {
    const fileInputRef = useRef(null);
    const [files, setFiles] = useState([]);
    const [chapterInput, setChapterInput] = useState({
        chapterName: '',
        description: '',
        priority: '',
        question: '',
        expectedOutput: ''
    });

    const [chapterList, setChapterList] = useState([]);
    const [expandedIndex, setExpandedIndex] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentModuleId, setCurrentModuleId] = useState(null);
    const [currentModuleName, setCurrentModuleName] = useState('');

    useEffect(() => {
        // Get module ID from localStorage (set by NewCoursefirst)
        const moduleId = localStorage.getItem('currentModuleId');
        const moduleName = localStorage.getItem('currentModuleName');
        if (moduleId) {
            setCurrentModuleId(moduleId);
            setCurrentModuleName(moduleName || 'Unknown Module');
        }
    }, []);

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        setFiles(selectedFiles);

        // NOTE: Add code to parse Excel file and extract chapters
        // Mock Data for right column preview (simulate parsed Excel content)
        setChapterList([
            { chapterName: 'Loops', description: 'Intro to loops', priority: 1, question: 'Write a for loop', expectedOutput: 'Loop output' },
            { chapterName: 'Functions', description: 'Functions in JS', priority: 2, question: 'Create a function', expectedOutput: 'Function Output' }
        ]);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setChapterInput({ ...chapterInput, [name]: value });
    };

    const handleSaveChapter = async () => {
        const { chapterName, description, question, expectedOutput } = chapterInput;

        if (!chapterName || !description || !question || !expectedOutput) {
            Swal.fire({
                title: 'Error!',
                text: 'Please fill out all fields',
                icon: 'error',
                background: "#181817",
                color: "#fff"
            });
            return;
        }

        if (!currentModuleId) {
            Swal.fire({
                title: 'Error!',
                text: 'No module selected. Please go back and create a module first.',
                icon: 'error',
                background: "#181817",
                color: "#fff"
            });
            return;
        }

        try {
            setLoading(true);
            const chapterData = {
                module: parseInt(currentModuleId),
                name: chapterName,
                desc: description,
                priority: chapterList.length + 1,
                question: question,
                expected_output: expectedOutput
            };

            const response = await authFetch('/learning/chapters/', {
                method: 'POST',
                body: JSON.stringify(chapterData),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                
                const newChapter = {
                    id: result.chapter_id,
                    chapterName,
                    description,
                    priority: chapterList.length + 1,
                    question,
                    expectedOutput
                };

                setChapterList([...chapterList, newChapter]);

                // Clear the input fields after save
                setChapterInput({
                    chapterName: '',
                    description: '',
                    priority: '',
                    question: '',
                    expectedOutput: ''
                });

                Swal.fire({
                    title: 'Success!',
                    text: 'Chapter added successfully!',
                    icon: 'success',
                    background: "#181817",
                    color: "#fff"
                });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create chapter');
            }
        } catch (error) {
            console.error('Error creating chapter:', error);
            Swal.fire({
                title: 'Error!',
                text: error.message || 'Failed to create chapter. Please try again.',
                icon: 'error',
                background: "#181817",
                color: "#fff"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };


    const toggleExpand = (index) => {
        setExpandedIndex(index === expandedIndex ? null : index);
    };

    // Save all chapters and proceed to next step
    const handleFinishAndNext = async () => {
        if (chapterList.length === 0) {
            Swal.fire({
                title: 'Warning!',
                text: 'Please add at least one chapter before proceeding.',
                icon: 'warning',
                background: "#181817",
                color: "#fff"
            });
            return;
        }

        Swal.fire({
            title: 'Success!',
            text: `Module "${currentModuleName}" created with ${chapterList.length} chapters!`,
            icon: 'success',
            background: "#181817",
            color: "#fff"
        }).then(() => {
            // Don't clear localStorage here - CourseStudents component needs it
            onNextcc();
        });
    };

    return (
        <div className='Custom-container'>
            <div className='new-c-top'>
                <h1>Add Chapters</h1>
                {currentModuleName && (
                    <p style={{color: '#888', marginTop: '8px'}}>
                        Adding chapters to: <strong style={{color: '#fff'}}>{currentModuleName}</strong>
                    </p>
                )}
                <img src={line} alt="line" className='w-full h-0.5' />
            </div>
            <div className='add-import'>
                <h2>Import Chapters</h2>
                <div className='import-file'>
                    {/* "Left space" section: filename/message */}
                    <div style={{
                        flex: 1,
                        color: files.length ? '#fff' : '#b7aacd',
                        fontSize: '1rem',
                        padding: '0.7rem 1rem'
                    }}>
                        {files.length === 0
                            ? "Upload here"
                            : files.length === 1
                                ? files[0].name
                                : `${files.map(f => f.name).join(', ')} (${files.length} files)`
                        }
                    </div>
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    {/* Upload button */}
                    <button
                        type="button"
                        onClick={handleUploadClick}
                        style={{
                            background: '#7b6cf6',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '7px',
                            padding: '0.6rem 1.5rem',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            fontWeight: 500,
                            margin: '0.5rem'
                        }}
                    >
                        Upload
                    </button>
                </div>
                <p>Or</p>
                <div className="chapter-sections">
                    {/* Left Column: Manual Chapter Form */}
                    <div className="left-manual-form">
                        <h3>Create Chapter Manually</h3>
                        <div className="form-group-c">
                            <label>Chapter Name</label>
                            <input
                                name="chapterName"
                                value={chapterInput.chapterName}
                                onChange={handleInputChange}
                                type="text"
                                placeholder="Enter chapter name"
                            />
                        </div>

                        <div className="form-group-c">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={chapterInput.description}
                                onChange={handleInputChange}
                                placeholder="Enter description"
                                rows={5}
                            ></textarea>
                        </div>

                        <div className="form-group-c">
                            <label>Priority (Chapter No.)</label>
                            <input
                                name="priority"
                                value={chapterInput.priority}
                                onChange={handleInputChange}
                                type="number"
                                placeholder="e.g., 1"
                            />
                        </div>

                        <div className="form-group-c">
                            <label>Question</label>
                            <textarea
                                name="question"
                                value={chapterInput.question}
                                onChange={handleInputChange}
                                placeholder="Enter question"
                                rows={5}
                            ></textarea>
                        </div>

                        <div className="form-group-c">
                            <label>Expected Output</label>
                            <textarea
                                name="expectedOutput"
                                value={chapterInput.expectedOutput}
                                onChange={handleInputChange}
                                placeholder="Enter expected output"
                                rows={5}
                            ></textarea>
                        </div>

                        <button 
                            onClick={handleSaveChapter} 
                            className="save-btn"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Chapter'}
                        </button>
                    </div>

                    {/* Right Column: Preview Area */}
                    <div className="right-preview">
                        <h3>Chapter Preview</h3>
                        {chapterList.length === 0 ? (
                            <p className="no-chapters">No chapters yet</p>
                        ) : (
                            chapterList.map((item, index) => (
                                <div
                                    className={`chapter-card ${expandedIndex === index ? 'expanded' : ''}`}
                                    key={index}
                                    onClick={() => toggleExpand(index)}
                                >
                                    <h4>{item.priority}. {item.chapterName}</h4>
                                    {expandedIndex === index && (
                                        <div className="chapter-details">
                                            <h5><strong>Description:</strong> </h5>
                                            <p> {item.description}</p>
                                            <h5><strong>Question:</strong></h5>
                                            <p> {item.question}</p>
                                            <h5><strong>Expected Output:</strong></h5>
                                            <p> {item.expectedOutput}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className='flex justify-end'>
                    <div className='flex items-center gap-8 bottom-course'>
                        <button className='back-btn-create' onClick={onBackcc}>Back</button>
                        <p>2/3</p>
                        <button 
                            className='next-btn' 
                            onClick={handleFinishAndNext}
                        >
                            Finish & Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChapterAdding