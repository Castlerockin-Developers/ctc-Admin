import React, { useState, useEffect } from "react";
import "./ViewResult.css";
import { FaSearch } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { authFetch } from "../scripts/AuthProvider";

const ViewResult = ({ result, onBack, onNext }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // You can adjust this number as needed

  if (!result) {
    return <div>No result selected</div>;
  }

  const viewExam = async (student) => {
    const response = await authFetch('/admin/results/individual-results/' + student.attempt_id + "/", {
      method: "GET",
    });
    if (response.ok) {
      const data = await response.json();
      const examData = {
        ...student,
        sections: data.reportData.sections.map(section => ({
          name: section.sectionName,
          obtainedMarks: section.obtainedMarks,
          totalMarks: section.maxMarks,
          questions: section.questionsAttempted.map(question => ({
            question: question.question,
            yourAnswer: question.selectedAnswer,
            actualAnswer: question.correctAnswer,
            marks: question.correctAnswer === question.selectedAnswer ? 1 : 0,
            status: question.correctAnswer === question.selectedAnswer ? "Correct" : "Incorrect",
          })),
        })),
      };
      console.log("Exam Data:", examData);
      onNext(examData);
    } else {
      console.error("Failed to fetch exam data:", response.statusText);
      alert("Failed to fetch exam data. Please try again later.");
    }
  };

  // Function to export student data to Excel with conditional formatting
  const handleExportToExcel = async (result) => {
    const response = await authFetch('/admin/results/full-report/' + result.id + "/", {
      method: "GET",
    });
    if (!response.ok) {
      console.error("Failed to fetch data for export:", response.statusText);
      alert("Failed to export data. Please try again later.");
      return;
    }
    const blob = await response.blob();
    const fileName = `result_${result.id}.xlsx`;
    saveAs(blob, fileName);
  };

  // Filter students based on search query
  const filteredStudents = result.students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.usn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate total pages
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  // Get current students for the page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Reset page to 1 when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);


  return (
    <div className="justify-center flex flex-wrap viewresult-container">
      <div className="viewreult-box">
        <div className="flex justify-between top-viewresult">
          <div className="flex">
            <button onClick={onBack}>&lt;</button>
            <h1>
              {result.id} - {result.name}
            </h1>
          </div>
          <div className="flex justify-between view-time">
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

        <div className="flex justify-between view-r-card-container">
          <div className="view-r-cards">
            <p>Students Attempted</p>
            <h4>{result.studentsAttempted}</h4>
          </div>
          <div className="view-r-cards">
            <p>Students Unattempted</p>
            <h4>{result.studentsUnattempted}</h4>
          </div>
          <div className="view-r-cards">
            <p>Malpractice</p>
            <h4>{result.malpractice}</h4>
          </div>
          <div className="view-r-cards">
            <p>Average Score</p>
            <h4>{result.averageScore}</h4>
          </div>
        </div>

        <div>
          <div className="flex justify-between middle-view">
            <p className="students">Students</p>
            <div className="flex">
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

              {/* Export Button */}
              <button
                onClick={() => handleExportToExcel(result)}
                className="flex items-center gap-2 bg-[#9B005D] text-white px-4 py-2 rounded-lg shadow-md
                                hover:bg-[#8A004A] hover:scale-105 transition-transform duration-200 ease-in-out cursor-pointer"
              >
                <img src="src/assets/excel.png" alt="Excel Icon" className="w-6 h-6" />
                <span className="font-medium text-lg">Export</span>
              </button>
            </div>
          </div>

          {/* UI Table (Without MCQ & Coding Marks) */}
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
                  {currentStudents.map((student, index) => (
                    <tr key={index}>
                      <td>{student.usn}</td>
                      <td>{student.name}</td>
                      <td>{student.startTime}</td>
                      <td>{student.endTime}</td>
                      <td>{student.score}</td>
                      <td>{student.trustScore}</td>
                      <td>
                        <button className="viewexam-btn" onClick={() => viewExam(student)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Controls */}
            <div className="flex justify-center items-center mt-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg mr-2 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-lg font-medium">Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg ml-2 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewResult;