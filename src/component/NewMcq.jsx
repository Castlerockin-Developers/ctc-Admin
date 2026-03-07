import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPlus, faTrash, faCheck, faImage } from '@fortawesome/free-solid-svg-icons';
import { log, error as logError } from '../utils/logger';
import Swal from 'sweetalert2';
import { authFetch } from '../scripts/AuthProvider';

const cardClass = 'rounded-xl border border-[#5a5a5a] bg-[#353535] overflow-hidden';
const inputClass = 'w-full rounded-lg border border-[#5a5a5a] bg-[#404040] px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#A294F9] focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5';
const btnPrimary = 'rounded-lg bg-[#A294F9] hover:bg-[#8E7AE6] text-white px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer';
const btnSecondary = 'rounded-lg border border-[#5a5a5a] bg-[#404040] text-gray-200 hover:bg-[#4a4a4a] px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer';
const btnDanger = 'rounded-lg bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 text-xs font-medium cursor-pointer';

const NewMcq = ({ setActiveComponent, onSave, onCancel }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [options, setOptions] = useState([{ text: '', file: null, isCorrect: false }]);
    const [questionText, setQuestionText] = useState('');

    const handleChange = (e) => {
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
                const accessToken = localStorage.getItem('access');
                log('Fetching categories with token:', !!accessToken);
                const response = await authFetch('/admin/sections/', { method: 'GET' });
                log('Categories response status:', response.status);
                if (response.ok) {
                    const data = await response.json();
                    log('Categories data:', data);
                    const fetchedCategories = data.map((category) => ({
                        id: category.id,
                        name: category.name,
                    }));
                    setCategories(fetchedCategories);
                } else {
                    logError('Failed to fetch categories:', response.statusText);
                }
            } catch (error) {
                logError('Error fetching categories:', error);
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
        const f = e.target.files?.[0];
        const updatedOptions = [...options];
        updatedOptions[index].file = f;
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
            inputAttributes: { required: true },
            showCancelButton: true,
            confirmButtonText: 'Add Category',
            cancelButtonText: 'Cancel',
            background: '#181817',
            color: '#fff',
            preConfirm: (name) => {
                if (!name || categories.some((cat) => cat.name.toLowerCase() === name.toLowerCase())) {
                    Swal.showValidationMessage('Please enter a valid and unique category name');
                    return false;
                }
                return name;
            },
        });
        if (!categoryName) return;
        try {
            const response = await authFetch('/admin/simple-category/', {
                method: 'POST',
                body: JSON.stringify({ title: categoryName }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to add category',
                    text: errorData.error || errorData.message || 'Please try again later.',
                    background: '#181817',
                    color: '#fff',
                });
                return;
            }
            const newCategory = await response.json();
            const categoryObj = {
                id: newCategory.group_id || newCategory.id,
                name: newCategory.title || newCategory.name || categoryName,
            };
            setCategories((prev) => [...prev, categoryObj]);
            setSelectedCategory(categoryObj.id);
            Swal.fire({
                icon: 'success',
                iconColor: '#A294F9',
                title: 'Category added',
                background: '#181817',
                color: '#fff',
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Network Error',
                text: 'Could not add category. Please try again.',
                background: '#181817',
                color: '#fff',
            });
        }
    };

    const handleSave = async () => {
        if (
            !selectedCategory ||
            (!questionText.trim() && !file) ||
            !options.every((option) => option.text.trim() || option.file) ||
            !options.some((option) => option.isCorrect)
        ) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete Form',
                text: 'Please fill in all required fields and mark one correct answer.',
                background: '#181817',
                color: '#fff',
            });
            return;
        }
        try {
            const hasFiles = file || options.some((option) => option.file);
            let response;
            if (hasFiles) {
                const formData = new FormData();
                formData.append('question', questionText);
                formData.append('category', selectedCategory);
                if (file) formData.append('questionImage', file);
                options.forEach((option, index) => {
                    formData.append(`options[${index}][text]`, option.text);
                    formData.append(`options[${index}][isCorrect]`, option.isCorrect);
                    if (option.file) formData.append(`options[${index}][file]`, option.file);
                });
                response = await authFetch('/admin/mcq/', { method: 'POST', body: formData });
            } else {
                response = await authFetch('/admin/mcq/', {
                    method: 'POST',
                    body: JSON.stringify({
                        question: questionText,
                        category: selectedCategory,
                        options: options.map((option) => ({ text: option.text, isCorrect: option.isCorrect })),
                    }),
                });
            }
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Saved Successfully!',
                    iconColor: '#A294F9',
                    text: 'Your MCQ has been saved.',
                    background: '#181817',
                    color: '#fff',
                }).then(() => onSave());
            } else {
                const errorData = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Save Failed',
                    text: errorData.error || errorData.message || 'An error occurred while saving.',
                    background: '#181817',
                    color: '#fff',
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: error.message || 'An unexpected error occurred.',
                background: '#181817',
                color: '#fff',
            });
        }
    };

    const handleCancel = () => {
        Swal.fire({
            title: 'Discard changes?',
            text: 'You will lose all unsaved data.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, discard',
            cancelButtonText: 'Go back',
            background: '#181817',
            color: '#fff',
        }).then((result) => {
            if (result.isConfirmed) onCancel();
        });
    };

    return (
        <div className="flex flex-col h-full min-h-0 bg-[#282828] rounded-lg overflow-hidden">
            {/* Header with Back */}
            <div className="shrink-0 flex items-center justify-between gap-4 px-4 py-3 border-b border-[#5a5a5a] bg-[#313131]">
                <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                    <span>Back</span>
                </button>
                <h1 className="text-xl font-semibold text-white">Create new MCQ</h1>
                <div className="w-16" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Question */}
                    <div className={cardClass}>
                        <div className="px-4 py-3 border-b border-[#5a5a5a] bg-[#313131]">
                            <h2 className="text-base font-semibold text-white">Question</h2>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label htmlFor="mcq-question" className={labelClass}>Question text</label>
                                <textarea
                                    id="mcq-question"
                                    required
                                    placeholder="Enter your question here"
                                    value={questionText}
                                    onChange={(e) => setQuestionText(e.target.value)}
                                    className={`${inputClass} min-h-[120px] resize-y`}
                                />
                            </div>
                            <div className="text-center text-sm text-gray-400">— or —</div>
                            <div>
                                <label className={labelClass}>
                                    <FontAwesomeIcon icon={faImage} className="mr-2 text-[#A294F9]" />
                                    Upload question image
                                </label>
                                <div className="flex flex-wrap items-center gap-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleChange}
                                        className="text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#A294F9] file:text-white file:cursor-pointer cursor-pointer"
                                    />
                                    {file && <span className="text-sm text-gray-400">Selected: {file.name}</span>}
                                </div>
                                {preview && (
                                    <img src={preview} alt="Preview" className="mt-2 rounded-lg border border-[#5a5a5a] max-w-[200px] h-auto" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Category */}
                    <div className={cardClass}>
                        <div className="px-4 py-3 border-b border-[#5a5a5a] bg-[#313131]">
                            <h2 className="text-base font-semibold text-white">Category</h2>
                        </div>
                        <div className="p-4 flex flex-wrap items-center gap-3">
                            <select
                                id="mcq-category"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                required
                                className={`${inputClass} max-w-xs`}
                            >
                                <option value="" disabled>Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={addCategory}
                                className={`${btnSecondary} flex items-center gap-2`}
                            >
                                <FontAwesomeIcon icon={faPlus} /> Add category
                            </button>
                        </div>
                    </div>

                    {/* Options */}
                    <div className={cardClass}>
                        <div className="px-4 py-3 border-b border-[#5a5a5a] bg-[#313131] flex items-center justify-between">
                            <h2 className="text-base font-semibold text-white">Options</h2>
                            <button type="button" onClick={addOption} className={`${btnSecondary} flex items-center gap-2 text-sm`}>
                                <FontAwesomeIcon icon={faPlus} /> Add option
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {options.map((option, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg border border-[#5a5a5a] bg-[#404040] p-4 space-y-3"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-medium text-gray-300">Option {index + 1}</span>
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={option.isCorrect}
                                                    onChange={() => handleCorrectAnswer(index)}
                                                    className="w-4 h-4 rounded border-2 border-[#A294F9] bg-transparent text-[#A294F9] focus:ring-[#A294F9] cursor-pointer"
                                                />
                                                <FontAwesomeIcon icon={faCheck} className="text-green-500 w-3.5 h-3.5" />
                                                Correct
                                            </label>
                                            <button type="button" onClick={() => handleDeleteOption(index)} className={btnDanger}>
                                                <FontAwesomeIcon icon={faTrash} className="mr-1" /> Remove
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        placeholder={`Option ${index + 1} text…`}
                                        value={option.text}
                                        onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                                        className={`${inputClass} min-h-[80px] resize-y`}
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">or image:</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleOptionFileChange(index, e)}
                                            className="text-xs text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-[#5a5a5a] file:text-white file:cursor-pointer cursor-pointer"
                                        />
                                        {option.file && <span className="text-xs text-gray-400">{option.file.name}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button type="button" onClick={handleSave} className={btnPrimary}>
                            Save MCQ
                        </button>
                        <button type="button" onClick={handleCancel} className={btnSecondary}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewMcq;
