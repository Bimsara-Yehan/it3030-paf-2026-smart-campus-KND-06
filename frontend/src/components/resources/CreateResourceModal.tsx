import React, { useState } from 'react';
import { createResource } from '../../api/resourceApi';

interface CreateResourceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateResourceModal: React.FC<CreateResourceModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('LECTURE_HALL');
    const [capacity, setCapacity] = useState<number | ''>('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // If modal is closed, don't render its contents
    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await createResource({
                name,
                type,
                capacity: typeof capacity === 'number' ? capacity : 0,
                location,
                description
            });
            onSuccess(); // Triggers refetch on the parent
            onClose();   // Closes the modal
            
            // Reset state for future openings
            setName('');
            setType('LECTURE_HALL');
            setCapacity('');
            setLocation('');
            setDescription('');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create resource. Please check inputs.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">Register New Resource</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800 transition-colors p-1"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-grow custom-scrollbar">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <form id="create-resource-form" onSubmit={handleSubmit} className="space-y-4">
                        
                        {/* Name */}
                        <div>
                            <label className="block mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Resource Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Main Computing Lab"
                                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3 outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* Type & Capacity Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    Type *
                                </label>
                                <select
                                    required
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3 outline-none transition-all shadow-sm"
                                >
                                    <option value="LECTURE_HALL">Lecture Hall</option>
                                    <option value="LAB">Laboratory</option>
                                    <option value="MEETING_ROOM">Meeting Room</option>
                                    <option value="EQUIPMENT">Equipment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    {type === 'EQUIPMENT' ? 'Quantity *' : 'Capacity (Seats) *'}
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    value={capacity}
                                    onChange={(e) => setCapacity(parseInt(e.target.value) || '')}
                                    placeholder={type === 'EQUIPMENT' ? 'e.g., 5' : 'e.g., 50'}
                                    className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3 outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Location Parameter
                            </label>
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g., South Wing, Floor 3"
                                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3 outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block mb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Details / Specifications
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Describe the physical condition, equipment limits, etc."
                                className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3 outline-none transition-all resize-none shadow-sm"
                            ></textarea>
                        </div>
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl transition-all shadow-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="create-resource-form"
                        disabled={isSubmitting}
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center min-w-[120px] disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                        ) : (
                            'Submit Asset'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
