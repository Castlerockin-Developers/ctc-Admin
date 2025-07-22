import React, { useRef, useState } from 'react';
import './CustomLearning.css';
import { motion } from "framer-motion";
import line from '../assets/Line.png'

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

    const handleSaveChapter = () => {
        const { chapterName, description, priority, question, expectedOutput } = chapterInput;

        if (chapterName && description && priority && question && expectedOutput) {
            const prioritizedChapter = {
                chapterName,
                description,
                priority: chapterList.length + 1,
                question,
                expectedOutput
            };

            setChapterList([...chapterList, prioritizedChapter]);

            // Clear the input fields after save
            setChapterInput({
                chapterName: '',
                description: '',
                priority: '',
                question: '',
                expectedOutput: ''
            });
        } else {
            alert('Please fill out all fields');
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };


    const toggleExpand = (index) => {
        setExpandedIndex(index === expandedIndex ? null : index);
    };

    return (
        <div className='Custom-container'>
            <div className='new-c-top'>
                <h1>Add Chapters</h1>
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

                        <button onClick={handleSaveChapter} className="save-btn">
                            Save Chapter
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
                        <button className='next-btn' onClick={onNextcc}>Next</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChapterAdding