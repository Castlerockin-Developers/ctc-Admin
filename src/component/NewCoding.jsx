import React, { useEffect, useState } from 'react';
import './NewQCreation.css';
import ReactQuill from 'react-quill';
import Swal from 'sweetalert2';
import { authFetch } from '../scripts/AuthProvider';

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

    const handleSave = async () => {
        // Validate inputs
        if (
            !question.trim() ||
            !shortDescription.trim() ||
            !statement.trim() ||
            !sampleInput.trim() ||
            !sampleOutput.trim() ||
            testCases.some(test => !test.input.trim() || !test.output.trim())
        ) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete Form',
                text: 'Please fill in all the required fields including sample input/output and test cases.',
                background: "#181817",
                color: "#fff",
            });
            return;
        }

        try {
            // Prepare data for backend
            const codingData = {
                question: question,
                shortDescription: shortDescription,
                statement: statement,
                sampleInput: sampleInput,
                sampleOutput: sampleOutput,
                testCases: testCases,
                score: score
            };

            console.log('Sending coding data:', codingData);

            // Send to backend
            const response = await authFetch('/admin/coding/', {
                method: 'POST',
                body: JSON.stringify(codingData),
            });

            if (response.ok) {
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
                <p>Or</p>
                <h4>Upload image : &nbsp; <input
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                /></h4>

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
                        value={shortDescription}
                        onChange={setShortDescription}
                        placeholder="Write your short description here"
                        className="custom-quill"
                    />
                </div>

                <h3>Statement :</h3>
                <div className='custom-quill'>
                    <ReactQuill
                        value={statement}
                        onChange={setStatement}
                        placeholder="Write your rich-text statement here"
                        className="custom-quill"
                    />
                </div>

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
                    <button onClick={handleSave} className='save-btn-m'>Save</button>
                    <button onClick={handleCancel} className='cancel-btn-m'>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default NewCoding;
