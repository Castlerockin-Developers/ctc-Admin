import React, { useState, useEffect } from "react";
import { error as logError } from "../utils/logger";
import { motion } from "framer-motion";
import { FaSearch, FaPlus } from "react-icons/fa";
import Swal from "sweetalert2";
import { authFetch } from "../scripts/AuthProvider";

const CustomLearning = ({ onNewcourse, onView }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActions, setSelectedActions] = useState({});

  const resetSelect = (courseId) => {
    setSelectedActions((prev) => ({ ...prev, [courseId]: "" }));
  };

  const loadCustomModules = async () => {
    try {
      setLoading(true);
      const response = await authFetch("/learning/list/", { method: "GET" });
      if (response.ok) {
        const modules = await response.json();
        const customModules = Array.isArray(modules)
          ? modules.filter((m) => m?.is_custom)
          : [];
        setCourses(customModules);
      } else {
        throw new Error("Failed to load modules");
      }
    } catch (error) {
      logError("Error loading custom modules:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to load custom modules. Please try again.",
        icon: "error",
        background: "#181817",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteModule = async (moduleId) => {
    Swal.fire({
      title: "Not available",
      text: "Delete is not supported yet. Please contact the administrator.",
      icon: "info",
      background: "#181817",
      color: "#fff",
    });
  };

  useEffect(() => {
    loadCustomModules();
  }, []);

  const handleActionChange = (e, courseId) => {
    const selectedAction = e.target.value;
    if (selectedAction === "view") {
      const selectedCourse = courses.find((c) => c.id === courseId);
      onView?.(selectedCourse);
      resetSelect(courseId);
    }
    if (selectedAction === "delete") {
      Swal.fire({
        title: "Are you sure?",
        text: "This module will be deleted permanently!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
        background: "#181817",
        color: "#fff",
      }).then((result) => {
        if (result.isConfirmed) deleteModule(courseId);
        resetSelect(courseId);
      });
    } else if (selectedAction === "assign-toggle") {
      setCourses((prev) =>
        prev.map((course) =>
          course.id === courseId
            ? { ...course, assigned: !course.assigned }
            : course
        )
      );
      resetSelect(courseId);
    } else {
      resetSelect(courseId);
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.author_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[87vh] min-h-[calc(100dvh-4.5rem)] w-full max-w-full flex-col overflow-hidden rounded-lg bg-[#282828] p-4 sm:p-5 md:h-[87vh] md:min-h-0 md:p-6 md:pb-8">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden pb-6 sm:gap-6 sm:pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold text-white sm:text-2xl md:text-3xl">
            Customized Modules
          </h1>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <motion.button
              whileTap={{ scale: 1.05 }}
              type="button"
              onClick={onNewcourse}
              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#8b7ce8]"
            >
              <FaPlus className="h-4 w-4" /> Create
            </motion.button>
            <div className="flex min-h-[44px] flex-1 min-w-0 items-center gap-2 rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2.5 transition-colors focus-within:border-[#A294F9] focus-within:ring-2 focus-within:ring-[#A294F9]/30">
              <FaSearch className="h-5 w-5 shrink-0 text-gray-300" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-w-0 flex-1 border-none bg-transparent text-white outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-[#5a5a5a] bg-[#353535] py-16">
            <p className="text-gray-400">Loading modules...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-[#5a5a5a] bg-[#353535] py-16 text-center">
            <p className="text-gray-400">
              No custom modules found. Create one to get started!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
            {filteredCourses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 inline-block rounded-md bg-[#282828] px-3 py-1.5 text-xs font-medium text-white">
                    {course.total_chapters ?? 0} chapters
                  </div>
                  <h2 className="truncate text-lg font-medium text-white">
                    {course.name}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-400">
                    {course.author_name
                      ? `${course.author_name}${course.author_designation ? ` (${course.author_designation})` : ""}`
                      : "No Author"}
                  </p>
                  {course.desc && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                      {course.desc}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center">
                  <select
                    value={selectedActions[course.id] ?? ""}
                    onChange={(e) => {
                      setSelectedActions((prev) => ({
                        ...prev,
                        [course.id]: e.target.value,
                      }));
                      handleActionChange(e, course.id);
                    }}
                    className="rounded-lg border border-[#5a5a5a] bg-[#535353] px-4 py-2.5 text-sm font-medium text-white outline-none focus:border-[#A294F9] focus:ring-2 focus:ring-[#A294F9]/30"
                  >
                    <option value="">Options</option>
                    <option value="view">View</option>
                    <option value="edit">Edit</option>
                    <option value="delete">Delete</option>
                    <option value="assign">Assign to Students</option>
                  </select>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomLearning;
