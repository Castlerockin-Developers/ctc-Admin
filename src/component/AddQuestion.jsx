import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import line from '../assets/Line.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRotateLeft, faRefresh, faFilter } from '@fortawesome/free-solid-svg-icons';
import Swal from "sweetalert2";
import { authFetch } from '../scripts/AuthProvider';
import './NewExam.css';


const AddQuestion = ({ onBack, onNexts, onCreateMCQ, onCreateCoding, isEditing = false, editExamData = null, createExamRequest = null }) => {

    const [mcqQuestions, setMcqQuestions] = useState(() => {
        const v = sessionStorage.getItem('mcqQuestions');
        return v ? JSON.parse(v) : [];
    });
    const [codingQuestions, setCodingQuestions] = useState(() => {
        const v = sessionStorage.getItem('codingQuestions');
        return v ? JSON.parse(v) : [];
    });
    const [sectionTimers, setSectionTimers] = useState(() => {
        const v = sessionStorage.getItem('sectionTimers');
        return v ? JSON.parse(v) : {};
    });

    // Get timed test information from createExamRequest
    const isOverallTimedTest = createExamRequest?.exam?.timedTest || false;

    // Populate questions from existing exam data when editing
    useEffect(() => {
        if (isEditing && editExamData) {
            console.log("AddQuestion props:", { isEditing, editExamData });
            console.log("editExamData in useEffect", editExamData);
            console.log("alloted_sections:", editExamData.alloted_sections);
            
            // Process MCQ questions from alloted_sections
            if (editExamData.alloted_sections && editExamData.alloted_sections.length > 0) {
                const mcqQuestionsFromExam = [];
                editExamData.alloted_sections.forEach((section, index) => {
                    console.log(`Processing section ${index}:`, section);
                    
                    // Check if questions are directly in the section
                    if (section.questions && section.questions.length > 0) {
                        console.log(`Section ${index} has ${section.questions.length} questions:`, section.questions);
                        section.questions.forEach(question => {
                            mcqQuestionsFromExam.push({
                                id: question.id,
                                title: question.title || question.content,
                                content: question.content,
                                type: question.type || 'mcq',
                                dataset: question.dataset,
                                group_id: section.section,
                                score: question.score || 0
                            });
                        });
                    } else {
                        console.log(`Section ${index} has no questions array, creating placeholder`);
                        // If no questions array, create a placeholder for the section
                        // This handles the case where we only have section info
                        mcqQuestionsFromExam.push({
                            id: `section_${section.id}`,
                            title: section.section_name || `Section ${section.id}`,
                            content: `Section with ${section.no_of_question || 0} questions`,
                            type: 'mcq',
                            dataset: 'exam_section',
                            group_id: section.section,
                            score: 0,
                            is_section_placeholder: true
                        });
                    }
                });
                console.log("MCQ questions from exam:", mcqQuestionsFromExam);
                setMcqQuestions(mcqQuestionsFromExam);
            } else {
                console.log("No alloted_sections found in editExamData");
            }

            // Process coding questions from selected_coding_questions
            if (editExamData.selected_coding_questions && editExamData.selected_coding_questions.length > 0) {
                const codingQuestionsFromExam = editExamData.selected_coding_questions.map(coding => ({
                    id: coding.id,
                    title: coding.question_name,
                    content: coding.statement,
                    type: 'coding',
                    score: coding.score || 0
                }));
                console.log("Coding questions from exam:", codingQuestionsFromExam);
                setCodingQuestions(codingQuestionsFromExam);
            }
        }
    }, [isEditing, editExamData]);

    // Save mcqQuestions
    useEffect(() => {
        sessionStorage.setItem('mcqQuestions', JSON.stringify(mcqQuestions));
    }, [mcqQuestions]);

    // Save codingQuestions
    useEffect(() => {
        sessionStorage.setItem('codingQuestions', JSON.stringify(codingQuestions));
    }, [codingQuestions]);

    // Save sectionTimers
    useEffect(() => {
        sessionStorage.setItem('sectionTimers', JSON.stringify(sectionTimers));
    }, [sectionTimers]);

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [sourceQuestions, setSourceQuestions] = useState([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchQuestions = async () => {
        try {
            setIsRefreshing(true);
            setIsLoading(true);
            console.log("Fetching questions...");
            const response = await authFetch('/admin/questions/', { method: 'GET' });
            if (response.ok) {
                const data = await response.json();
                console.log("Received questions data:", data);
                const questions = data.map(q => ({
                    id: q.id,
                    title: q.title,
                    content: q.content,
                    type: q.type,
                    dataset: q.dataset,
                    group_id: q.group_id
                }));
                setSourceQuestions(questions || []);
                console.log("Processed questions:", questions);
            } else {
                console.error("Failed to fetch questions:", response.statusText);
            }
        } catch (error) {
            console.error("Error fetching questions:", error);
        } finally {
            setIsRefreshing(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Popup states
    const [showCreatePopup, setShowCreatePopup] = useState(false);
    const [showImportPopup, setShowImportPopup] = useState(false);
    const [selectedQuestionType, setSelectedQuestionType] = useState(null);

    //   Import Question Bank Popup
    const [isEditingScoreCoding] = useState(false);
    const [isQuestionBankVisible, setIsQuestionBankVisible] = useState(true);
    const [selectedSectionFilter, setSelectedSectionFilter] = useState('all');


    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const truncateTitle = (title, wordLimit = 5) => {
        const words = title.split(" ");
        if (words.length > wordLimit) {
            return words.slice(0, wordLimit).join(" ") + "...";
        }
        return title;
    };

    const handleCreateClick = () => {
        setShowCreatePopup(true);
    };

    const handleImport = () => {
        setShowImportPopup(true);
    };

    const handleCloseCreatePopup = () => {
        setShowCreatePopup(false);
        setShowImportPopup(false);
        
        // Clear the file input
        const fileInput = document.getElementById('excelFileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleCreateType = (type) => {
        setShowCreatePopup(false);
        if (type === 'mcq') {
            onCreateMCQ();          // ← navigate to NewMcq
        } else {
            onCreateCoding();
        }
    };


    // -------------------- Score Editing Logic --------------------
    // near the top, alongside your other handlers
    // at top of component
    const handleEditSectionScore = (groupId) => {
        // find a "default" current score
        const current = mcqQuestions.find(q => q.group_id === groupId)?.score ?? 0;

        Swal.fire({
            title: 'Set score for each question.',
            text: 'Enter a score between 0 and 10',
            input: 'number',
            inputValue: current,
            inputAttributes: { min: 0, max: 10, step: 1 },
            showCancelButton: true,
            confirmButtonText: 'Apply',
            background: "#181817",
            color: "#fff",
        }).then(result => {
            if (!result.isConfirmed) return;
            const newScore = parseInt(result.value, 10);
            if (isNaN(newScore) || newScore < 0 || newScore > 10) {
                return Swal.fire({ title: 'Invalid', text: 'Must be 0–10', icon: 'error', background: "#181817", color: "#fff" });
            }
            setMcqQuestions(prev =>
                prev.map(q =>
                    q.group_id === groupId
                        ? { ...q, score: newScore }
                        : q
                )
            );
            Swal.fire({ title: 'Done!', text: `All set to ${newScore}`, icon: 'success', background: "#181817", color: "#fff", timer: 1200 });
        });
    };


    const handleEditCodingSectionScore = () => {
        if (codingQuestions.length === 0) {
            return Swal.fire({
                title: 'No Questions',
                text: 'No coding questions added to score.',
                icon: 'error',
                background: '#181817',
                color: '#fff',
                showConfirmButton: false,
                timer: 1500,
            });
        }
        const current = codingQuestions[0].score ?? 0;
        Swal.fire({
            title: 'Set score for all coding questions',
            text: 'Enter a score between 0 and 10:',
            input: 'number',
            inputValue: current,
            inputAttributes: { min: 0, max: 10, step: 1 },
            showCancelButton: true,
            confirmButtonText: 'Apply',
            background: '#181817',
            color: '#fff',
        }).then(result => {
            if (result.isConfirmed) {
                const newScore = parseInt(result.value, 10);
                if (isNaN(newScore) || newScore < 0 || newScore > 10) {
                    return Swal.fire({ title: 'Invalid score', text: 'Enter 0–10.', icon: 'error', background: '#181817', color: '#fff' });
                }
                setCodingQuestions(prev => prev.map(q => ({ ...q, score: newScore })));
                Swal.fire({ title: 'Done!', text: `All coding questions set to ${newScore}.`, icon: 'success', background: '#181817', color: '#fff', timer: 1500 });
            }
        });
    };

    const handleFileSelection = (questionType) => {
        setSelectedQuestionType(questionType);  // Store the selected question type (MCQ or Coding)
        document.getElementById('excelFileInput').click();  // Trigger file input click
    };

    const getUserDetails = async () => {
        try {
            const response = await authFetch('/getUserDetails/', {
                method: 'GET',
            });
            
            if (response.ok) {
                const userData = await response.json();
                return userData;
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
        return null;
    };

    const downloadTemplate = async (questionType) => {
        try {
            const path = `/download-question-template/?type=${questionType}`;
            const response = await authFetch(path, {
                method: 'GET',
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${questionType}_question_template.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                throw new Error('Failed to download template');
            }
        } catch (error) {
            console.error('Error downloading template:', error);
            Swal.fire({
                title: 'Download Failed',
                text: 'Failed to download template. Please try again.',
                icon: 'error',
                background: "#181817",
                color: "#fff",
            });
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['.xlsx', '.xls', '.csv'];
            const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
            
            if (!allowedTypes.includes(fileExtension)) {
                Swal.fire({
                    title: 'Invalid File Type',
                    text: 'Please upload an Excel (.xlsx, .xls) or CSV file.',
                    icon: 'error',
                    background: "#181817",
                    color: "#fff",
                });
                return;
            }

            // Validate file size (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                Swal.fire({
                    title: 'File Too Large',
                    text: 'Please upload a file smaller than 10MB.',
                    icon: 'error',
                    background: "#181817",
                    color: "#fff",
                });
                return;
            }
            try {
                // Show loading state
                Swal.fire({
                    title: 'Uploading...',
                    text: `Processing ${selectedQuestionType.toUpperCase()} questions from ${file.name}`,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    showConfirmButton: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                    background: "#181817",
                    color: "#fff",
                });

                // Create FormData for file upload
                const formData = new FormData();
                formData.append('file', file);
                
                // Get organization ID from user data
                let orgId = '1'; // Default fallback
                try {
                    const userData = JSON.parse(localStorage.getItem('userdata') || '{}');
                    if (userData.org_id || userData.org?.id) {
                        orgId = userData.org_id || userData.org.id;
                    } else {
                        // If not in localStorage, fetch from API
                        const userDetails = await getUserDetails();
                        if (userDetails && userDetails.org) {
                            // The org field might be the organization name, so we need to get the ID
                            // For now, we'll use a default value and let the backend handle it
                            orgId = '1';
                        }
                    }
                } catch (error) {
                    console.error('Error getting organization ID:', error);
                }
                formData.append('org_id', orgId);

                // Upload file to the API
                console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
                console.log('Organization ID:', orgId);
                
                const response = await authFetch('/import-questions/', {
                    method: 'POST',
                    body: formData,
                    // Don't set Content-Type header, let the browser set it with boundary for FormData
                });

                if (response.ok) {
                    const result = await response.json();
                    
                    // Show success message
                    const successMessage = result.detail || 'Questions imported successfully!';
                    Swal.fire({
                        title: 'Success!',
                        text: `${selectedQuestionType.toUpperCase()} questions imported successfully! ${successMessage}`,
                        icon: 'success',
                        background: "#181817",
                        color: "#fff",
                        timer: 3000,
                        showConfirmButton: false,
                    });

                    // Refresh the question bank to show newly imported questions
                    await fetchQuestions();
                    
                    // Close the popup
                    handleCloseCreatePopup();
                } else {
                    const errorData = await response.json();
                    console.error('Upload failed:', errorData);
                    
                    // Show more specific error messages
                    let errorMessage = 'Upload failed';
                    if (errorData.detail) {
                        errorMessage = errorData.detail;
                    } else if (errorData.errors && Array.isArray(errorData.errors)) {
                        errorMessage = `Import failed with ${errorData.errors.length} errors. Please check your file format.`;
                    }
                    
                    // Add specific guidance based on question type
                    if (selectedQuestionType === 'mcq') {
                        errorMessage += '\n\nFor MCQ questions, ensure you have: kind, question, category, score, reason, and all answer fields.';
                    } else if (selectedQuestionType === 'coding') {
                        errorMessage += '\n\nFor coding questions, ensure you have: kind, coding_name, score, short_desc, statement, input, expected_output.';
                    }
                    
                    throw new Error(errorMessage);
                }
            } catch (error) {
                console.error('Error uploading file:', error);
                
                // Show error message
                Swal.fire({
                    title: 'Upload Failed',
                    text: error.message || 'An error occurred while uploading the file. Please check the file format and try again.',
                    icon: 'error',
                    background: "#181817",
                    color: "#fff",
                });
            } finally {
                // Clear the file input to allow re-uploading the same file
                e.target.value = '';
            }
        }
    };

    // Handle changes to the score input for Coding
    const handleScoreChangeCoding = (questionId, newScore) => {
        const limitedScore = Math.min(10, Math.max(0, newScore)); // Ensure score is between 0 and 10
        setCodingQuestions(prevQuestions =>
            prevQuestions.map(q =>
                q.id === questionId ? { ...q, score: limitedScore } : q
            )
        );
    };

    // Truncate content
    const truncateContent = (text, limit = 10) => {
        const words = text.split(' ');
        return words.length > limit ? `${words.slice(0, limit).join(' ')}...` : text;
    };

    // Add single
    const addSingleQuestion = (q, type) => {
        console.log(`addSingleQuestion called with: ID=${q.id}, Title=${q.title}, Type=${type}`);
        
        if (!('score' in q)) q.score = 0;
        const exists = [...mcqQuestions, ...codingQuestions].some(x => x.id === q.id);
        console.log(`Question ${q.id} already exists: ${exists}`);
        
        if (!exists) {
            if (type === 'mcq') {
                console.log(`Adding MCQ question ${q.id} to mcqQuestions`);
                setMcqQuestions(prev => {
                    const newMcqQuestions = [...prev, q];
                    console.log(`mcqQuestions updated: ${prev.length} -> ${newMcqQuestions.length}`);
                    return newMcqQuestions;
                });
            } else {
                console.log(`Adding coding question ${q.id} to codingQuestions`);
                setCodingQuestions(prev => {
                    const newCodingQuestions = [...prev, q];
                    console.log(`codingQuestions updated: ${prev.length} -> ${newCodingQuestions.length}`);
                    return newCodingQuestions;
                });
            }
            setSourceQuestions(prev => {
                const newSourceQuestions = prev.filter(x => x.id !== q.id);
                console.log(`sourceQuestions updated: ${prev.length} -> ${newSourceQuestions.length}`);
                // Check if question bank should be hidden after removing this question
                if (newSourceQuestions.length === 0) {
                    console.log('Hiding question bank - no more source questions');
                    setIsQuestionBankVisible(false);
                }
                return newSourceQuestions;
            });
        } else {
            console.log(`Skipping question ${q.id} - already exists`);
        }
    };

    // 1) Prompt & count
    const handleAddAllClick = (sectionId, type) => {
        console.log(`=== handleAddAllClick START ===`);
        console.log(`Called with: sectionId=${sectionId}, type=${type}`);
        
        // choose the right base list
        const base = sectionId != null
            ? sourceQuestions.filter(q => q.group_id === sectionId && q.type === type)
            : sourceQuestions.filter(q => q.type === type);

        const total = base.length;
        console.log(`Total questions available: ${total}`);
        console.log(`Available question IDs:`, base.map(q => q.id));
        
        if (total === 0) {
            Swal.fire({
                title: "Error",
                text: "No questions available in this section.",
                icon: "error",
                background: "#181817",
                color: "#fff",
                showConfirmButton: true,
            });
            return;
        }

        // Simplified dialog to avoid confusion
        Swal.fire({
            title: `Add ${type.toUpperCase()} Questions`,
            text: `Available: ${total} questions. How many do you want to add?`,
            input: 'number',
            inputValue: 1,
            inputAttributes: { 
                min: 1, 
                max: total, 
                step: 1
            },
            showCancelButton: true,
            confirmButtonText: 'Add Questions',
            cancelButtonText: 'Cancel',
            background: "#181817",
            color: "#fff",
            inputValidator: (value) => {
                if (!value) {
                    return 'You need to enter a number!';
                }
                const num = parseInt(value, 10);
                if (isNaN(num) || num < 1 || num > total) {
                    return `Please enter a number between 1 and ${total}`;
                }
            }
        }).then(result => {
            console.log('=== SweetAlert Result ===');
            console.log('result:', result);
            console.log('result.isConfirmed:', result.isConfirmed);
            console.log('result.value:', result.value);
            console.log('result.dismiss:', result.dismiss);
            console.log('========================');
            
            if (result.isConfirmed && result.value) {
                const inputValue = parseInt(result.value, 10);
                const count = Math.min(inputValue || 0, total);
                console.log(`User entered: ${result.value}, parsed as: ${inputValue}, final count: ${count}`);
                
                if (count < 1) {
                    Swal.fire({ 
                        title: "Invalid Input!", 
                        text: "Enter a positive number.", 
                        icon: "error", 
                        background: "#181817", 
                        color: "#fff" 
                    });
                    return;
                }
                console.log(`Adding ${count} questions (user specified number)`);
                addMultipleQuestions(sectionId, type, count);
            } else if (result.dismiss) {
                console.log('User dismissed the dialog');
            } else {
                console.log('Unexpected result state:', result);
            }
            console.log(`=== handleAddAllClick END ===`);
        });
    };

    // 2) Actually grab & add
    const addMultipleQuestions = (sectionId, type, count) => {
        console.log(`=== addMultipleQuestions START ===`);
        console.log(`Called with: sectionId=${sectionId}, type=${type}, count=${count}`);
        
        // Step 1: Fetch questions from question bank
        const filtered = sectionId != null
            ? sourceQuestions.filter(q => q.group_id === sectionId && q.type === type)
            : sourceQuestions.filter(q => q.type === type);

        const totalAvailable = filtered.length;
        console.log(`Step 1 - Fetched questions from question bank: ${totalAvailable} questions available`);
        console.log(`Filtered question IDs:`, filtered.map(q => q.id));

        // Step 2: Validate count against available questions
        if (count > totalAvailable) {
            console.log(`WARNING: Count (${count}) is greater than available questions (${totalAvailable})`);
            console.log(`Will add all available questions (${totalAvailable}) instead of requested ${count}`);
            
            // Show warning to user
            Swal.fire({
                title: "Warning",
                text: `You requested ${count} questions, but only ${totalAvailable} are available. Adding all available questions.`,
                icon: "warning",
                background: "#181817",
                color: "#fff",
                timer: 3000,
                showConfirmButton: false,
            });
            
            // Adjust count to available
            count = totalAvailable;
        }

        // Step 3: Randomly select questions
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, count);
        
        console.log(`Step 3 - Randomly selected ${selectedQuestions.length} questions out of ${totalAvailable} available`);
        console.log('Selected question IDs:', selectedQuestions.map(q => q.id));
        console.log('Selected question titles:', selectedQuestions.map(q => q.title));
        
        // Step 4: Track state before adding
        const mcqCountBefore = mcqQuestions.length;
        const codingCountBefore = codingQuestions.length;
        console.log(`Step 4 - State before adding - MCQ: ${mcqCountBefore}, Coding: ${codingCountBefore}`);
        
        // Step 5: Add only those selected questions
        console.log(`Step 5 - Adding ${selectedQuestions.length} questions one by one:`);
        selectedQuestions.forEach((q, index) => {
            console.log(`  ${index + 1}/${selectedQuestions.length}: ID=${q.id}, Title=${q.title}`);
            addSingleQuestion(q, type);
        });
        
        // Step 6: Verify the addition
        setTimeout(() => {
            const mcqCountAfter = mcqQuestions.length;
            const codingCountAfter = codingQuestions.length;
            const actuallyAdded = type === 'mcq' ? mcqCountAfter - mcqCountBefore : codingCountAfter - codingCountBefore;
            
            console.log(`Step 6 - Verification:`);
            console.log(`  Expected to add: ${count} questions`);
            console.log(`  Actually added: ${actuallyAdded} questions`);
            console.log(`  State after - MCQ: ${mcqCountAfter}, Coding: ${codingCountAfter}`);
            
            if (actuallyAdded === count) {
                console.log(`✅ SUCCESS: Added exactly ${count} questions as requested`);
            } else {
                console.log(`❌ ERROR: Expected ${count} but added ${actuallyAdded} questions`);
            }
            
            console.log(`=== addMultipleQuestions END ===`);
        }, 100);
    };

    // Test function to verify the logic
    const testAddMultipleQuestions = () => {
        console.log('=== TESTING addMultipleQuestions LOGIC ===');
        
        // Create test data
        const testSourceQuestions = [
            { id: 1, title: 'Test 1', type: 'mcq', group_id: 1 },
            { id: 2, title: 'Test 2', type: 'mcq', group_id: 1 },
            { id: 3, title: 'Test 3', type: 'mcq', group_id: 1 },
            { id: 4, title: 'Test 4', type: 'mcq', group_id: 1 },
            { id: 5, title: 'Test 5', type: 'mcq', group_id: 1 },
        ];
        
        const testSectionId = 1;
        const testType = 'mcq';
        const testCount = 3;
        
        console.log(`Test data: ${testSourceQuestions.length} questions, sectionId=${testSectionId}, type=${testType}, count=${testCount}`);
        
        // Test the filtering logic
        const filtered = testSourceQuestions.filter(q => q.group_id === testSectionId && q.type === testType);
        console.log(`Filtered: ${filtered.length} questions`);
        
        // Test the selection logic
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, testCount);
        console.log(`Selected: ${selected.length} questions`);
        console.log('Selected IDs:', selected.map(q => q.id));
        
        console.log('=== TEST COMPLETE ===');
    };

    // Make test function available globally for debugging
    useEffect(() => {
        window.testAddMultipleQuestions = testAddMultipleQuestions;
        window.testQuestionAddition = () => {
            console.log('=== TESTING QUESTION ADDITION LOGIC ===');
            
            // Test data
            const testQuestions = [
                { id: 1, title: 'Test MCQ 1', type: 'mcq', group_id: 1, content: 'Question 1' },
                { id: 2, title: 'Test MCQ 2', type: 'mcq', group_id: 1, content: 'Question 2' },
                { id: 3, title: 'Test MCQ 3', type: 'mcq', group_id: 1, content: 'Question 3' },
                { id: 4, title: 'Test MCQ 4', type: 'mcq', group_id: 1, content: 'Question 4' },
                { id: 5, title: 'Test MCQ 5', type: 'mcq', group_id: 1, content: 'Question 5' },
            ];
            
            const testCount = 3;
            const testSectionId = 1;
            const testType = 'mcq';
            
            console.log(`Test: Adding ${testCount} questions from ${testQuestions.length} available`);
            
            // Simulate the filtering logic
            const filtered = testQuestions.filter(q => q.group_id === testSectionId && q.type === testType);
            console.log(`Filtered questions: ${filtered.length}`);
            
            // Simulate the selection logic
            const shuffled = [...filtered].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, testCount);
            console.log(`Selected questions: ${selected.length}`);
            console.log('Selected IDs:', selected.map(q => q.id));
            
            console.log('=== TEST COMPLETE ===');
            return selected;
        };
        console.log('Test functions available:');
        console.log('- window.testAddMultipleQuestions()');
        console.log('- window.testQuestionAddition()');
    }, []);

    const handleDragStart = (e, q) => {
        e.dataTransfer.setData('question', JSON.stringify(q));
        e.target.classList.add('draggable-active');
    };
    const handleDragEnd = (e) => {
        e.target.classList.remove('draggable-active');
    };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, type) => {
        e.preventDefault();
        const questionData = JSON.parse(e.dataTransfer.getData('question'));
        if (questionData.type === type) {
            addSingleQuestion(questionData, type);
        }
    };

    const handleReturnQuestion = (questionToReturn) => {
        if (questionToReturn.type === 'mcq') {
            setMcqQuestions(mcqQuestions.filter(q => q.id !== questionToReturn.id));
        } else if (questionToReturn.type === 'coding') {
            setCodingQuestions(codingQuestions.filter(q => q.id !== questionToReturn.id));
        }
        setSourceQuestions(prev => [...prev, questionToReturn]);
        setIsQuestionBankVisible(true);
    };

    const handleRemoveSection = (groupId) => {
        const toReturn = mcqQuestions.filter(q => q.group_id === groupId);
        setMcqQuestions(prev => prev.filter(q => q.group_id !== groupId));
        setSourceQuestions(prev => [...prev, ...toReturn]);
        setIsQuestionBankVisible(true);
    };

    const handleTimerChange = (groupId, value) => {
        setSectionTimers(prev => ({ ...prev, [groupId]: value }));
    };


    const handleNextButtonClick = () => {
        // 0) Make sure at least one question is added
        if (mcqQuestions.length === 0 && codingQuestions.length === 0) {
            return Swal.fire({
                title: "Error",
                text: "Please add at least one question from the Question Bank to proceed.",
                icon: "error",
                background: "#181817",
                color: "#fff",
                timer: 1500,
                showConfirmButton: false,
            });
        }

        // 1) Ensure all scores are > 0
        const allQs = [...mcqQuestions, ...codingQuestions];
        const hasZeroScore = allQs.some(q => q.score === 0 || q.score == null);
        if (hasZeroScore) {
            return Swal.fire({
                title: "Scores Incomplete",
                text: "Please assign a non-zero score to every question before proceeding.",
                icon: "error",
                background: "#181817",
                color: "#fff",
                timer: 1500,
                showConfirmButton: false,
            });
        }

        // 2) Validate section timers if overall timed test is not enabled
        if (!isOverallTimedTest) {
            // Check if MCQ sections have timers set
            const mcqSectionIds = [...new Set(mcqQuestions.map(q => q.group_id))];
            const mcqSectionsWithoutTimer = mcqSectionIds.filter(groupId => 
                !sectionTimers[groupId] || sectionTimers[groupId] === ''
            );
            
            if (mcqSectionsWithoutTimer.length > 0) {
                return Swal.fire({
                    title: "Section Timers Required",
                    text: "Please set timers for all MCQ sections when overall timed test is disabled.",
                    icon: "error",
                    background: "#181817",
                    color: "#fff",
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        }

        // 3) Warn if one type is missing
        if (mcqQuestions.length > 0 && codingQuestions.length === 0) {
            return Swal.fire({
                title: "Warning",
                text: "You have not added any Coding questions. Do you want to proceed?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                background: "#181817",
                color: "#fff",
            }).then(result => {
                if (result.isConfirmed) onNexts();
            });
        }
        if (codingQuestions.length > 0 && mcqQuestions.length === 0) {
            return Swal.fire({
                title: "Warning",
                text: "You have not added any MCQ questions. Do you want to proceed?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                background: "#181817",
                color: "#fff",
            }).then(result => {
                if (result.isConfirmed) onNexts();
            });
        }

        // 4) All good — go next
        onNexts();
    };


    const uniqueSections = [...new Set(sourceQuestions.map(q => q.group_id))];
    
    // Filter questions based on selected section
    const getFilteredQuestions = () => {
        if (selectedSectionFilter === 'all') {
            return sourceQuestions;
        } else if (selectedSectionFilter === 'coding') {
            return sourceQuestions.filter(q => q.type === 'coding');
        } else {
            // Filter by specific section ID
            return sourceQuestions.filter(q => q.group_id === parseInt(selectedSectionFilter));
        }
    };
    
    const filteredQuestions = getFilteredQuestions();
    
    // Get available sections for filter dropdown
    const getAvailableSections = () => {
        const sections = [
            { value: 'all', label: 'All Sections' },
            { value: 'coding', label: 'Coding Questions' }
        ];
        
        // Add MCQ sections
        uniqueSections.forEach(sectionId => {
            const sectionQs = sourceQuestions.filter(q => q.group_id === sectionId && q.type === 'mcq');
            if (sectionQs.length > 0) {
                sections.push({
                    value: sectionId.toString(),
                    label: `${sectionQs[0].title} (${sectionQs.length} questions)`
                });
            }
        });
        
        return sections;
    };
    
    // Skeleton loader component
    const QuestionSkeleton = () => (
        <div className="dataset-section card-gap">
            <div className="question-templet-wrapper">
                <div className="question-templet-header flex justify-between">
                    <div className="skeleton-text skeleton-header"></div>
                    <div className="skeleton-button"></div>
                </div>
                <div className="question-templet-body">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skeleton-question-line"></div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className='addq-container justify-center flex flex-wrap'>
            <div className='addquestion-box'>
                <h1>Add Questions</h1>
                <div className='flex gap-4 new-question-buttons'>
                    <button onClick={handleCreateClick}>Create MCQ/Coding</button>
                    <button onClick={handleImport}>Import MCQ/Coding</button>
                    {showCreatePopup && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="create-popup">
                                <button
                                    onClick={handleCloseCreatePopup}
                                    className="absolute top-1 right-2 text-white font-bold hover:text-gray-700"
                                >
                                    ✕
                                </button>
                                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                                    Create new question
                                </h2>
                                <div className="flex gap-2 justify-between create-popup-btn">
                                    <button
                                        onClick={() => handleCreateType('mcq')}
                                        className="flex-1"
                                    >
                                        MCQ
                                    </button>
                                    <button
                                        onClick={() => handleCreateType('coding')}
                                        className="flex-1"
                                    >
                                        Coding
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showImportPopup && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="create-popup">
                                <button
                                    onClick={handleCloseCreatePopup}
                                    className="absolute top-1 right-2 text-white font-bold hover:text-gray-700"
                                >
                                    ✕
                                </button>
                                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
                                    Import questions from excel
                                </h2>

                                <div className="mb-4">
                                    <div className="grid grid-cols-2 gap-2">
                                                                                 <button
                                             className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 border-b-2 border-white hover:border-blue-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                             onClick={() => downloadTemplate('mcq')}
                                         >
                                             <span className="underline decoration-2 underline-offset-4" style={{ textDecorationColor: '#A294F9' }}>Download MCQ Template</span>
                                         </button>
                                        <button
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 border-b-2 border-white hover:border-green-300 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                                            onClick={() => downloadTemplate('coding')}
                                        >
                                            <span className="underline decoration-2 underline-offset-4" style={{ textDecorationColor: '#A294F9' }}>Download Coding Template</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-4 text-sm text-white">
                                    <p>Upload an Excel file (.xlsx, .xls) or CSV file with questions.</p>
                                    <p>Download the appropriate template for your question type and follow the format.</p>
                                    <div className="text-xs mt-2">
                                        <p><strong>MCQ Questions:</strong> kind, question, category, group (optional), score, reason, 
                                        answer_1, answer_1_is_correct, answer_2, answer_2_is_correct, 
                                        answer_3, answer_3_is_correct, answer_4, answer_4_is_correct</p>
                                        <p><strong>Coding Questions:</strong> kind, coding_name, score, short_desc, statement, 
                                        input, expected_output, testcases (optional)</p>
                                    </div>
                                </div>

                                <div className='flex gap-2 import-btn'>
                                    {/* MCQ Button */}
                                    <button
                                        className="px-4 py-2 bg-blue-500 text-white rounded-md mb-2 w-full hover:bg-blue-700"
                                        onClick={() => handleFileSelection('mcq')}
                                    >
                                        Upload MCQ Questions
                                    </button>

                                    {/* Coding Button */}
                                    <button
                                        className="px-4 py-2 bg-green-500 text-white rounded-md w-full hover:bg-green-700"
                                        onClick={() => handleFileSelection('coding')}
                                    >
                                        Upload Coding Questions
                                    </button>
                                </div>

                                {/* File Input (hidden, triggered by buttons) */}
                                <input
                                    type="file"
                                    accept=".xlsx, .xls, .csv"
                                    onChange={handleFileUpload}
                                    id="excelFileInput"
                                    className="hidden"
                                />
                            </div>
                        </div>
                    )}


                </div>
                <div className='grid xl:grid-cols-2 lg:grid-cols-1 md:grid-cols-1 add-q-container xl:gap-1.5 lg:gap-10 gap-14'>
                    <div className='questionbank-container'>
                        <div className='question-bank'>
                            <div className='question-bank-head flex justify-between'>
                                <h3>Question Bank</h3>
                                <div className='flex gap-2'>
                                    <div className="section-filter-wrapper">
                                        <FontAwesomeIcon icon={faFilter} className="filter-icon" />
                                        <select
                                            className="section-filter"
                                            value={selectedSectionFilter}
                                            onChange={(e) => setSelectedSectionFilter(e.target.value)}
                                        >
                                            {getAvailableSections().map(section => (
                                                <option key={section.value} value={section.value}>
                                                    {section.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button 
                                        onClick={fetchQuestions} 
                                        disabled={isRefreshing}
                                        className={`
                                            flex items-center gap-2 px-3 py-1 rounded text-sm text-white transition-all duration-200 ${
                                                isRefreshing 
                                                    ? 'bg-gray-400 cursor-not-allowed' 
                                                    : 'bg-blue-500 hover:bg-blue-700'
                                            }
                                        `}
                                    >
                                        <FontAwesomeIcon 
                                            icon={faRefresh} 
                                            className={`${isRefreshing ? 'animate-spin' : ''}`}
                                        />
                                    </button>
                                    {/* <button 
                                        onClick={() => {
                                            console.log('=== DEBUG INFO ===');
                                            console.log('sourceQuestions:', sourceQuestions);
                                            console.log('mcqQuestions:', mcqQuestions);
                                            console.log('codingQuestions:', codingQuestions);
                                            console.log('==================');
                                        }}
                                        className="px-3 py-1 rounded text-sm text-white bg-yellow-500 hover:bg-yellow-700"
                                    >
                                        Debug
                                    </button> */}
                                </div>
                            </div>
                            <div className='question-bank-body'>
                                {isLoading ? (
                                    // Show skeleton loaders while loading
                                    <>
                                        <QuestionSkeleton />
                                        <QuestionSkeleton />
                                        <QuestionSkeleton />
                                    </>
                                ) : isQuestionBankVisible && (
                                    <>
                                        {/* MCQ Sections by group_id */}
                                        {uniqueSections.map(sectionId => {
                                            const sectionQs = filteredQuestions.filter(q => q.group_id === sectionId && q.type === 'mcq');
                                            if (!sectionQs.length) return null;
                                            const sectionName = sectionQs[0].title;
                                            const total = sectionQs.length;
                                            const list = sectionQs.slice(0, 10);
                                            return (
                                                <div key={sectionId} className="dataset-section card-gap">
                                                    <div className="question-templet-wrapper">
                                                        <div className="question-templet-header flex justify-between">
                                                            <p>{`${sectionName} - ${total} questions`}</p>
                                                            <button
                                                                className="bg-green-500 rounded-sm hover:bg-green-900 px-2"
                                                                onClick={() => handleAddAllClick(sectionId, 'mcq')}
                                                            >
                                                                + Add
                                                            </button>
                                                        </div>
                                                        <div className="question-templet-body">
                                                            {list.map(q => (
                                                                <p key={q.id} className="cardin-q">
                                                                    {windowWidth <= 1024
                                                                        ? truncateContent(q.content, 10)
                                                                        : q.content}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Coding Section - only show when filtering all sections or coding specifically */}
                                        {(selectedSectionFilter === 'all' || selectedSectionFilter === 'coding') && (
                                            <div className="dataset-section card-gap">
                                                <div className="question-templet-wrapper">
                                                    <div className="question-templet-header flex justify-between">
                                                        <p>{`Coding Questions - ${filteredQuestions.filter(q => q.type === 'coding').length} questions`}</p>
                                                        <button
                                                            className="bg-green-500 rounded-sm hover:bg-green-900 px-2"
                                                            onClick={() => handleAddAllClick(null, 'coding')}
                                                        >
                                                            + Add
                                                        </button>
                                                    </div>
                                                    <div className="question-templet-body">
                                                        <div className="question">
                                                            {filteredQuestions
                                                                .filter(q => q.type === 'coding')
                                                                .slice(0, 10)
                                                                .map(question => (
                                                                    <details
                                                                        key={question.id}
                                                                        draggable
                                                                        onDragStart={e => handleDragStart(e, question)}
                                                                        onDragEnd={handleDragEnd}
                                                                    >
                                                                        <summary className="flex justify-between">
                                                                            {windowWidth <= 1024
                                                                                ? truncateTitle(question.title, 2)
                                                                                : question.title}
                                                                            <div className="flex items-center gap-2 exam-type">
                                                                                <span className="text-sm">
                                                                                    {question.type.toUpperCase()}
                                                                                </span>
                                                                            </div>
                                                                        </summary>
                                                                        <p>{question.content}</p>
                                                                    </details>
                                                                ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className='questionbank-added-container'>
                        <div className='question-bank'>
                            <div className='addedquestion-bank-head flex justify-between'>
                                <h3>MCQ</h3>
                            </div>
                            <div className='addedquestion-bank-body'>
                                {[...new Set(mcqQuestions.map(q => q.group_id))].map(groupId => {
                                    const sectionQs = mcqQuestions.filter(q => q.group_id === groupId);
                                    const sectionName = sectionQs[0]?.title || 'Unnamed Section'; // Safeguard for missing title
                                    const isSectionPlaceholder = sectionQs[0]?.is_section_placeholder;

                                    return (
                                        <details key={groupId} className="mb-4 border rounded p-2">
                                            <summary className="flex justify-between items-center cursor-pointer">
                                                <p>{`${sectionName} — ${sectionQs.length} questions`}</p>
                                                <div className="flex items-center gap-2">
                                                    {/* Timer input */}
                                                    <div className="flex flex-col">
                                                        <input
                                                            type="number"
                                                            placeholder="Timer"
                                                            value={sectionTimers[groupId] || ''}
                                                            onChange={e => handleTimerChange(groupId, e.target.value)}
                                                            className="section-timer"
                                                            disabled={isOverallTimedTest}
                                                        />
                                                    </div>

                                                    {/* Edit Score */}
                                                    <button
                                                        onClick={() => handleEditSectionScore(groupId)}
                                                        className="bg-[#A294F9] hover:bg-[#826fff] px-2 py-1 rounded text-sm text-white"
                                                    >
                                                        Edit Score
                                                    </button>

                                                    {/* Remove */}
                                                    <button
                                                        onClick={() => handleRemoveSection(groupId)}
                                                        className="bg-red-500 hover:bg-red-700 px-2 py-1 rounded text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </summary>

                                            {/* Display the content of each question in the section */}
                                            <div>
                                                {sectionQs.map((question, index) => (
                                                    <div key={question.id} className="score-alloted">
                                                        <p>{`${index + 1}. ${question.content || 'No content available'}`}</p>
                                                        <p className="text-sm text-white-500">Score: {question.score !== undefined ? question.score : 'N/A'}</p>
                                                        {isSectionPlaceholder && (
                                                            <p className="text-sm text-blue-400">Section placeholder - questions will be loaded from question bank</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    );
                                })}

                                {/* Show message if no MCQ sections are added */}
                                {mcqQuestions.length === 0 && (
                                    <div className="text-center text-gray-400 py-4">
                                        <p>No MCQ sections added yet.</p>
                                        <p className="text-sm">Add questions from the Question Bank to get started.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Coding Section */}
                        <div className='question-bank'>
                            <div className='addedquestion-bank-head flex justify-between'>
                                <h3>Coding</h3>
                                <div className='flex items-center gap-2'>
                                    <button
                                        onClick={handleEditCodingSectionScore}
                                        className="bg-blue-500 hover:bg-blue-700 px-2 py-1 rounded text-sm text-white"
                                    >
                                        Edit Score
                                    </button>
                                    <div className='section-timer-desktop'>
                                        <span>Section timer: </span>
                                        <input 
                                            type="number" 
                                            placeholder='In minutes' 
                                            disabled={isOverallTimedTest}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div
                                className='addedquestion-bank-body'
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, 'coding')}
                            >
                                {codingQuestions.map(question => (
                                    <details key={question.id}>
                                        <summary className='flex justify-between'>
                                            {windowWidth <= 1024
                                                ? truncateTitle(question.title, 3)
                                                : question.title}
                                            <div className="flex items-center gap-4">
                                                <input
                                                    type="number"
                                                    value={question.score ?? 0}
                                                    disabled={!isEditingScoreCoding}
                                                    onChange={(e) => handleScoreChangeCoding(question.id, e.target.value)}
                                                    className={`${isEditingScoreCoding ? 'w-16' : 'w-8'} mr-2 text-black rounded-sm text-white text-center ${isEditingScoreCoding ? '[background-color:oklch(0.42_0_0)]' : ''}`}
                                                />
                                                {!isEditingScoreCoding && <span className="ml-1">score</span>}
                                                <button
                                                    onClick={() => handleReturnQuestion(question)}
                                                    className="bg-red-500 hover:bg-red-700 px-2 py-1 rounded"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </summary>
                                        <p>{question.content}</p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
                <div className='flex justify-center'>
                    <img src={line} alt="line" className='line-bottom' />
                </div>
                <div className='flex w-full justify-end bottom-control gap-1'>
                    <button onClick={onBack} className="exam-previous-btn">
                        <FontAwesomeIcon icon={faRotateLeft} className='left-icon' />back
                    </button>
                    <p>2/3</p>
                    <button
                        className='exam-next-btn'
                        onClick={handleNextButtonClick}
                        disabled={[...mcqQuestions, ...codingQuestions].some(q => q.score === 0 || q.score == null) || 
                                 (!isOverallTimedTest && [...new Set(mcqQuestions.map(q => q.group_id))].some(groupId => 
                                     !sectionTimers[groupId] || sectionTimers[groupId] === ''
                                 ))}
                        style={{ 
                            opacity: ([...mcqQuestions, ...codingQuestions].some(q => q.score === 0 || q.score == null) || 
                                     (!isOverallTimedTest && [...new Set(mcqQuestions.map(q => q.group_id))].some(groupId => 
                                         !sectionTimers[groupId] || sectionTimers[groupId] === ''
                                     )) ? 0.5 : 1) 
                        }}
                    >
                        Next
                    </button>

                </div>
            </div>
        </div>
    );
};

// PropType definitions to resolve ESLint 'missing in props validation' warnings
AddQuestion.propTypes = {
    onBack: PropTypes.func.isRequired,
    onNexts: PropTypes.func.isRequired,
    onCreateMCQ: PropTypes.func.isRequired,
    onCreateCoding: PropTypes.func.isRequired,
    isEditing: PropTypes.bool,
    editExamData: PropTypes.object,
    createExamRequest: PropTypes.object,
};

export default AddQuestion;