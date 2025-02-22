import React, { useEffect, useState } from 'react';
import './ViewResult.css';
import ParticularResult from './PerticularResult.jsx'; // Ensure the correct file path for ParticularResult
import { FaSearch, FaShare } from 'react-icons/fa';
// import axios from 'axios'; // Uncomment and use axios for making HTTP requests when backend is ready

const ViewResult = ({ result, onBack }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [resultDetails, setResultDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStudent, setSelectedStudent] = useState(null);

    useEffect(() => {
        const fetchResultDetails = async () => {
            try {
                // Uncomment and update the endpoint once your backend is ready
                // const response = await axios.get(`https://api.example.com/results/${result.id}`);
                // setResultDetails(response.data);

                // Simulate result details data (temporary mock data while the backend is not available)
                const mockResultDetails = {
                    id: result.id,
                    name: result.name,
                    startTime: "10:00 AM",
                    endTime: "11:30 AM",
                    studentsAttempted: 15,
                    studentsUnattempted: 2,
                    malpractice: 90,
                    averageScore: 572,
                    students: [
                        { usn: "4NM20EC408", name: "Manish Naik", startTime: "10:00 AM", endTime: "11:30 AM", score: 85, trustScore: 95 },
                        { usn: "4NM20EC409", name: "John Doe", startTime: "10:00 AM", endTime: "11:30 AM", score: 90, trustScore: 98 },
                    ],
                };

                setResultDetails(mockResultDetails);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching result details", error);
                setError("Failed to load result details. Please try again later.");
                setLoading(false);
            }
        };

        fetchResultDetails();
    }, [result.id]);

    if (loading) {
        return <p className="text-center text-lg">Loading result details...</p>;
    }

    if (error) {
        return <p className="text-center text-lg text-red-500">{error}</p>;
    }

    if (!resultDetails) {
        return <div>No result details available</div>;
    }

    const handleViewStudent = (student) => {
        setSelectedStudent(student);
    };

    const handleBackFromStudent = () => {
        setSelectedStudent(null);
    };

    return (
        <div className='justify-center flex flex-wrap viewresult-container'>
            {selectedStudent ? (
                <ParticularResult student={selectedStudent} onBack={handleBackFromStudent} />
            ) : (
                <div className='viewreult-box'>
                    <div className='flex justify-between top-viewresult'>
                        <div className='flex'>
                            <button onClick={onBack}>&lt;</button>
                            <h1>{resultDetails.id} - {resultDetails.name}</h1>
                        </div>
                        <div className='flex justify-between view-time'>
                            <div>
                                <p>Start Time</p>
                                <p>{resultDetails.startTime}</p>
                            </div>
                            <div>
                                <p>End Time</p>
                                <p>{resultDetails.endTime}</p>
                            </div>
                        </div>
                    </div>
                    <div className='flex justify-between view-r-card-container'>
                        <div className='view-r-cards'>
                            <p>Students Attempted</p>
                            <h4>{resultDetails.studentsAttempted}</h4>
                        </div>
                        <div className='view-r-cards'>
                            <p>Students Unattempted</p>
                            <h4>{resultDetails.studentsUnattempted}</h4>
                        </div>
                        <div className='view-r-cards'>
                            <p>Malpractice</p>
                            <h4>{resultDetails.malpractice}</h4>
                        </div>
                        <div className='view-r-cards'>
                            <p>Average Score</p>
                            <h4>{resultDetails.averageScore}</h4>
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
                                        {resultDetails.students.map((student, index) => (
                                            <tr key={index}>
                                                <td>{student.usn}</td>
                                                <td>{student.name}</td>
                                                <td>{student.startTime}</td>
                                                <td>{student.endTime}</td>
                                                <td>{student.score}</td>
                                                <td>{student.trustScore}</td>
                                                <td><button className='viewexam-btn' onClick={() => handleViewStudent(student)}>View</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewResult;
