import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';  // Import SweetAlert2
import './NewQCreation.css';

const NewMcq = ({ setActiveComponent, onSave, onCancel }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [categories, setCategories] = useState([
        "Maths", "Science", "History", "Geography", "English", "General Knowledge", "Other"
    ]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [options, setOptions] = useState([{ text: '', file: null, isCorrect: false }]);

    const handleChange = e => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

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

    const addCategory = () => {
        Swal.fire({
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
            preConfirm: (category) => {
                if (category && !categories.includes(category)) {
                    setCategories([...categories, category]);
                    setSelectedCategory(category);
                    return category;
                } else {
                    Swal.showValidationMessage('Please enter a valid category');
                }
            }
        });
    };

    const handleSave = () => {
        // Form validation before saving
        if (!selectedCategory || !options.every(option => option.text)) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete Form',
                text: 'Please fill in all the required fields.',
                background: "#181817",
                color: "#fff",
            });
        } else {
            Swal.fire({
                icon: 'success',
                title: 'Saved Successfully!',
                text: 'Your MCQ has been saved.',
                background: "#181817",
                color: "#fff",
            }).then(() => {
                onSave();
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
                        {categories.map((category, index) => (
                            <option key={index} value={category}>{category}</option>
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
