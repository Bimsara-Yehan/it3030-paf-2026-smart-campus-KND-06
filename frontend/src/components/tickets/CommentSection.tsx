import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTicketComments, ticketKeys } from '../../hooks/useTickets';
import { ticketApi } from '../../api/tickets';
import { useAuth } from '../../context/AuthContext';

export default function CommentSection({ ticketId }: { ticketId: string }) {
  const queryClient = useQueryClient();
  const { data: comments, isLoading } = useTicketComments(ticketId);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { user: currentUser } = useAuth();

  const mutation = useMutation({
    mutationFn: (message: string) => ticketApi.addComment(ticketId, { content: message }),
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ticketKeys.comments(ticketId) });
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Failed to post comment.');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) => 
      ticketApi.updateComment(commentId, { content }),
    onSuccess: () => {
      setEditingCommentId(null);
      queryClient.invalidateQueries({ queryKey: ticketKeys.comments(ticketId) });
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Failed to update comment.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => ticketApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketKeys.comments(ticketId) });
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Failed to delete comment.');
    }
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
                <div key={comment.id} className="flex gap-4 group">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-bold uppercase">{comment.authorName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-2xl rounded-tl-none p-4 border border-gray-100 relative">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-gray-900">{comment.authorName}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(comment.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      
                      {/* Action Buttons (visible on hover for owners) */}
                      {currentUser?.id === comment.authorId && editingCommentId !== comment.id && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditedContent(comment.message);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this comment?')) {
                                deleteMutation.mutate(comment.id);
                              }
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="mt-2">
                        <textarea
                          rows={2}
                          value={editedContent}
                          onChange={(e) => setEditedContent(e.target.value)}
                          className="w-full p-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button 
                            onClick={() => setEditingCommentId(null)}
                            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 font-medium"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={() => updateMutation.mutate({ commentId: comment.id, content: editedContent })}
                            disabled={updateMutation.isPending || !editedContent.trim()}
                            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 font-medium disabled:opacity-50"
                          >
                            {updateMutation.isPending ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.message}</p>
                    )}
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
