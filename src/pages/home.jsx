<<<<<<< HEAD
    import React, { useState } from "react";
    import TopBar from "../component/TopBar";
    import Sidebar from "../component/Sibebar";
    import Dashboard from "../component/Dashboard";
    import ManageExam from "../component/ManageExam";
    import ManageResult from "../component/ManageResult";
    import ManageStudents from "../component/ManageStudents";
=======
import React, { useState } from "react";
import TopBar from "../component/TopBar";
import Sidebar from "../component/Sibebar";
import Dashboard from "../component/Dashboard";
import ManageExam from "../component/ManageExam";
import NewExam from "../component/NewExam";
import AddQuestion from "../component/AddQuestion";
import AddStudents from "../component/AddStudents";
import Swal from "sweetalert2";
import Subcription from "../component/Subcription";
import Settings from "../component/Settings";
>>>>>>> 95f3d444caf171b58ad22eb31db068b9133a1b5a

    const Home = () => {
        const [activeComponent, setActiveComponent] = useState("dashboard");

<<<<<<< HEAD
        return (
            <div>
                <TopBar />
                <div className="flex">
                    {/* Sidebar */}
                    <div className="xl:w-2/10 lg:w-2/10 md:w-0/10 sm:w-0">
                        <Sidebar setActiveComponent={setActiveComponent} />
                    </div>

                    {/* Main Content Area */}
                    <div className="xl:w-8/10 lg:w-8/10 md:w-10/10 sm:w-full">
                        {activeComponent === "dashboard" && <Dashboard />}
                        {activeComponent === "manageExam" && <ManageExam />}
                        {activeComponent === "result" && <ManageResult />}
                        {activeComponent === "student" && <ManageStudents />}
                    </div>
                </div>  
=======
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
        <div>
            <TopBar />
            <div className="flex">
                {/* Sidebar */}
                <div className="xl:w-2/10 lg:w-2/10 md:w-0/10 sm:w-0">
                    <Sidebar setActiveComponent={setActiveComponent} />
                </div>

                {/* Main Content Area */}
                <div className="xl:w-8/10 lg:w-8/10 md:w-10/10 sm:w-full">
                    {activeComponent === "dashboard" && <Dashboard />}
                    {activeComponent === "subcribe" && <Subcription />}
                    {activeComponent === "settings" && <Settings />}
                    {activeComponent === "manageExam" && (
                        <ManageExam onCreateNewExam={() => setActiveComponent("newExam")} />
                    )}
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
>>>>>>> 95f3d444caf171b58ad22eb31db068b9133a1b5a
            </div>
        );
    };

    export default Home;
