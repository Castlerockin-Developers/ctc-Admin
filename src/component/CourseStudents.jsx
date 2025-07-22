import React, { useEffect, useState } from 'react';
import './CustomLearning.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import line from '../assets/Line.png';
import { motion } from "framer-motion";
import { authFetch } from '../scripts/AuthProvider'; // Adjust import path as needed

const CourseStudents = ({ onBackccc, onNextccc }) => {
    const [allStudents, setAllStudents] = useState([]);
    const [addedStudents, setAddedStudents] = useState([]);

    const [allSearchQuery, setAllSearchQuery] = useState('');
    const [addedSearchQuery, setAddedSearchQuery] = useState('');
    const [allBranchFilter, setAllBranchFilter] = useState('');
    const [addedBranchFilter, setAddedBranchFilter] = useState('');
    const [branches, setBranches] = useState([]);

    // Fetch students and initialize state
    useEffect(() => {
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
                setBranches(Object.keys(data.data));
            } catch (e) {
                console.error('Failed to fetch students:', e);
            }
        })();
    }, []);

    // Filter all students
    const filteredAll = allStudents.filter(s =>
        (!allBranchFilter || s.branch.toLowerCase() === allBranchFilter.toLowerCase()) &&
        (s.name.toLowerCase().includes(allSearchQuery.toLowerCase()) ||
            s.id.toLowerCase().includes(allSearchQuery.toLowerCase()))
    ).filter(s => !addedStudents.some(a => a.studentId === s.studentId)); // Only show not-added students

    // Filter added students
    const filteredAdded = addedStudents.filter(s =>
        (!addedBranchFilter || s.branch.toLowerCase() === addedBranchFilter.toLowerCase()) &&
        (s.name.toLowerCase().includes(addedSearchQuery.toLowerCase()) ||
            s.id.toLowerCase().includes(addedSearchQuery.toLowerCase()))
    );

    // Add all filtered students
    const addAll = () => {
        setAddedStudents(prev => [...prev, ...filteredAll]);
        setAddedBranchFilter('');
        setAddedSearchQuery('');
    };

    // Add a single student
    const addOne = s =>
        setAddedStudents(prev =>
            prev.some(a => a.studentId === s.studentId)
                ? prev
                : [...prev, s]
        );

    // Remove a student
    const removeOne = s =>
        setAddedStudents(prev =>
            prev.filter(a => a.studentId !== s.studentId)
        );

    // Remove all added students with confirmation
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
                setAddedStudents([]);
            }
        });
    };

    return (
        <div className='Custom-container'>
            <div className='new-c-top'>
                <h1>Add Students</h1>
                <img src={line} alt="line" className='w-full h-0.5' />
            </div>

            <div className='add-import'>
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
                                    <input
                                        type='text'
                                        placeholder='Search All Students'
                                        onChange={e => setAllSearchQuery(e.target.value)}
                                    />
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
                                                <tr key={s.studentId}>
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
                            <h3>Added</h3>
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
                                    <input
                                        type='text'
                                        placeholder='Search Added Students'
                                        onChange={e => setAddedSearchQuery(e.target.value)}
                                    />
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
                                                <td>
                                                    <button
                                                        onClick={removeAll}
                                                        className='bg-red-500 hover:bg-red-900 rounded adds-btn'
                                                    >
                                                        Remove all
                                                    </button>
                                                </td>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredAdded.map(s => (
                                                <tr key={s.studentId}>
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
                <div className='flex justify-end third-step'>
                    <div className='flex items-center gap-8 bottom-course'>
                        <button className='back-btn-create' onClick={onBackccc}>Back</button>
                        <p>3/3</p>
                        <button className='next-btn' onClick={onNextccc}>Create</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseStudents;
