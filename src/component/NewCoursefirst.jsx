import React, { useRef, useState } from 'react';
import './CustomLearning.css';
import { motion } from "framer-motion";
import line from '../assets/Line.png'

const NewCoursefirst = ({ onBackc, onNextc }) => {
    const fileInputRef = useRef(null);
    // State to store uploaded image files (you may limit to one image or multiple)
    const [files, setFiles] = useState([]);

    // Handle file selection
    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        setFiles(selectedFiles);
    };

    // Open file selection dialog
    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };
    return (
        <div className='Custom-container'>
            <div className='new-c-top'>
                <h1>Create New Module</h1>
                <img src={line} alt="line" className='w-full h-0.5' />
            </div>
            <div className='c-input-containers'>
                <div className='create-course'>
                    <h4>Module Name:</h4>
                    <input
                        type="text"
                        placeholder="Search students..."
                        className="w-full sm:w-auto"
                    />
                </div>
                <div className='create-course'>
                    <h4>Faculty Name:</h4>
                    <input
                        type="text"
                        placeholder="Search students..."
                        className="w-full sm:w-auto"
                    />
                </div>
                <img src={line} alt="line" className='w-full h-0.5' />
                <div className='create-course'>
                    <h4>Module Description:</h4>
                    <textarea name="description" id="description" placeholder='Enter Description' cols={55} rows={5}></textarea>
                </div>
                <div className='create-course'>
                    <h4>Upload Image:</h4>
                    <div
                        style={{
                            color: files.length ? '#fff' : '#b7aacd',
                        }}
                        className='upload-pic'>
                        {files.length === 0
                            ? 'Upload here'
                            : files.length === 1
                                ? files[0].name
                                : `${files.map((f) => f.name).join(', ')} (${files.length} files)`}
                    </div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />

                    {/* Upload button */}
                    <motion.button
                        type="button"
                        onClick={handleUploadClick}
                        className='upload-btn'
                        whileTap={{ scale: 1.2 }}
                    >
                        Upload
                    </motion.button>
                </div>
                <img src={line} alt="line" className='w-full h-0.5' />
                <div className='flex justify-end'>
                    <div className='flex items-center gap-8 bottom-course'>
                        <button className='back-btn-create' onClick={onBackc}>Back</button>
                        <p>1/3</p>
                        <button className='next-btn' onClick={onNextc}>Next</button>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default NewCoursefirst