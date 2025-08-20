import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import line from '../assets/Line.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft, faSearch } from '@fortawesome/free-solid-svg-icons';
import { authFetch } from '../scripts/AuthProvider';

const AddStudents = ({ onBack, onSubmit, createExamRequest, isEditing = false, editExamData = null }) => {
    // Session storage keys
    const STORAGE_KEYS = {
        allBranch: 'addStudents_allBranch',
        addedBranch: 'addStudents_addedBranch',
        addedList: 'addStudents_list',
    };

    // Student lists
    const [allStudents, setAllStudents] = useState([]);
    const [addedStudents, setAddedStudents] = useState([]);

    // Filters
    const [allBranchFilter, setAllBranchFilter] = useState('');
    const [addedBranchFilter, setAddedBranchFilter] = useState('');

    // Search queries
    const [allSearchQuery, setAllSearchQuery] = useState('');
    const [addedSearchQuery, setAddedSearchQuery] = useState('');

    // Pagination States (one for each table)
    const [allPage, setAllPage]     = useState(1);
    const [addedPage, setAddedPage] = useState(1);
    const studentsPerPage = 20;

    // Derive branches dynamically
    const branches = useMemo(
        () => Array.from(new Set(allStudents.map(s => s.branch))).sort(),
        [allStudents]
    );

    const [isCreating, setIsCreating] = useState(false);

    // Load session and fetch
    useEffect(() => {
        // Only load from sessionStorage if not in edit mode
        if (!isEditing) {
            const saved = sessionStorage.getItem(STORAGE_KEYS.addedList);
            if (saved) {
                const parsed = JSON.parse(saved).map(item => ({
                    studentId: item.studentId ?? item.id,
                    id: item.id,
                    name: item.name,
                    degree: item.degree || '',
                    year: item.year || '',
                    branch: item.branch,
                }));
                setAddedStudents(parsed);
            }
        }

        setAllBranchFilter(sessionStorage.getItem(STORAGE_KEYS.allBranch) || '');
        setAddedBranchFilter(sessionStorage.getItem(STORAGE_KEYS.addedBranch) || '');

        (async () => {
            try {
                const res = await authFetch('/admin/students/', { method: 'GET' });
                const data = await res.json();
                const list = Object.keys(data.data).flatMap(branch =>
                    data.data[branch]
                        .filter(s => s.usn)
                        .map(s => ({
                            studentId: s.id,
                            id: s.usn,
                            name: s.name,
                            degree: s.degree || '',
                            year: s.year || '',
                            branch,
                        }))
                );
                setAllStudents(list);
            } catch (e) {
                console.error(e);
            }
        })();
    }, [isEditing]);

    // Populate students from existing exam data when editing
    useEffect(() => {
        if (isEditing && editExamData) {
            console.log("AddStudents - editExamData:", editExamData);
            console.log("AddStudents - students from exam:", editExamData.students);
            console.log("AddStudents - user from exam:", editExamData.user);
            
            // Check both 'students' and 'user' fields
            let studentsData = editExamData.students || editExamData.user || [];
            
            if (studentsData && studentsData.length > 0) {
                const studentsFromExam = studentsData.map(student => {
                    console.log("Processing student:", student);
                    return {
                        studentId: student.id,
                        id: student.usn || student.slNo || student.id,
                        name: student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student',
                        degree: student.degree || '',
                        year: student.year || '',
                        branch: student.branch || '',
                    };
                }).filter(student => student.name !== 'Unknown Student'); // Filter out invalid students
                
                console.log("Processed students from exam:", studentsFromExam);
                setAddedStudents(studentsFromExam);
            } else {
                console.log("No students found in exam data");
                setAddedStudents([]);
            }
        }
    }, [isEditing, editExamData]);

    // Persist
    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEYS.addedList, JSON.stringify(addedStudents));
    }, [addedStudents]);
    
    // Debug: Log addedStudents changes
    useEffect(() => {
        console.log("AddStudents - addedStudents state changed:", addedStudents);
    }, [addedStudents]);
    
    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEYS.allBranch, allBranchFilter);
    }, [allBranchFilter]);
    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEYS.addedBranch, addedBranchFilter);
    }, [addedBranchFilter]);

    // Filter logic including branch + search
    const filteredAll = allStudents.filter(s =>
        (!allBranchFilter || s.branch === allBranchFilter) &&
        !addedStudents.some(a => a.studentId === s.studentId) &&
        (
            s.id.toLowerCase().includes(allSearchQuery.toLowerCase()) ||
            s.name.toLowerCase().includes(allSearchQuery.toLowerCase())
        )
    );

    const filteredAdded = addedStudents.filter(s =>
        (!addedBranchFilter || s.branch === addedBranchFilter) &&
        (
            s.id.toLowerCase().includes(addedSearchQuery.toLowerCase()) ||
            s.name.toLowerCase().includes(addedSearchQuery.toLowerCase())
        )
    );

    // Pagination Logic
    const paginateData = (data, currentPage) => {
        const startIndex = (currentPage - 1) * studentsPerPage;
        return data.slice(startIndex, startIndex + studentsPerPage);
    };

    // Actions
    const addAll = () => {
        setAddedStudents(prev => [...prev, ...filteredAll]);
        setAddedBranchFilter('');
        setAddedSearchQuery('');
    };
    const addOne = s =>
        setAddedStudents(prev =>
            prev.some(a => a.studentId === s.studentId)
                ? prev
                : [...prev, s]
        );
    const removeOne = s =>
        setAddedStudents(prev =>
            prev.filter(a => a.studentId !== s.studentId)
        );

    const removeAll = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'This will remove all added students.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, remove all',
            cancelButtonText: 'Cancel',
            background: '#181817',
            color: '#fff'
        }).then(result => {
            if (result.isConfirmed) {
                setAddedStudents([]);  // clear the array
            }
        });
    };

    const createExam = async () => {
        if (!addedStudents.length) {
            return Swal.fire({ 
                title: 'No Students',
                text: 'Please add at least one student to proceed.',
                icon: 'error',
                background: '#181817',
                color: '#fff'
            });
        }

        setIsCreating(true);
        
        // Get section_ids from sessionStorage for MCQ questions
        const mcqQuestions = JSON.parse(sessionStorage.getItem('mcqQuestions') || '[]');
        const section_ids = [...new Set(mcqQuestions.map(q => q.group_id))];
        
        // Get coding_question_ids from sessionStorage for coding questions
        const codingQuestions = JSON.parse(sessionStorage.getItem('codingQuestions') || '[]');
        const coding_question_ids = codingQuestions.map(q => q.id);
        
        const payload = { 
            ...createExamRequest, 
            students: addedStudents.map(s => s.studentId),
            section_ids: section_ids,
            coding_question_ids: coding_question_ids
        };

        console.log("AddStudents - createExam payload:", payload);
        console.log("AddStudents - students being sent:", payload.students);
        console.log("AddStudents - addedStudents:", addedStudents);

        try {
            let res;
            if (isEditing && editExamData) {
                // Update existing exam
                console.log("AddStudents - Updating exam:", editExamData.id);
                res = await authFetch(`/admin/exams/${editExamData.id}/`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // Create new exam
                console.log("AddStudents - Creating new exam");
                res = await authFetch('/admin/exams/create-exam/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }
            
            console.log("AddStudents - Response status:", res.status);
            console.log("AddStudents - Response ok:", res.ok);
            
            if (!res.ok) {
                const errorData = await res.json();
                console.log("AddStudents - Error response:", errorData);
                throw new Error(errorData.message || 'Failed to create exam');
            }
            
            const responseData = await res.json();
            console.log("AddStudents - Success response:", responseData);
            
            const actionText = isEditing ? 'Updated' : 'Created';
            await Swal.fire({
                title: `Test ${actionText}`,
                text: `Test has been ${actionText.toLowerCase()}.`,
                icon: 'success',
                confirmButtonText: 'OK',
                background: '#181817',
                color: '#fff'
            });
            onSubmit();
        } catch (err) {
            console.error("AddStudents - Error:", err);
            Swal.fire({
                title: 'Error',
                text: err.message,
                icon: 'error',
                confirmButtonText: 'OK',
                background: '#181817',
                color: '#fff'
            });
        } finally {
            setIsCreating(false);
        }
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
                                <select
                                    className='filter-select-branch'
                                    value={allBranchFilter}
                                    onChange={e => setAllBranchFilter(e.target.value)}
                                >
                                    <option value=''>Branch</option>
                                    {branches.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                                <div className='flex relative s-search-container'>
                                    <FontAwesomeIcon icon={faSearch} className='s-icon' />
                                    <input type='text' placeholder='Search All Students' onChange={e => setAllSearchQuery(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className='all-s-body'>
                            <div className="adds-table-wrapper">
                                <table>
                                    <thead>
                                        <tr>
                                            <td colSpan={2} align='left'>All Students</td>
                                            <td colSpan={2} align='right'>
                                                <button
                                                    onClick={addAll}
                                                    className='bg-green-500 rounded hover:bg-green-900 adds-branch'
                                                >
                                                    + Add Batch
                                                </button>
                                            </td>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {
                                             paginateData(filteredAll, allPage).length ? (
                                            paginateData(filteredAll, allPage).map(s => (
                                                <tr key={s.studentId} className='border-1 border-white'>
                                                    <td>{s.id}</td>
                                                    <td>{s.name}</td>
                                                    <td>{s.branch}</td>
                                                    <td>
                                                        <button
                                                            onClick={() => addOne(s)}
                                                            className='bg-green-500 hover:bg-green-900 rounded adds-btn'
                                                        >
                                                            +Add
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className='text-center'>No students found</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            <div className="pagination flex justify-center items-center gap-2 mt-2">
                                <button
                                    disabled={filteredAll.length === 0 || allPage === 1}
                                    onClick={() => setAllPage(p => Math.max(1, p - 1))}
                                    className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <span>
                                    {filteredAll.length ? allPage : 0} / {Math.ceil(filteredAll.length / studentsPerPage) || 0}
                                </span>
                                <button
                                    disabled={filteredAll.length === 0 || allPage >= Math.ceil(filteredAll.length / studentsPerPage)}
                                    onClick={() => setAllPage(p => Math.min(Math.ceil(filteredAll.length / studentsPerPage), p + 1))}
                                    className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Added Students Section */}
                    <div className='all-student-added'>
                        <div className='all-s-header-added flex justify-between'>
                            <h3>Added Students</h3>
                            <div className='flex gap-1.5 r-header-search'>
                                <select
                                    className='filter-select-branch'
                                    value={addedBranchFilter}
                                    onChange={e => setAddedBranchFilter(e.target.value)}
                                >
                                    <option value=''>Branch</option>
                                    {branches.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                                <div className='flex relative s-search-container'>
                                    <FontAwesomeIcon icon={faSearch} className='s-icon' />
                                    <input type='text' placeholder='Search Added Students' onChange={e => setAddedSearchQuery(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className='all-s-body'>
                            <div className="addeds-table-wrapper">
                                {filteredAdded.length ? (
                                    <table>
                                        <thead>
                                            <tr>
                                                <td colSpan={5} align='left'>Added Students</td>
                                                <td><button className='bg-red-500 hover:bg-red-900 rounded adds-btn' onClick={removeAll}>Remove all</button></td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginateData(filteredAdded, addedPage).map(s => (
                                                <tr key={s.studentId} className='border-1 border-white'>
                                                    <td>{s.id}</td>
                                                    <td className='whitespace-nowrap'>{s.name}</td>
                                                    <td>{s.degree}</td>
                                                    <td>{s.year}</td>
                                                    <td>{s.branch}</td>
                                                    <td>
                                                        <button
                                                            onClick={() => removeOne(s)}
                                                            className='bg-red-500 hover:bg-red-900 rounded adds-btn'
                                                        >
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className='text-center text-white'>No students added yet.</p>
                                )}
                            </div>

                            {/* Pagination Controls for Added Students */}
                             <div className="pagination flex justify-center items-center gap-2 mt-2">
                                <button
                                    disabled={filteredAdded.length === 0 || addedPage === 1}
                                    onClick={() => setAddedPage(p => Math.max(1, p - 1))}
                                    className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                                >
                                    Prev
                                </button>
                               <span>
                                    {filteredAdded.length ? addedPage : 0} / {Math.ceil(filteredAdded.length / studentsPerPage) || 0}
                                </span>
                                <button
                                    disabled={filteredAdded.length === 0 || addedPage >= Math.ceil(filteredAdded.length / studentsPerPage)}
                                    onClick={() => setAddedPage(p => Math.min(Math.ceil(filteredAdded.length / studentsPerPage), p + 1))}
                                    className="px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='flex justify-center'>
                    <img src={line} alt='line' className='line-bottom' />
                </div>
                <div className='flex w-full justify-end bottom-control gap-1'>
                    <button onClick={onBack} className="exam-previous-btn">
                        <FontAwesomeIcon icon={faRotateLeft} className='left-icon' />back
                    </button>
                    <p>3/3</p>
                    <button
                        className='exam-next-btn'
                        onClick={createExam}
                        disabled={isCreating}
                    >
                        {isCreating
                            ? <span className='flex items-center gap-2'>
                                <svg className='animate-spin h-5 w-5' viewBox='0 0 24 24'>
                                    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
                                    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v8z' />
                                </svg>
                                {isEditing ? 'Updating…' : 'Creating…'}
                            </span>
                            : isEditing ? '+ Update Exam' : '+ CreateExam'
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddStudents;
