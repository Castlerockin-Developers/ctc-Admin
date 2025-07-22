import React, { useState } from 'react';
import './CustomLearning.css';
import { motion } from "framer-motion";
import { FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';

// STEP 1: Add your course data here
const initialCourses = [
    { id: 1, title: "Python", instructor: "John", for: "CSE" },
    { id: 2, title: "Data Structures", instructor: "Alice", for: "ECE" },
    { id: 3, title: "React.js", instructor: "Sara", for: "IS" },
    { id: 4, title: "Machine Learning", instructor: "Mark", for: "AD" },
    { id: 5, title: "UI/UX Design", instructor: "Eva", for: "ML" },
    { id: 6, title: "UI/UX Design", instructor: "Eva", for: "ML" },
];

const CustomLearning = ({ onNewcourse, onView }) => {
    const [courses, setCourses] = useState(initialCourses);

    // Track selected dropdown value for each course
    const [selectedActions, setSelectedActions] = useState({});

    const resetSelect = (courseId) => {
        setSelectedActions(prev => ({ ...prev, [courseId]: "" }));
    };

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
                text: 'This course will be deleted!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!',
                background: "#181817",
                color: "#fff"
            }).then(result => {
                if (result.isConfirmed) {
                    setCourses(prev => prev.filter(course => course.id !== courseId));
                    Swal.fire({
                        title: 'Deleted!',
                        text: 'Your course has been deleted.',
                        icon: 'success',
                        background: "#181817",
                        color: "#fff"
                    });
                }

                // reset select regardless
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
                                placeholder="Search students..."
                                className="w-full sm:w-auto"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className='course-container'>
                <div className='course-card-container gap-4'>
                    {/* STEP 2: Map through the courses array */}
                    {courses.map(course => (
                        <div key={course.id} className='flex justify-between course-card'>
                            <div className='course-title'>
                                <div className='c-branch flex items-center'>
                                    <h4>{course.for}</h4>
                                </div>
                                <div>
                                    <h2>{course.title}</h2>
                                    <p>{course.instructor}</p>
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
                                    <option value="assign-toggle">
                                        {course.assigned ? "Unassign" : "Assign"}
                                    </option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div >
    );
}

export default CustomLearning;
