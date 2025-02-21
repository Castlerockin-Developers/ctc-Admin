// ExamReport.jsx
import React, { useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const ExamReport = ({ student, onBack }) => {
    const reportRef = useRef();

    if (!student) {
        return <div>No student selected</div>;
    }

    // Function to export PDF in A4 format
    const exportPDF = async () => {
        const input = reportRef.current;

        // Capture the report section as an image
        const canvas = await html2canvas(input, { scale: 3 });
        const imgData = canvas.toDataURL('image/png');

        // Create a new jsPDF instance with A4 size
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add image to PDF and save
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth - 20, imgHeight - 20);
        pdf.save(`${student.name}_ExamReport.pdf`);
    };

    return (
        <div className="container">
            <div ref={reportRef} className="pdf-content">
                <div className="header">
                    <div>
                        <h2>{student.testName}</h2>
                        <h1>{student.name}</h1>
                        <p>USN: {student.usn}</p>
                    </div>
                    <div className="score">
                        <p><strong>Total Score:</strong> {student.score}</p>
                        <p><strong>Trust Score:</strong> {student.trustScore}%</p>
                    </div>
                </div>

                <div className="section">Exam Performance</div>
                <div className="exam-box">
                    <div className="exam-header">
                        <p><strong>MCQ</strong></p>
                        <p><strong>{student.questions.length}/4</strong></p>
                    </div>
                    {student.questions.map((q, index) => (
                        <div className="question" key={index}>
                            {index + 1}. {q.text}  
                            <span className={q.correct ? "correct" : "wrong"}>{q.correct ? "Correct" : "Wrong"}</span>  
                            {q.marks} Marks
                        </div>
                    ))}
                </div>

                <div className="section">Analysis</div>
                <div className="analysis">
                    <img src="src/assets/Shield.png" alt="Shield" width="90" />
                    <div className="analysis-text">
                        <p><strong>Time Taken:</strong> {student.startTime} - {student.endTime}</p>
                        <p><strong>Percentile:</strong> {Math.round((student.score / 100) * 100)}%</p>
                        <p><strong>Anomalies Detected:</strong> {student.trustScore < 50 ? "Yes" : "No"}</p>
                    </div>
                </div>
            </div>

            <div className="button-container">
                <button onClick={exportPDF} className="export-button">Export as PDF</button>
                <button onClick={onBack} className="back-button">Go Back</button>
            </div>

            <style jsx>{`
                .container {
                    max-width: 800px;
                    background: white;
                    padding: 20px;
                    margin: auto;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    border-radius: 10px;
                    font-family: Arial, sans-serif;
                }
                h1 {
                    font-size: 22px;
                    margin-bottom: 5px;
                }
                h2 {
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #ddd;
                }
                .score {
                    text-align: right;
                    font-size: 14px;
                }
                .section {
                    background: #f3f3f3;
                    padding: 10px;
                    margin-top: 10px;
                    font-weight: bold;
                }
                .exam-box {
                    background: white;
                    padding: 15px;
                    border-radius: 5px;
                    border: 1px solid #ccc;
                    margin-bottom: 10px;
                    font-size: 14px;
                }
                .exam-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-weight: bold;
                    padding-bottom: 5px;
                }
                .question {
                    display: flex;
                    justify-content: space-between;
                    padding: 5px 0;
                    font-size: 14px;
                }
                .correct { color: green; }
                .wrong { color: red; }
                .analysis {
                    background: white;
                    padding: 20px;
                    margin-top: 10px;
                    border-radius: 5px;
                    border: 1px solid #ccc;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .button-container {
                    display: flex;
                    justify-content: space-between;
                    margin-top: 20px;
                }
                .export-button, .back-button {
                    padding: 10px 15px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .export-button {
                    background-color: #28a745;
                    color: white;
                }
                .export-button:hover {
                    background-color: #218838;
                }
                .back-button {
                    background-color: #007bff;
                    color: white;
                }
                .back-button:hover {
                    background-color: #0056b3;
                }
            `}</style>
        </div>
    );
};

export default ExamReport;

