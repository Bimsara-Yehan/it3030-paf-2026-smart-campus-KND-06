import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import type { ApiResponse, Resource } from '../../types';

const CreateBookingPage: React.FC = () => {
  const navigate = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    resourceId: '',
    startTime: '',
    endTime: '',
    purpose: '',
    attendees: 1,
  });

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await axiosClient.get<ApiResponse<Resource[]>>('/resources');
        setResources(response.data.data);
      } catch (err) {
        setError('Failed to load resources.');
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Date validation
    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      setError('End time must be after start time.');
      return;
    }

    setSubmitting(true);
    try {
      await axiosClient.post('/bookings', formData);
      navigate('/bookings');
    } catch (err: any) {
      console.error('Booking failed:', err);
      // Capture the specific error message from the backend if available
      const serverMessage = err.response?.data?.message || err.message;
      setError(serverMessage || 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-amber-700">Preparing booking form...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-2xl">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Request Resource</h1>
        <p className="text-gray-500 mb-8 font-medium">Book a campus resource for your activity.</p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Select Resource</label>
            <select
              required
              value={formData.resourceId}
              onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium appearance-none text-gray-900"
            >
              <option value="">Choose a resource...</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.type})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Start Date & Time</label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">End Date & Time</label>
              <input
                type="datetime-local"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Number of Attendees</label>
            <input
              type="number"
              min="1"
              required
              value={formData.attendees}
              onChange={(e) => setFormData({ ...formData, attendees: parseInt(e.target.value) || 1 })}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium text-gray-900"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">Purpose / Notes</label>
            <textarea
              rows={4}
              placeholder="Tell us why you need this resource..."
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all font-medium resize-none text-gray-900"
            />
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/bookings')}
              className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-2 py-4 px-8 bg-amber-700 text-white font-bold rounded-2xl shadow-lg shadow-amber-200 hover:bg-amber-800 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 active:scale-95"
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBookingPage;
