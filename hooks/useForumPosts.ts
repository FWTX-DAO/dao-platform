import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@privy-io/react-auth";

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_id: string;
  category: string;
  upvotes: number;
  reply_count: number;
  created_at: string;
  updated_at?: string;
  has_upvoted: number;
}

export interface ForumPostInput {
  title: string;
  content: string;
  category?: string;
  parent_id?: string;
}

export interface ForumPostUpdate {
  id: string;
  title: string;
  content: string;
  category: string;
}

const fetchForumPosts = async (): Promise<ForumPost[]> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/forums/posts", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch posts: ${response.statusText}`);
  }

  return response.json();
};

const fetchForumReplies = async (postId: string): Promise<ForumPost[]> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/forums/posts/${postId}/replies`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch replies: ${response.statusText}`);
  }

  return response.json();
};

const createForumPost = async (postData: ForumPostInput): Promise<ForumPost> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/forums/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create post: ${response.statusText}`);
  }

  return response.json();
};

const updateForumPost = async (postData: ForumPostUpdate): Promise<ForumPost> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/forums/posts", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update post: ${response.statusText}`);
  }

  return response.json();
};

const deleteForumPost = async (postId: string): Promise<void> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/forums/posts", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ id: postId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete post: ${response.statusText}`);
  }
};

const voteOnPost = async ({ postId, voteType }: { postId: string; voteType: number }) => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/forums/vote", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ postId, voteType }),
  });

  if (!response.ok) {
    throw new Error(`Failed to vote: ${response.statusText}`);
  }

  return response.json();
};

// Query Hooks
export const useForumPosts = () => {
  return useQuery({
    queryKey: ["forum-posts"],
    queryFn: fetchForumPosts,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useForumReplies = (postId: string | null) => {
  return useQuery({
    queryKey: ["forum-replies", postId],
    queryFn: () => fetchForumReplies(postId!),
    enabled: !!postId,
    staleTime: 1000 * 30, // 30 seconds
  });
};

// Mutation Hooks
export const useCreateForumPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createForumPost,
    onSuccess: (newPost) => {
      // Add the new post to the beginning of the list
      queryClient.setQueryData(["forum-posts"], (oldData: ForumPost[] | undefined) => {
        return oldData ? [newPost, ...oldData] : [newPost];
      });
    },
  });
};

export const useUpdateForumPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateForumPost,
    onSuccess: (updatedPost) => {
      // Update the post in the list
      queryClient.setQueryData(["forum-posts"], (oldData: ForumPost[] | undefined) => {
        return oldData ? oldData.map(post => 
          post.id === updatedPost.id ? updatedPost : post
        ) : [updatedPost];
      });
      
      // Also update any reply queries that might contain this post
      queryClient.invalidateQueries({ queryKey: ["forum-replies"] });
    },
  });
};

export const useDeleteForumPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteForumPost,
    onSuccess: (_, deletedPostId) => {
      // Remove the post from the list
      queryClient.setQueryData(["forum-posts"], (oldData: ForumPost[] | undefined) => {
        return oldData ? oldData.filter(post => post.id !== deletedPostId) : [];
      });
      
      // Invalidate reply queries in case a reply was deleted
      queryClient.invalidateQueries({ queryKey: ["forum-replies"] });
    },
  });
};

export const useVoteOnPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: voteOnPost,
    onSuccess: (data, { postId }) => {
      // Update the vote counts in both posts and replies queries
      const updatePostVotes = (posts: ForumPost[] | undefined) => {
        return posts ? posts.map(post => 
          post.id === postId 
            ? { ...post, upvotes: data.upvotes, has_upvoted: data.hasUpvoted ? 1 : 0 }
            : post
        ) : [];
      };

      queryClient.setQueryData(["forum-posts"], updatePostVotes);
      
      // Update all reply queries
      queryClient.setQueriesData(
        { queryKey: ["forum-replies"] },
        updatePostVotes
      );
    },
  });
};