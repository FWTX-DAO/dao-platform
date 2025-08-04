import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { usePrivy, getAccessToken } from "@privy-io/react-auth";
import AppLayout from "../components/AppLayout";
import { 
  HeartIcon,
  ChatBubbleBottomCenterTextIcon,
  PlusIcon 
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_id: string;
  category: string;
  upvotes: number;
  reply_count: number;
  created_at: string;
  has_upvoted: number;
}

const categories = ["General", "Governance", "Technical", "Events", "Education"];

export default function ForumsPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    category: "General",
  });

  useEffect(() => {
    if (ready && !authenticated) {
      router.push("/");
    }
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (authenticated) {
      fetchPosts();
    }
  }, [authenticated]);

  const fetchPosts = async () => {
    try {
      const accessToken = await getAccessToken();
      const response = await fetch("/api/forums/posts", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpvote = async (postId: string, currentUpvoted: number) => {
    try {
      const accessToken = await getAccessToken();
      const voteType = currentUpvoted ? 0 : 1;
      
      const response = await fetch("/api/forums/vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ postId, voteType }),
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              upvotes: data.upvotes,
              has_upvoted: data.hasUpvoted ? 1 : 0,
            };
          }
          return post;
        }));
      }
    } catch (err) {
      console.error("Error voting:", err);
    }
  };

  const handleCreatePost = async () => {
    if (newPost.title && newPost.content) {
      setIsCreating(true);
      setError("");
      
      try {
        const accessToken = await getAccessToken();
        const response = await fetch("/api/forums/posts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(newPost),
        });

        if (response.ok) {
          const data = await response.json();
          setPosts([data, ...posts]);
          setNewPost({ title: "", content: "", category: "General" });
          setShowCreatePost(false);
        } else {
          throw new Error("Failed to create post");
        }
      } catch (err) {
        console.error("Error creating post:", err);
        setError("Failed to create post. Please try again.");
      } finally {
        setIsCreating(false);
      }
    }
  };

  const filteredPosts = selectedCategory === "All" 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

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
          {categories.map(category => (
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
        {showCreatePost && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6">
              <h2 className="text-xl font-bold mb-4">Create New Post</h2>
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Content</label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    rows={5}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowCreatePost(false)}
                    disabled={isCreating}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreatePost}
                    disabled={isCreating}
                    className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
                  >
                    {isCreating ? "Creating..." : "Create Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Posts List */}
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">Loading posts...</div>
        ) : error && posts.length === 0 ? (
          <div className="py-8 text-center text-red-600">{error}</div>
        ) : posts.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No posts yet. Be the first to create one!
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map(post => (
              <div key={post.id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        by {post.author_name || "Anonymous"} • {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600">{post.content}</p>
                    <div className="flex items-center gap-6 mt-4">
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
                      <button className="flex items-center gap-2 text-gray-500 hover:text-violet-600">
                        <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
                        <span className="text-sm">{post.reply_count} replies</span>
                      </button>
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