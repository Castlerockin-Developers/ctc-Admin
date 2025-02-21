import React from 'react';
import { FaShareSquare } from 'react-icons/fa';
import html2pdf from 'html2pdf.js';

const PerticularResult = ({ student, onBack }) => {
    if (!student) {
        return <div>No student selected</div>;
    }

    const exportToPDF = () => {
        // Customize the HTML before exporting
        const pdfContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Exam Report</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
                <style>
                    body {
                        font-family: 'Inter', sans-serif;
                        margin: 0;
                        padding: 20px;
                        background-color: #f8f8f8;
                    }
                    .container {
                        max-width: 800px;
                        background: white;
                        padding: 20px;
                        margin: auto;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        border-radius: 10px;
                    }
                    h1 {
                        font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;
                        margin: 0;
                        font-size: 24px;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .score {
                        display: flex;
                        gap: 20px;
                        text-align: right;
                    }
                    .score p {
                        margin: 5px 0;
                    }
                    .section {
                        background: #ddd;
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
                    }
                    .exam-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .question {
                        display: flex;
                        justify-content: space-between;
                        padding: 5px 0;
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
                    .analysis img {
                        border: 1px solid #ccc;
                        border-radius: 5px;
                        padding: 5px;
                        margin-right: 15px;
                    }
                    .analysis-text {
                        text-align: right;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div>
                            <p>DSA-OneShot Course</p>
                            <h1>${student.name}</h1>
                            <p>${student.usn}</p>
                        </div>
                        <div class="score">
                            <p><strong>Total Score</strong><br>${student.score}</p>
                            <p><strong>Trust Score</strong><br>${student.trustScore}%</p>
                        </div>
                    </div>
                    
                    <div class="section">Exam Section</div>
                    <div class="exam-box">
                        <div class="exam-header">
                            <p><strong>MCQ</strong></p>
                            <p><strong>${student.questions.filter(q => q.type === 'mcq').length}/${student.questions.length}</strong></p>
                        </div>
                        ${student.questions
                            .filter(q => q.type === 'mcq')
                            .map((question, index) => `
                                <div class="question">${index + 1}. ${question.text} <span class="${question.correct ? 'correct' : 'wrong'}">${question.correct ? 'Correct' : 'Wrong'}</span> ${question.marks}</div>
                            `)
                            .join('')}
                    </div>
                    
                    <div class="exam-box">
                        <div class="exam-header">
                            <p><strong>Coding</strong></p>
                            <p><strong>${student.questions.filter(q => q.type === 'coding').length}/${student.questions.length}</strong></p>
                        </div>
                        ${student.questions
                            .filter(q => q.type === 'coding')
                            .map((question, index) => `
                                <div class="question">${index + 1}. ${question.text} <span class="${question.correct ? 'correct' : 'wrong'}">${question.correct ? 'Correct' : 'Wrong'}</span> ${question.marks}</div>
                            `)
                            .join('')}
                    </div>

                    <div class="exam-box">
                        <div class="exam-header">
                            <p><strong>Speech</strong></p>
                            <p><strong>${student.questions.filter(q => q.type === 'speech').length}/${student.questions.length}</strong></p>
                        </div>
                        ${student.questions
                            .filter(q => q.type === 'speech')
                            .map((question, index) => `
                                <div class="question">${index + 1}. ${question.text} <span class="${question.correct ? 'correct' : 'wrong'}">${question.correct ? 'Correct' : 'Wrong'}</span> ${question.marks}</div>
                            `)
                            .join('')}
                    </div>
                    
                    <div class="section">Analysis</div>
                    <div class="analysis">
                        <img src="logoo.png" alt="Shield" width="90">
                        <div class="analysis-text">
                            <p>Time Taken</p>
                            <p>Percentile</p>
                            <p>Anomalies Detected</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Set PDF options
        const options = {
            margin: 10,
            filename: `${student.name}_Exam_Report.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        };

        // Export content as PDF
        html2pdf()
            .from(pdfContent) // Use custom content for the PDF
            .set(options)
            .save();
    };

    return (
        <div className="viewresult-container">
            <div className="viewreult-box">
                <div className="flex justify-between top-viewresult">
                    <div className="flex">
                        <button onClick={onBack}>&lt;</button>
                        <div>
                            <p>
                                <span>Tests</span> / <span>#{student.testId} - {student.testName}</span>
                            </p>
                            <h1>{student.name}</h1>
                            <h4>{student.usn}</h4>
                        </div>
                    </div>
                    <div className="flex gap-10 justify-between marks-r-cards-container">
                        <div className="marks-r-cards">
                            <p>Obtained Score</p>
                            <h4>{student.score}</h4>
                        </div>
                        <div className="marks-r-cards">
                            <p>Trust Score</p>
                            <h4>{student.trustScore}</h4>
                        </div>
                    </div>
                </div>
                <div id="pdf-content" className="p-result-section">
                    <div className="p-result-header">
                        <h2>Exam Section</h2>
                        <button className="flex gap-2" onClick={exportToPDF}>
                            <FaShareSquare className="share-icon" />
                            Export as PDF
                        </button>
                    </div>
                    <div className="p-result-body flex flex-col items-center justify-start">
                        <div className="p-result-viwer">
                            <div className="p-reult-viwer-header flex justify-between">
                                <h2>MCQ</h2>
                                <p>3/4</p>
                            </div>
                            <div className="p-result-viwer-body flex justify-center">
                                <div className="presult-container">
                                    {student.questions.map((question, index) => (
                                        <details key={index}>
                                            <summary>
                                                <div className="flex justify-between items-center w-full">
                                                    <p>{index + 1}. {question.text}</p>
                                                    <div className="flex gap-40">
                                                        <span className={question.correct ? "status-correct" : "status-wrong"}>
                                                            {question.correct ? "Correct" : "Wrong"}
                                                        </span>
                                                        <p>{question.marks}</p>
                                                    </div>
                                                </div>
                                            </summary>
                                            <div className="answer-boxes">
                                                <div className="answer-box">
                                                    <h3>Your Answer</h3>
                                                    <p>{question.userAnswer}</p>
                                                </div>
                                                <div className="answer-box">
                                                    <h3>Actual Answer</h3>
                                                    <p>{question.correctAnswer}</p>
                                                </div>
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PerticularResult;
