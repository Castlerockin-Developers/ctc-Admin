import React from 'react';
import './ViewExam.css';
import { FaShareSquare } from 'react-icons/fa';

const ViewExam = ({ onBack }) => {
    return (
        <div className='viewexam-container justify-center flex flex-wrap'>
            <div className='viewexam-box'>
                <div className='flex'>
                    <button onClick={onBack}>&lt;</button>
                    <h1>#541 DSA one shot</h1>
                </div>
                <div className="viewexam-section">
                    <div className="viewexam-header">
                        <h2>Exam Section</h2>
                        <div className='viewexam-header-btn'>
                            <button className='viewexam-del-btn'>Delete</button>
                            <button className='viewexam-edit-btn'>Edit</button>
                        </div>
                    </div>
                    {/* Add items-center to center children horizontally */}
                    <div className="viewexam-body flex flex-col items-center justify-start">
                        <div className="viewexam-viwer">
                            <div className='viewexam-q'>
                                <div className="viewexam-viwer-header flex justify-between">
                                    <h2>MCQ</h2>
                                    <p>10</p>
                                </div>
                                <div className="viewexam-viwer-body flex justify-center">
                                    <div className="viewexams-container">
                                        <details>
                                            <summary>
                                                {/* Container INSIDE summary for flex layout */}
                                                <div className="flex justify-between items-center w-full">
                                                    <p>1. Sample Question</p>
                                                </div>
                                            </summary>
                                            <div className="viewexam-answer-boxes">
                                                <div className="viewexam-answer-box">
                                                    <ul>
                                                        <li>option1</li>
                                                        <li>option2</li>
                                                        <li>option3</li>
                                                        <li>option4</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </details>
                                        <details>
                                            <summary>
                                                <div className="flex justify-between items-center w-full">
                                                    <p>1. Sample Question</p>
                                                </div>
                                            </summary>
                                            <div className="viewexam-answer-boxes">
                                                <div className="viewexam-answer-box">
                                                    <ul>
                                                        <li>option1</li>
                                                        <li>option2</li>
                                                        <li>option3</li>
                                                        <li>option4</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </details>
                                    </div>
                                </div>
                            </div>
                            <div className='viewexam-q'>
                                <div className="viewexam-viwer-header flex justify-between">
                                    <h2>Coding</h2>
                                    <p>2</p>
                                </div>
                                <div className="viewexam-viwer-body flex justify-center">
                                    <div className="viewexams-container">
                                        <details>
                                            <summary>
                                                {/* Container INSIDE summary for flex layout */}
                                                <div className="flex justify-between items-center w-full">
                                                    <p>1. Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis quo quaerat fuga laborum ducimus error voluptas quidem libero sunt aliquam!</p>
                                                </div>
                                            </summary>
                                            <div className="viewexam-answer-boxes">
                                                <div className="viewexam-answer-box">
                                                    <h3>Test Case</h3>
                                                    <p>This is where your answer would appear.</p>
                                                </div>
                                                <div className="viewexam-answer-box">
                                                    <h3>Sample Input</h3>
                                                    <p>This is where the correct answer would appear.</p>
                                                    <h3>Sample Output</h3>
                                                    <p>This is where the correct answer would appear.</p>
                                                </div>
                                            </div>
                                        </details>
                                        <details>
                                            <summary>
                                                <div className="flex justify-between items-center w-full">
                                                    <p>1. Sample Question</p>
                                                </div>
                                            </summary>
                                            <div className="viewexam-answer-boxes">
                                                <div className="viewexam-answer-box">
                                                    <h3>Test Case</h3>
                                                    <p>This is where your answer would appear.</p>
                                                </div>
                                                <div className="viewexam-answer-box">
                                                    <h3>Sample Input</h3>
                                                    <p>This is where the correct answer would appear.</p>
                                                    <h3>Sample Output</h3>
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
        </div>
    )
}

export default ViewExam