import React from 'react';

type BadgeType = 'status' | 'type';

interface ResourceBadgeProps {
    text: string;
    type: BadgeType;
}

export const ResourceBadge: React.FC<ResourceBadgeProps> = ({ text, type }) => {
    
    // Premium dynamic coloring depending on the word
    const getBadgeStyle = () => {
        if (type === 'type') {
            return `bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-indigo-400 border border-indigo-500/20`;
        }
        
        switch (text.toUpperCase()) {
            case 'ACTIVE':
                return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
            case 'OUT_OF_SERVICE':
                return 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]';
            default:
                return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
        }
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${getBadgeStyle()}`}>
            {text.replace('_', ' ')}
        </span>
    );
};
