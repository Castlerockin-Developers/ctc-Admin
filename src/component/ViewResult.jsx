import React, { useState } from "react";
import "./ViewResult.css";
import { FaSearch } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ViewResult = ({ result, onBack, onNext }) => {
  const [searchQuery, setSearchQuery] = useState("");

  if (!result) {
    return <div>No result selected</div>;
  }

  // Function to export student data to Excel with conditional formatting
  const handleExportToExcel = () => {
    const studentData = result.students.map((student) => ({
      USN: student.usn,
      Name: student.name,
      "Start Time": student.startTime,
      "End Time": student.endTime,
      Score: student.score,
      "Trust Score": student.trustScore,
      "MCQ Marks": student.mcqMarks || "N/A",
      "Coding Marks": student.codingMarks || "N/A",
    }));

    // Create a new worksheet
    const worksheet = XLSX.utils.json_to_sheet(studentData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Student Results");

    // Define the style for cells with Trust Score < 50
    const redFill = {
      patternType: "solid",
      fgColor: { rgb: "FFFF0000" }, // Red color
    };

    // Apply conditional formatting for Trust Score
    const trustScoreColumn = XLSX.utils.sheet_to_json(worksheet, { header: "Trust Score" });
    trustScoreColumn.forEach((row, index) => {
      if (row["Trust Score"] < 50) {
        const cellAddress = XLSX.utils.encode_cell({ r: index + 1, c: 5 }); // Column F (Trust Score)
        if (!worksheet[cellAddress]) worksheet[cellAddress] = {};
        worksheet[cellAddress].s = {
          fill: redFill,
        };
      }
    });

    // Create an Excel file and trigger download
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });

    saveAs(data, `Student_Results_${result.id}.xlsx`);
  };

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
                onClick={handleExportToExcel}
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
                  {result.students.map((student, index) => (
                    <tr key={index}>
                      <td>{student.usn}</td>
                      <td>{student.name}</td>
                      <td>{student.startTime}</td>
                      <td>{student.endTime}</td>
                      <td>{student.score}</td>
                      <td>{student.trustScore}</td>
                      <td>
                        <button className="viewexam-btn" onClick={() => onNext(student)}>
                          View
                        </button>
                      </td>
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
