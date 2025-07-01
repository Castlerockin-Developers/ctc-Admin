import { useEffect, useState } from 'react';
import './ViewExam.css';
import { FaShareSquare } from 'react-icons/fa';
import { authFetch } from '../scripts/AuthProvider'

const ViewExam = ({ exam, onBack }) => {
    const [examDetails, setExamDetails] = useState(null);  // <-- new state for detailed exam data

    const handleViewExam = async (exam) => {
        try {
            const response = await authFetch(`/admin/exams/${exam.id}/`, { method: "GET" });
            if (!response.ok) {
                throw new Error("Failed to fetch exam details");
            }
            const data = await response.json();
            console.log("Exam details:", data);
            setExamDetails(data);  // set detailed data here
        } catch (error) {
            console.error("Error fetching exam details:", error);
            alert("Failed to load exam details");
        }
    };

    useEffect(() => {
        if (exam && !examDetails) {
            handleViewExam(exam);
        }
    }
        , [exam, examDetails]);

    if (!examDetails) {
        return (
            <div className="viewexam-container justify-center flex flex-wrap">
                <h1>Loading exam details...</h1>
            </div>
        );
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
                            <div className='viewexam-q'>

                                <div className="viewexam-viwer-header flex justify-between items-center">
                                    <h2 className='text-xl'>MCQ</h2>
                                    <p>10</p>

                                </div>
                                <div className="viewexam-viwer-body flex justify-center">
                                    <div className="viewexams-container pb-2">
                                        {examDetails?.alloted_sections?.map((section, index) => (
                                            <div key={section.id || index} className="question-block my-2">
                                                <div className="flex justify-between items-center w-full text-xl py-2">
                                                    <p className='text-white'>
                                                        {index + 1}. {section.section_name || "Sample Question"}
                                                    </p>
                                                    <p className="text-sm text-white whitespace-nowrap">
                                                        Timed: {section.is_timed ? "Yes" : "No"} {section.is_timed && `| Time: ${section.section_time} min`} | Total: {section.no_of_question}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className='viewexam-q'>
                                <div className="viewexam-viwer-header flex justify-between items-center">
                                    <h2 className='text-xl'>Coding</h2>
                                    <p>2</p>

                                </div>
                                <div className="viewexam-viwer-body flex justify-center">
                                    <div className="viewexams-container pb-2">
                                        {examDetails.selected_coding_questions?.map(({ id, question_name }, index) => (
                                            <div key={id} className="question-block my-2">
                                                <div className="flex justify-between items-center w-full py-2 text-xl">
                                                    <p className='text-white text-md'>{index + 1}. {question_name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewExam;

