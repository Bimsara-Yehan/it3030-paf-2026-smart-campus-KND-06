import React from 'react';
import type { ResourceResponse } from '../../api/resourceApi';
import { ResourceBadge } from './ResourceBadge';

interface ResourceCardProps {
    resource: ResourceResponse;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
    return (
        <div className="group relative bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-indigo-400 transition-all duration-300 hover:shadow-xl flex flex-col">
            
            {/* Top Graphic Area */}
            <div className="h-24 w-full bg-gradient-to-br from-indigo-50 to-blue-50 relative overflow-hidden group-hover:from-indigo-100 group-hover:to-blue-100 transition-all duration-500">
                {/* Status Indicator */}
                <div className="absolute top-4 right-4 z-10">
                    <ResourceBadge text={resource.status} type="status" />
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 flex flex-col flex-grow relative z-10 -mt-8">
                
                {/* Floating Type Badge */}
                <div className="mb-4">
                    <ResourceBadge text={resource.type} type="type" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mt-2 mb-1 group-hover:text-indigo-600 transition-colors">
                    {resource.name}
                </h3>
                
                <p className="text-sm text-gray-500 mb-6 flex-grow line-clamp-2">
                    {resource.description || 'No description provided.'}
                </p>

                {/* Specs Box */}
                <div className="grid grid-cols-2 gap-4 mt-auto border-t border-gray-100 pt-5">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                            {resource.type === 'EQUIPMENT' ? 'Quantity' : 'Capacity'}
                        </span>
                        <span className="text-sm text-gray-800 font-medium">
                            {resource.capacity || 'N/A'} {resource.type === 'EQUIPMENT' ? 'Units' : 'Seats'}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 uppercase tracking-wider mb-1">Location</span>
                        <span className="text-sm text-gray-800 font-medium truncate" title={resource.location}>
                            {resource.location || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 pointer-events-none transition-all duration-300"></div>
        </div>
    );
};
