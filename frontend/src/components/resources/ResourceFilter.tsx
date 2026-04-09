import React, { useState } from 'react';

interface ResourceFilterProps {
    onFilterChange: (type: string, capacity: number, location: string, naturalQuery?: string) => void;
}

export const ResourceFilter: React.FC<ResourceFilterProps> = ({ onFilterChange }) => {
    const [type, setType] = useState('');
    const [capacity, setCapacity] = useState('');
    const [location, setLocation] = useState('');
    const [naturalQuery, setNaturalQuery] = useState('');

    const handleApply = () => {
        onFilterChange(type, capacity ? parseInt(capacity) : 0, location, naturalQuery);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-md mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                AI Smart Search & Standard Filters
            </h3>
            
            {/* Novelty AI Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="e.g., 'I need a massive lecture hall in the North Wing for 200 students'"
                        className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block pl-11 p-3.5 shadow-sm transition-all"
                        value={naturalQuery}
                        onChange={(e) => setNaturalQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block mb-2 text-xs font-medium text-gray-600 uppercase tracking-wider">Resource Type</label>
                    <select
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 transition-colors shadow-sm"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="LECTURE_HALL">Lecture Hall</option>
                        <option value="LAB">Laboratory</option>
                        <option value="MEETING_ROOM">Meeting Room</option>
                        <option value="EQUIPMENT">Equipment</option>
                    </select>
                </div>
                <div>
                    <label className="block mb-2 text-xs font-medium text-gray-600 uppercase tracking-wider">Min Capacity</label>
                    <input
                        type="number"
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 transition-colors shadow-sm"
                        placeholder="e.g. 50"
                        value={capacity}
                        onChange={(e) => setCapacity(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block mb-2 text-xs font-medium text-gray-600 uppercase tracking-wider">Location Scope</label>
                    <input
                        type="text"
                        className="bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 transition-colors shadow-sm"
                        placeholder="e.g. North Wing"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                    />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={handleApply}
                        className="w-full text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-xl text-sm px-5 py-2.5 text-center transition-all shadow-md shadow-indigo-200"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
};
