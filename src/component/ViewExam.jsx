import React, { useEffect, useState } from 'react';
import './ViewExam.css';
import { FaShareSquare } from 'react-icons/fa';
// import axios from 'axios'; // Uncomment and use axios for making HTTP requests when backend is ready

const ViewExam = ({ exam, onBack }) => {
    const [examDetails, setExamDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchExamDetails = async () => {
            try {
                // Uncomment and update the endpoint once your backend is ready
                // const response = await axios.get(`https://api.example.com/exams/${exam.id}`);
                // setExamDetails(response.data);

                // Simulate exam details data (temporary mock data while the backend is not available)
                const mockExamDetails = {
                    id: exam.id,
                    name: exam.name,
                    startTime: "10:00 AM",
                    endTime: "11:30 AM",
                    questions: [
                        {
                            id: 1,
                            type: "MCQ",
                            question: "Sample Question 1",
                            options: ["option1", "option2", "option3", "option4"],
                        },
                        {
                            id: 2,
                            type: "MCQ",
                            question: "Sample Question 2",
                            options: ["option1", "option2", "option3", "option4"],
                        },
                        {
                            id: 3,
                            type: "Coding",
                            question: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis quo quaerat fuga laborum ducimus error voluptas quidem libero sunt aliquam!",
                            testCase: "Sample Test Case",
                            sampleInput: "Sample Input",
                            sampleOutput: "Sample Output",
                        },
                        {
                            id: 4,
                            type: "Coding",
                            question: "Sample Question 2",
                            testCase: "Sample Test Case",
                            sampleInput: "Sample Input",
                            sampleOutput: "Sample Output",
                        },
                    ],
                };

                setExamDetails(mockExamDetails);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching exam details", error);
                setError("Failed to load exam details. Please try again later.");
                setLoading(false);
            }
        };

        fetchExamDetails();
    }, [exam.id]);

    if (loading) {
        return <p className="text-center text-lg">Loading exam details...</p>;
    }

    if (error) {
        return <p className="text-center text-lg text-red-500">{error}</p>;
    }

    if (!examDetails) {
        return <div>No exam details available</div>;
    }

    return (
        <div className='viewexam-container justify-center flex flex-wrap'>
            <div className='viewexam-box'>
                <div className='flex'>
                    <button onClick={onBack}>&lt;</button>
                    <h1>#{examDetails.id} {examDetails.name}</h1>
                </div>
                <div className="viewexam-section">
                    <div className="viewexam-header">
                        <h2>Exam Section</h2>
                        <div className='viewexam-header-btn'>
                            <button className='viewexam-del-btn'>Delete</button>
                            <button className='viewexam-edit-btn'>Edit</button>
                        </div>
                    </div>
                    <div className="viewexam-body flex flex-col items-center justify-start">
                        <div className="viewexam-viwer">
                            {examDetails.questions.map((question, index) => (
                                <div key={question.id} className='viewexam-q'>
                                    <div className="viewexam-viwer-header flex justify-between">
                                        <h2>{question.type}</h2>
                                        <p>{index + 1}</p>
                                    </div>
                                    <div className="viewexam-viwer-body flex justify-center">
                                        <div className="viewexams-container">
                                            <details>
                                                <summary>
                                                    <div className="flex justify-between items-center w-full">
                                                        <p>{question.question}</p>
                                                    </div>
                                                </summary>
                                                <div className="viewexam-answer-boxes">
                                                    {question.type === "MCQ" ? (
                                                        <div className="viewexam-answer-box">
                                                            <ul>
                                                                {question.options.map((option, idx) => (
                                                                    <li key={idx}>{option}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="viewexam-answer-box">
                                                                <h3>Test Case</h3>
                                                                <p>{question.testCase}</p>
                                                            </div>
                                                            <div className="viewexam-answer-box">
                                                                <h3>Sample Input</h3>
                                                                <p>{question.sampleInput}</p>
                                                                <h3>Sample Output</h3>
                                                                <p>{question.sampleOutput}</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </details>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewExam;
