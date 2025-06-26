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
                            <span>Export as PDF</span>
                        </button>
                    </div>
                    <div className="p-result-body-container flex flex-col items-center justify-start">
                        <div className="p-result-body flex flex-col items-center justify-start">
                            {student.sections.map((section, sectionIndex) => (
                                <table key={sectionIndex} className="w-full border-collapse">
                                    <thead>
                                        <tr className="p-reult-viwer-header">
                                            <th className="px-4 py-2 text-left">{section.name}</th>
                                            <th className="px-4 py-2 text-left" colSpan={2}>({section.obtainedMarks ?? 'N/A'}/{section.totalMarks ?? 'N/A'})</th>
                                        </tr>
                                    </thead>
                                    <tbody className='p-result-viwer-body'>
                                        {section.questions.map((detail, qIndex) => (
                                            <React.Fragment key={qIndex}>
                                                {/* summary row */}
                                                <tr>
                                                    <td className="px-4 py-2">
                                                        {qIndex + 1}. {detail.question}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <span className={`status-${detail.status}`}>{detail.status}</span>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {detail.marks}
                                                    </td>
                                                </tr>
                                                {/* expandable answer row */}
                                                <tr>
                                                    <td className="px-4 py-2" colSpan={3}>
                                                        <details className="group">
                                                            <summary className="cursor-pointer font-medium">
                                                                View Answers
                                                            </summary>
                                                            <div className="answer-boxes flex flex-col md:flex-row gap-4 mt-2">
                                                                <div className="answer-box flex-1 bg-gray-50 p-4 rounded">
                                                                    <h3 className="font-semibold mb-1">Your Answer</h3>
                                                                    <p>{detail.yourAnswer || '—'}</p>
                                                                </div>
                                                                <div className="answer-box flex-1 bg-gray-50 p-4 rounded">
                                                                    <h3 className="font-semibold mb-1">Actual Answer</h3>
                                                                    <p>{detail.actualAnswer || '—'}</p>
                                                                </div>
                                                            </div>
                                                        </details>
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParticularResult;
