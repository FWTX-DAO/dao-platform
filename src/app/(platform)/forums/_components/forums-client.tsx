'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  MessageCircle,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { ForumPostModal } from '@components/modals/ForumPostModal';
import {
  useForumPosts,
  useForumReplies,
  useCreateForumPost,
  useUpdateForumPost,
  useDeleteForumPost,
  useVoteOnPost,
  type ForumPost,
} from '@hooks/useForumPosts';
import { formatDate } from '@utils/format';
import { PageHeader } from '@components/ui/page-header';
import { FilterPills } from '@components/ui/filter-pills';
import { EmptyState } from '@components/ui/empty-state';
import { ErrorState } from '@components/ui/error-state';
import { SkeletonList } from '@components/ui/skeleton';

const CATEGORIES = ['All', 'General', 'Governance', 'Technical', 'Events', 'Education'] as const;
type Category = (typeof CATEGORIES)[number];

export function ForumsClient() {
  const { user } = usePrivy();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading, isError, refetch } = useForumPosts();
  const createPostMutation = useCreateForumPost();
  const updatePostMutation = useUpdateForumPost();
  const deletePostMutation = useDeleteForumPost();
  const voteMutation = useVoteOnPost();

  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [viewingReplies, setViewingReplies] = useState<ForumPost | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'General' });
  const [editPost, setEditPost] = useState({ title: '', content: '', category: 'General' });

  const { data: replies = [], isLoading: isLoadingReplies } = useForumReplies(viewingReplies?.id || null);

  // Focus trap ref for reply modal
  const replyModalRef = useRef<HTMLDivElement>(null);
  const replyTriggerRef = useRef<HTMLButtonElement | null>(null);

  // Close modal on Escape
  useEffect(() => {
    if (!viewingReplies) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewingReplies(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [viewingReplies]);

  // Return focus on modal close
  useEffect(() => {
    if (!viewingReplies && replyTriggerRef.current) {
      replyTriggerRef.current.focus();
      replyTriggerRef.current = null;
    }
  }, [viewingReplies]);

  const handleUpvote = (postId: string, currentUpvoted: number) => {
    const voteType = currentUpvoted ? 0 : 1;
    voteMutation.mutate({ postId, voteType });
  };

  const handleCreatePost = () => {
    if (newPost.title.trim() && newPost.content.trim()) {
      setError('');
      createPostMutation.mutate(newPost, {
        onSuccess: () => {
          setNewPost({ title: '', content: '', category: 'General' });
          setShowCreatePost(false);
        },
        onError: () => setError('Failed to create post. Please try again.'),
      });
    }
  };

  const handleEditPost = () => {
    if (!editingPost || !editPost.title.trim() || !editPost.content.trim()) return;
    setError('');
    updatePostMutation.mutate(
      { id: editingPost.id, title: editPost.title, content: editPost.content, category: editPost.category },
      {
        onSuccess: () => {
          setEditingPost(null);
          setEditPost({ title: '', content: '', category: 'General' });
        },
        onError: () => setError('Failed to update post. Please try again.'),
      }
    );
  };

  const handleDeletePost = (postId: string) => {
    setConfirmDelete(null);
    deletePostMutation.mutate(postId, {
      onError: () => setError('Failed to delete post. Please try again.'),
    });
  };

  const startEditPost = (post: ForumPost) => {
    setEditingPost(post);
    setEditPost({ title: post.title, content: post.content, category: post.category });
  };

  const filteredPosts = useMemo(
    () => (selectedCategory === 'All' ? posts : posts.filter((post) => post.category === selectedCategory)),
    [selectedCategory, posts]
  );

  const handlePostHover = useCallback(
    (postId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['forum-replies', postId],
        queryFn: async () => {
          const { getAccessToken } = await import('@privy-io/react-auth');
          const accessToken = await getAccessToken();
          const response = await fetch(`/api/forums/posts/${postId}/replies`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!response.ok) throw new Error('Failed to fetch');
          return response.json();
        },
      });
    },
    [queryClient]
  );

  const openReplies = (post: ForumPost, triggerElement: HTMLButtonElement) => {
    replyTriggerRef.current = triggerElement;
    setViewingReplies(post);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Community Forums" subtitle="Discuss ideas and collaborate with the community">
        <button
          onClick={() => setShowCreatePost(true)}
          className="inline-flex items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden min-h-[44px] transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Post
        </button>
      </PageHeader>

      <FilterPills
        options={CATEGORIES}
        value={selectedCategory}
        onChange={setSelectedCategory}
        ariaLabel="Filter posts by category"
      />

      <ForumPostModal
        title="Create New Post"
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onSubmit={handleCreatePost}
        isPending={createPostMutation.isPending}
        error={error}
        postData={newPost}
        onChangePostData={setNewPost}
        submitLabel="Create Post"
        pendingLabel="Creating..."
      />

      <ForumPostModal
        title="Edit Post"
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        onSubmit={handleEditPost}
        isPending={updatePostMutation.isPending}
        error={error}
        postData={editPost}
        onChangePostData={setEditPost}
        submitLabel="Update Post"
        pendingLabel="Updating..."
      />

      {/* Reply modal */}
      {viewingReplies && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setViewingReplies(null); }}
          style={{ overscrollBehavior: 'contain' }}
        >
          <div
            ref={replyModalRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Replies to: ${viewingReplies.title}`}
            className="bg-white rounded-t-xl sm:rounded-lg w-full sm:max-w-2xl max-h-[85vh] sm:max-h-[80vh] flex flex-col sm:my-8"
          >
            <div className="flex justify-between items-start p-5 border-b shrink-0">
              <div className="min-w-0 flex-1 mr-4">
                <h2 className="text-lg font-bold text-gray-900 truncate">Replies to: {viewingReplies.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  by {viewingReplies.author_name} &middot; {formatDate(viewingReplies.created_at)}
                </p>
              </div>
              <button
                onClick={() => setViewingReplies(null)}
                className="text-gray-400 hover:text-gray-600 p-2 -m-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 border-b bg-gray-50 shrink-0">
              <p className="text-gray-700 whitespace-pre-line text-sm">{viewingReplies.content}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {isLoadingReplies ? (
                <SkeletonList count={2} />
              ) : replies.length === 0 ? (
                <EmptyState
                  icon={<MessageCircle />}
                  title="No replies yet"
                  description="Be the first to reply!"
                />
              ) : (
                <ul className="space-y-4">
                  {replies.map((reply: any) => (
                    <li key={reply.id} className="bg-white border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-900">{reply.author_name || 'Anonymous'}</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(reply.created_at)}
                          {reply.updated_at && reply.updated_at !== reply.created_at && <span className="ml-1">(edited)</span>}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line mb-3 text-sm">{reply.content}</p>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => handleUpvote(reply.id, reply.has_upvoted)}
                          className="flex items-center gap-2 text-gray-500 hover:text-violet-600 focus-visible:ring-2 focus-visible:outline-hidden p-2 -ml-2 rounded-md min-h-[44px]"
                          aria-label={`Upvote reply by ${reply.author_name || 'Anonymous'}`}
                        >
                          <Heart className={`h-4 w-4 ${reply.has_upvoted ? 'fill-violet-600 text-violet-600' : ''}`} />
                          <span className="text-sm tabular-nums">{reply.upvotes}</span>
                        </button>
                        {user && reply.author_privy_did === user.id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditPost(reply)}
                              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-md focus-visible:ring-2 focus-visible:outline-hidden min-h-[44px]"
                            >
                              <Pencil className="h-4 w-4" /> Edit
                            </button>
                            <button
                              onClick={() => setConfirmDelete(reply.id)}
                              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md focus-visible:ring-2 focus-visible:outline-hidden min-h-[44px]"
                            >
                              <Trash2 className="h-4 w-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div role="alertdialog" aria-modal="true" aria-label="Confirm delete" className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete post?</h3>
            <p className="text-sm text-gray-600 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium min-h-[44px] focus-visible:ring-2 focus-visible:outline-hidden"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePost(confirmDelete)}
                className="px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium min-h-[44px] focus-visible:ring-2 focus-visible:outline-hidden"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post list */}
      {isError ? (
        <ErrorState title="Failed to load posts" onRetry={() => refetch()} />
      ) : isLoading ? (
        <SkeletonList count={4} />
      ) : error ? (
        <div role="alert" className="py-4 px-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<MessageCircle />}
          title="No posts yet"
          description="Be the first to start a discussion!"
          action={
            <button
              onClick={() => setShowCreatePost(true)}
              className="inline-flex items-center px-4 py-2.5 bg-violet-600 text-white rounded-md hover:bg-violet-700 font-medium text-sm min-h-[44px]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </button>
          }
        />
      ) : filteredPosts.length === 0 ? (
        <EmptyState
          title={`No posts in "${selectedCategory}"`}
          description="Try selecting a different category."
          action={
            <button
              onClick={() => setSelectedCategory('All')}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm min-h-[44px]"
            >
              Clear filter
            </button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {filteredPosts.map((post) => (
            <li key={post.id} className="bg-white shadow-xs rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-100" onMouseEnter={() => handlePostHover(post.id)}>
              <div className="flex items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{post.category}</span>
                    <span className="text-xs text-gray-500">
                      by {post.author_name || 'Anonymous'} &middot; {formatDate(post.created_at)}
                      {post.updated_at && post.updated_at !== post.created_at && <span className="ml-1 text-gray-400">(edited)</span>}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                  <p className="text-gray-600 whitespace-pre-line line-clamp-3 text-sm">{post.content}</p>
                  <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleUpvote(post.id, post.has_upvoted)}
                        className="flex items-center gap-2 text-gray-500 hover:text-violet-600 focus-visible:ring-2 focus-visible:outline-hidden p-2 -ml-2 rounded-md min-h-[44px]"
                        aria-label={`Upvote "${post.title}"`}
                      >
                        <Heart className={`h-5 w-5 ${post.has_upvoted ? 'fill-violet-600 text-violet-600' : ''}`} />
                        <span className="text-sm tabular-nums">{post.upvotes}</span>
                      </button>
                      <button
                        onClick={(e) => openReplies(post, e.currentTarget)}
                        className="flex items-center gap-2 text-gray-500 hover:text-violet-600 focus-visible:ring-2 focus-visible:outline-hidden p-2 rounded-md min-h-[44px]"
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm tabular-nums">{post.reply_count} replies</span>
                      </button>
                    </div>
                    {user && post.author_privy_did === user.id && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEditPost(post)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-md focus-visible:ring-2 focus-visible:outline-hidden min-h-[44px]"
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </button>
                        <button
                          onClick={() => setConfirmDelete(post.id)}
                          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md focus-visible:ring-2 focus-visible:outline-hidden min-h-[44px]"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
