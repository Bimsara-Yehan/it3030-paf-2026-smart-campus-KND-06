import React, from 'react';

interface ResourceFilterProps {
    onFilterChange: (type: string, capacity: number, location: string) => void;
}

export const ResourceFilter: React.FC<ResourceFilterProps> = ({ onFilterChange }) => {
    // Keeping it visually minimalist but functional
    return (
        <div className="bg-[#14161c] border border-gray-800 p-5 rounded-2xl mb-8 flex flex-wrap gap-4 items-end shadow-lg">
            <div className="flex-grow">
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Resource Type</label>
                <select 
                    onChange={(e) => onFilterChange(e.target.value, 0, '')} 
                    className="w-full bg-[#0f1115] border border-gray-700 text-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                >
                    <option value="">All Types</option>
                    <option value="LECTURE_HALL">Lecture Hall</option>
                    <option value="LAB">Laboratory</option>
                    <option value="MEETING_ROOM">Meeting Room</option>
                    <option value="EQUIPMENT">Equipment</option>
                </select>
            </div>
            
            <div className="flex-grow">
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Min Capacity</label>
                <input 
                    type="number" 
                    placeholder="e.g. 50" 
                    onChange={(e) => onFilterChange('', parseInt(e.target.value), '')}
                    className="w-full bg-[#0f1115] border border-gray-700 text-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-600"
                />
            </div>

            <div className="flex-grow">
                <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">Location</label>
                <input 
                    type="text" 
                    placeholder="e.g. North Wing" 
                    onChange={(e) => onFilterChange('', 0, e.target.value)}
                    className="w-full bg-[#0f1115] border border-gray-700 text-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-600"
                />
            </div>
        </div>
    );
};
