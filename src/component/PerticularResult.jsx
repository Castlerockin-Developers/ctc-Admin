import React from 'react';
import { FaShareAlt, FaShareSquare } from 'react-icons/fa';
import { authFetch } from '../scripts/AuthProvider';
import { saveAs } from "file-saver";


const ParticularResult = ({ student, onBack }) => {
    if (!student) {
        return <div>No student data available</div>;
    }
    const onExportPDF = async () => {
        try {
            const response = await authFetch('/exams/export-result/' + student.attempt_id + "/", {
                method: "GET",
            });
            if (!response.ok) {
                console.error("Failed to fetch PDF for export:", response.statusText);
                alert("Failed to export PDF. Please try again later.");
                return;
            }
            const blob = await response.blob();
            const fileName = `result_${student.usn}.pdf`;
            saveAs(blob, fileName);
        } catch (error) {
            console.error("Error exporting PDF:", error);
            alert("An error occurred while exporting PDF.");
        }
    };

    return (
        <div className='viewresult-container'>
            <div className='viewreult-box'>
                <div className='flex justify-between top-viewresult'>
                    <div className='flex'>
                        <button onClick={onBack}>&lt;</button>
                        <div>
                            <p><span>Tests</span> / <span>#{student.usn}</span></p>
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
                        <button className="flex gap-2"
                            onClick={() => { onExportPDF(); }}
                            title="Export as PDF">
                            <FaShareSquare className="share-icon" />
                            Export as PDF
                        </button>
                    </div>
                    <div className="p-result-body flex flex-col items-center justify-start">
                        <div className="p-result-body flex flex-col items-center justify-start">
                        {student.sections.map((section, sectionIndex) => (
                            <div key={sectionIndex} className="p-result-viwer">
                            <div className="p-reult-viwer-header flex justify-between">
                                <h2>{section.name}</h2>
                                <p>{section.obtainedMarks || 'N/A'}/{section.totalMarks || 'N/A'}</p>
                            </div>
                            <div className="p-result-viwer-body flex justify-center">
                                <div className="presult-container">
                                {section.questions.map((detail, index) => (
                                    <details key={index}>
                                    <summary>
                                        <div className="flex justify-between items-center w-full">
                                        <p>{index + 1}. {detail.question}</p>
                                        <div className="flex gap-40">
                                            <span className={`status-${detail.status}`}>{detail.status}</span>
                                            <p>{detail.marks}</p>
                                        </div>
                                        </div>
                                    </summary>
                                    <div className="answer-boxes">
                                        <div className="answer-box">
                                        <h3>Your Answer</h3>
                                        <p>{detail.yourAnswer}</p>
                                        </div>
                                        <div className="answer-box">
                                        <h3>Actual Answer</h3>
                                        <p>{detail.actualAnswer}</p>
                                        </div>
                                    </div>
                                    </details>
                                ))}
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

export default ParticularResult;
