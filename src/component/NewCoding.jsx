import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { log, error as logError } from '../utils/logger';
import ReactQuill from 'react-quill';
import Swal from 'sweetalert2';
import { authFetch } from '../scripts/AuthProvider';
import 'react-quill/dist/quill.snow.css';

const cardClass = 'rounded-xl border border-[#5a5a5a] bg-[#353535] overflow-hidden';
const inputClass = 'w-full rounded-lg border border-[#5a5a5a] bg-[#404040] px-3 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#A294F9] focus:border-transparent';
const labelClass = 'block text-sm font-medium text-gray-300 mb-1.5';
const btnPrimary = 'rounded-lg bg-[#A294F9] hover:bg-[#8E7AE6] text-white px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const btnSecondary = 'rounded-lg border border-[#5a5a5a] bg-[#404040] text-gray-200 hover:bg-[#4a4a4a] px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50';
const btnDanger = 'rounded-lg bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 text-xs font-medium cursor-pointer';

const NewCoding = ({ setActiveComponent, onSave, onBack }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [editorContent, setEditorContent] = useState('');
    const [testCases, setTestCases] = useState([{ input: '', output: '' }]);
    const [question, setQuestion] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [statement, setStatement] = useState('');
    const [sampleInput, setSampleInput] = useState('');
    const [sampleOutput, setSampleOutput] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const shortDescriptionRef = useRef(null);
    const statementRef = useRef(null);

    const testImageUrl = useCallback(async (url) => {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            logError('Error testing image URL:', error);
            return false;
        }
    }, []);

    const imageUploadHandler = useCallback(async (file) => {
        try {
            log('Starting image upload for file:', file.name);
            Swal.fire({
                title: 'Uploading image...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
            });
            const formData = new FormData();
            formData.append('image', file);
            const response = await authFetch('/admin/upload-image/', {
                method: 'POST',
                body: formData,
                headers: {},
            });
            if (response.ok) {
                const data = await response.json();
                log('Upload successful, image URL:', data.image_url);
                Swal.close();
                return data.image_url;
            }
            const errorData = await response.json();
            logError('Upload failed:', errorData);
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: errorData.error || 'Failed to upload image',
                background: '#181817',
                color: '#fff',
            });
            return null;
        } catch (error) {
            logError('Error uploading image:', error);
            const blobUrl = URL.createObjectURL(file);
            Swal.fire({
                icon: 'warning',
                title: 'Upload Failed',
                text: 'Using local preview (image may not be saved permanently).',
                background: '#181817',
                color: '#fff',
            });
            return blobUrl;
        }
    }, []);

    const createImageHandler = useCallback(
        (editorRef) => () => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();
            input.onchange = async () => {
                const f = input.files[0];
                if (f && editorRef.current) {
                    const imageUrl = await imageUploadHandler(f);
                    if (imageUrl) {
                        const quill = editorRef.current.getEditor();
                        const range = quill.getSelection();
                        const insertIndex = range ? range.index : quill.getLength();
                        try {
                            quill.insertEmbed(insertIndex, 'image', imageUrl);
                            setTimeout(() => {
                                const content = quill.getContents();
                                const hasImage = content.ops.some((op) => op.insert && op.insert.image);
                                if (!hasImage) {
                                    const html = `<img src="${imageUrl}" alt="uploaded" style="max-width:100%;height:auto;" />`;
                                    quill.clipboard.dangerouslyPasteHTML(insertIndex, html);
                                }
                            }, 100);
                            quill.setSelection(insertIndex + 1);
                            quill.insertText(insertIndex + 1, '\n');
                            quill.focus();
                        } catch (err) {
                            logError('Error inserting image:', err);
                        }
                    }
                }
            };
        },
        [imageUploadHandler]
    );

    const shortDescriptionModules = useMemo(
        () => ({
            toolbar: {
                container: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    [{ color: [] }, { background: [] }],
                    [{ align: [] }],
                    ['link', 'image'],
                    ['clean'],
                ],
                handlers: { image: createImageHandler(shortDescriptionRef) },
            },
        }),
        [createImageHandler]
    );

    const statementModules = useMemo(
        () => ({
            toolbar: {
                container: [
                    [{ header: [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    [{ color: [] }, { background: [] }],
                    [{ align: [] }],
                    ['link', 'image'],
                    ['clean'],
                ],
                handlers: { image: createImageHandler(statementRef) },
            },
        }),
        [createImageHandler]
    );

    const formats = useMemo(
        () => ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'color', 'background', 'align', 'link', 'image'],
        []
    );

    const handleChange = (e) => {
        if (e.target.files?.[0]) setFile(e.target.files[0]);
    };

    const handleRemoveImage = () => {
        setFile(null);
        setPreview('');
    };

    const stripHtml = (html) => {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    const handleSave = async () => {
        if (
            !question.trim() ||
            !shortDescription.trim() ||
            !statement.trim() ||
            !sampleInput.trim() ||
            !sampleOutput.trim() ||
            testCases.length === 0 ||
            testCases.some((t) => !t.input.trim() || !t.output.trim())
        ) {
            Swal.fire({
                icon: 'warning',
                title: 'Incomplete Form',
                text: 'Please fill in all required fields: question, description, statement, sample I/O, and at least one test case.',
                background: '#181817',
                color: '#fff',
            });
            return;
        }
        const validTestCases = testCases.filter((t) => t.input.trim() && t.output.trim());
        if (validTestCases.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Valid Test Cases',
                text: 'Add at least one test case with both input and output.',
                background: '#181817',
                color: '#fff',
            });
            return;
        }
        setIsSaving(true);
        try {
            const codingData = {
                question,
                shortDescription: stripHtml(shortDescription),
                statement: stripHtml(statement),
                sampleInput,
                sampleOutput,
                testCases: validTestCases,
                score: 10,
            };
            const response = await authFetch('/admin/coding/', {
                method: 'POST',
                body: JSON.stringify(codingData),
                headers: { 'Content-Type': 'application/json' },
            });
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Saved Successfully!',
                    iconColor: '#A294F9',
                    text: 'Your coding question has been saved.',
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
            logError('Error saving coding question:', error);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: error.message || 'An unexpected error occurred.',
                background: '#181817',
                color: '#fff',
            });
        } finally {
            setIsSaving(false);
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
            if (result.isConfirmed) onBack();
        });
    };

    const handleAddTestCase = () => setTestCases([...testCases, { input: '', output: '' }]);
    const handleRemoveTestCase = (index) => setTestCases(testCases.filter((_, i) => i !== index));
    const handleTestCaseChange = (index, field, value) => {
        const updated = [...testCases];
        updated[index][field] = value;
        setTestCases(updated);
    };

    useEffect(() => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <div className="flex flex-col h-full min-h-0 bg-[#282828] rounded-lg overflow-hidden">
            {/* ReactQuill dark theme: visible toolbar + editor, single card (no extra box) */}
            <style>{`
                .newcoding-quill .ql-toolbar.ql-snow { background: #313131; border: none; border-bottom: 1px solid #5a5a5a; padding: 10px 0; }
                .newcoding-quill .ql-toolbar .ql-stroke { stroke: #6b6b6b; }
                .newcoding-quill .ql-toolbar .ql-fill { fill: #9ca3af; }
                .newcoding-quill .ql-toolbar .ql-picker { color: #9ca3af; }
                .newcoding-quill .ql-toolbar button:hover .ql-stroke { stroke: #A294F9; }
                .newcoding-quill .ql-toolbar button:hover .ql-fill { fill: #A294F9; }
                .newcoding-quill .ql-container.ql-snow { border: none; background: #353535; }
                .newcoding-quill .ql-editor { min-height: 140px; color: #e5e5e5; }
                .newcoding-quill .ql-editor.ql-blank::before { color: #6b7280; }
                .newcoding-quill .ql-editor img { max-width: 100%; height: auto; border-radius: 6px; }
            `}</style>

            {/* Header */}
            <div className="shrink-0 flex items-center justify-between gap-4 px-4 py-3 border-b border-[#5a5a5a] bg-[#313131]">
                <button
                    type="button"
                    onClick={handleCancel}
                    className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                    <span>Back</span>
                </button>
                <h1 className="text-xl font-semibold text-white">Create new coding question</h1>
                <div className="w-16" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Question title */}
                    <div className={cardClass}>
                        <div className="px-4 py-3 border-b border-[#5a5a5a] bg-[#313131]">
                            <h2 className="text-base font-semibold text-white">Question title</h2>
                        </div>
                        <div className="p-4">
                            <input
                                id="coding-question"
                                required
                                placeholder="Enter question title"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                className={inputClass}
                            />
                            {file && (
                                <div className="mt-3 flex flex-wrap items-center gap-3">
                                    <span className="text-sm text-gray-400">Image: {file.name}</span>
                                    <img src={preview} alt="Preview" className="rounded-lg border border-[#5a5a5a] max-w-[180px] h-auto" />
                                    <button type="button" onClick={handleRemoveImage} className={btnDanger}>Remove image</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Short description — simple label, no extra container */}
                    <div className="space-y-2">
                        <h2 className="text-base font-medium text-white">Short description</h2>
                        <div className="newcoding-quill">
                            <ReactQuill
                                ref={shortDescriptionRef}
                                value={shortDescription}
                                onChange={setShortDescription}
                                placeholder="Write short description (supports images via toolbar)"
                                modules={shortDescriptionModules}
                                formats={formats}
                            />
                        </div>
                        <p className="text-xs text-gray-500">Use the image icon in the toolbar to upload images.</p>
                    </div>

                    {/* Statement — simple label, no extra container */}
                    <div className="space-y-2">
                        <h2 className="text-base font-medium text-white">Statement</h2>
                        <div className="newcoding-quill">
                            <ReactQuill
                                ref={statementRef}
                                value={statement}
                                onChange={setStatement}
                                placeholder="Write the problem statement (rich text and images)"
                                modules={statementModules}
                                formats={formats}
                            />
                        </div>
                        <p className="text-xs text-gray-500">Use the image icon in the toolbar to upload images.</p>
                    </div>

                    {/* Sample input / output */}
                    <div className={cardClass}>
                        <div className="px-4 py-3 border-b border-[#5a5a5a] bg-[#313131]">
                            <h2 className="text-base font-semibold text-white">Sample input & output</h2>
                        </div>
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Sample input</label>
                                <textarea
                                    placeholder="e.g. 1 2"
                                    value={sampleInput}
                                    onChange={(e) => setSampleInput(e.target.value)}
                                    required
                                    className={`${inputClass} min-h-[80px] resize-y`}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Sample output</label>
                                <textarea
                                    placeholder="e.g. 3"
                                    value={sampleOutput}
                                    onChange={(e) => setSampleOutput(e.target.value)}
                                    required
                                    className={`${inputClass} min-h-[80px] resize-y`}
                                />
                            </div>
                        </div>
                    </div>

{/* Test cases */}
                    <div className={cardClass}>
                        <div className="px-4 py-3 border-b border-[#5a5a5a] bg-[#313131] flex items-center justify-between">
                            <h2 className="text-base font-semibold text-white">Test cases</h2>
                            <button type="button" onClick={handleAddTestCase} className={`${btnSecondary} flex items-center gap-2 text-sm`}>
                                <FontAwesomeIcon icon={faPlus} /> Add test case
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {testCases.map((tc, index) => (
                                <div key={index} className="rounded-lg border border-[#5a5a5a] bg-[#404040] p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-300">Test case {index + 1}</span>
                                        <button type="button" onClick={() => handleRemoveTestCase(index)} className={btnDanger}>
                                            <FontAwesomeIcon icon={faTrash} className="mr-1" /> Remove
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>Input</label>
                                            <textarea
                                                placeholder="Input"
                                                value={tc.input}
                                                onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                                                className={`${inputClass} min-h-[70px] resize-y text-sm`}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Expected output</label>
                                            <textarea
                                                placeholder="Output"
                                                value={tc.output}
                                                onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                                                className={`${inputClass} min-h-[70px] resize-y text-sm`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button type="button" onClick={handleSave} className={btnPrimary} disabled={isSaving}>
                            {isSaving ? 'Saving...' : 'Save coding question'}
                        </button>
                        <button type="button" onClick={handleCancel} className={btnSecondary} disabled={isSaving}>
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewCoding;
