import React, { useRef, useState, useEffect } from 'react';
import './CustomLearning.css';
import { motion } from "framer-motion";
import line from '../assets/Line.png'
import { authFetch } from '../scripts/AuthProvider';
import Swal from 'sweetalert2';

const NewCoursefirst = ({ onBackc, onNextc }) => {
    const fileInputRef = useRef(null);
    // State to store uploaded image files (you may limit to one image or multiple)
    const [files, setFiles] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        faculty: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);

    // No need to load authors - using logged in user

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

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

    // Create module via API
    const createModule = async () => {
        if (!formData.name || !formData.description) {
            Swal.fire({
                title: 'Error!',
                text: 'Please fill all required fields.',
                icon: 'error',
                background: "#181817",
                color: "#fff"
            });
            return false;
        }

        if (files.length === 0) {
            Swal.fire({
                title: 'Error!',
                text: 'Please upload an image for the module.',
                icon: 'error',
                background: "#181817",
                color: "#fff"
            });
            return false;
        }

        try {
            setLoading(true);
            
            // Debug logging
            console.log('Creating module with data:', {
                name: formData.name,
                description: formData.description,
                imageFile: files[0]?.name,
                accessToken: localStorage.getItem('access') ? 'Present' : 'Missing'
            });
            
            const moduleData = new FormData();
            moduleData.append('name', formData.name);
            moduleData.append('desc', formData.description);
            moduleData.append('image', files[0]);

            // Use authFetch for proper error handling and token management
            console.log('Making API request to:', '/learning/custom-modules/');
            let response = await authFetch('/learning/custom-modules/', {
                method: 'POST',
                body: moduleData
            });

            console.log('API response status:', response.status);
            console.log('API response ok:', response.ok);

            if (response.ok) {
                const result = await response.json();
                console.log('Module created successfully:', result);
                localStorage.setItem('currentModuleId', result.module_id);
                localStorage.setItem('currentModuleName', formData.name);
                
                Swal.fire({
                    title: 'Success!',
                    text: 'Module created successfully!',
                    icon: 'success',
        iconColor: "#A294F9", // Set the icon color to purple

                    background: "#181817",
                    color: "#fff"
                });
                
                return true;
            } else {
                const errorText = await response.text();
                console.error('Response status:', response.status);
                console.error('Response text:', errorText);
                throw new Error(errorText || 'Failed to create module');
            }
        } catch (error) {
            console.error('Error creating module:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            // Provide more specific error messages
            let errorMessage = 'Failed to create module. Please try again.';
            
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection and try again.';
            } else if (error.message.includes('401')) {
                errorMessage = 'Authentication error: Please log in again.';
            } else if (error.message.includes('403')) {
                errorMessage = 'Permission denied: You may not have permission to create modules.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server error: Please try again later or contact support.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            Swal.fire({
                title: 'Error!',
                text: errorMessage,
                icon: 'error',
                background: "#181817",
                color: "#fff"
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Handle next button click
    const handleNext = async () => {
        const success = await createModule();
        if (success) {
            onNextc();
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
                    <h4>Module Name: <span style={{color: 'red'}}>*</span></h4>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter module name..."
                        className="w-full sm:w-auto"
                        required
                    />
                </div>
                <div className='create-course'>
                    <h4>Faculty Name:</h4>
                    <input
                        type="text"
                        name="faculty"
                        value={formData.faculty}
                        onChange={handleInputChange}
                        placeholder="Enter faculty name (optional)..."
                        className="w-full sm:w-auto"
                    />
                </div>
                <img src={line} alt="line" className='w-full h-0.5' />
                <div className='create-course'>
                    <h4>Module Description: <span style={{color: 'red'}}>*</span></h4>
                    <textarea 
                        name="description" 
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder='Enter module description...' 
                        cols={55} 
                        rows={5}
                        required
                    ></textarea>
                </div>
                <div className='create-course'>
                    <h4>Upload Image: <span style={{color: 'red'}}>*</span></h4>
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
                        <button 
                            className='next-btn' 
                            onClick={handleNext}
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    )
}

export default NewCoursefirst