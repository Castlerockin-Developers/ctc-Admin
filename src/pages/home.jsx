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

const Home = () => {
    const [activeComponent, setActiveComponent] = useState("dashboard");
    const [isStudentModalOpen, setStudentModalOpen] = useState(false);
    const [openAddUserModal, setOpenAddUserModal] = useState(false);

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
                <div className="xl:w-2/10 lg:w-2/10 md:w-0/10 sm:w-0">
                    <Sidebar activeComponent={activeComponent}
                        setActiveComponent={setActiveComponent}
                        onCreateExam={() => setActiveComponent("newExam")}
                    />
                </div>

                {/* Main Content Area */}
                <div className="xl:w-8/10 lg:w-8/10 md:w-10/10 sm:w-full">
                    {/* Main Navigation Components */}
                    {activeComponent === "dashboard" && (
                        <Dashboard
                            onCreateExam={() => setActiveComponent("newExam")}
                            onAddStudent={() => {
                                setActiveComponent("student");
                                setStudentModalOpen(true); // Open modal when quick link is clicked
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

                    {/* Exam Flow Navigation */}
                    {activeComponent === "newExam" && (
                        <NewExam
                            onBack={() => setActiveComponent("manageExam")}
                            onNext={() => setActiveComponent("addQuestion")}
                        />
                    )}
                    {activeComponent === "addQuestion" && (
                        <AddQuestion
                            onBack={() => setActiveComponent("newExam")}
                            onNexts={() => setActiveComponent("addStudents")}
                        />
                    )}
                    {activeComponent === "addStudents" && (
                        <AddStudents
                            onBack={() => setActiveComponent("addQuestion")}
                            onSubmit={handleCreateExam}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home;
