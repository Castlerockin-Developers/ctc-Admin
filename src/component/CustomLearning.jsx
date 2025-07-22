import React from 'react';
import './CustomLearning.css';
import { motion } from "framer-motion";
import { FaSearch } from 'react-icons/fa';

// STEP 1: Add your course data here
const courses = [
    { id: 1, title: "Python", instructor: "John", for: "CSE" },
    { id: 2, title: "Data Structures", instructor: "Alice", for: "ECE" },
    { id: 3, title: "React.js", instructor: "Sara", for: "IS" },
    { id: 4, title: "Machine Learning", instructor: "Mark", for: "AD" },
    { id: 5, title: "UI/UX Design", instructor: "Eva", for: "ML" },
    { id: 6, title: "UI/UX Design", instructor: "Eva", for: "ML" },
];

const CustomLearning = ({ onNewcourse }) => {
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
                                <select name="" id="">
                                    <option value="">Choose</option>
                                    <option value="">Edit</option>
                                    <option value="">Delete</option>
                                    <option value="">Unassign</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CustomLearning;
