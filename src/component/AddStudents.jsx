import React, { useEffect, useRef, useState } from 'react';
import line from '../assets/Line.png';
import filter from '../assets/filter.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

const AddStudents = ({ onBack, onSubmit }) => {
    // Main filter popups for All & Added students
    const [showFilterAll, setShowFilterAll] = useState(false);
    const [showFilterAdded, setShowFilterAdded] = useState(false);
    const filterRefAll = useRef(null);
    const filterRefAdded = useRef(null);

    // Student lists
    const [allStudents, setAllStudents] = useState([
        { id: '4NM21EC400', name: 'John Kumar', degree: 'BE', year: '2025', branch: 'CSE' },
        { id: '4NM21EC401', name: 'Alice Smith', degree: 'BE', year: '2025', branch: 'ISE' }
    ]);
    const [addedStudents, setAddedStudents] = useState([]);
    const [isAllStudentsVisible, setIsAllStudentsVisible] = useState(true);

    // Sub-popup states for branch (which triggers the Year sub-popup)
    const [hoveredBranch, setHoveredBranch] = useState(null);
    const [subPopupPosition, setSubPopupPosition] = useState({ top: 0, left: 0 });
    // Sub-popup state for year (which triggers the Section sub-popup)
    const [hoveredYear, setHoveredYear] = useState(null);
    const [yearPopupPosition, setYearPopupPosition] = useState({ top: 0, left: 0 });

    // Arrays for options
    const branches = ["CSE", "ISE", "AIML", "CSE AIML", "CSE DS", "EC"];
    const years = ["1st Year", "2nd Year", "3rd Year", "Final Year"];
    const sections = ["A", "B", "C", "D"];

    // Toggle functions for filter popups
    const toggleFilterAll = (event) => {
        event.stopPropagation();
        setShowFilterAll((prev) => !prev);
        setShowFilterAdded(false);
        setHoveredBranch(null);
    };

    const toggleFilterAdded = (event) => {
        event.stopPropagation();
        setShowFilterAdded((prev) => !prev);
        setShowFilterAll(false);
        setHoveredBranch(null);
    };

    // Close filter popups when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterRefAll.current && !filterRefAll.current.contains(event.target)) {
                setShowFilterAll(false);
                setHoveredBranch(null);
            }
            if (filterRefAdded.current && !filterRefAdded.current.contains(event.target)) {
                setShowFilterAdded(false);
                setHoveredBranch(null);
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

    // Sub-popup handlers
    const handleBranchHover = (e, branch) => {
        setHoveredBranch(branch);
        const rect = e.target.getBoundingClientRect();
        setSubPopupPosition({
            top: rect.top + window.scrollY,
            left: rect.right + 10, // Position to the right of the branch item
        });
    };

    const handleYearHover = (e, year) => {
        setHoveredYear(year);
        const rect = e.target.getBoundingClientRect();
        setYearPopupPosition({
            top: rect.top + window.scrollY,
            left: rect.right + 10, // Position to the right of the year button
        });
    };

    // When the mouse leaves a branch or year, we clear the sub-popup states.
    const handleMouseLeave = () => {
        setHoveredBranch(null);
        setHoveredYear(null);
    };

    return (
        <div className='adds-container justify-center flex flex-wrap'>
            <div className='addStudent-box'>
                <h1>Add Students</h1>
                {/* <img src={line} alt="line" /> */}

                <div className='grid lg:grid-cols-2 md:grid-cols-1 gap-2.5 add-s-container'>
                    {/* All Students Section */}
                    <div className='all-student'>
                        <div className='all-s-header flex justify-between'>
                            <h3>All Students</h3>
                            <div className='flex gap-1.5 r-header-search'>
                                <button onClick={toggleFilterAll}>
                                    <img src={filter} alt="filter" />
                                </button>
                                <div className='flex relative s-search-container'>
                                    <FontAwesomeIcon icon={faSearch} className='s-icon' />
                                    <input type="text" />
                                </div>
                            </div>
                        </div>
                        <div className='all-s-body'>
                            <div className="adds-table-wrapper">
                                {isAllStudentsVisible && (
                                    <table>
                                        <thead>
                                            <tr>
                                                <td colSpan={3} align='left'>All Students</td>
                                                <td colSpan={3} align='right'>
                                                    <button onClick={handleAddBatch} className='bg-green-500 rounded hover:bg-green-900 adds-branch'>
                                                        + Add Batch
                                                    </button>
                                                </td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allStudents.map(student => (
                                                <tr key={student.id} className='border-1 border-white'>
                                                    <td>{student.id}</td>
                                                    <td>{student.name}</td>
                                                    <td>{student.degree}</td>
                                                    <td>{student.year}</td>
                                                    <td>{student.branch}</td>
                                                    <td>
                                                        <button onClick={() => handleAddStudent(student)} className='bg-green-500 hover:bg-green-900 rounded adds-btn'>
                                                            +Add
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

                    {/* Added Students Section */}
                    <div className='all-student-added'>
                        <div className='all-s-header-added flex justify-between'>
                            <h3>Added Students</h3>
                            <div className='flex gap-1.5 r-header-search'>
                                <button onClick={toggleFilterAdded}>
                                    <img src={filter} alt="filter" />
                                </button>
                                <div className='flex relative s-search-container'>
                                    <FontAwesomeIcon icon={faSearch} className='s-icon' />
                                    <input type="text" />
                                </div>
                            </div>
                        </div>
                        <div className='all-s-body'>
                            <div className="addeds-table-wrapper">
                                {addedStudents.length === 0 ? (
                                    <p className="text-center text-white">No students added yet.</p>
                                ) : (
                                    <table>
                                        <thead>
                                            <tr>
                                                <td colSpan={6} align='left'>Added Students</td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {addedStudents.map(student => (
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
                    <button onClick={onBack} className="exam-previous-btn"><FontAwesomeIcon icon={faRotateLeft} className='left-icon' />back</button>
                    <p>3/3</p>
                    <button className='exam-next-btn' onClick={onSubmit}>+ CreateExam</button>
                </div>

                {/* -------------------------------
            FILTER POPUP FOR ALL STUDENTS
        --------------------------------- */}
                {showFilterAll && (
                    <div className="inadd-student" ref={filterRefAll}>
                        <h3>Branch</h3>
                        <img src={line} alt="line" className="s-filter-line" />
                        <div className="inadd-student-filter-options">
                            {branches.map((branch, index) => (
                                <div key={index}
                                    className="adds-filter-item"
                                    onMouseEnter={(e) => handleBranchHover(e, branch)}
                                    onMouseLeave={handleMouseLeave}>
                                    {branch}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* -------------------------------
            FILTER POPUP FOR ADDED STUDENTS
        --------------------------------- */}
                {showFilterAdded && (
                    <div className="inadded-student" ref={filterRefAdded}>
                        <h3>Branch</h3>
                        <img src={line} alt="line" className="s-filter-line" />
                        <div className="inadd-student-filter-options">
                            {branches.map((branch, index) => (
                                <div key={index}
                                    className="adds-filter-item"
                                    onMouseEnter={(e) => handleBranchHover(e, branch)}
                                    onMouseLeave={handleMouseLeave}>
                                    {branch}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* -------------------------------
            SUB-POPUP: YEAR SELECTION (triggered by hovering a branch)
        --------------------------------- */}
                {(showFilterAll || showFilterAdded) && hoveredBranch && (
                    <div className="sub-popup"
                        style={{ top: subPopupPosition.top, left: subPopupPosition.left }}
                        onMouseEnter={() => setHoveredBranch(hoveredBranch)}
                        onMouseLeave={handleMouseLeave}>
                        <h4>{hoveredBranch} - Year</h4>
                        {years.map((year, index) => (
                            <button key={index}
                                className="sub-item"
                                onMouseEnter={(e) => handleYearHover(e, year)}
                                onMouseLeave={handleMouseLeave}>
                                {year}
                            </button>
                        ))}
                    </div>
                )}

                {/* -------------------------------
            SUB-POPUP: SECTION SELECTION (triggered by hovering a year)
        --------------------------------- */}
                {hoveredYear && (
                    <div className="sub-popup"
                        style={{ top: yearPopupPosition.top, left: yearPopupPosition.left }}
                        onMouseEnter={() => setHoveredYear(hoveredYear)}
                        onMouseLeave={handleMouseLeave}>
                        <h4>{hoveredYear} - Section</h4>
                        {sections.map((section, index) => (
                            <button key={index} className="sub-item">
                                {section}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddStudents;
