import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { ticketApi } from '../../api/tickets';
import { ticketKeys } from '../../hooks/useTickets';
import { useToastStore } from '../../store/useToastStore';
import type { CreateTicketRequest, TicketCategory, TicketPriority } from '../../types/ticket';
import { predictTicketDetails, type AIPrediction } from '../../utils/aiPredictor';
import { useEffect } from 'react';

interface TicketFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TicketForm({ onSuccess, onCancel }: TicketFormProps) {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const [apiError, setApiError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
    mutationFn: async (data: CreateTicketRequest) => {
      // 1. Create the ticket first
      const ticket = await ticketApi.createTicket(data);
      
      // 2. If there are files, upload them sequentially
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          try {
            await ticketApi.uploadAttachment(ticket.id, file);
          } catch (err) {
            console.error(`Failed to upload ${file.name}`, err);
            // We continue with other files even if one fails
          }
        }
      }
      return ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.lists() });
      addToast('Ticket created successfully with attachments!', 'success');
      reset();
      setSelectedFiles([]);
      onSuccess?.();
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Failed to create ticket.';
      setApiError(msg);
      addToast(msg, 'error');
    },
  });

  // Watch for AI and Duplicate Detection
  const title = watch('title');
  const description = watch('description');
  const [aiBanner, setAiBanner] = useState<AIPrediction | null>(null);
  
  // Debounced search for similar tickets
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      if (title && title.length >= 5) {
        setDebouncedQuery(title);
      } else {
        setDebouncedQuery('');
      }
    }, 600);
    return () => clearTimeout(handler);
  }, [title]);

  const { data: similarTickets } = useQuery({
    queryKey: ['tickets', 'similar', debouncedQuery],
    queryFn: () => ticketApi.getSimilarTickets(debouncedQuery),
    enabled: debouncedQuery.length >= 5,
  });

  // AI Predictor logic
  useEffect(() => {
    const combinedText = `${title || ''} ${description || ''}`;
    if (combinedText.length > 10) {
      const pred = predictTicketDetails(combinedText);
      if (pred) {
        if (pred.category) setValue('category', pred.category);
        if (pred.priority) setValue('priority', pred.priority);
        setAiBanner(pred);
      } else {
        setAiBanner(null);
      }
    } else {
      setAiBanner(null);
    }
  }, [title, description, setValue]);

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

        {/* AI Predictor Banner */}
        {aiBanner && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start gap-3 animate-in fade-in duration-300">
            <span className="text-xl">🤖</span>
            <div>
              <p className="text-sm font-semibold text-purple-800">AI Assistant Auto-Selected Fields</p>
              <p className="text-xs text-purple-600 mt-0.5">{aiBanner.reason} Category set to <span className="font-bold">{aiBanner.category?.replace('_', ' ')}</span> and Priority to <span className="font-bold">{aiBanner.priority}</span>.</p>
            </div>
          </div>
        )}

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Contact (Optional)</label>
            <input
              {...register('preferredContact')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
              placeholder="Phone number or alternative email"
            />
          </div>
          
          <div className="md:col-span-1">
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Supporting Documents ({selectedFiles.length}/3)
             </label>
             <div className="relative">
               <input
                 type="file"
                 multiple
                 accept="image/*,.pdf,.doc,.docx"
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 onChange={(e) => {
                   const files = Array.from(e.target.files || []);
                   if (selectedFiles.length + files.length > 3) {
                     addToast('Maximum 3 files allowed', 'warning');
                     return;
                   }
                   setSelectedFiles([...selectedFiles, ...files]);
                 }}
               />
               <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                 <div className="flex items-center gap-2 text-blue-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-xs font-semibold">Attach Files</span>
                 </div>
               </div>
             </div>
              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-gray-100 p-1.5 rounded border border-gray-200">
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button 
                        type="button"
                        onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
           </div>
         </div>

         {/* Smart Duplicate Detector */}
         {similarTickets && similarTickets.length > 0 && (
           <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 animate-in slide-in-from-top-2 duration-300">
             <div className="flex items-center gap-2 text-orange-800 font-semibold mb-2">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
               Wait, is your issue already reported?
             </div>
             <p className="text-xs text-orange-700 mb-3">We found {similarTickets.length} active ticket(s) that match your report. Submitting a duplicate may slow down resolution time.</p>
             <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
               {similarTickets.map(ticket => (
                 <div key={ticket.id} className="bg-white border border-orange-100 rounded-lg p-2 text-sm flex justify-between items-center shadow-sm">
                   <div className="truncate pr-4 flex-1">
                     <span className="font-semibold text-gray-800">{ticket.title}</span> 
                     <span className="text-gray-500 text-xs ml-2">({ticket.status})</span>
                   </div>
                   <span className="px-2 py-1 bg-orange-100 text-orange-800 text-[10px] font-bold rounded-full whitespace-nowrap">SIMILAR</span>
                 </div>
               ))}
             </div>
             <div className="mt-3 text-xs text-orange-600 font-medium">Please verify before clicking Submit!</div>
           </div>
         )}

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
