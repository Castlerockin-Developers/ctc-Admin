import React, { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import line from '../assets/Line.png';
import filter from '../assets/filter.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft, faSearch } from '@fortawesome/free-solid-svg-icons';
import { authFetch } from '../scripts/AuthProvider';

const AddStudents = ({ onBack, onSubmit, createExamRequest, setCreateExamRequest }) => {
    // Single filter popup state for both sections
    const [showFilter, setShowFilter] = useState(false);
    const filterRef = useRef(null);

    // Student lists

    const [allStudents, setAllStudents] = useState([]);
    const [addedStudents, setAddedStudents] = useState([]);
    const [isAllStudentsVisible, setIsAllStudentsVisible] = useState(true);

    // Separate filter states for each section
    const [allSelectedBranchFilter, setAllSelectedBranchFilter] = useState("");
    const [allSelectedBatchFilter, setAllSelectedBatchFilter] = useState("");
    const [addedSelectedBranchFilter, setAddedSelectedBranchFilter] = useState("");
    const [addedSelectedBatchFilter, setAddedSelectedBatchFilter] = useState("");

    // Which section's filter popup is active ("all" or "added")
    const [activeFilterSection, setActiveFilterSection] = useState("");

    // Sub-popup state for branch hover (to trigger Batch selection)
    const [hoveredBranch, setHoveredBranch] = useState(null);
    const [subPopupPosition, setSubPopupPosition] = useState({ top: 0, left: 0 });
    const hoverTimeoutRef = useRef(null);

    // Array for branch options
    const branches = ["CSE", "ISE", "AIML", "CSE AIML", "CSE DS", "EC"];

    // Compute unique batches for the hovered branch from both student lists
    const batchesForHoveredBranch = hoveredBranch
        ? [...new Set([...allStudents, ...addedStudents]
            .filter(student => student.branch === hoveredBranch)
            .map(student => student.year)
        )]
        : [];

    // Toggle function for the filter popup for each section
    const toggleFilter = (event, section) => {
        event.stopPropagation();
        if (activeFilterSection === section && showFilter) {
            setShowFilter(false);
            setActiveFilterSection("");
        } else {
            setActiveFilterSection(section);
            setShowFilter(true);
        }
        setHoveredBranch(null);
    };

    // Close filter popup when clicking outside
    useEffect(() => {
        const fetchStudents = async () => {
            try {
            const response = await authFetch('/admin/students/', { method: 'GET' });
            const data = await response.json();
            const formattedData = Object.keys(data.data).map(branch => {
                return data.data[branch]
                .filter(student => student.usn)
                .map(student => ({
                    studentId: student.id,
                    id: student.usn,
                    name: student.name,
                    degree: student.degree || '',
                    year: student.year || '',
                    branch: branch
                }));
            }).flat();
            setAllStudents(formattedData);
            } catch (error) {
            console.error("Error fetching students:", error);
            }
        };
        fetchStudents();
                


        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setShowFilter(false);
                setHoveredBranch(null);
                setActiveFilterSection("");
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, []);

    // Handlers for moving students between lists
    const handleAddBatch = () => {
        if (allStudents.length > 0) {
            setAddedStudents([...addedStudents, ...allStudents]);
            setAllStudents([]);
            setIsAllStudentsVisible(false);
        }
    };

    const handleAddStudent = (student) => {
        setAddedStudents([...addedStudents, student]);
        setAllStudents(allStudents.filter(s => s.id !== student.id));
        if (allStudents.length === 1) setIsAllStudentsVisible(false);
    };

    const handleRemoveStudent = (student) => {
        setAllStudents([...allStudents, student]);
        setAddedStudents(addedStudents.filter(s => s.id !== student.id));
        setIsAllStudentsVisible(true);
    };

    // Sub-popup handler for branch hover (to show batch options)
    const handleBranchHover = (e, branch) => {
        clearTimeout(hoverTimeoutRef.current);
        setHoveredBranch(branch);
        const rect = e.target.getBoundingClientRect();
        setSubPopupPosition({
            top: rect.top + window.scrollY,
            left: rect.right + 10,
        });
    };

    // When the mouse leaves a branch or the filter popup, delay clearing the sub-popup
    const handleMouseLeave = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setHoveredBranch(null);
        }, 300);
    };

    // Cancel the timeout when entering the sub-popup so it remains clickable
    const handleSubPopupEnter = () => {
        clearTimeout(hoverTimeoutRef.current);
    };

    const handleSubPopupLeave = () => {
        setHoveredBranch(null);
    };

    // When a batch button is clicked, apply the filter to the active section
    const handleBatchFilterClick = (batch) => {
        if (activeFilterSection === "all") {
            setAllSelectedBranchFilter(hoveredBranch);
            setAllSelectedBatchFilter(batch);
        } else if (activeFilterSection === "added") {
            setAddedSelectedBranchFilter(hoveredBranch);
            setAddedSelectedBatchFilter(batch);
        }
        setShowFilter(false);
        setHoveredBranch(null);
        setActiveFilterSection("");
    };

    // Clear filter function: clears the filter for the active section
    const clearFilter = () => {
        if (activeFilterSection === "all") {
            setAllSelectedBranchFilter("");
            setAllSelectedBatchFilter("");
        } else if (activeFilterSection === "added") {
            setAddedSelectedBranchFilter("");
            setAddedSelectedBatchFilter("");
        }
        setShowFilter(false);
        setHoveredBranch(null);
        setActiveFilterSection("");
    };

    // Compute filtered list for All Students based on applied filters
    const filteredAllStudents = allStudents.filter(student => {
        if (allSelectedBranchFilter && student.branch !== allSelectedBranchFilter) return false;
        if (allSelectedBatchFilter && student.year !== allSelectedBatchFilter) return false;
        return true;
    });

    // Compute filtered list for Added Students based on applied filters
    const filteredAddedStudents = addedStudents.filter(student => {
        if (addedSelectedBranchFilter && student.branch !== addedSelectedBranchFilter) return false;
        if (addedSelectedBatchFilter && student.year !== addedSelectedBatchFilter) return false;
        return true;
    });

    // Handle CreateExam button click using SweetAlert
    const handleCreateExam =async () => {
        if (addedStudents.length === 0) {
            Swal.fire({
                title: "No Students Added",
                text: "Please add at least one student before creating the exam.",
                icon: "error",
                confirmButtonText: "OK",
                background: "#181817",
                color: "#fff"
            });
            return;
        }
        const examData = {
            ...createExamRequest,
            students: addedStudents.map(student => (
                student.studentId)),
        };
        const response = await authFetch('/admin/exams/create-exam/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(examData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            Swal.fire({
                title: "Error",
                text: errorData.message || "Failed to create exam.",
                icon: "error",
                confirmButtonText: "OK",
                background: "#181817",
                color: "#fff"
            });
            return;
        }
        Swal.fire({
            title: "Test Created",
            text: "Test has been created.",
            icon: "success",
            confirmButtonText: "OK",
            background: "#181817",
            color: "#fff"
        }).then(() => {
            onSubmit();
        });
    };

    return (
        <div className='adds-container justify-center flex flex-wrap'>
            <div className='addStudent-box'>
                <h1>Add Students</h1>

                <div className='grid lg:grid-cols-2 md:grid-cols-1 gap-2.5 add-s-container'>
                    {/* All Students Section */}
                    <div className='all-student'>
                        <div className='all-s-header flex justify-between'>
                            <h3>All Students</h3>
                            <div className='flex gap-1.5 r-header-search'>
                                <button onClick={(e) => toggleFilter(e, 'all')}>
                                    <img src={filter} alt="filter" />
                                </button>
                                <div className='flex relative s-search-container'>
                                    <FontAwesomeIcon icon={faSearch} className='s-icon' />
                                    <input type="text" placeholder="Search All Students" />
                                </div>
                            </div>
                        </div>
                        <div className='all-s-body'>
                            <div className="adds-table-wrapper">
                                {isAllStudentsVisible && (
                                    <table>
                                        <thead>
                                            <tr>
                                                <td colSpan={2} align='left'>All Students</td>
                                                <td colSpan={2} align='right'>
                                                    <button onClick={handleAddBatch} className='bg-green-500 rounded hover:bg-green-900 adds-branch'>
                                                        + Add Batch
                                                    </button>
                                                </td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAllStudents.length > 0 ? (
                                                filteredAllStudents.map(student => (
                                                    <tr key={student.id} className='border-1 border-white'>
                                                        <td>{student.id}</td>
                                                        <td>{student.name}</td>
                                                        <td>{student.branch}</td>
                                                        <td>
                                                            <button onClick={() => handleAddStudent(student)} className='bg-green-500 hover:bg-green-900 rounded adds-btn'>
                                                                +Add
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="text-center">No students found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Added Students Section */}
                    <div className='all-student-added'>
                        <div className='all-s-header-added flex justify-between'>
                            <h3>Added Students</h3>
                            <div className='flex gap-1.5 r-header-search'>
                                <button onClick={(e) => toggleFilter(e, 'added')}>
                                    <img src={filter} alt="filter" />
                                </button>
                                <div className='flex relative s-search-container'>
                                    <FontAwesomeIcon icon={faSearch} className='s-icon' />
                                    <input type="text" placeholder="Search Added Students" />
                                </div>
                            </div>
                        </div>
                        <div className='all-s-body'>
                            <div className="addeds-table-wrapper">
                                {filteredAddedStudents.length === 0 ? (
                                    <p className="text-center text-white">No students added yet.</p>
                                ) : (
                                    <table>
                                        <thead>
                                            <tr>
                                                <td colSpan={6} align='left'>Added Students</td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAddedStudents.map(student => (
                                                <tr key={student.id} className='border-1 border-white'>
                                                    <td>{student.id}</td>
                                                    <td className='whitespace-nowrap'>{student.name}</td>
                                                    <td>{student.degree}</td>
                                                    <td>{student.year}</td>
                                                    <td>{student.branch}</td>
                                                    <td>
                                                        <button onClick={() => handleRemoveStudent(student)} className='bg-red-500 hover:bg-red-900 rounded adds-btn'>
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex justify-center'>
                    <img src={line} alt="line" className='line-bottom' />
                </div>
                <div className='flex w-full justify-end bottom-control gap-1'>
                    <button onClick={onBack} className="exam-previous-btn">
                        <FontAwesomeIcon icon={faRotateLeft} className='left-icon' />back
                    </button>
                    <p>3/3</p>
                    <button className='exam-next-btn' onClick={handleCreateExam}>+ CreateExam</button>
                </div>

                {/* Filter Popup */}
                {showFilter && (
                    <>
                        <div className="filter-popup" ref={filterRef}>
                            <h3>Branch</h3>
                            <div className="flex justify-center w-full">
                                <img src={line} alt="line" className="filter-line" />
                            </div>
                            <div className="filter-options">
                                {branches.map((branch, index) => (
                                    <div
                                        key={index}
                                        className={`filter-item ${hoveredBranch === branch ? "active-filter-item" : ""}`}
                                        onMouseEnter={(e) => handleBranchHover(e, branch)}
                                        onMouseLeave={handleMouseLeave}
                                    >
                                        {branch}
                                    </div>
                                ))}
                            </div>
                            <button className="apply-btn" onClick={clearFilter}>Clear Filter</button>
                        </div>
                        {hoveredBranch && (
                            <div
                                className="sub-popup"
                                style={{ top: subPopupPosition.top, left: subPopupPosition.left }}
                                onMouseEnter={handleSubPopupEnter}
                                onMouseLeave={handleSubPopupLeave}
                            >
                                <h4>{hoveredBranch} - Batch</h4>
                                {batchesForHoveredBranch.length > 0 ? (
                                    batchesForHoveredBranch.map((batch, index) => (
                                        <button 
                                            key={index} 
                                            className="sub-item" 
                                            onClick={() => handleBatchFilterClick(batch)}
                                        >
                                            {batch}
                                        </button>
                                    ))
                                ) : (
                                    <button className="sub-item">No Batch</button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AddStudents;
