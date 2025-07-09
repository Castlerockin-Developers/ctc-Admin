// ManageLoader.jsx
import React from 'react';
import './ManageLoader.css';

const ManageLoader = () => {
    return (
        <div className="p-6 animate-pulse w-full overflow-x-auto">
            {/* Search Bar */}
            <div className="h-10 w-full md:w-40 bg-gray-600 rounded mb-4" />

            <div className="flex flex-wrap justify-between items-center gap-4">
                {/* Left filters */}
                <div className="flex flex-wrap gap-2 filter-optn">
                    <div className="h-6 w-20 sm:w-24 md:w-28 bg-gray-600 rounded mb-4" />
                    <div className="h-6 w-20 sm:w-24 md:w-28 bg-gray-600 rounded mb-4" />
                    {/* hide this from md downward */}
                    <div className="h-6 w-20 sm:w-24 md:w-28 bg-gray-600 rounded mb-4 hidden md:block" />
                </div>

                {/* Right filters */}
                <div className="flex flex-wrap gap-2 filter-optn">
                    {/* these only start showing at md */}
                    <div className="h-10 w-full sm:w-40 md:w-48 bg-gray-600 rounded hidden sm:block" />
                    <div className="h-10 w-full sm:w-40 md:w-48 bg-gray-600 rounded hidden sm:block" />
                    <div className="h-10 w-full sm:w-40 md:w-48 bg-gray-600 rounded" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-700 rounded border border-gray-600 p-4 space-y-2 bottom-stats mt-6">
                {[...Array(16)].map((_, i) => (
                    <div
                        key={i}
                        className="h-6 bg-gray-600 rounded w-full md:w-full lg:w-full row-space"
                    />
                ))}
            </div>
        </div>
    );
};

export default ManageLoader;
