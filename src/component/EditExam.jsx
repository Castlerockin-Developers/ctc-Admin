import React from 'react';
import closeicon from "../assets/close.png";
import { motion } from "motion/react";

const EditExam = ({ onClose, examDetails }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className=" rounded-lg shadow-lg w-3/4 md:w-1/2"
            >
                <div className='edit-container'>
                    <div className="flex justify-between items-center edit-exam-header">
                        <h2>Exam Section</h2>
                        <motion.button
                            whileTap={{ scale: 1.1 }}
                            className="text-red-500 text-lg"
                            onClick={onClose}
                        >
                            <img src={closeicon} alt="" />
                        </motion.button>
                    </div>
                    <div className='edit-section'>

                    </div>
                </div>
                <div>
                    <p>Modify details for {examDetails?.name}.</p>
                    {/* Add input fields for editing */}
                </div>
            </motion.div>
        </div>
    );
};

export default EditExam