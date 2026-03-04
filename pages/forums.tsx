import { useRouter } from "next/router";
import { useEffect, useState, useMemo, useCallback } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useQueryClient } from "@tanstack/react-query";
import AppLayout from "@components/AppLayout";
import {
  HeartIcon,
  ChatBubbleBottomCenterTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { ForumPostModal } from "@components/modals/ForumPostModal";
import {
  useForumPosts,
  useForumReplies,
  useCreateForumPost,
  useUpdateForumPost,
  useDeleteForumPost,
  useVoteOnPost,
  type ForumPost
} from "@hooks/useForumPosts";

import { formatDate } from "@utils/format";

// Static arrays moved outside component to prevent recreation on each render
const CATEGORIES = ["General", "Governance", "Technical", "Events", "Education"] as const;

export default function ForumsPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const queryClient = useQueryClient();
  
  // React Query hooks
  const { 
    data: posts = [], 
    isLoading, 
    error: postsError 
  } = useForumPosts();
  
  const createPostMutation = useCreateForumPost();
  const updatePostMutation = useUpdateForumPost();
  const deletePostMutation = useDeleteForumPost();
  const voteMutation = useVoteOnPost();

  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [viewingReplies, setViewingReplies] = useState<ForumPost | null>(null);
  const [error, setError] = useState("");
  
  // Form state
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

  // Replies query - only enabled when viewing replies
  const { 
    data: replies = [], 
    isLoading: isLoadingReplies 
  } = useForumReplies(viewingReplies?.id || null);

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  // Handle query errors
  useEffect(() => {
    if (postsError) {
      setError("Failed to load posts");
    }
  }, [postsError]);

  const handleUpvote = (postId: string, currentUpvoted: number) => {
    const voteType = currentUpvoted ? 0 : 1;
    voteMutation.mutate({ postId, voteType });
  };

  const handleCreatePost = () => {
    if (newPost.title.trim() && newPost.content.trim()) {
      setError("");
      createPostMutation.mutate(newPost, {
        onSuccess: () => {
          setNewPost({ title: "", content: "", category: "General" });
          setShowCreatePost(false);
        },
        onError: () => {
          setError("Failed to create post. Please try again.");
        }
      });
    }
  };

  const handleEditPost = () => {
    if (!editingPost || !editPost.title.trim() || !editPost.content.trim()) return;
    
    setError("");
    updatePostMutation.mutate({
      id: editingPost.id,
      title: editPost.title,
      content: editPost.content,
      category: editPost.category,
    }, {
      onSuccess: () => {
        setEditingPost(null);
        setEditPost({ title: "", content: "", category: "General" });
      },
      onError: () => {
        setError("Failed to update post. Please try again.");
      }
    });
  };

  const handleDeletePost = (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    deletePostMutation.mutate(postId, {
      onError: () => {
        setError("Failed to delete post. Please try again.");
      }
    });
  };

  const startEditPost = (post: ForumPost) => {
    setEditingPost(post);
    setEditPost({
      title: post.title,
      content: post.content,
      category: post.category,
    });
  };

  const viewReplies = (post: ForumPost) => {
    setViewingReplies(post);
  };

  // Memoize filtered posts to prevent unnecessary recalculations
  const filteredPosts = useMemo(() =>
    selectedCategory === "All"
      ? posts
      : posts.filter(post => post.category === selectedCategory),
    [selectedCategory, posts]
  );

  // Memoize prefetch handler to prevent recreation on each render
  const handlePostHover = useCallback((postId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["forum-replies", postId],
      queryFn: async () => {
        const { getAccessToken } = await import("@privy-io/react-auth");
        const accessToken = await getAccessToken();
        const response = await fetch(`/api/forums/posts/${postId}/replies`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!response.ok) throw new Error('Failed to fetch');
        return response.json();
      },
    });
  }, [queryClient]);

  if (!ready || !authenticated) return null;

  return (
    <AppLayout title="Forums - Fort Worth TX DAO">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Community Forums</h1>
            <p className="mt-2 text-gray-600">Discuss ideas and collaborate with the community</p>
          </div>
          <button
            onClick={() => setShowCreatePost(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Post
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("All")}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectedCategory === "All"
                ? "bg-violet-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All
          </button>
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                selectedCategory === category
                  ? "bg-violet-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Create Post Modal */}
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

        {/* Edit Post Modal */}
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

        {/* Replies Modal */}
        {viewingReplies && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col my-8">
              <div className="flex justify-between items-center p-6 border-b">
                <div>
                  <h2 className="text-xl font-bold">Replies to: {viewingReplies.title}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    by {viewingReplies.author_name} • {formatDate(viewingReplies.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => setViewingReplies(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Original Post */}
              <div className="p-6 border-b bg-gray-50">
                <p className="text-gray-700 whitespace-pre-line">{viewingReplies.content}</p>
              </div>

              {/* Replies */}
              <div className="flex-1 overflow-y-auto p-6">
                {isLoadingReplies ? (
                  <div className="text-center py-8 text-gray-500">Loading replies...</div>
                ) : replies.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No replies yet. Be the first to reply!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {replies.map(reply => (
                      <div key={reply.id} className="bg-white border rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {reply.author_name || "Anonymous"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(reply.created_at)}
                            {reply.updated_at && reply.updated_at !== reply.created_at && (
                              <span className="ml-1">(edited)</span>
                            )}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-line mb-3">{reply.content}</p>
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleUpvote(reply.id, reply.has_upvoted)}
                            className="flex items-center gap-2 text-gray-500 hover:text-violet-600"
                          >
                            {reply.has_upvoted ? (
                              <HeartSolidIcon className="h-4 w-4 text-violet-600" />
                            ) : (
                              <HeartIcon className="h-4 w-4" />
                            )}
                            <span className="text-sm">{reply.upvotes}</span>
                          </button>
                          
                          {/* Show edit/delete buttons only for reply author */}
                          {user && reply.author_privy_did === user.id && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => startEditPost(reply)}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded"
                              >
                                <PencilIcon className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePost(reply.id)}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <TrashIcon className="h-3 w-3" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Posts List */}
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading posts...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-600">{error}</div>
        ) : posts.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No posts yet. Be the first to create one!
          </div>
        ) : (
          <div className="space-y-4">
                     {filteredPosts.map(post => (
              <div
                key={post.id}
                className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
                onMouseEnter={() => handlePostHover(post.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        by {post.author_name || "Anonymous"} • {formatDate(post.created_at)}
                        {post.updated_at && post.updated_at !== post.created_at && (
                          <span className="ml-1 text-xs text-gray-400">(edited)</span>
                        )}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 whitespace-pre-line">{post.content}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-6">
                        <button
                          onClick={() => handleUpvote(post.id, post.has_upvoted)}
                          className="flex items-center gap-2 text-gray-500 hover:text-violet-600"
                        >
                          {post.has_upvoted ? (
                            <HeartSolidIcon className="h-5 w-5 text-violet-600" />
                          ) : (
                            <HeartIcon className="h-5 w-5" />
                          )}
                          <span className="text-sm">{post.upvotes}</span>
                        </button>
                        <button 
                          onClick={() => viewReplies(post)}
                          className="flex items-center gap-2 text-gray-500 hover:text-violet-600"
                        >
                          <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
                          <span className="text-sm">{post.reply_count} replies</span>
                        </button>
                      </div>
                      
                      {/* Show edit/delete buttons only for post author */}
                      {user && post.author_privy_did === user.id && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditPost(post)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded"
                          >
                            <PencilIcon className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}