import React, { useState } from 'react';
import './ViewResult.css';
import { FaSearch, FaShare } from 'react-icons/fa';

const ViewResult = ({ result, onBack, onNext }) => {
    const [searchQuery, setSearchQuery] = useState("");

    if (!result) {
        return <div>No result selected</div>;
    }

    return (
        <div className='justify-center flex flex-wrap viewresult-container'>
            <div className='viewreult-box'>
                <div className='flex justify-between top-viewresult'>
                    <div className='flex'>
                        <button onClick={onBack}>&lt;</button>
                        <h1> {result.id} -{result.name}</h1>
                    </div>
                    <div className='flex justify-between view-time'>
                        <div>
                            <p>Start Time</p>
                            <p>{result.startTime}</p>
                        </div>
                        <div>
                            <p>End Time</p>
                            <p>{result.endTime}</p>
                        </div>
                    </div>
                </div>
                <div className='flex justify-between view-r-card-container'>
                    <div className='view-r-cards'>
                        <p>Students Attempted</p>
                        <h4>{result.studentsAttempted}</h4>
                    </div>
                    <div className='view-r-cards'>
                        <p>Students Unattempted</p>
                        <h4>{result.studentsUnattempted}</h4>
                    </div>
                    <div className='view-r-cards'>
                        <p>Malpractice</p>
                        <h4>{result.malpractice}</h4>
                    </div>
                    <div className='view-r-cards'>
                        <p>Average Score</p>
                        <h4>{result.averageScore}</h4>
                    </div>
                </div>
                <div>
                    <div className='flex justify-between middle-view'>
                        <p className='students'>
                            Students
                        </p>
                        <div className='flex'>
                            <div className="search-box flex items-center w-full sm:w-auto">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search results..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full sm:w-auto"
                                />
                            </div>
                            <button className='flex gap-2'><FaShare className='icon-export' /> Export</button>
                        </div>
                    </div>
                    <div>
                        <div className="view-table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>USN</th>
                                        <th>Name</th>
                                        <th className="start-time">Start Time</th>
                                        <th className="start-time">End Time</th>
                                        <th>Score</th>
                                        <th>Trust Score</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.students.map((student, index) => (
                                        <tr key={index}>
                                            <td>{student.usn}</td>
                                            <td>{student.name}</td>
                                            <td>{student.startTime}</td>
                                            <td>{student.endTime}</td>
                                            <td>{student.score}</td>
                                            <td>{student.trustScore}</td>
                                            <td><button className='viewexam-btn' onClick={() => onNext(student)}>View</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewResult;
