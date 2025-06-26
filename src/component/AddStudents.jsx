import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import line from '../assets/Line.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft, faSearch } from '@fortawesome/free-solid-svg-icons';
import { authFetch } from '../scripts/AuthProvider';

const AddStudents = ({ onBack, onSubmit, createExamRequest }) => {
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

    // Derive branches dynamically
    const branches = useMemo(
        () => Array.from(new Set(allStudents.map(s => s.branch))).sort(),
        [allStudents]
    );

    // Load session and fetch
    useEffect(() => {
        const saved = sessionStorage.getItem(STORAGE_KEYS.addedList);
        if (saved) {
            const parsed = JSON.parse(saved).map(item => ({
                // old entries had only `id`—assume that was the USN
                studentId: item.studentId ?? item.id,
                id: item.id,
                name: item.name,
                degree: item.degree || '',
                year: item.year || '',
                branch: item.branch,
            }));
            setAddedStudents(parsed);
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
    }, []);

    // Persist
    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEYS.addedList, JSON.stringify(addedStudents));
    }, [addedStudents]);
    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEYS.allBranch, allBranchFilter);
    }, [allBranchFilter]);
    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEYS.addedBranch, addedBranchFilter);
    }, [addedBranchFilter]);

    // Filters applied
    const filteredAll = allStudents.filter(s =>
        (!allBranchFilter || s.branch === allBranchFilter) &&
        !addedStudents.some(a => a.studentId === s.studentId)
    );
    const filteredAdded = addedStudents.filter(s =>
        !addedBranchFilter || s.branch === addedBranchFilter
    );

    // Actions
    const addAll = () => setAddedStudents(prev => [...prev, ...filteredAll]);
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

    const createExam = async () => {
        if (!addedStudents.length) {
            return Swal.fire({
                title: 'No Students Added',
                text: 'Add at least one student before creating the exam.', icon: 'error',
                confirmButtonText: 'OK', background: '#181817', color: '#fff'
            });
        }
        const payload = { ...createExamRequest, students: addedStudents.map(s => s.studentId) };
        const res = await authFetch('/admin/exams/create-exam/', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const { message } = await res.json();
            return Swal.fire({ title: 'Error', text: message || 'Failed.', icon: 'error', confirmButtonText: 'OK', background: '#181817', color: '#fff' });
        }
        Swal.fire({ title: 'Test Created', text: 'Test has been created.', icon: 'success', confirmButtonText: 'OK', background: '#181817', color: '#fff' }).then(onSubmit);
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
                                    onChange={e => { setAllBranchFilter(e.target.value); setAllBatchFilter(''); }}
                                >
                                    <option value=''>Branch</option>
                                    {branches.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                                <div className='flex relative s-search-container'>
                                    <FontAwesomeIcon icon={faSearch} className='s-icon' />
                                    <input type='text' placeholder='Search All Students' />
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
                                        {filteredAll.length ? (
                                            filteredAll.map(s => (
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
                                    onChange={e => { setAddedBranchFilter(e.target.value); setAddedBatchFilter(''); }}
                                >
                                    <option value=''>Branch</option>
                                    {branches.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                                <div className='flex relative s-search-container'>
                                    <FontAwesomeIcon icon={faSearch} className='s-icon' />
                                    <input type='text' placeholder='Search Added Students' />
                                </div>
                            </div>
                        </div>
                        <div className='all-s-body'>
                            <div className="addeds-table-wrapper">
                                {filteredAdded.length ? (
                                    <table>
                                        <thead>
                                            <tr>
                                                <td colSpan={6} align='left'>Added Students</td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAdded.map(s => (
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
                    <button className='exam-next-btn' onClick={createExam}>+ CreateExam</button>
                </div>
            </div>
        </div>
    );
};

export default AddStudents;
