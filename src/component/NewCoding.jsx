import React, { useEffect, useState } from 'react';
import './NewQCreation.css';
import ReactQuill from 'react-quill';
import Swal from 'sweetalert2';

const NewCoding = ({ setActiveComponent, onSave, onBack }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState("");
    const [editorContent, setEditorContent] = useState("");
    const [testCases, setTestCases] = useState([{ input: "", output: "" }]);
    const [question, setQuestion] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [statement, setStatement] = useState("");

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

    const handleSave = () => {
        if (!question || !shortDescription || !statement || testCases.some(test => !test.input || !test.output)) {
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
                text: 'Your coding question has been saved.',
                background: "#181817",
                color: "#fff",
            }).then(() => {
                onSave();
            });
        }
    };

    const handleCancel = () => {
        Swal.fire({
            icon: 'warning',
            title: 'Are you sure?',
            text: 'You will lose all the unsaved data!',
            showCancelButton: true,
            confirmButtonText: 'Yes, cancel',
            cancelButtonText: 'No, stay',
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
                    name="Sample testcase"
                    placeholder="Enter sample testcase"
                    required
                />

                <h3>Sample Testcase Output: </h3>
                <textarea
                    name="Sample testcase output"
                    placeholder="Enter sample output"
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
                <div className="action-buttons">
                    <button type="button" onClick={handleSave} className='save-btn'>Save</button>
                    <button type="button" onClick={handleCancel} className='cancel-btn'>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default NewCoding;
