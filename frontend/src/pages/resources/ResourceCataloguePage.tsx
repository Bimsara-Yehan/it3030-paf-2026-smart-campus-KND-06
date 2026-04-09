import React, { useState } from 'react';
import { useResources } from '../../hooks/useResources';
import { ResourceCard } from '../../components/resources/ResourceCard';
import { ResourceFilter } from '../../components/resources/ResourceFilter';
import { CreateResourceModal } from '../../components/resources/CreateResourceModal';

export const ResourceCataloguePage: React.FC = () => {
    const [filterType, setFilterType] = useState<string>('');
    const [filterCapacity, setFilterCapacity] = useState<number>(0);
    const [filterLocation, setFilterLocation] = useState<string>('');
    const [naturalQuery, setNaturalQuery] = useState<string>('');
    
    // Manage modal visibility
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Custom hook bringing in the data from the backend!
    const { resources, loading, error, refetch } = useResources(filterType, filterCapacity, filterLocation, naturalQuery);

    const handleFilterChange = (type: string, capacity: number, location: string, natQ?: string) => {
        setFilterType(type || '');
        setFilterCapacity(capacity || 0);
        setFilterLocation(location || '');
        setNaturalQuery(natQ || '');
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800 p-8 pt-12 relative">
            
            {/* Modal Injection */}
            <CreateResourceModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onSuccess={() => refetch()} 
            />

            <div className="max-w-7xl mx-auto">
                
                {/* Header Section */}
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
                            Facilities & Assets
                        </h1>
                        <p className="text-gray-600 max-w-xl">
                            Browse and retrieve detailed metadata on lecture halls, laboratories, meeting rooms, and shared equipment available across the campus grid.
                        </p>
                    </div>
                    {/* Trigger button for Admin Form */}
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-[0_0_20px_rgba(79,70,229,0.2)] transition-all"
                    >
                        + New Resource
                    </button>
                </div>

                <ResourceFilter onFilterChange={handleFilterChange} />

                {/* State Handling */}
                {loading && (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl">
                        Error fetching catalogue: {error}
                    </div>
                )}

                {/* Grid Layout */}
                {!loading && !error && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {resources.map((resource) => (
                            <ResourceCard key={resource.id} resource={resource} />
                        ))}
                    </div>
                )}

                {!loading && !error && resources.length === 0 && (
                    <div className="text-center py-20 text-gray-500 bg-white border border-dashed border-gray-300 rounded-2xl">
                        No resources match your precise grid filters.
                    </div>
                )}

            </div>
        </div>
    );
};
