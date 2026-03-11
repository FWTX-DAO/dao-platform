"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useQueryClient } from "@tanstack/react-query";
import {
  Heart,
  MessageCircle,
  Plus,
  Pencil,
  Trash2,
  Send,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ForumPostModal } from "@components/modals/ForumPostModal";
import {
  useForumPosts,
  useForumReplies,
  useCreateForumPost,
  useUpdateForumPost,
  useDeleteForumPost,
  useVoteOnPost,
  type ForumPost,
} from "@hooks/useForumPosts";
import { getReplies as getRepliesAction } from "@/app/_actions/forum";
import { queryKeys } from "@shared/constants/query-keys";
import { formatDate } from "@utils/format";
import { PageHeader } from "@components/ui/page-header";
import { FilterPills } from "@components/ui/filter-pills";
import { EmptyState } from "@components/ui/empty-state";
import { ErrorState } from "@components/ui/error-state";
import { SkeletonList } from "@components/ui/skeleton";

const CATEGORIES = [
  "All",
  "General",
  "Governance",
  "Technical",
  "Events",
  "Education",
] as const;
type Category = (typeof CATEGORIES)[number];

export function ForumsClient() {
  const { user } = usePrivy();
  const queryClient = useQueryClient();

  const { data: posts = [], isLoading, isError, refetch } = useForumPosts();
  const createPostMutation = useCreateForumPost();
  const updatePostMutation = useUpdateForumPost();
  const deletePostMutation = useDeleteForumPost();
  const voteMutation = useVoteOnPost();

  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "General",
  });
  const [editPost, setEditPost] = useState({
    title: "",
    content: "",
    category: "General",
  });
  const [replyContent, setReplyContent] = useState("");

  const { data: replies = [], isLoading: isLoadingReplies } =
    useForumReplies(expandedPostId);

  const replyMutation = useCreateForumPost();
  const replyVoteMutation = useVoteOnPost(expandedPostId);
  const replyDeleteMutation = useDeleteForumPost(expandedPostId);

  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  const expandedPost = useMemo(
    () => posts.find((p) => p.id === expandedPostId) ?? null,
    [posts, expandedPostId],
  );

  const handleUpvote = (postId: string, currentUpvoted: number) => {
    const voteType = currentUpvoted ? 0 : 1;
    voteMutation.mutate({ postId, voteType });
  };

  const handleReplyUpvote = (postId: string, currentUpvoted: number) => {
    const voteType = currentUpvoted ? 0 : 1;
    replyVoteMutation.mutate({ postId, voteType });
  };

  const handleCreatePost = () => {
    if (newPost.title.trim() && newPost.content.trim()) {
      setError("");
      createPostMutation.mutate(newPost, {
        onSuccess: () => {
          setNewPost({ title: "", content: "", category: "General" });
          setShowCreatePost(false);
        },
        onError: () => setError("Failed to create post. Please try again."),
      });
    }
  };

  const handleEditPost = () => {
    if (!editingPost || !editPost.title.trim() || !editPost.content.trim())
      return;
    setError("");
    updatePostMutation.mutate(
      {
        id: editingPost.id,
        title: editPost.title,
        content: editPost.content,
        category: editPost.category,
      },
      {
        onSuccess: () => {
          setEditingPost(null);
          setEditPost({ title: "", content: "", category: "General" });
        },
        onError: () => setError("Failed to update post. Please try again."),
      },
    );
  };

  const handleDeletePost = (postId: string) => {
    setConfirmDelete(null);
    deletePostMutation.mutate(postId, {
      onError: () => setError("Failed to delete post. Please try again."),
    });
  };

  const handleDeleteReply = (replyId: string) => {
    setConfirmDelete(null);
    replyDeleteMutation.mutate(replyId, {
      onError: () => setError("Failed to delete reply. Please try again."),
    });
  };

  const handleSubmitReply = () => {
    if (!expandedPost || !replyContent.trim()) return;
    replyMutation.mutate(
      {
        title: `Re: ${expandedPost.title}`,
        content: replyContent.trim(),
        category: expandedPost.category,
        parentId: expandedPost.id,
      },
      {
        onSuccess: () => {
          setReplyContent("");
          replyInputRef.current?.focus();
        },
        onError: () => setError("Failed to post reply. Please try again."),
      },
    );
  };

  const startEditPost = (post: ForumPost) => {
    setEditingPost(post);
    setEditPost({
      title: post.title,
      content: post.content,
      category: post.category,
    });
  };

  const toggleReplies = (postId: string) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      setReplyContent("");
    } else {
      setExpandedPostId(postId);
      setReplyContent("");
    }
  };

  const filteredPosts = useMemo(
    () =>
      selectedCategory === "All"
        ? posts
        : posts.filter((post) => post.category === selectedCategory),
    [selectedCategory, posts],
  );

  const handlePostHover = useCallback(
    (postId: string) => {
      queryClient.prefetchQuery({
        queryKey: queryKeys.forum.replies(postId),
        queryFn: () =>
          getRepliesAction(postId) as unknown as Promise<ForumPost[]>,
        staleTime: 1000 * 60,
      });
    },
    [queryClient],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Community Forums"
        subtitle="Discuss ideas and collaborate with the community"
      >
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

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirm delete"
            className="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete post?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium min-h-[44px] focus-visible:ring-2 focus-visible:outline-hidden"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (
                    expandedPostId &&
                    replies.some((r: ForumPost) => r.id === confirmDelete)
                  ) {
                    handleDeleteReply(confirmDelete);
                  } else {
                    handleDeletePost(confirmDelete);
                  }
                }}
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
        <div
          role="alert"
          className="py-4 px-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700"
        >
          {error}
        </div>
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
              onClick={() => setSelectedCategory("All")}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm min-h-[44px]"
            >
              Clear filter
            </button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {filteredPosts.map((post) => {
            const isExpanded = expandedPostId === post.id;
            return (
              <li
                key={post.id}
                className="bg-white shadow-xs rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-100"
                onMouseEnter={() => handlePostHover(post.id)}
              >
                <div className="flex items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        by {post.authorName || "Anonymous"} &middot;{" "}
                        {formatDate(post.createdAt)}
                        {post.updatedAt &&
                          post.updatedAt !== post.createdAt && (
                            <span className="ml-1 text-gray-400">(edited)</span>
                          )}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 whitespace-pre-line line-clamp-3 text-sm">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleUpvote(post.id, post.hasUpvoted)}
                          className="flex items-center gap-2 text-gray-500 hover:text-violet-600 focus-visible:ring-2 focus-visible:outline-hidden p-2 -ml-2 rounded-md min-h-[44px]"
                          aria-label={`Upvote "${post.title}"`}
                        >
                          <Heart
                            className={`h-5 w-5 ${post.hasUpvoted ? "fill-violet-600 text-violet-600" : ""}`}
                          />
                          <span className="text-sm tabular-nums">
                            {post.upvotes}
                          </span>
                        </button>
                        <button
                          onClick={() => toggleReplies(post.id)}
                          className={`flex items-center gap-2 text-gray-500 hover:text-violet-600 focus-visible:ring-2 focus-visible:outline-hidden p-2 rounded-md min-h-[44px] ${isExpanded ? "text-violet-600" : ""}`}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? "Hide" : "Show"} replies for "${post.title}"`}
                        >
                          <MessageCircle
                            className={`h-5 w-5 ${isExpanded ? "fill-violet-100" : ""}`}
                          />
                          <span className="text-sm tabular-nums">
                            {post.replyCount} replies
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {user && post.authorPrivyDid === user.id && (
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

                {/* Inline threaded replies */}
                {isExpanded && (
                  <div className="mt-4 border-l-2 border-violet-200 pl-4 ml-1">
                    {isLoadingReplies ? (
                      <SkeletonList count={2} />
                    ) : replies.length === 0 ? (
                      <p className="text-sm text-gray-500 py-3">
                        No replies yet. Be the first to reply!
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {replies.map((reply: ForumPost) => (
                          <li
                            key={reply.id}
                            className="bg-gray-50 rounded-lg p-3"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                {reply.authorName || "Anonymous"}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(reply.createdAt)}
                                {reply.updatedAt &&
                                  reply.updatedAt !== reply.createdAt && (
                                    <span className="ml-1">(edited)</span>
                                  )}
                              </span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-line text-sm mb-2">
                              {reply.content}
                            </p>
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() =>
                                  handleReplyUpvote(reply.id, reply.hasUpvoted)
                                }
                                className="flex items-center gap-1.5 text-gray-500 hover:text-violet-600 focus-visible:ring-2 focus-visible:outline-hidden p-1.5 -ml-1.5 rounded-md min-h-[36px]"
                                aria-label={`Upvote reply by ${reply.authorName || "Anonymous"}`}
                              >
                                <Heart
                                  className={`h-3.5 w-3.5 ${reply.hasUpvoted ? "fill-violet-600 text-violet-600" : ""}`}
                                />
                                <span className="text-xs tabular-nums">
                                  {reply.upvotes}
                                </span>
                              </button>
                              {user && reply.authorPrivyDid === user.id && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => startEditPost(reply)}
                                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-md focus-visible:ring-2 focus-visible:outline-hidden min-h-[36px]"
                                  >
                                    <Pencil className="h-3.5 w-3.5" /> Edit
                                  </button>
                                  <button
                                    onClick={() => setConfirmDelete(reply.id)}
                                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md focus-visible:ring-2 focus-visible:outline-hidden min-h-[36px]"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Reply input */}
                    <div className="mt-3 flex gap-2 items-end">
                      <textarea
                        ref={replyInputRef}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleSubmitReply();
                          }
                        }}
                        placeholder="Write a reply..."
                        rows={2}
                        className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-hidden"
                      />
                      <button
                        onClick={handleSubmitReply}
                        disabled={
                          !replyContent.trim() || replyMutation.isPending
                        }
                        className="inline-flex items-center justify-center px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium min-h-[44px] min-w-[44px] focus-visible:ring-2 focus-visible:ring-dao-gold focus-visible:outline-hidden transition-colors"
                        aria-label="Send reply"
                      >
                        {replyMutation.isPending ? (
                          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
