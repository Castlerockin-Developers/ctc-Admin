import React from 'react';
import './SettingsLoader.css';

const SettingsLoader = () => {
    return (
        <div className="p-4 sm:p-6 animate-pulse w-full overflow-x-auto">
            {/* Search Bar */}
            <div className="h-8 sm:h-10 w-full md:w-40 bg-transparent rounded mb-2 mt-6 sm:mt-10" />
            <div className="h-8 sm:h-10 w-20 sm:w-24 md:w-44 bg-[#333] rounded mb-4 setting-title" />

            <div className="h-64 sm:h-80 md:h-98 w-full bg-[#333] rounded mb-4 setting-title grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
                <div>
                    <div className='flex flex-col sm:flex-row'>
                        <div className="h-24 sm:h-32 w-16 sm:w-20 md:w-38 bg-[#4b4b4b] rounded mb-4 setting-profile z-10" />
                        <div className='flex flex-col gap-4 sm:gap-6 setting-username'>
                            <div className='flex gap-2'>
                                <div className="h-4 sm:h-6 w-16 sm:w-20 lg:w-30 bg-[#4b4b4b] rounded mb-2 sm:mb-4 z-10" />
                                <div className="h-4 sm:h-6 w-16 sm:w-20 lg:w-30 bg-[#4b4b4b] rounded mb-2 sm:mb-4 z-10" />
                            </div>
                            <div className='flex gap-2'>
                                <div className="h-4 sm:h-6 w-16 sm:w-20 md:w-30 bg-[#4b4b4b] rounded mb-2 sm:mb-4 z-10" />
                                <div className="h-4 sm:h-6 w-16 sm:w-20 md:w-30 bg-[#4b4b4b] rounded mb-2 sm:mb-4 z-10" />
                            </div>
                            <div className='flex gap-2'>
                                <div className="h-4 sm:h-6 w-16 sm:w-20 md:w-30 bg-[#4b4b4b] rounded mb-2 sm:mb-4 z-10" />
                                <div className="h-4 sm:h-6 w-16 sm:w-20 md:w-30 bg-[#4b4b4b] rounded mb-2 sm:mb-4 z-10" />
                            </div>
                        </div>
                    </div>
                    <div className='flex'>
                        <div className="h-24 sm:h-32 w-full bg-[#4b4b4b] rounded mb-4 setting-manager z-10" />
                    </div>
                </div>

                <div className="h-64 sm:h-78 w-3/4 bg-[#4b4b4b] rounded mb-4 setting-activity z-10">
                    <div className="h-4 sm:h-6 w-16 sm:w-20 md:w-28 bg-gray-400 rounded mb-4 z-10 setting-activity-title" />
                    <div className="h-3 sm:h-4 w-full bg-gray-400 rounded mb-2 sm:mb-4 z-10 setting-activity-p" />
                    <div className="h-3 sm:h-4 w-full bg-gray-400 rounded mb-2 sm:mb-4 z-10 setting-activity-p" />
                    <div className="h-3 sm:h-4 w-full bg-gray-400 rounded mb-2 sm:mb-4 z-10 setting-activity-p" />
                    <div className="h-3 sm:h-4 w-full bg-gray-400 rounded mb-2 sm:mb-4 z-10 setting-activity-p" />
                    <div className="h-3 sm:h-4 w-full bg-gray-400 rounded mb-2 sm:mb-4 z-10 setting-activity-p" />
                    <div className="h-3 sm:h-4 w-full bg-gray-400 rounded mb-2 sm:mb-4 z-10 setting-activity-p" />
                    <div className="h-3 sm:h-4 w-full bg-gray-400 rounded mb-2 sm:mb-4 z-10 setting-activity-p" />
                    <div className="h-3 sm:h-4 w-full bg-gray-400 rounded mb-2 sm:mb-4 z-10 setting-activity-p" />
                </div>
            </div>

            <div className='flex flex-col sm:flex-row justify-between w-full gap-4'>
                <div className='h-6 w-full sm:w-20 md:w-44 bg-[#333] rounded mb-4 setting-title' />
                <div className='flex gap-2'>
                    <div className='h-6 w-full sm:w-20 md:w-44 bg-[#333] rounded mb-4 setting-title' />
                    <div className='h-6 w-full sm:w-20 md:w-44 bg-[#333] rounded mb-4 setting-title' />
                </div>
            </div>
            <div className='h-32 sm:h-50 w-full bg-[#333] rounded mb-4 setting-title'/>
        </div>
    )
}

export default SettingsLoader