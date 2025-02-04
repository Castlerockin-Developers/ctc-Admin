import React, { useState } from "react";
import TopBar from "../component/TopBar";
import Sidebar from "../component/Sibebar";
import Dashboard from "../component/Dashboard";
import ManageExam from "../component/ManageExam";

const Home = () => {
    const [activeComponent, setActiveComponent] = useState("dashboard");

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
                </div>
            </div>
        </div>
    );
};

export default Home;
