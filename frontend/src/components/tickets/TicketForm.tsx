import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketApi } from '../../api/tickets';
import { ticketKeys } from '../../hooks/useTickets';
import { useToastStore } from '../../store/useToastStore';
import type { CreateTicketRequest, TicketCategory, TicketPriority } from '../../types/ticket';

interface TicketFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TicketForm({ onSuccess, onCancel }: TicketFormProps) {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateTicketRequest>({
    defaultValues: {
      category: 'IT_SUPPORT' as TicketCategory,
      priority: 'LOW' as TicketPriority,
      title: '',
      description: '',
      preferredContact: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateTicketRequest) => ticketApi.createTicket(data),
    onSuccess: () => {
      // Invalidate the tickets lists so the new ticket immediately appears in the UI
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      addToast('Ticket created successfully!', 'success');
      reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to create ticket.';
      setApiError(msg);
      addToast(msg, 'error');
    },
  });

  const onSubmit = (data: CreateTicketRequest) => {
    setApiError(null);
    mutation.mutate(data);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden w-full max-w-2xl mx-auto animate-in slide-in-from-bottom duration-500">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Create New Ticket</h3>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
        {apiError && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {apiError}
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title*</label>
          <input
            {...register('title', { required: 'Title is required', minLength: { value: 5, message: 'Minimum 5 characters' } })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            placeholder="E.g., Projector in Room 301 is not working"
          />
          {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
        </div>

        {/* Two Column Layout for Category & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category*</label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            >
              {['IT_SUPPORT', 'MAINTENANCE', 'CLEANING', 'SECURITY', 'OTHER'].map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority*</label>
            <select
              {...register('priority', { required: 'Priority is required' })}
              className="w-full px-4 py-2 border border-gray-300 bg-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            >
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((pri) => (
                <option key={pri} value={pri}>
                  {pri}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Detailed Description*</label>
          <textarea
            {...register('description', { required: 'Description is required', minLength: { value: 10, message: 'Please provide more details' } })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow resize-y"
            placeholder="Please describe the issue in detail to help our technicians resolve it quickly."
          />
          {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
        </div>

        {/* Preferred Contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Contact (Optional)</label>
          <input
            {...register('preferredContact')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            placeholder="Phone number or alternative email"
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              'Submit Ticket'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
