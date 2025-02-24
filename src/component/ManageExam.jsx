import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaPlus } from "react-icons/fa";
import filter from '../assets/filter.png';
import line from '../assets/Line.png';
import { motion } from "motion/react";
import ViewExam from './ViewExam'; // Import ViewExam component

const ManageExam = ({ onCreateNewExam, onNext }) => {
    const [activeButton, setActiveButton] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilter, setShowFilter] = useState(false);
    const [hoveredBranch, setHoveredBranch] = useState(null);
    const [subMenuPosition, setSubMenuPosition] = useState({ top: 0, left: 0 });
    const [selectedExam, setSelectedExam] = useState(null);
    const filterRef = useRef(null);
    const subPopupRef = useRef(null);
    let hoverTimeout = useRef(null);
     // // Fetch exams from backend
    // const fetchExams = async () => {
    //     try {
    //         let url = `${API_BASE_URL}`;
    //         if (activeButton !== "all") {
    //             url += `?category=${activeButton}`;
    //         }
    //         const response = await axios.get(url);
    //         setExams(response.data);
    //     } catch (error) {
    //         console.error("Error fetching exams:", error);
    //     }
    // };



    // Handle search API call
    // const handleSearch = async (query) => {
    //     setSearchQuery(query);
    //     if (query.length > 0) {
    //         try {
    //             const response = await axios.get(`${API_BASE_URL}search/?q=${query}`);
    //             setExams(response.data);
    //         } catch (error) {
    //             console.error("Error searching exams:", error);
    //         }
    //     } else {
    //         fetchExams(); // Reset data when search is cleared
    //     }
    // };

    // Toggle filter pop-up
    const toggleFilter = () => {
        setShowFilter(!showFilter);
        setHoveredBranch(null);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                filterRef.current &&
                !filterRef.current.contains(event.target) &&
                (!subPopupRef.current || !subPopupRef.current.contains(event.target))
            ) {
                setShowFilter(false);
                setHoveredBranch(null);
            }
        };

        if (showFilter) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showFilter]);

    const handleHover = (event, branch) => {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = setTimeout(() => {
            const rect = event.target.getBoundingClientRect();
            const subMenuWidth = 180;
            const screenWidth = window.innerWidth;
            const screenHeight = window.innerHeight;

            let left = rect.right + 10;
            if (left + subMenuWidth > screenWidth) {
                left = rect.left - subMenuWidth - 10;
            }

            let top = rect.top;
            if (top + 180 > screenHeight) {
                top = rect.bottom - 180;
            }

            setHoveredBranch(branch);
            setSubMenuPosition({ top, left });
        }, 200);
    };

    const handleMouseLeave = () => {
        hoverTimeout.current = setTimeout(() => {
            setHoveredBranch(null);
        }, 300);
    };

    const handleSubMenuEnter = () => {
        clearTimeout(hoverTimeout.current);
    };

    const tableData = [
        { id: 1, category: "Active", name: "DSA", startTime: "10:00 AM", endTime: "11:30 AM", analytics: "85%", status: "Completed" },
        { id: 2, category: "Completed", name: "Python", startTime: "12:00 PM", endTime: "1:30 PM", analytics: "90%", status: "Ongoing" },
        { id: 3, category: "Completed", name: "JAVA", startTime: "2:00 PM", endTime: "3:00 PM", analytics: "76%", status: "Upcoming" },
        { id: 4, category: "Completed", name: "JavaScript", startTime: "3:30 PM", endTime: "5:00 PM", analytics: "88%", status: "Completed" },
        { id: 5, category: "Active", name: "React Js", startTime: "5:30 PM", endTime: "7:00 PM", analytics: "92%", status: "Ongoing" }
    ];

    const filteredTableData = tableData
        .filter(row => activeButton === "all" || row.category.toLowerCase() === activeButton)
        .filter(row =>
            searchQuery === "" ||
            row.id.toString().includes(searchQuery) ||
            row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.startTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.endTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.analytics.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.status.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const handleViewExam = (exam) => {
        setSelectedExam(exam);
    };

    const handleBack = () => {
        setSelectedExam(null);
    };

    return (
        <div className="lg:w-3xl justify-center flex flex-wrap exam-container">
            {selectedExam ? (
                <ViewExam exam={selectedExam} onBack={handleBack} />
            ) : (
                <div className="exam-greeting">
                    <h1>Exams</h1>
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="m-btn-left flex flex-wrap justify-center sm:justify-start gap-2">
                            <motion.button whileTap={{ scale: 1.1 }} className={activeButton === "all" ? "m-active" : ""} onClick={() => setActiveButton("all")}>
                                All Exams
                            </motion.button>
                            <motion.button whileTap={{ scale: 1.1 }} className={activeButton === "active" ? "m-active" : ""} onClick={() => setActiveButton("active")}>
                                Active
                            </motion.button>
                            <motion.button whileTap={{ scale: 1.1 }} className={activeButton === "completed" ? "m-active" : ""} onClick={() => setActiveButton("completed")}>
                                Upcoming
                            </motion.button>
                        </div>
                        <div className="m-btn-right flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
                            <button className="filter-btn" onClick={toggleFilter}>
                                <img src={filter} alt="Filter" />
                            </button>
                            <div className="search-box flex items-center w-full sm:w-auto">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search exams..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full sm:w-auto"
                                />
                            </div>
                            <motion.button whileTap={{ scale: 1.2 }} className="create-btn w-full sm:w-auto" onClick={onCreateNewExam}>
                            <FaPlus className="icon" /> Create New Exam
                        </motion.button>
                        </div>
                    </div>
                    {showFilter && (
                        <>
                            <div className="filter-popup" ref={filterRef}>
                                <h3>Branch</h3>
                                <div className="flex justify-center w-full">
                                    <img src={line} alt="line" className="filter-line" />
                                </div>
                                <div className="filter-options">
                                    {["CSE", "ISE", "AIML", "CSE AIML", "CSE DS", "EC"].map((branch, index) => (
                                        <div
                                            key={index}
                                            className={`filter-item ${hoveredBranch === branch ? "active-filter-item" : ""}`}
                                            onMouseEnter={(e) => handleHover(e, branch)}
                                            onMouseLeave={handleMouseLeave}
                                        >
                                            {branch}
                                        </div>
                                    ))}
                                </div>
                                <button className="apply-btn">Add Branch</button>
                            </div>
                            {hoveredBranch && (
                                <div
                                    className="sub-popup"
                                    ref={subPopupRef}
                                    style={{ top: subMenuPosition.top, left: subMenuPosition.left }}
                                    onMouseEnter={handleSubMenuEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <h4>{hoveredBranch} - Year</h4>
                                    <button className="sub-item">1st Year</button>
                                    <button className="sub-item">2nd Year</button>
                                    <button className="sub-item">3rd Year</button>
                                    <button className="sub-item">Final Year</button>
                                </div>
                            )}
                        </>
                    )}
                    <div className="m-table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>#ID</th>
                                    <th>Name</th>
                                    <th className="start-time">Start Time</th>
                                    <th className="start-time">End Time</th>
                                    <th>Analytics</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTableData.length > 0 ? (
                                    filteredTableData.map((row, index) => (
                                        <tr key={row.id} className={index % 2 === 0 ? "even-row" : "odd-row"}>
                                            <td>{row.id}</td>
                                            <td>{row.name}</td>
                                            <td>{row.startTime}</td>
                                            <td>{row.endTime}</td>
                                            <td>{row.analytics}</td>
                                            <td>{row.status}</td>
                                            <td><motion.button className="viewexam-btn" whileTap={{ scale: 1.2 }} onClick={() => handleViewExam(row)}>View Exam</motion.button></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="no-data">No exams found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};



    // return (
    //     <div className="lg:w-3xl justify-center flex flex-wrap exam-container">
    //         <div className="exam-greeting">
    //             <h1>Exams</h1>
    //             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
    //                 {/* Left Button Group */}
    //                 <div className="m-btn-left flex flex-wrap justify-center sm:justify-start gap-2">
    //                     <motion.button whileTap={{ scale: 1.1 }} className={activeButton === "all" ? "m-active" : ""} onClick={() => setActiveButton("all")}>
    //                         All Exams
    //                     </motion.button>
    //                     <motion.button whileTap={{ scale: 1.1 }} className={activeButton === "active" ? "m-active" : ""} onClick={() => setActiveButton("active")}>
    //                         Active
    //                     </motion.button>
    //                     <motion.button whileTap={{ scale: 1.1 }} className={activeButton === "completed" ? "m-active" : ""} onClick={() => setActiveButton("completed")}>
    //                         Completed
    //                     </motion.button>
    //                 </div>
    
    //                 {/* Right Side: Filter Button, Search Bar, Create Exam Button */}
    //                 <div className="m-btn-right flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
    //                     <button className="filter-btn" onClick={() => setShowFilter(!showFilter)}>
    //                         <img src={filter} alt="Filter" />
    //                     </button>
    
    //                     {/* Search Bar */}
    //                     <div className="search-box flex items-center w-full sm:w-auto">
    //                         <FaSearch className="search-icon" />
    //                         <input
    //                             type="text"
    //                             placeholder="Search exams..."
    //                             value={searchQuery}
    //                             onChange={(e) => handleSearch(e.target.value)}
    //                             className="w-full sm:w-auto"
    //                         />
    //                     </div>
    
    //                     <motion.button whileTap={{ scale: 1.2 }} className="create-btn w-full sm:w-auto" onClick={onCreateNewExam}>
    //                         <FaPlus className="icon" /> Create New Exam
    //                     </motion.button>
    //                 </div>
    //             </div>
    
    //             {/* Table */}
    //             <div className="m-table-container">
    //                 <table>
    //                     <thead>
    //                         <tr>
    //                             <th>#ID</th>
    //                             <th>Name</th>
    //                             <th>Start Time</th>
    //                             <th>End Time</th>
    //                             <th>Analytics</th>
    //                             <th>Status</th>
    //                         </tr>
    //                     </thead>
    //                     <tbody>
    //                         {exams.length > 0 ? (
    //                             exams.map((exam) => (
    //                                 <tr key={exam.id}>
    //                                     <td>{exam.id}</td>
    //                                     <td>{exam.name}</td>
    //                                     <td>{exam.start_time}</td>
    //                                     <td>{exam.end_time}</td>
    //                                     <td>{exam.analytics}</td>
    //                                     <td>{exam.status}</td>
    //                                 </tr>
    //                             ))
    //                         ) : (
    //                             <tr>
    //                                 <td colSpan="6" className="no-data">No exams found</td>
    //                             </tr>
    //                         )}
    //                     </tbody>
    //                 </table>
    //             </div>
    //         </div>
    //     </div>
    // );
    // };

export default ManageExam;

