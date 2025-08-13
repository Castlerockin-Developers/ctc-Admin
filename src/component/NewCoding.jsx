import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import './NewQCreation.css';
import ReactQuill from 'react-quill';
import Swal from 'sweetalert2';
import { authFetch } from '../scripts/AuthProvider';
import 'react-quill/dist/quill.snow.css';

const NewCoding = ({ setActiveComponent, onSave, onBack }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [editorContent, setEditorContent] = useState("");
    const [testCases, setTestCases] = useState([{ input: "", output: "" }]);
    const [question, setQuestion] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [statement, setStatement] = useState("");
    const [sampleInput, setSampleInput] = useState("");
    const [sampleOutput, setSampleOutput] = useState("");
    const [score, setScore] = useState(10);
    const [isSaving, setIsSaving] = useState(false);
    
    // Refs for ReactQuill editors
    const shortDescriptionRef = useRef(null);
    const statementRef = useRef(null);

    // Test if image URL is accessible
    const testImageUrl = useCallback(async (url) => {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.error('Error testing image URL:', error);
            return false;
        }
    }, []);

    // Custom image upload handler for ReactQuill
    const imageUploadHandler = useCallback(async (file) => {
        try {
            console.log('Starting image upload for file:', file.name, 'Size:', file.size, 'Type:', file.type);
            
            // Show loading
            Swal.fire({
                title: 'Uploading image...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Create FormData for file upload
            const formData = new FormData();
            formData.append('image', file);
            
            console.log('FormData created, calling authFetch...');

            // Upload image to backend
            const response = await authFetch('/admin/upload-image/', {
                method: 'POST',
                body: formData,
                headers: {
                    // Don't set Content-Type for FormData, let browser set it
                }
            });

            console.log('Response received:', response.status, response.statusText);

            if (response.ok) {
                const data = await response.json();
                console.log('Upload successful, image URL:', data.image_url);
                Swal.close();
                return data.image_url;
            } else {
                const errorData = await response.json();
                console.error('Upload failed with status:', response.status, 'Error:', errorData);
                Swal.fire({
                    icon: 'error',
                    title: 'Upload Failed',
                    text: errorData.error || 'Failed to upload image',
                    background: "#181817",
                    color: "#fff",
                });
                return null;
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            console.error('Error details:', error.message);
            // Fallback: create a local blob URL for immediate use
            const blobUrl = URL.createObjectURL(file);
            Swal.fire({
                icon: 'warning',
                title: 'Upload Failed',
                text: 'Image upload service unavailable. Using local preview (image will not be saved permanently).',
                background: "#181817",
                color: "#fff",
            });
            return blobUrl;
        }
    }, []);

    // Create image handler function
    const createImageHandler = useCallback((editorRef) => {
        return () => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();

            input.onchange = async () => {
                const file = input.files[0];
                if (file && editorRef.current) {
                    const imageUrl = await imageUploadHandler(file);
                    if (imageUrl) {
                        console.log('Inserting image with URL:', imageUrl);
                        
                        // Test if the image URL is accessible
                        const isAccessible = await testImageUrl(imageUrl);
                        console.log('Image URL accessible:', isAccessible);
                        
                        const quill = editorRef.current.getEditor();
                        const range = quill.getSelection();
                        
                        // If no selection, insert at the end
                        const insertIndex = range ? range.index : quill.getLength();
                        console.log('Inserting at index:', insertIndex);
                        
                        // Try different approaches for image insertion
                        try {
                            // Method 1: Use insertEmbed
                            quill.insertEmbed(insertIndex, 'image', imageUrl);
                            
                            // Method 2: If that doesn't work, try inserting as HTML
                            setTimeout(() => {
                                const content = quill.getContents();
                                console.log('Content after insertEmbed:', content);
                                
                                // Check if image was actually inserted
                                const hasImage = content.ops.some(op => op.insert && op.insert.image);
                                if (!hasImage) {
                                    console.log('Image not found in content, trying HTML insertion...');
                                    // Insert as HTML
                                    const html = `<img src="${imageUrl}" alt="uploaded image" style="max-width: 100%; height: auto;" />`;
                                    quill.clipboard.dangerouslyPasteHTML(insertIndex, html);
                                }
                            }, 100);
                            
                            // Move cursor after the image and add a newline
                            quill.setSelection(insertIndex + 1);
                            quill.insertText(insertIndex + 1, '\n');
                            
                            // Focus the editor to show the image
                            quill.focus();
                            
                            console.log('Image insertion completed');
                            console.log('Current editor content:', quill.getContents());
                            console.log('Current editor HTML:', quill.root.innerHTML);
                        } catch (error) {
                            console.error('Error inserting image:', error);
                        }
                    }
                }
            };
        };
    }, [imageUploadHandler, testImageUrl]);

    // Memoize modules configuration to prevent ReactQuill from disappearing
    const shortDescriptionModules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['link', 'image'],
                ['clean']
            ],
            handlers: {
                image: createImageHandler(shortDescriptionRef)
            }
        }
    }), [createImageHandler]);

    const statementModules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['link', 'image'],
                ['clean']
            ],
            handlers: {
                image: createImageHandler(statementRef)
            }
        }
    }), [createImageHandler]);

    // ReactQuill formats configuration - memoized
    const formats = useMemo(() => [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'color', 'background',
        'align',
        'link', 'image'
    ], []);

    const handleChange = e => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    const handleRemoveImage = () => {
        setFile(null);
        setPreview("");
    };

    const handleEditorChange = (value) => {
        setEditorContent(value);
    };

    // Function to strip HTML tags from ReactQuill content
    const stripHtml = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const handleSave = async () => {
        // Validate inputs
        if (
            !question.trim() ||
            !shortDescription.trim() ||
            !statement.trim() ||
            !sampleInput.trim() ||
            !sampleOutput.trim() ||
            testCases.length === 0 ||
            testCases.some(test => !test.input.trim() || !test.output.trim())
        ) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete Form',
                text: 'Please fill in all the required fields including question, description, statement, sample input/output, and at least one test case.',
                background: "#181817",
                color: "#fff",
            });
            return;
        }

        setIsSaving(true);
        try {
            // Filter out empty test cases and prepare data for backend
            const validTestCases = testCases.filter(test => test.input.trim() && test.output.trim());
            
            if (validTestCases.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'No Valid Test Cases',
                    text: 'Please add at least one test case with both input and output.',
                    background: "#181817",
                    color: "#fff",
                });
                return;
            }
            
            const codingData = {
                question: question,
                shortDescription: stripHtml(shortDescription),
                statement: stripHtml(statement),
                sampleInput: sampleInput,
                sampleOutput: sampleOutput,
                testCases: validTestCases,
                score: score
            };

            console.log('Sending coding data:', codingData);
            console.log('Original shortDescription:', shortDescription);
            console.log('Original statement:', statement);
            console.log('Stripped shortDescription:', stripHtml(shortDescription));
            console.log('Stripped statement:', stripHtml(statement));
            console.log('Original test cases:', testCases);
            console.log('Valid test cases:', validTestCases);

            // Send to backend
            const response = await authFetch('/admin/coding/', {
                method: 'POST',
                body: JSON.stringify(codingData),
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const responseData = await response.json();
                console.log('Success response:', responseData);
                Swal.fire({
                    icon: 'success',
                    title: 'Saved Successfully!',
        iconColor: "#A294F9", // Set the icon color to purple
                    text: 'Your coding question has been saved.',
                    background: "#181817",
                    color: "#fff",
                }).then(() => {
                    onSave();
                });
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                Swal.fire({
                    icon: 'error',
                    title: 'Save Failed',
                    text: errorData.error || errorData.message || 'An error occurred while saving.',
                    background: "#181817",
                    color: "#fff",
                });
            }
        } catch (error) {
            console.error('Error saving coding question:', error);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: error.message || 'An unexpected error occurred.',
                background: "#181817",
                color: "#fff",
            });
        } finally {
            setIsSaving(false);
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
                onBack();
            }
        });
    };

    const handleAddTestCase = () => {
        setTestCases([...testCases, { input: "", output: "" }]);
    };

    const handleRemoveTestCase = (index) => {
        const updatedTestCases = testCases.filter((_, i) => i !== index);
        setTestCases(updatedTestCases);
    };

    const handleTestCaseChange = (index, field, value) => {
        const updatedTestCases = [...testCases];
        updatedTestCases[index][field] = value;
        setTestCases(updatedTestCases);
    };

    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <div className='newmcq-container justify-center flex flex-wrap'>
            <div className='newmcq-wrapper'>
                <h1>New Coding</h1>

                <h3>Question :</h3>
                <input
                    className='coding-question'
                    name="question"
                    id="question"
                    required
                    placeholder="Enter your question here"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                />

                {file && (
                    <>
                        <p>Picked: {file.name}</p>
                        <img src={preview} alt="preview" style={{ maxWidth: 200 }} />
                        <button onClick={handleRemoveImage}>Remove Image</button>
                    </>
                )}

                <h3>Short Description :</h3>
                <div className="custom-quill">
                    <ReactQuill
                        ref={shortDescriptionRef}
                        value={shortDescription}
                        onChange={setShortDescription}
                        placeholder="Write your short description here"
                        className="custom-quill"
                        modules={shortDescriptionModules}
                        formats={formats}
                    />
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    💡 Tip: Click the image icon in the toolbar to upload images directly into the description
                </p>

                <h3>Statement :</h3>
                <div className='custom-quill'>
                    <ReactQuill
                        ref={statementRef}
                        value={statement}
                        onChange={setStatement}
                        placeholder="Write your rich-text statement here"
                        className="custom-quill"
                        modules={statementModules}
                        formats={formats}
                    />
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    💡 Tip: Click the image icon in the toolbar to upload images directly into the statement
                </p>

                <h3>Sample Testcase: </h3>
                <textarea
                    name="sampleInput"
                    placeholder="Enter sample testcase"
                    value={sampleInput}
                    onChange={(e) => setSampleInput(e.target.value)}
                    required
                />

                <h3>Sample Testcase Output: </h3>
                <textarea
                    name="sampleOutput"
                    placeholder="Enter sample output"
                    value={sampleOutput}
                    onChange={(e) => setSampleOutput(e.target.value)}
                    required
                />

                <h3>Score: </h3>
                <input
                    type="number"
                    name="score"
                    placeholder="Enter score (default: 10)"
                    value={score}
                    onChange={(e) => setScore(parseInt(e.target.value) || 10)}
                    min="1"
                    required
                />

                <h3>Testcases</h3>
                <div className='testcases-container'>
                    {testCases.map((testCase, index) => (
                        <div key={index} className="options-container">
                            <div className='testcase'>
                                <p>Input</p>
                                <textarea
                                    className="option-textarea"
                                    placeholder="Enter input here"
                                    value={testCase.input}
                                    onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                                    required
                                />
                            </div>
                            <div className='testcase'>
                                <p>Output</p>
                                <textarea
                                    className="option-textarea"
                                    placeholder="Enter output here"
                                    value={testCase.output}
                                    onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                                    required
                                />
                            </div>
                            <div className="add-remove-buttons">
                                <button type="button" onClick={handleAddTestCase} className="add-testcase-btn">Add Testcase</button>
                                <button type="button" className="delete-testcase-btn" onClick={() => handleRemoveTestCase(index)}>Delete Testcase</button>
                            </div>
                        </div>
                    ))}

                </div>
                <div className="save-cancel-container">
                    <button onClick={handleSave} className='save-btn-m' disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={handleCancel} className='cancel-btn-m' disabled={isSaving}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default NewCoding;
