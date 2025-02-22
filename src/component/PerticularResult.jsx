import React from 'react';
import { FaShareAlt, FaShareSquare } from 'react-icons/fa';

const ParticularResult = ({ student, onBack }) => {
    return (
        <div className='viewresult-container'>
            <div className='viewreult-box'>
                <div className='flex justify-between top-viewresult'>
                    <div className='flex'>
                        <button onClick={onBack}>&lt;</button>
                        <div>
                            <p><span>Tests</span> / <span>#{student.usn} - {student.name}</span></p>
                            <h1>{student.name}</h1>
                            <h4>{student.usn}</h4>
                        </div>
                    </div>
                    <div className='flex gap-10 justify-between marks-r-cards-container'>
                        <div className='marks-r-cards'>
                            <p>Obtained Score</p>
                            <h4>{student.score}</h4>
                        </div>
                        <div className='marks-r-cards'>
                            <p>Trust Score</p>
                            <h4>{student.trustScore}</h4>
                        </div>
                    </div>
                </div>
                <div className="p-result-section">
                    <div className="p-result-header">
                        <h2>Exam Section</h2>
                        <button className="flex gap-2">
                            <FaShareSquare className="share-icon" />
                            Export as PDF
                        </button>
                    </div>
                    {/* Add items-center to center children horizontally */}
                    <div className="p-result-body flex flex-col items-center justify-start">
                        <div className="p-result-viwer">
                            <div className="p-reult-viwer-header flex justify-between">
                                <h2>MCQ</h2>
                                <p>3/4</p>
                            </div>
                            <div className="p-result-viwer-body flex justify-center">
                                <div className="presult-container">
                                    <details>
                                        <summary>
                                            {/* Container INSIDE summary for flex layout */}
                                            <div className="flex justify-between items-center w-full">
                                                <p>1. Sample Question</p>
                                                <div className="flex gap-40">
                                                    <span className="status-correct">Correct</span>
                                                    <p>1</p>
                                                </div>
                                            </div>
                                        </summary>
                                        <div className="answer-boxes">
                                            <div className="answer-box">
                                                <h3>Your Answer</h3>
                                                <p>This is where your answer would appear.</p>
                                            </div>
                                            <div className="answer-box">
                                                <h3>Actual Answer</h3>
                                                <p>This is where the correct answer would appear.</p>
                                            </div>
                                        </div>
                                    </details>
                                    <details>
                                        <summary>
                                            <div className="flex justify-between items-center w-full">
                                                <p>1. Sample Question</p>
                                                <div className="flex gap-40">
                                                    <span className="status-wrong">Wrong</span>
                                                    <p>1</p>
                                                </div>
                                            </div>
                                        </summary>
                                        <div className="answer-boxes">
                                            <div className="answer-box">
                                                <h3>Your Answer</h3>
                                                <p>This is where your answer would appear.</p>
                                            </div>
                                            <div className="answer-box">
                                                <h3>Actual Answer</h3>
                                                <p>This is where the correct answer would appear.</p>
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        </div>
                        <div className="p-result-viwer">
                            <div className="p-reult-viwer-header flex justify-between">
                                <h2>Coding</h2>
                                <p>3/4</p>
                            </div>
                            <div className="p-result-viwer-body flex justify-center">
                                <div className="presult-container">
                                    <details>
                                        <summary>
                                            <div className="flex justify-between items-center w-full">
                                                <p>1. Sample Question</p>
                                                <div className="flex gap-40">
                                                    <span className="status-correct">Correct</span>
                                                    <p>1</p>
                                                </div>
                                            </div>
                                        </summary>
                                        <div className="answer-boxes">
                                            <div className="answer-box">
                                                <h3>Your Answer</h3>
                                                <p>This is where your answer would appear.</p>
                                            </div>
                                            <div className="answer-box">
                                                <h3>Actual Answer</h3>
                                                <p>This is where the correct answer would appear.</p>
                                            </div>
                                        </div>
                                    </details>
                                    <details>
                                        <summary>
                                            <div className="flex justify-between items-center w-full">
                                                <p>1. Sample Question</p>
                                                <div className="flex gap-40">
                                                    <span className="status-wrong">Wrong</span>
                                                    <p>1</p>
                                                </div>
                                            </div>
                                        </summary>
                                        <div className="answer-boxes">
                                            <div className="answer-box">
                                                <h3>Your Answer</h3>
                                                <p>This is where your answer would appear.</p>
                                            </div>
                                            <div className="answer-box">
                                                <h3>Actual Answer</h3>
                                                <p>This is where the correct answer would appear.</p>
                                            </div>
                                        </div>
                                    </details>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParticularResult;
