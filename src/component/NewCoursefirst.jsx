import React, { useRef, useState } from "react";
import { log, error as logError } from "../utils/logger";
import { motion } from "framer-motion";
import { FaChevronLeft, FaCloudUploadAlt } from "react-icons/fa";
import { authFetch } from "../scripts/AuthProvider";
import Swal from "sweetalert2";

const inputClass =
  "w-full rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#A294F9] focus:ring-2 focus:ring-[#A294F9]/30";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-300";

const NewCoursefirst = ({ onBackc, onNextc }) => {
  const fileInputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    faculty: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    setFiles(Array.from(event.target.files));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const createModule = async () => {
    if (!formData.name?.trim() || !formData.description?.trim()) {
      Swal.fire({
        title: "Error!",
        text: "Please fill all required fields.",
        icon: "error",
        background: "#181817",
        color: "#fff",
      });
      return false;
    }
    if (files.length === 0) {
      Swal.fire({
        title: "Error!",
        text: "Please upload an image for the module.",
        icon: "error",
        background: "#181817",
        color: "#fff",
      });
      return false;
    }

    try {
      setLoading(true);
      log("Creating module with data:", {
        name: formData.name,
        description: formData.description,
        imageFile: files[0]?.name,
      });

      const moduleData = new FormData();
      moduleData.append("name", formData.name);
      moduleData.append("desc", formData.description);
      moduleData.append("image", files[0]);

      const response = await authFetch("/learning/custom-modules/", {
        method: "POST",
        body: moduleData,
      });

      if (response.ok) {
        const result = await response.json();
        log("Module created successfully:", result);
        localStorage.setItem("currentModuleId", result.module_id);
        localStorage.setItem("currentModuleName", formData.name);
        Swal.fire({
          title: "Success!",
          text: "Module created successfully!",
          icon: "success",
          iconColor: "#A294F9",
          background: "#181817",
          color: "#fff",
        });
        return true;
      }
      const errorText = await response.text();
      throw new Error(errorText || "Failed to create module");
    } catch (error) {
      logError("Error creating module:", error);
      let errorMessage = "Failed to create module. Please try again.";
      if (error.message?.includes("Failed to fetch"))
        errorMessage =
          "Network error: Unable to connect. Check your connection and try again.";
      else if (error.message?.includes("401"))
        errorMessage = "Authentication error: Please log in again.";
      else if (error.message?.includes("403"))
        errorMessage = "Permission denied.";
      else if (error.message) errorMessage = error.message;
      Swal.fire({
        title: "Error!",
        text: errorMessage,
        icon: "error",
        background: "#181817",
        color: "#fff",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    const success = await createModule();
    if (success) onNextc();
  };

  return (
    <div className="flex h-[87vh] min-h-[calc(100dvh-4.5rem)] w-full max-w-full flex-col overflow-y-auto rounded-lg bg-[#282828] p-4 sm:p-5 md:p-6 md:pb-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBackc}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] text-white transition-colors hover:bg-[#4a4a4a]"
            aria-label="Back"
          >
            <FaChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">
              Create New Module
            </h1>
            <div className="mt-1 h-0.5 w-full rounded bg-[#5a5a5a]" />
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className={labelClass}>
              Module Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter module name..."
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className={labelClass}>Faculty Name</label>
            <input
              type="text"
              name="faculty"
              value={formData.faculty}
              onChange={handleInputChange}
              placeholder="Enter faculty name (optional)..."
              className={inputClass}
            />
          </div>
          <div className="h-px bg-[#5a5a5a]" />
          <div>
            <label className={labelClass}>
              Module Description <span className="text-red-400">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter module description..."
              rows={5}
              className={`${inputClass} min-h-[120px] resize-y`}
              required
            />
          </div>
          <div>
            <label className={labelClass}>
              Upload Image <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div
                className={`flex min-h-[48px] flex-1 items-center rounded-lg border border-[#5a5a5a] bg-[#3d3d3d] px-4 py-2.5 text-sm ${files.length ? "text-white" : "text-gray-500"}`}
              >
                {files.length === 0
                  ? "No file chosen"
                  : files.length === 1
                    ? files[0].name
                    : `${files.length} files selected`}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <motion.button
                type="button"
                whileTap={{ scale: 1.05 }}
                onClick={handleUploadClick}
                className="inline-flex items-center cursor-pointer justify-center gap-2 rounded-lg bg-[#A294F9] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#8b7ce8]"
              >
                <FaCloudUploadAlt className="h-4 w-4" /> Upload
              </motion.button>
            </div>
          </div>
          <div className="h-px bg-[#5a5a5a]" />
          <div className="flex flex-wrap items-center justify-center gap-4 pt-6 sm:gap-8">
            <button
              type="button"
              onClick={onBackc}
              className="rounded-lg border cursor-pointer border-[#5a5a5a] bg-[#3d3d3d] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#4a4a4a]"
            >
              Back
            </button>
            <span className="text-sm font-medium text-gray-400">Step 1/3</span>
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="rounded-lg bg-[#8E5DAF] cursor-pointer px-5 py-2.5 text-sm font-medium text-white hover:bg-[#7421ac] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewCoursefirst;
