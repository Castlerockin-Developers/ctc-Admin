import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaSearch, FaPlus, FaFilter } from "react-icons/fa";
import filter from '../assets/filter.png';
import line from '../assets/Line.png';
import { motion } from "motion/react";
import { authFetch } from "../scripts/AuthProvider";
import Swal from "sweetalert2";
import ManageLoader from "../loader/ManageLoader";
import TableSkeleton from "../loader/TableSkeleton";
import { useCache } from "../hooks/useCache";
import CacheStatusIndicator from "./CacheStatusIndicator";
import "./CacheStatusIndicator.css";

const ManageExam = ({ onCreateNewExam, onNext, cacheAllowed, onEditExam, examToView, onBackToDashboard }) => {
    const [activeButton, setActiveButton] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedExam, setSelectedExam] = useState(examToView || null);
    const [showFilter, setShowFilter] = useState(false);
    const filterRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    // const itemsPerPage = 10;
    const [itemsPerPage, setItemsPerPage] = useState(
        () => window.innerWidth >= 2560 ? 15 : 10
    );

    const pageFade = {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.4 } }
    };

    const slideUp = {
        initial: { y: 20, opacity: 0 },
        animate: { y: 0, opacity: 1, transition: { duration: 0.3 } }
    };

    useEffect(() => {
        const onResize = () => {
            setItemsPerPage(window.innerWidth >= 2560 ? 15 : 10);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Update selectedExam when examToView changes
    useEffect(() => {
        if (examToView) {
            setSelectedExam(examToView);
        }
    }, [examToView]);


    // Close filter dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setShowFilter(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close filter dropdown on Escape key press
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setShowFilter(false);
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    const toggleFilter = () => {
        setShowFilter(prev => !prev);
    };

    const handleFilterSelect = (key) => {
        setActiveButton(key);
        setCurrentPage(1); // Reset to first page when filter is applied
        setShowFilter(false);
    };


    // Exams data fetch function
    const fetchExams = useCallback(async () => {
        const response = await authFetch('/admin/exams/', { method: "GET" });
        const data = await response.json();
        return data;
    }, []);

    // Cache callbacks
    const onCacheHit = useCallback((data) => {
        console.log('Exams data loaded from cache');
    }, []);

    const onCacheMiss = useCallback((data) => {
        console.log('Exams data fetched fresh');
    }, []);

    const onError = useCallback((err) => {
        console.error('Exams fetch error:', err);
    }, []);

    // Use cache hook for exams data
    const {
        data: examsData,
        loading,
        error,
        cacheUsed,
        cacheInfo,
        forceRefresh,
        invalidateCache,
        clearAllCache
    } = useCache('exam_data', fetchExams, {
        enabled: cacheAllowed,
        expiryMs: 5 * 60 * 1000, // 5 minutes
        autoRefresh: false,
        onCacheHit,
        onCacheMiss,
        onError
    });

    // Process exams data for display
    const tableData = examsData ? examsData.map((exam) => ({
        id: exam.id,
        name: exam.name,
        startTime: new Date(exam.start_time).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short', hour12: true }),
        endTime: new Date(exam.end_time).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short', hour12: true }),
        attemptsAllowed: exam.attempts_allowed,
        status: new Date(exam.start_time) > new Date() ? "Upcoming" : exam.is_result_declared ? "Results Declared" : new Date(exam.end_time) > new Date() ? "Ongoing" : "Completed",
    })) : [];

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

    const totalPages = Math.ceil(filteredTableData.length / itemsPerPage);
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentTableData = filteredTableData.slice(indexOfFirst, indexOfLast);

    const handleViewExam = (exam) => {
        setSelectedExam(exam);
    };

    const handleBack = () => {
        setSelectedExam(null);
        if (onBackToDashboard) {
            onBackToDashboard();
        }
        forceRefresh(); // Re-fetch exams to ensure updated data after potential edit
    };

    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
    };

    return (
        <motion.div
            variants={pageFade}
            initial="initial"
            animate="animate"
            className="lg:w-3xl justify-center flex flex-wrap exam-container">
            {selectedExam ? (
                <ViewExam exam={selectedExam} onBack={handleBack} onEditExam={onEditExam} />
            ) : (
                <div className="exam-greeting">
                    <div className="flex justify-between items-center mb-4">
                        <motion.h1 variants={slideUp}>Exams</motion.h1>

                    </div>
                    <div className="flex sm:flex-row justify-self-end items-center gap-4">
                        <div className="m-btn-right flex sm:flex-row flex-col-reverse sm:justify-end justify-center items-center gap-2 w-full sm:w-auto">
                            {/* Filter dropdown */}
                            <motion.div variants={slideUp} ref={filterRef} className="relative">
                                <button className="filter-btn" onClick={toggleFilter}>
                                    <FaFilter
                                        className="h-6 w-6 cursor-pointer text-white"
                                    />
                                </button>
                                {showFilter && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="absolute mt-2 left-0 bg-[#1F1F1F] border border-gray-200 rounded shadow-lg z-10"
                                    >
                                        <ul className="py-2 text-white filter-btn-options">
                                            <li
                                                className={`px-4 py-3 hover:bg-[#535353] cursor-pointer ${activeButton === 'all' ? 'font-semibold' : ''}`}
                                                onClick={() => handleFilterSelect('all')}
                                            >All Exams</li>
                                            <li
                                                className={`px-4 py-3 hover:bg-[#535353] cursor-pointer ${activeButton === 'active' ? 'font-semibold' : ''}`}
                                                onClick={() => handleFilterSelect('active')}
                                            >Active</li>
                                            <li
                                                className={`px-4 py-3 hover:bg-[#535353] cursor-pointer ${activeButton === 'upcoming' ? 'font-semibold' : ''}`}
                                                onClick={() => handleFilterSelect('upcoming')}
                                            >Upcoming</li>
                                            <li
                                                className={`px-4 py-3 hover:bg-[#535353] cursor-pointer ${activeButton === 'completed' ? 'font-semibold' : ''}`}
                                                onClick={() => handleFilterSelect('completed')}
                                            >Completed</li>
                                        </ul>
                                    </motion.div>
                                )}
                            </motion.div>
                            <motion.div variants={slideUp} className="search-box1 flex">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search exams..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full sm:w-auto"
                                />
                            </motion.div>
                            <motion.button variants={slideUp} whileTap={{ scale: 1.2 }} className="create-btn w-full sm:w-auto" onClick={onCreateNewExam}>
                                <FaPlus className="icon" /> Create New Exam
                            </motion.button>
                        </div>
                    </div>
                    <div className="m-table-container">
                        {loading || !examsData ? (
                            <TableSkeleton />
                        ) : (
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
                                    {currentTableData.length > 0 ? (
                                        currentTableData.map((row, idx) => (
                                            <motion.tr
                                                key={row.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.03, duration: 0.2 }}
                                                className={idx % 2 === 0 ? "even-row" : "odd-row"}>
                                                <td>{row.id}</td>
                                                <td>{row.name}</td>
                                                <td>{row.startTime}</td>
                                                <td>{row.endTime}</td>
                                                <td>{row.attemptsAllowed}</td>
                                                <td>{row.status}</td>
                                                <td><motion.button className="viewexam-btn" whileTap={{ scale: 1.2 }} onClick={() => handleViewExam(row)}>View Exam</motion.button></td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="no-data">No exams found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                    {/* Pagination Controls */}
                    {!loading && examsData && filteredTableData.length > 0 && (
                        <div className="pagination-controls flex justify-between items-center mt-4">
                            <motion.button
                                whileTap={{ scale: 1.1 }}
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="pagination-btn"
                            >
                                Previous
                            </motion.button>
                            <span>Page {currentPage} of {totalPages}</span>
                            <motion.button
                                whileTap={{ scale: 1.1 }}
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="pagination-btn"
                            >
                                Next
                            </motion.button>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};


const ViewExam = ({ exam, onBack, onEditExam }) => {
    const [examDetails, setExamDetails] = useState(null);  // <-- new state for detailed exam data

    // Function to check if exam is completed
    const isExamCompleted = (examData) => {
        if (!examData) return false;
        
        // Check if exam has end_time
        if (examData.end_time) {
            const endTime = new Date(examData.end_time);
            const currentTime = new Date();
            return endTime < currentTime;
        }
        
        // Check if exam has is_result_declared field
        if (examData.is_result_declared !== undefined) {
            return examData.is_result_declared;
        }
        
        // Check if exam has status field
        if (examData.status) {
            return examData.status === 'completed' || examData.status === 'finished';
        }
        
        return false;
    };

    const handleEditClick = () => {
        if (onEditExam && examDetails) {
            onEditExam(examDetails);
        }
    };

    const handleDeleteExam = async () => {
        try {
            // Show confirmation dialog
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, delete it!',
                background: '#181817',
                color: '#fff',
            });

            if (result.isConfirmed) {
                // Show loading state
                Swal.fire({
                    title: 'Deleting...',
                    text: 'Please wait while we delete the exam.',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                    background: '#181817',
                    color: '#fff',
                });

                // Make API call to delete exam
                const response = await authFetch(`/admin/exams/${examDetails.id}/`, {
                    method: "DELETE",
                });

                if (response.ok) {
                    Swal.fire({
                        icon: "success",
                        title: "Exam Deleted!",
                        text: "The exam has been deleted successfully.",
                        background: '#181817',
                        color: '#fff',
                    });
                    // Navigate back to exam list
                    onBack();
                } else {
                    const errorData = await response.json();
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: errorData.error || "Failed to delete exam.",
                        background: '#181817',
                        color: '#fff',
                    });
                }
            }
        } catch (error) {
            console.error("Error deleting exam:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: error.message || "Network error occurred while deleting the exam.",
                background: '#181817',
                color: '#fff',
            });
        }
    };

    const handleViewExam = async (exam) => {
        try {
            const response = await authFetch(`/admin/exams/${exam.id}/`, { method: "GET" });
            if (!response.ok) {
                throw new Error("Failed to fetch exam details");
            }
            const data = await response.json();
            console.log("ManageExam - Exam details:", data);
            console.log("ManageExam - Students in exam data:", data.students);
            console.log("ManageExam - Students count:", data.students?.length || 0);
            console.log("ManageExam - Exam completion status:", {
                end_time: data.end_time,
                is_result_declared: data.is_result_declared,
                status: data.status,
                isCompleted: isExamCompleted(data)
            });
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
            <ManageLoader />
        );
    }

    return (
        <div className='viewexam-container justify-center flex flex-wrap'>
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
                className='viewexam-box'>
                <div className='flex'>
                    <button onClick={onBack}>&lt;</button>
                    <h1>#{examDetails.id} {examDetails.name}</h1>
                </div>
                <div className="viewexam-section">
                    <div className="viewexam-header">
                        <h2>Exam Section</h2>
                        <div className='viewexam-header-btn'>
                        {!isExamCompleted(examDetails) && (
                            <>
                                <button className='viewexam-del-btn' onClick={handleDeleteExam}>Delete</button>
                                <button className="viewexam-edit-btn" onClick={handleEditClick}>Edit</button>
                            </>
                            )}
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
                                            <motion.div
                                                initial={{ opacity: 0, translateX: -10 }}
                                                animate={{ opacity: 1, translateX: 0 }}
                                                transition={{ delay: index * 0.05, duration: 0.3 }}
                                                key={section.id || index}
                                                className="question-block my-2">
                                                <div className="flex justify-between items-center w-full text-xl py-2">
                                                    <p className='text-white'>
                                                        {index + 1}. {section.section_name || "Sample Question"}
                                                    </p>
                                                    <p className="text-sm text-white whitespace-nowrap">
                                                        Timed: {section.is_timed ? "Yes" : "No"} {section.is_timed && `| Time: ${section.section_time} min`} | Total: {section.no_of_question}
                                                    </p>
                                                </div>
                                            </motion.div>
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
                
                {/* Students Section */}
                <div className="viewexam-section">
                    <div className="viewexam-header">
                        <h2>Assigned Students</h2>
                    </div>
                    <div className="viewexam-body flex flex-col items-center justify-start">
                        <div className="viewexam-viwer">
                            <div className='viewexam-q'>
                                <div className="viewexam-viwer-header flex justify-between items-center">
                                    <h2 className='text-xl'>Students</h2>
                                    <p>{examDetails?.students?.length || 0}</p>
                                </div>
                                <div className="viewexam-viwer-body flex justify-center">
                                    <div className="viewexams-container pb-2">
                                        {examDetails?.students && examDetails.students.length > 0 ? (
                                            examDetails.students.map((student, index) => (
                                                <div key={student.id || index} className="question-block my-2">
                                                    <div className="flex justify-between items-center w-full text-xl py-2">
                                                        <p className='text-white'>
                                                            {index + 1}. {student.name || `${student.first_name} ${student.last_name}`}
                                                        </p>
                                                        <p className="text-sm text-white whitespace-nowrap">
                                                            USN: {student.usn || student.slNo} | {student.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="question-block my-2">
                                                <div className="flex justify-center items-center w-full text-xl py-2">
                                                    <p className='text-white text-center'>No students assigned to this exam</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default ManageExam;

