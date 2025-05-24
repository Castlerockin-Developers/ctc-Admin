import React, { useState, useEffect, useRef } from "react";
import { FaSearch, FaPlus } from "react-icons/fa";
import filter from '../assets/filter.png';
import line from '../assets/Line.png';
import { motion } from "motion/react";
import { authFetch } from "../scripts/AuthProvider";
import Swal from "sweetalert2";

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
    const [tableData, setTableData] = useState([]);

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

    const fetchExams = async () => {
        try {
            const response = await authFetch('/admin/exams/', { method: "GET" });
            const data = await response.json();
            // Assuming the response data is an array of exam objects
            setExams(data);
        } catch (error) {
            console.error("Error fetching exams:", error);
        }
    };
    useEffect(() => {
        fetchExams();
    }, []);

    const setExams = (data) => {
        // Assuming data is an array of exam objects

        const exams = data.map((exam) => ({
            id: exam.id,
            name: exam.name,
            startTime: new Date(exam.start_time).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short', hour12: true }),
            endTime: new Date(exam.end_time).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short', hour12: true }),
            attemptsAllowed: exam.attempts_allowed,
            status: new Date(exam.start_time) > new Date() ? "Upcoming" : exam.is_result_declared ? "Results Declared" : new Date(exam.end_time) > new Date() ? "Ongoing" : "Completed",
        }));
        setTableData(exams);
    };

    const filteredTableData = tableData
        .filter(row => {
            if (activeButton === "all") return true;
            if (activeButton === "active") return row.status === "Ongoing";
            if (activeButton === "upcoming") return row.status === "Upcoming";
            if (activeButton === "completed") return row.status === "Results Declared" || row.status === "Completed";
            return true;
        })
        .filter(row =>
            searchQuery === "" ||
            row.id.toString().includes(searchQuery) ||
            row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.startTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.endTime.toLowerCase().includes(searchQuery.toLowerCase()) ||
            row.attemptsAllowed.toString().includes(searchQuery) ||
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
                            <motion.button whileTap={{ scale: 1.1 }} className={activeButton === "upcoming" ? "m-active" : ""} onClick={() => setActiveButton("upcoming")}>
                                Upcoming
                            </motion.button>
                            <motion.button whileTap={{ scale: 1.1 }} className={activeButton === "completed" ? "m-active" : ""} onClick={() => setActiveButton("completed")}>
                                Completed
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
                                    <th>Attempts Allowed</th>
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
                                            <td>{row.attemptsAllowed}</td>
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


const ViewExam = ({ exam, onBack }) => {
    const [examDetails, setExamDetails] = useState(null);  // <-- new state for detailed exam data
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleEditClick = () => {
        setIsEditModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsEditModalOpen(false);
    };

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
                            <button className="viewexam-edit-btn" onClick={handleEditClick}>Edit</button>
                        </div>
                    </div>
                    <div className="viewexam-body flex flex-col items-center justify-start">
                        <div className="viewexam-viwer">
                            <div className='viewexam-q'>
                                <div className="viewexam-viwer-header flex justify-between">
                                    <p className='text-xl text-bold text-white leading-loose'>MCQ</p>
                                    <p>{examDetails?.alloted_sections?.length || 0}</p>
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
                                <div className="viewexam-viwer-header flex justify-between">
                                    <p className='text-xl font-bold text-white leading-loose'>Coding</p>
                                    <p className='pb-0'>{examDetails.selected_coding_questions?.length || 0}</p>
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
            {isEditModalOpen && (
                <EditExamModal examID={examDetails.id} onClose={handleCloseModal} />
            )}
        </div>
    );
};

const EditExamModal = ({ onClose, examID }) => {
    const [exam, setExam] = useState({
        id: examID,
        name: "",
        start_time: "",
        end_time: "",
        attempts_allowed: "",
        is_result_declared: false,
        is_timed: false,
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchExamData = async () => {
            try {
                const response = await authFetch(`/admin/exams/${examID}`, { method: "GET" });
                if (response.ok) {
                    const data = await response.json();
                    setExam({
                        id: data.id,
                        name: data.name,
                        start_time: new Date(data.start_time).toISOString().slice(0, 16),
                        end_time: new Date(data.end_time).toISOString().slice(0, 16),
                        attempts_allowed: data.attempts_allowed,
                        is_result_declared: data.is_result_declared,
                        is_timed: data.is_timed,
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: "Exam data could not be loaded.",
                    });
                }
            } catch (error) {
                console.error(error);
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: "Failed to fetch exam data.",
                });
            }
        };

        if (examID) fetchExamData();
    }, [examID]);

    const validate = () => {
        const newErrors = {};
        if (!exam.name) newErrors.name = "Exam name is required.";
        if (!exam.start_time) newErrors.start_time = "Start time is required.";
        if (!exam.end_time) newErrors.end_time = "End time is required.";
        if (!exam.attempts_allowed || isNaN(Number(exam.attempts_allowed)) || Number(exam.attempts_allowed) < 1)
            newErrors.attempts_allowed = "Attempts allowed must be a positive number.";
        return newErrors;
    };

    const handleEditExam = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        const payload = {
            name: exam.name,
            start_time: new Date(exam.start_time).toISOString(),
            end_time: new Date(exam.end_time).toISOString(),
            attempts_allowed: Number(exam.attempts_allowed),
            is_result_declared: exam.is_result_declared,
            is_timed: exam.is_timed,
        };

        try {
            const response = await authFetch(`/admin/exams/${examID}/`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                Swal.fire({
                    icon: "success",
                    title: "Exam Updated",
                    text: "Exam details updated successfully.",
                });
                onClose();
            } else {
                const errData = await response.json();
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: errData.error || "Failed to update exam.",
                });
            }
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message || "Network error.",
            });
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setExam({
            ...exam,
            [name]: type === "checkbox" ? checked : value,
        });
        if (errors[name]) setErrors({ ...errors, [name]: null });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <h2 className="modal-title">Edit Exam</h2>

                <div className="form-group">
                    <label>Exam Name :</label>
                    <input
                        type="text"
                        name="name"
                        className="form-input"
                        placeholder="Enter Exam Name"
                        value={exam.name}
                        onChange={handleChange}
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                    <label>Start Time :</label>
                    <input
                        type="datetime-local"
                        name="start_time"
                        className="form-input"
                        value={exam.start_time}
                        onChange={handleChange}
                    />
                    {errors.start_time && <span className="error-text">{errors.start_time}</span>}
                </div>

                <div className="form-group">
                    <label>End Time :</label>
                    <input
                        type="datetime-local"
                        name="end_time"
                        className="form-input"
                        value={exam.end_time}
                        onChange={handleChange}
                    />
                    {errors.end_time && <span className="error-text">{errors.end_time}</span>}
                </div>

                <div className="form-group">
                    <label>Attempts Allowed :</label>
                    <input
                        type="number"
                        min="1"
                        name="attempts_allowed"
                        className="form-input"
                        placeholder="Number of attempts"
                        value={exam.attempts_allowed}
                        onChange={handleChange}
                    />
                    {errors.attempts_allowed && <span className="error-text">{errors.attempts_allowed}</span>}
                </div>

                <div className="form-group flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="is_result_declared"
                        checked={exam.is_result_declared}
                        onChange={handleChange}
                        id="resultDeclared"
                    />
                    <label htmlFor="resultDeclared">Is Result Declared?</label>
                </div>

                <div className="form-group flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="is_timed"
                        checked={exam.is_timed}
                        onChange={handleChange}
                        id="isTimed"
                    />
                    <label htmlFor="isTimed">Is Timed Exam?</label>
                </div>

                <div className="modal-buttons">
                    <motion.button className="back-btn" onClick={onClose}>
                        ↩ Back
                    </motion.button>
                    <motion.button className="create-btn-student" onClick={handleEditExam}>
                        Update
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default ManageExam;

