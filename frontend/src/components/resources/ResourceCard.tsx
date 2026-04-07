import React from 'react';
import { ResourceResponse } from '../../api/resourceApi';
import { ResourceBadge } from './ResourceBadge';

interface ResourceCardProps {
    resource: ResourceResponse;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
    return (
        <div className="group relative bg-[#0f1115] border border-gray-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] flex flex-col">
            
            {/* Top Graphic Area */}
            <div className="h-24 w-full bg-gradient-to-br from-gray-800/50 to-gray-900/50 relative overflow-hidden group-hover:from-indigo-900/20 group-hover:to-purple-900/20 transition-all duration-500">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                
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

                <h3 className="text-xl font-bold text-gray-100 mt-2 mb-1 group-hover:text-indigo-300 transition-colors">
                    {resource.name}
                </h3>
                
                <p className="text-sm text-gray-400 mb-6 flex-grow line-clamp-2">
                    {resource.description || 'No description provided.'}
                </p>

                {/* Specs Box */}
                <div className="grid grid-cols-2 gap-4 mt-auto border-t border-gray-800/60 pt-5">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Capacity</span>
                        <span className="text-sm text-gray-300 font-medium">{resource.capacity || 'N/A'} Seats</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 uppercase tracking-wider mb-1">Location</span>
                        <span className="text-sm text-gray-300 font-medium truncate" title={resource.location}>
                            {resource.location || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
            
            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 pointer-events-none transition-all duration-300"></div>
        </div>
    );
};
