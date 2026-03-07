import React from "react";

const Spinner = ({ className = "" }) => (
  <div
    className={`flex flex-col items-center justify-center gap-3 p-8 ${className}`}
    role="status"
    aria-label="Loading"
  >
    <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#555] border-t-[#A294F9]" />
    <p className="text-sm text-gray-400">Loading...</p>
  </div>
);

export default Spinner;
