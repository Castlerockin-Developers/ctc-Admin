import React, { useState, useEffect } from 'react';
import './CustomLearning.css';
import { motion } from "framer-motion";
import { FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';
import { authFetch } from '../scripts/AuthProvider';

const CustomLearning = ({ onNewcourse, onView }) => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Track selected dropdown value for each course
    const [selectedActions, setSelectedActions] = useState({});

    const resetSelect = (courseId) => {
        setSelectedActions(prev => ({ ...prev, [courseId]: "" }));
    };

    // Load custom modules from API
    const loadCustomModules = async () => {
        try {
            setLoading(true);
            const response = await authFetch('/learning/custom-modules/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const modules = await response.json();
                setCourses(modules);
            } else {
                throw new Error('Failed to load modules');
            }
        } catch (error) {
            console.error('Error loading custom modules:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to load custom modules. Please try again.',
                icon: 'error',
                background: "#181817",
                color: "#fff"
            });
        } finally {
            setLoading(false);
        }
    };

    // Delete module via API
    const deleteModule = async (moduleId) => {
        try {
            const response = await authFetch(`/learning/custom-modules/${moduleId}/`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setCourses(prev => prev.filter(course => course.id !== moduleId));
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Your module has been deleted.',
                    icon: 'success',
                    background: "#181817",
                    color: "#fff"
                });
            } else {
                throw new Error('Failed to delete module');
            }
        } catch (error) {
            console.error('Error deleting module:', error);
            Swal.fire({
                title: 'Error!',
                text: 'Failed to delete module. Please try again.',
                icon: 'error',
                background: "#181817",
                color: "#fff"
            });
        }
    };

    useEffect(() => {
        loadCustomModules();
    }, []);

    const handleActionChange = (e, courseId) => {
        const selectedAction = e.target.value;

        if (selectedAction === "view") {
            const selectedCourse = courses.find((c) => c.id === courseId);
            onView && onView(selectedCourse);
            resetSelect(courseId);
        }

        if (selectedAction === "delete") {
            Swal.fire({
                title: 'Are you sure?',
                text: 'This module will be deleted permanently!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!',
                background: "#181817",
                color: "#fff"
            }).then(result => {
                if (result.isConfirmed) {
                    deleteModule(courseId);
                }
                resetSelect(courseId);
            });
        }

        else if (selectedAction === "assign-toggle") {
            setCourses(prev =>
                prev.map(course =>
                    course.id === courseId
                        ? { ...course, assigned: !course.assigned }
                        : course
                )
            );
            resetSelect(courseId);
        }

        else {
            // For edit etc., just reset for now
            resetSelect(courseId);
        }
    };


    return (
        <div className='Custom-container'>
            <div className='flex items-center justify-center'>
                <div className='c-top flex items-center justify-between'>
                    <h1>Customized Modules</h1>
                    <div className='flex gap-2'>
                        <motion.button
                            whileTap={{ scale: 1.1 }}
                            onClick={onNewcourse}
                        >Create
                        </motion.button>
                        <div className="search-box flex items-center">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search modules..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-auto"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className='course-container'>
                {loading ? (
                    <div className='flex justify-center items-center py-8'>
                        <div className='text-white'>Loading modules...</div>
                    </div>
                ) : (
                    <div className='course-card-container gap-4'>
                        {courses
                            .filter(course => 
                                course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                (course.author_name && course.author_name.toLowerCase().includes(searchTerm.toLowerCase()))
                            )
                            .map(course => (
                            <div key={course.id} className='flex justify-between course-card'>
                                <div className='course-title'>
                                    <div className='c-branch flex items-center'>
                                        <h4>{course.total_chapters} chapters</h4>
                                    </div>
                                    <div>
                                        <h2>{course.name}</h2>
                                        <p>{course.author_name ? `${course.author_name} (${course.author_designation})` : 'No Author'}</p>
                                        <small style={{color: '#888'}}>{course.desc}</small>
                                    </div>
                                </div>
                                <div className='flex items-center course-view-btn '>
                                    <select
                                        value={selectedActions[course.id] || ""}
                                        onChange={(e) => {
                                            setSelectedActions(prev => ({
                                                ...prev,
                                                [course.id]: e.target.value
                                            }));
                                            handleActionChange(e, course.id);
                                        }}
                                    >
                                        <option value="">Options</option>
                                        <option value="view">View</option>
                                        <option value="edit">Edit</option>
                                        <option value="delete">Delete</option>
                                        <option value="assign">Assign to Students</option>
                                    </select>
                                </div>
                            </div>
                        ))}
                        {courses.length === 0 && (
                            <div className='flex justify-center items-center py-8'>
                                <div className='text-white'>No custom modules found. Create one to get started!</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
}

export default CustomLearning;
