import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "../component/TopBar";
import Sidebar from "../component/Sibebar"; // Ensure Sidebar is imported correctly
import Dashboard from "../component/Dashboard";
import ManageExam from "../component/ManageExam";
import NewExam from "../component/NewExam";
import ManageResult from "../component/ManageResult";
import ManageStudents from "../component/ManageStudents";
import AddQuestion from "../component/AddQuestion";
import AddStudents from "../component/AddStudents";
import Swal from "sweetalert2";
import Subcription from "../component/Subcription";
import Settings from "../component/Settings";
import ViewResult from "../component/ViewResult";
import PerticularResult from "../component/PerticularResult";
import ViewExam from "../component/ViewExam";
import NewMcq from "../component/NewMcq";
import NewCoding from "../component/NewCoding";
import { authFetch } from "../scripts/AuthProvider";
import CustomLearning from "../component/CustomLearning";
import NewCoursefirst from "../component/NewCoursefirst";
import ChapterAdding from "../component/ChapterAdding";
import CourseStudents from "../component/CourseStudents";
import ViewCourse from "../component/ViewCourse";
import { useCacheConsent } from "../hooks/useCache";

const Home = () => {
    const navigate = useNavigate();
    const [activeComponent, setActiveComponent] = useState("dashboard");
    const [isStudentModalOpen, setStudentModalOpen] = useState(false);
    const [openAddUserModal, setOpenAddUserModal] = useState(false);
    const [createExamRequest, setCreateExamRequest] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    
    // Edit exam flow states
    const [isEditingExam, setIsEditingExam] = useState(false);
    const [editExamData, setEditExamData] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    // Use cache consent hook
    const { cacheAllowed, showConsent, handleConsent } = useCacheConsent();

    // Debug logging for cache consent
    console.log('Home component - Cache consent state:', {
        cacheAllowed,
        showConsent
    });

    // Temporary bypass for cache consent to ensure components load
    const effectiveCacheAllowed = cacheAllowed !== false;

    // Authentication check
    useEffect(() => {
        const accessToken = localStorage.getItem('access');
        if (!accessToken) {
            navigate('/');
            return;
        }
        setIsAuthenticated(true);
    }, [navigate]);

    const handleSubmitExam = async () => {

        try {
            const response = await authFetch("/admin/exams/create-exam/", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(createExamRequest),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Failed:", errorData);
                Swal.fire("Error", "Exam creation failed", "error");
                return;
            }

            Swal.fire("Success", "Exam created successfully", "success");
            onNext();
        } catch (error) {
            console.error("Error:", error);
            Swal.fire("Error", "Something went wrong", "error");
        }
    };

    // Function to handle exam creation alert
    const handleCreateExam = () => {
        Swal.fire({
            title: "Saved!",
            text: "Exam has been created.",
            icon: "success",
            background: "#181817",
            color: "#fff",
            showConfirmButton: false,
            timer: 1500,
        });
        setActiveComponent("manageExam");
    };

    // Function to handle edit exam
    const handleEditExam = (examDetails) => {
        console.log("Home - handleEditExam called with:", examDetails);
        console.log("Home - examDetails.students:", examDetails?.students);
        console.log("Home - examDetails.user:", examDetails?.user);
        setEditExamData(examDetails);
        setIsEditingExam(true);
        setActiveComponent("editExam");
    };

    // Function to handle exam update
    const handleUpdateExam = async (updatedData) => {
        try {
            const response = await authFetch(`/admin/exams/${editExamData.id}/`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to update exam");
            }

            Swal.fire({
                title: "Updated!",
                text: "Exam has been updated successfully.",
                icon: "success",
                background: "#181817",
                color: "#fff",
                showConfirmButton: false,
                timer: 1500,
            });
            
            // Reset edit states and go back to manage exam
            setIsEditingExam(false);
            setEditExamData(null);
            setActiveComponent("manageExam");
        } catch (error) {
            console.error("Error updating exam:", error);
            Swal.fire("Error", error.message || "Failed to update exam", "error");
        }
    };

    // Show loading while checking authentication
    if (!isAuthenticated) {
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
        <div className="home-container">
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

            <div className="flex">
                {/* Sidebar */}
                <div className="xl:w-2/10 lg:w-[25%] md:w-0/10 sm:w-0">
                    <Sidebar activeComponent={
                        ["editExam", "editAddQuestion", "editAddStudents"].includes(activeComponent)
                            ? "manageExam"
                            : activeComponent
                    }
                        setActiveComponent={setActiveComponent}
                        onCreateExam={() => setActiveComponent("newExam")}
                    />
                </div>

                {/* Main Content Area */}
                <div className="xl:w-8/10 lg:w-[75%] md:w-10/10 sm:w-full">
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
                            onViewexam={() => {
                                setActiveComponent("viewexam");
                            }}
                            onManageExam={() => {
                                setActiveComponent("manageExam");
                            }}
                            onSubscription={() => {
                                setActiveComponent("subcribe");
                            }}
                            onManageStudents={() => {
                                setActiveComponent("student");
                            }}
                            cacheAllowed={effectiveCacheAllowed}
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
                            onNext={() => setActiveComponent("viewexam")}
                            cacheAllowed={effectiveCacheAllowed}
                            onEditExam={handleEditExam}
                        />
                    )}
                    {activeComponent === "viewexam" && <ViewExam
                        onBack={() => setActiveComponent("manageExam")} />}
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
                            onBack={() => setActiveComponent("manageExam")}
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
                            onBack={() => setActiveComponent("newExam")}
                            onNexts={() => setActiveComponent("addStudents")}
                            onCreateMCQ={() => setActiveComponent("newMcq")}
                            onCreateCoding={() => setActiveComponent("newCoding")}
                            createExamRequest={createExamRequest}
                            setCreateExamRequest={setCreateExamRequest}
                        />
                    )}
                    {activeComponent === "addStudents" && (
                        <AddStudents
                            onBack={() => setActiveComponent("addQuestion")}
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
                            console.log("Home - editAddStudents component - editExamData:", editExamData);
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
