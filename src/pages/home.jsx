import React, { useState } from "react";
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

const Home = () => {
    const [activeComponent, setActiveComponent] = useState("dashboard");
    const [isStudentModalOpen, setStudentModalOpen] = useState(false);
    const [openAddUserModal, setOpenAddUserModal] = useState(false);
    const [createExamRequest, setCreateExamRequest] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);

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

    return (
        <div className="home-container">
            <TopBar /> {/* Keep top bar fixed */}

            <div className="flex">
                {/* Sidebar */}
                <div className="xl:w-2/10 lg:w-[25%] md:w-0/10 sm:w-0">
                    <Sidebar activeComponent={activeComponent}
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
                        <ManageExam onCreateNewExam={() => setActiveComponent("newExam")}
                            onNext={() => setActiveComponent("viewexam")} />
                    )}
                    {activeComponent === "viewexam" && <ViewExam
                        onBack={() => setActiveComponent("manageExam")} />}
                    {activeComponent === "result" && <ManageResult
                        onNext={() => setActiveComponent("viewresult")}
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
                        // <ViewCourse />
                        <ViewCourse onBack={() => setActiveComponent("custom")} />
                    )}

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
                </div>
            </div>
        </div>
    );
};

export default Home;
