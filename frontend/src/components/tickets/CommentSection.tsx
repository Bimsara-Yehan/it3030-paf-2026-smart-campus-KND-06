import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTicketComments, ticketKeys } from '../../hooks/useTickets';
import { ticketApi } from '../../api/tickets';

export default function CommentSection({ ticketId }: { ticketId: string }) {
  const queryClient = useQueryClient();
  const { data: comments, isLoading } = useTicketComments(ticketId);
  const [newComment, setNewComment] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (message: string) => ticketApi.addComment(ticketId, { message }),
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ticketKeys.comments(ticketId) });
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Failed to post comment.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setErrorMsg(null);
    mutation.mutate(newComment.trim());
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Activity & Comments</h3>
        <span className="bg-gray-200 text-gray-700 py-0.5 px-2.5 rounded-full text-xs font-medium">
          {comments?.length || 0}
        </span>
      </div>
      <div className="p-6">
        {/* Comments List */}
        <div className="space-y-6 mb-8 max-h-[500px] overflow-y-auto pr-2">
          {isLoading ? (
            <p className="text-sm text-gray-500 animate-pulse text-center">Loading activity...</p>
          ) : comments?.length === 0 ? (
            <p className="text-sm text-gray-500 text-center italic">No comments yet. Be the first to add an update.</p>
          ) : (
            <div className="space-y-6">
              {comments?.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-bold uppercase">{comment.authorName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-none p-4 border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-sm text-gray-900">{comment.authorName}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-6">
          {errorMsg && <p className="text-red-500 text-sm mb-2">{errorMsg}</p>}
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 outline-none transition-all resize-none"
                placeholder="Write a comment or status update..."
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={mutation.isPending || !newComment.trim()}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {mutation.isPending ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
