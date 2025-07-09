// DashboardLoader.jsx
import React from 'react';
import './DashboardLoader.css'

const DashboardLoader = () => (
    <div className="p-6 animate-pulse">
        {/* top stats row */}
        <div className="h-14 w-52 bg-gray-600 rounded title" />
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-4 top-stats">
            {[...Array(3)].map((_, i) => (
                <div
                    key={i}
                    className="h-24 bg-gray-700 rounded border border-gray-600"
                />
            ))}
        </div>

        {/* main content row */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-3 gap-4">
            {/* Recent Tests */}
            <div className="bg-gray-700 rounded border border-gray-600 p-4 space-y-2">
                <div className="h-28 bg-gray-600 rounded w-1/3 row-space" />
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-600 rounded row-space" />
                ))}
            </div>

            {/* Completed Results */}
            <div className="bg-gray-700 rounded border border-gray-600 p-4 space-y-2">
                <div className="h-28 bg-gray-600 rounded w-full md:w-1/3 row-space" />
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-600 rounded row-space" />
                ))}
            </div>


            {/* Quick links & Notifications */}
            <div className="space-y-4">
                <div className="bg-gray-700 rounded border border-gray-600 p-4 space-y-2 bottom-stats">
                    <div className="h-14 bg-gray-600 rounded w-1/2 row-space" />
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-6 bg-gray-600 rounded w-3/4 row-space" />
                    ))}
                </div>
                <div className="bg-gray-700 rounded border border-gray-600 p-4 space-y-2">
                    <div className="h-28 bg-gray-600 rounded w-1/2 row-space" />
                    <div className="h-14 bg-gray-600 rounded row-space" />
                </div>
            </div>
        </div>
    </div>
);

export default DashboardLoader;
