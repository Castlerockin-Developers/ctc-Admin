import React from "react";
import { useNavigate } from "react-router-dom";
import { logout, ACCESS_DENIED_MESSAGE } from "../scripts/AuthProvider";

const AccessDeniedPage = () => {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    // Ensure any existing session is cleared before returning to login
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="relative w-full max-w-md rounded-3xl bg-[#181817] px-8 py-10 shadow-2xl shadow-black/60 border border-white/10">
        <div className="mb-4 text-center">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
            Access denied
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            {ACCESS_DENIED_MESSAGE}
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={handleBackToLogin}
            className="inline-flex items-center justify-center rounded-full bg-[#A294F9] px-6 py-2.5 text-sm sm:text-base font-semibold text-black shadow-lg shadow-[#A294F9]/30 transition-transform transition-colors hover:bg-[#8b7ce8] hover:shadow-[#A294F9]/40 active:scale-95"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedPage;

