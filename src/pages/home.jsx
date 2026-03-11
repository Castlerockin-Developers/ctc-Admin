import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { log, error as logError } from "../utils/logger";
import TopBar from "../component/TopBar";
import Sidebar from "../component/Sibebar";
import Swal from "sweetalert2";
import { authFetch } from "../scripts/AuthProvider";
import { useCacheConsent } from "../hooks/useCache";

import Dashboard from "../component/Dashboard";
import ManageExam from "../component/ManageExam";
import NewExam from "../component/NewExam";
import ManageResult from "../component/ManageResult";
import ManageStudents from "../component/ManageStudents";
import AddQuestion from "../component/AddQuestion";
import AddStudents from "../component/AddStudents";
import Subcription from "../component/Subcription";
import Settings from "../component/Settings";
import ViewResult from "../component/ViewResult";
import PerticularResult from "../component/PerticularResult";
import NewMcq from "../component/NewMcq";
import NewCoding from "../component/NewCoding";
import CustomLearning from "../component/CustomLearning";
import NewCoursefirst from "../component/NewCoursefirst";
import ChapterAdding from "../component/ChapterAdding";
import CourseStudents from "../component/CourseStudents";
import ViewCourse from "../component/ViewCourse";

const Home = () => {
    const navigate = useNavigate();
    const [activeComponent, setActiveComponent] = useState("dashboard");
    const [isStudentModalOpen, setStudentModalOpen] = useState(false);
    const [openAddUserModal, setOpenAddUserModal] = useState(false);
    const [createExamRequest, setCreateExamRequest] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);

    // Edit exam flow states
    const [isEditingExam, setIsEditingExam] = useState(false);
    const [editExamData, setEditExamData] = useState(null);

    // Exam to view state
    const [examToView, setExamToView] = useState(null);

    // Use cache consent hook
    const { cacheAllowed, showConsent, handleConsent } = useCacheConsent();

    // Debug logging for cache consent
    log('Home component - Cache consent state:', {
        cacheAllowed,
        showConsent
    });

    // Temporary bypass for cache consent to ensure components load
    const effectiveCacheAllowed = true;

    // Authentication + admin access check
    useEffect(() => {
        const verifyAccess = async () => {
            const accessToken = localStorage.getItem('access');
            if (!accessToken) {
                navigate('/');
                return;
            }
            setIsAuthenticated(true);
            try {
                // Use getUserDetails to validate admin access before showing the app
                const response = await authFetch('/getUserDetails/', { method: 'GET' });
                const data = await response.json();
                const hasAdminAccess =
                    data?.can_access_admin_panel === true || data?.is_superuser === true;
                if (!hasAdminAccess) {
                    navigate('/access-denied', { replace: true });
                    return;
                }
            } catch (error) {
                // If backend says forbidden, send user to access denied
                if (error.status === 403) {
                    navigate('/access-denied', { replace: true });
                    return;
                }
                logError('Home - failed to verify admin access:', error);
                navigate('/', { replace: true });
                return;
            } finally {
                setCheckingAccess(false);
            }
        };

        verifyAccess();
    }, [navigate]);

    // Clear session storage on page refresh/load to ensure clean form state
    useEffect(() => {
        const clearSessionStorageOnLoad = () => {
            log("Home - Clearing session storage on page load/refresh");
            
            // Clear all exam creation related session storage
            const allKeys = [
                'newExam:testName',
                'newExam:examStartDate', 
                'newExam:startTime',
                'newExam:examEndDate',
                'newExam:endTime',
                'newExam:timedTest',
                'newExam:timer',
                'newExam:attemptsAllowed',
                'newExam:instructions',
                'mcqQuestions',
                'codingQuestions', 
                'sectionTimers',
                'addStudents_allBranch',
                'addStudents_addedBranch',
                'addStudents_list'
            ];
            
            allKeys.forEach(key => {
                sessionStorage.removeItem(key);
            });
            
            log("Home - Session storage cleared on page load/refresh");
        };
        
        clearSessionStorageOnLoad();
        
        // Also clear session storage when user navigates away from the page
        const handleBeforeUnload = () => {
            log("Home - Clearing session storage before page unload");
            clearSessionStorageOnLoad();
        };
        
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const handleSubmitExam = async () => {

        try {
            const response = await authFetch("/admin/exams/create-exam/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createExamRequest),
            });

            if (!response.ok) {
                const errorData = await response.json();
                logError("Failed:", errorData);
                Swal.fire("Error", "Exam creation failed", "error");
                return;
            }

            Swal.fire("Success", "Exam created successfully", "success");
            onNext();
        } catch (error) {
            logError("Error:", error);
            Swal.fire("Error", "Something went wrong", "error");
        }
    };

    // Function to handle exam creation alert
    const handleCreateExam = () => {
        // Clear all session storage when exam is successfully created
        const clearAllSessionStorage = () => {
            log("Home - Clearing all session storage after successful exam creation");
            
            // Clear NewExam component session storage
            const newExamKeys = [
                'newExam:testName',
                'newExam:examStartDate', 
                'newExam:startTime',
                'newExam:examEndDate',
                'newExam:endTime',
                'newExam:timedTest',
                'newExam:timer',
                'newExam:attemptsAllowed',
                'newExam:instructions'
            ];
            
            // Clear AddQuestion component session storage
            const addQuestionKeys = [
                'mcqQuestions',
                'codingQuestions', 
                'sectionTimers'
            ];
            
            // Clear AddStudents component session storage
            const addStudentsKeys = [
                'addStudents_allBranch',
                'addStudents_addedBranch',
                'addStudents_list'
            ];
            
            // Clear all keys
            [...newExamKeys, ...addQuestionKeys, ...addStudentsKeys].forEach(key => {
                sessionStorage.removeItem(key);
                log(`Home - Cleared session storage key: ${key}`);
            });
            
            log("Home - All session storage cleared after successful exam creation");
        };
        
        clearAllSessionStorage();
        
        Swal.fire({
            title: "Saved!",
            text: "Exam has been created.",
            icon: "success",
        iconColor: "#A294F9", // Set the icon color to purple
            background: "#181817",
            color: "#fff",
            showConfirmButton: false,
            timer: 1500,
        });
        setActiveComponent("manageExam");
    };

    // Function to handle edit exam
    const handleEditExam = (examDetails) => {
        setEditExamData(examDetails);
        setIsEditingExam(true);
        setActiveComponent("editExam");
    };

    // Function to handle exam update (post-success UI only; network call is done in AddStudents)
    const handleUpdateExam = () => {
        log("Home - handleUpdateExam called (post-success). editExamData:", editExamData);

        // Reset edit states and go back to manage exam
        setIsEditingExam(false);
        setEditExamData(null);
        setActiveComponent("manageExam");
    };

    // Show loading while checking authentication / admin access
    if (!isAuthenticated || checkingAccess) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="home-container flex h-screen flex-col overflow-hidden">
            {/* Temporarily hide cache consent dialog to test if it's blocking components
            {showConsent && (
                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-60 z-50">
                    <div className="bg-white p-6 rounded shadow-lg text-center max-w-md">
                        <h2 className="text-lg font-bold mb-2">Allow Data Caching?</h2>
                        <p className="mb-4">To make navigation faster, we can store student, exam, and result data in your browser. Do you allow us to store this data in your browser cache/localStorage?</p>
                        <button className="bg-green-600 text-white px-4 py-2 rounded mr-2" onClick={() => handleConsent(true)}>Allow</button>
                        <button className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => handleConsent(false)}>Deny</button>
                    </div>
                </div>
            )}
            */}
            <TopBar /> {/* Keep top bar fixed */}

            <div className="flex min-h-0 flex-1 w-full gap-0 overflow-hidden">
                {/* Sidebar - fixed height column so right-side content (e.g. skeleton) never pushes it */}
                <div className="flex h-full min-h-0 shrink-0 flex-col md:w-0 sm:w-0 lg:w-[25%] xl:w-[20%] 2xl:w-[18%]">
                    <Sidebar activeComponent={
                        ["editExam", "editAddQuestion", "editAddStudents"].includes(activeComponent)
                            ? "manageExam"
                            : activeComponent
                    }
                        setActiveComponent={setActiveComponent}
                        onCreateExam={() => setActiveComponent("newExam")}
                        onManageExamClick={() => setExamToView(null)}
                    />
                </div>

                {/* Main Content Area - scrolls internally; tall content (e.g. skeleton) does not affect sidebar */}
                <div className="min-h-0 flex-1 min-w-0 overflow-y-auto pl-0 md:pl-1 lg:pl-0 sm:w-full md:w-full lg:w-[75%] xl:w-[80%] 2xl:w-[82%]">
                    {/* Main Navigation Components */}
                    {activeComponent === "dashboard" && (
                        <Dashboard
                            onCreateExam={() => setActiveComponent("newExam")}
                            onAddStudent={() => {
                                setActiveComponent("student");
                                setStudentModalOpen(true);
                            }}
                            onAddUser={() => {
                                setActiveComponent("settings");
                                setOpenAddUserModal(true);
                            }}
                            onAddCredits={() => {
                                setActiveComponent("subcribe");
                            }}
                            onManageExam={(exam) => {
                                if (exam) {
                                    setExamToView(exam);
                                }
                                setActiveComponent("manageExam");
                            }}
                            onSubscription={() => {
                                setActiveComponent("subcribe");
                            }}
                            onManageStudents={() => {
                                setActiveComponent("student");
                            }}
                            cacheAllowed={effectiveCacheAllowed}
                            onBackToDashboard={() => {
                                setExamToView(null);
                                setActiveComponent("dashboard");
                            }}
                        />
                    )}
                    {activeComponent === "subcribe" && <Subcription />}
                    {activeComponent === "settings" && (
                        <Settings
                            openAddUserModal={openAddUserModal}
                            setOpenAddUserModal={setOpenAddUserModal}
                        />
                    )}
                    {activeComponent === "manageExam" && (
                        <ManageExam
                            onCreateNewExam={() => setActiveComponent("newExam")}
                            cacheAllowed={effectiveCacheAllowed}
                            onEditExam={handleEditExam}
                            examToView={examToView}
                            onClearExamToView={() => setExamToView(null)}
                        />
                    )}
                    {activeComponent === "result" && <ManageResult
                        onNext={() => setActiveComponent("viewresult")}
                        cacheAllowed={effectiveCacheAllowed}
                    />}
                    {activeComponent === "viewresult" && <ViewResult
                        onBack={() => setActiveComponent("result")}
                        onNext={() => setActiveComponent("perticularresult")}
                    />}
                    {activeComponent === "perticularresult" && <PerticularResult
                        onBack={() => setActiveComponent("viewresult")}
                    />}
                    {activeComponent === "student" && (
                        <ManageStudents
                            studentModalOpen={isStudentModalOpen}
                            setStudentModalOpen={setStudentModalOpen}
                            cacheAllowed={effectiveCacheAllowed}
                        />
                    )}

                    {activeComponent === "custom" && (
                        <CustomLearning
                            onNewcourse={() => setActiveComponent("partone")}
                            onView={(course) => {
                                setSelectedCourse(course);
                                setActiveComponent("viewcourse");
                            }}
                        />
                    )}
                    {activeComponent === "viewcourse" && (
                        <ViewCourse
                            onBack={() => setActiveComponent("custom")}
                            selectedCourse={selectedCourse}
                        />
                    )}

                    {/* Custom Learning Creation Flow */}
                    {activeComponent === "partone" && (
                        <NewCoursefirst
                            onNextc={() => setActiveComponent("parttwo")}
                            onBackc={() => setActiveComponent("custom")}
                        />
                    )}

                    {activeComponent === "parttwo" && (
                        <ChapterAdding
                            onBackcc={() => setActiveComponent("partone")}
                            onNextcc={() => setActiveComponent("partthree")}
                        />
                    )}

                    {activeComponent === "partthree" && (
                        <CourseStudents
                            onNextccc={() => setActiveComponent("custom")}
                            onBackccc={() => setActiveComponent("parttwo")}
                        />
                    )}

                    {/* Exam Flow Navigation */}
                    {activeComponent === "newExam" && (
                        <NewExam
                            onBack={() => {
                                // Clear session storage when going back to manage exam
                                const clearSessionStorage = () => {
                                    log("Home - Clearing session storage when navigating back to manage exam");
                                    
                                    // Clear NewExam component session storage
                                    const newExamKeys = [
                                        'newExam:testName',
                                        'newExam:examStartDate', 
                                        'newExam:startTime',
                                        'newExam:examEndDate',
                                        'newExam:endTime',
                                        'newExam:timedTest',
                                        'newExam:timer',
                                        'newExam:attemptsAllowed',
                                        'newExam:instructions'
                                    ];
                                    
                                    // Clear AddQuestion component session storage
                                    const addQuestionKeys = [
                                        'mcqQuestions',
                                        'codingQuestions', 
                                        'sectionTimers'
                                    ];
                                    
                                    // Clear AddStudents component session storage
                                    const addStudentsKeys = [
                                        'addStudents_allBranch',
                                        'addStudents_addedBranch',
                                        'addStudents_list'
                                    ];
                                    
                                    // Clear all keys
                                    [...newExamKeys, ...addQuestionKeys, ...addStudentsKeys].forEach(key => {
                                        sessionStorage.removeItem(key);
                                        log(`Home - Cleared session storage key: ${key}`);
                                    });
                                    
                                    log("Home - Session storage cleared successfully");
                                };
                                
                                clearSessionStorage();
                                setActiveComponent("manageExam");
                            }}
                            onNext={() => setActiveComponent("addQuestion")}
                            createExamRequest={createExamRequest}
                            setCreateExamRequest={setCreateExamRequest}
                        />
                    )}
                    {activeComponent === "newMcq" && (
                        <NewMcq
                            onSave={() => setActiveComponent("addQuestion")}
                            onCancel={() => setActiveComponent("addQuestion")}
                        />
                    )}
                    {activeComponent === "newCoding" && (
                        <NewCoding
                            onSave={() => setActiveComponent("addQuestion")}
                            onBack={() => setActiveComponent("addQuestion")}
                        />
                    )}
                    {activeComponent === "addQuestion" && (
                        <AddQuestion
                            onBack={() => {
                                // Do not clear mcqQuestions/codingQuestions/sectionTimers so returning to step 2 preserves added questions (same as step 1)
                                setActiveComponent("newExam");
                            }}
                            onNexts={() => setActiveComponent("addStudents")}
                            onCreateMCQ={() => setActiveComponent("newMcq")}
                            onCreateCoding={() => setActiveComponent("newCoding")}
                            createExamRequest={createExamRequest}
                            setCreateExamRequest={setCreateExamRequest}
                        />
                    )}
                    {activeComponent === "addStudents" && (
                        <AddStudents
                            onBack={() => {
                                // Clear session storage when going back to addQuestion
                                const clearSessionStorage = () => {
                                    log("Home - Clearing session storage when going back to addQuestion");
                                    const keys = ['addStudents_allBranch', 'addStudents_addedBranch', 'addStudents_list'];
                                    keys.forEach(key => sessionStorage.removeItem(key));
                                };
                                clearSessionStorage();
                                setActiveComponent("addQuestion");
                            }}
                            onSubmit={handleCreateExam}
                            createExamRequest={createExamRequest}
                            setCreateExamRequest={setCreateExamRequest}
                        />
                    )}

                    {/* Edit Exam Flow Navigation */}
                    {activeComponent === "editExam" && (
                        <NewExam
                            isEditing={true}
                            editExamData={editExamData}
                            onBack={() => {
                                setIsEditingExam(false);
                                setEditExamData(null);
                                setActiveComponent("manageExam");
                            }}
                            onNext={() => setActiveComponent("editAddQuestion")}
                            createExamRequest={createExamRequest}
                            setCreateExamRequest={setCreateExamRequest}
                        />
                    )}
                    {activeComponent === "editAddQuestion" && (
                        <AddQuestion
                            isEditing={true}
                            editExamData={editExamData}
                            onBack={() => setActiveComponent("editExam")}
                            onNexts={() => setActiveComponent("editAddStudents")}
                            onCreateMCQ={() => setActiveComponent("newMcq")}
                            onCreateCoding={() => setActiveComponent("newCoding")}
                            createExamRequest={createExamRequest}
                            setCreateExamRequest={setCreateExamRequest}
                        />
                    )}
                    {activeComponent === "editAddStudents" && (
                        (() => {
                            log("Home - editAddStudents component - editExamData:", editExamData);
                            return (
                                <AddStudents
                                    isEditing={true}
                                    editExamData={editExamData}
                                    onBack={() => setActiveComponent("editAddQuestion")}
                                    onSubmit={handleUpdateExam}
                                    createExamRequest={createExamRequest}
                                    setCreateExamRequest={setCreateExamRequest}
                                />
                            );
                        })()
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
