import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';  // Import SweetAlert2
import './NewQCreation.css';
import { authFetch } from '../scripts/AuthProvider';

const NewMcq = ({ setActiveComponent, onSave, onCancel }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [options, setOptions] = useState([{ text: '', file: null, isCorrect: false }]);
    const [questionText, setQuestionText] = useState('');


    const handleChange = e => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                // Check authentication first
                const accessToken = localStorage.getItem('access');
                console.log('Fetching categories with token:', !!accessToken);
                
                const response = await authFetch('/admin/sections/', { method: 'GET' }); // adjust endpoint if needed
                console.log('Categories response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Categories data:', data);
                    // The backend now returns categories with id, name, and category fields
                    const fetchedCategories = data.map(category => ({
                        id: category.id,
                        name: category.name,
                    }));
                    setCategories(fetchedCategories);
                } else {
                    console.error('Failed to fetch categories:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    const handleOptionChange = (index, field, value) => {
        const updatedOptions = [...options];
        updatedOptions[index][field] = value;
        setOptions(updatedOptions);
    };

    const handleDeleteOption = (index) => {
        const updatedOptions = options.filter((_, i) => i !== index);
        setOptions(updatedOptions);
    };

    const addOption = () => {
        setOptions([...options, { text: '', file: null, isCorrect: false }]);
    };

    const handleOptionFileChange = (index, e) => {
        const file = e.target.files?.[0];
        const updatedOptions = [...options];
        updatedOptions[index].file = file;
        setOptions(updatedOptions);
    };

    const handleCorrectAnswer = (index) => {
        const updatedOptions = options.map((option, i) => ({
            ...option,
            isCorrect: i === index ? !option.isCorrect : option.isCorrect,
        }));
        setOptions(updatedOptions);
    };

    const addCategory = async () => {
        const { value: categoryName } = await Swal.fire({
            title: 'Enter new category',
            input: 'text',
            inputPlaceholder: 'Enter new category name',
            inputAttributes: {
                required: true
            },
            showCancelButton: true,
            confirmButtonText: 'Add Category',
            cancelButtonText: 'Cancel',
            background: "#181817",
            color: "#fff",
            preConfirm: (name) => {
                if (!name || categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
                    Swal.showValidationMessage('Please enter a valid and unique category name');
                    return false;
                }
                return name;
            }
        });

        if (!categoryName) return; // User cancelled or validation failed

        try {
            // POST new category to backend - adjust endpoint and payload as per your API
            // Check if user is authenticated
            const accessToken = localStorage.getItem('access');
            console.log('Access token exists:', !!accessToken);
            
            console.log('Sending request with data:', { title: categoryName });
            // Temporarily use simple endpoint for testing
            const response = await authFetch('/admin/simple-category/', {
                method: 'POST',
                body: JSON.stringify({ title: categoryName })
            });
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.log('Error data:', errorData);
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to add category',
                    text: errorData.error || errorData.message || 'Please try again later.',
                    background: "#181817",
                    color: "#fff",
                });
                return;
            }

            const newCategory = await response.json();
            // Assuming backend returns something like { group_id: 123, title: 'CategoryName' }
            const categoryObj = {
                id: newCategory.group_id || newCategory.id,
                name: newCategory.title || newCategory.name || categoryName
            };

            setCategories(prev => [...prev, categoryObj]);
            setSelectedCategory(categoryObj.id);

            Swal.fire({
                icon: 'success',
        iconColor: "#A294F9", // Set the icon color to purple
                title: 'Category added',
                background: "#181817",
                color: "#fff",
            });
            
            // Don't reload the entire page, just refresh categories
            // window.location.reload();

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Network Error',
                text: 'Could not add category. Please try again.',
                background: "#181817",
                color: "#fff",
            });
        }
    };


    const handleSave = async () => {
        // Validate inputs
        if (
            !selectedCategory ||
            !questionText.trim() ||
            !options.every(option => option.text.trim()) ||
            !options.some(option => option.isCorrect)
        ) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete Form',
                text: 'Please fill in all the required fields and mark a correct answer.',
                background: "#181817",
                color: "#fff",
            });
            return;
        }

        try {
            // Prepare form data for file upload (if question image or option files present)
            const formData = new FormData();

            // Add question data
            formData.append('question', questionText);
            formData.append('category', selectedCategory);

            // Add question image if present
            if (file) formData.append('questionImage', file);

            // Prepare options data (text, correct, files)
            options.forEach((option, index) => {
                formData.append(`options[${index}][text]`, option.text);
                formData.append(`options[${index}][isCorrect]`, option.isCorrect);
                if (option.file) formData.append(`options[${index}][file]`, option.file);
            });

            // Use the correct endpoint for creating MCQ questions
            const response = await authFetch('/admin/mcq/', {
                method: 'POST',
                body: JSON.stringify({
                    question: questionText,
                    category: selectedCategory,
                    options: options.map(option => ({
                        text: option.text,
                        isCorrect: option.isCorrect
                    }))
                }),
            });

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Saved Successfully!',
        iconColor: "#A294F9", // Set the icon color to purple
                    text: 'Your MCQ has been saved.',
                    background: "#181817",
                    color: "#fff",
                }).then(() => {
                    // Don't reload the entire page
                    // window.location.reload();
                    onSave(); // callback after successful save
                });
            } else {
                const errorData = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Save Failed',
                    text: errorData.message || 'An error occurred while saving.',
                    background: "#181817",
                    color: "#fff",
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: error.message || 'An unexpected error occurred.',
                background: "#181817",
                color: "#fff",
            });
        }
    };



    const handleCancel = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You will lose all unsaved data.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, discard',
            cancelButtonText: 'go back',
            background: "#181817",
            color: "#fff",
        }).then((result) => {
            if (result.isConfirmed) {
                onCancel();
            }
        });
    };

    return (
        <div className='newmcq-container justify-center flex flex-wrap'>
            <div className='newmcq-wrapper'>
                <h1>New Mcq</h1>

                <h3>Question :</h3>
                <textarea
                    name="question"
                    id="question"
                    required
                    placeholder="Enter your question here"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                ></textarea>
                <p>Or</p>
                <h4>Upload image :
                    <input type="file" accept="image/*" onChange={handleChange} />
                    {file && <p>Picked: {file.name}</p>}
                    {preview && <img src={preview} alt="preview" style={{ maxWidth: 200 }} />}
                </h4>

                <h3>Category :</h3>
                <div className="category-container">
                    <select
                        name="category"
                        id="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        required
                    >
                        <option value="" disabled>Select a category</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                        ))}
                    </select>

                    <button onClick={addCategory}>+ Add Category</button>
                </div>

                <h3>Options :</h3>
                <div className="options-container">
                    {options.map((option, index) => (
                        <div key={index} className="option-column">
                            <textarea
                                className="option-textarea"
                                placeholder={`Option ${index + 1}…`}
                                value={option.text}
                                onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                required
                            />
                            <p>Or</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleOptionFileChange(index, e)}
                            />
                            {option.file && <p>Picked: {option.file.name}</p>}

                            {/* Correct Answer Checkbox */}
                            <div>
                                <input
                                    type="checkbox"
                                    checked={option.isCorrect}
                                    onChange={() => handleCorrectAnswer(index)}
                                    className='correct-answer-checkbox'
                                />
                                Correct Answer
                            </div>

                            {/* Delete Option */}
                            <button onClick={() => handleDeleteOption(index)}>Delete Option</button>
                        </div>
                    ))}
                </div>
                <button onClick={addOption} className='add-option-btn'>Add Option</button>

                {/* Save and Cancel Buttons */}
                <div className="save-cancel-container">
                    <button onClick={handleSave} className='save-btn-m'>Save</button>
                    <button onClick={handleCancel} className='cancel-btn-m'>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default NewMcq;
