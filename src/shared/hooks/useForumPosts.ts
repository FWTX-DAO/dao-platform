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
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useForumReplies = (postId: string | null) => {
  return useQuery({
    queryKey: ["forum-replies", postId],
    queryFn: () => fetchForumReplies(postId!),
    enabled: !!postId,
    staleTime: 1000 * 60, // 1 minute
  });
};

// Mutation Hooks
export const useCreateForumPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createForumPost,
    onMutate: async (newPost) => {
      await queryClient.cancelQueries({ queryKey: ["forum-posts"] });
      
      const previousPosts = queryClient.getQueryData<ForumPost[]>(["forum-posts"]);
      
      const optimisticPost: ForumPost = {
        id: `temp-${Date.now()}`,
        title: newPost.title,
        content: newPost.content,
        author_name: 'You',
        author_id: 'temp',
        category: newPost.category || 'general',
        upvotes: 0,
        reply_count: 0,
        created_at: new Date().toISOString(),
        has_upvoted: 0,
      };
      
      if (newPost.parent_id) {
        queryClient.setQueryData<ForumPost[]>(["forum-replies", newPost.parent_id], (old) => 
          old ? [optimisticPost, ...old] : [optimisticPost]
        );
      } else {
        queryClient.setQueryData<ForumPost[]>(["forum-posts"], (old) => 
          old ? [optimisticPost, ...old] : [optimisticPost]
        );
      }
      
      return { previousPosts, parentId: newPost.parent_id };
    },
    onError: (_err, _newPost, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["forum-posts"], context.previousPosts);
      }
      if (context?.parentId) {
        queryClient.invalidateQueries({ queryKey: ["forum-replies", context.parentId] });
      }
    },
    onSuccess: (newPost, variables) => {
      if (variables.parent_id) {
        queryClient.setQueryData(["forum-replies", variables.parent_id], (oldData: ForumPost[] | undefined) => {
          return oldData ? [newPost, ...oldData.filter(p => !p.id.startsWith('temp-'))] : [newPost];
        });
        queryClient.setQueryData(["forum-posts"], (oldData: ForumPost[] | undefined) => {
          return oldData ? oldData.map(post => 
            post.id === variables.parent_id 
              ? { ...post, reply_count: post.reply_count + 1 }
              : post
          ) : [];
        });
      } else {
        queryClient.setQueryData(["forum-posts"], (oldData: ForumPost[] | undefined) => {
          return oldData ? [newPost, ...oldData.filter(p => !p.id.startsWith('temp-'))] : [newPost];
        });
      }
    },
  });
};

export const useUpdateForumPost = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateForumPost,
    onMutate: async (updatedPost) => {
      await queryClient.cancelQueries({ queryKey: ["forum-posts"] });
      
      const previousPosts = queryClient.getQueryData<ForumPost[]>(["forum-posts"]);
      
      queryClient.setQueryData<ForumPost[]>(["forum-posts"], (old) => 
        old ? old.map((post): ForumPost => 
          post.id === updatedPost.id 
            ? { ...post, title: updatedPost.title, content: updatedPost.content, category: updatedPost.category, updated_at: new Date().toISOString() }
            : post
        ) : []
      );
      
      return { previousPosts };
    },
    onError: (_err, _updatedPost, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["forum-posts"], context.previousPosts);
      }
    },
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(["forum-posts"], (oldData: ForumPost[] | undefined) => {
        return oldData ? oldData.map(post => 
          post.id === updatedPost.id ? updatedPost : post
        ) : [updatedPost];
      });
      
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
    onMutate: async ({ postId, voteType }) => {
      await queryClient.cancelQueries({ queryKey: ["forum-posts"] });
      await queryClient.cancelQueries({ queryKey: ["forum-replies"] });
      
      const previousPosts = queryClient.getQueryData<ForumPost[]>(["forum-posts"]);
      
      const updatePostVotesOptimistic = (posts: ForumPost[] | undefined): ForumPost[] => {
        return posts ? posts.map(post => {
          if (post.id === postId) {
            const currentlyUpvoted = post.has_upvoted === 1;
            let newUpvotes = post.upvotes;
            let newHasUpvoted = 0;
            
            if (voteType === 1) {
              if (currentlyUpvoted) {
                newUpvotes = post.upvotes - 1;
                newHasUpvoted = 0;
              } else {
                newUpvotes = post.upvotes + 1;
                newHasUpvoted = 1;
              }
            }
            
            return { ...post, upvotes: newUpvotes, has_upvoted: newHasUpvoted };
          }
          return post;
        }) : [];
      };

      queryClient.setQueryData(["forum-posts"], updatePostVotesOptimistic);
      queryClient.setQueriesData({ queryKey: ["forum-replies"] }, updatePostVotesOptimistic);
      
      return { previousPosts };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["forum-posts"], context.previousPosts);
      }
      queryClient.invalidateQueries({ queryKey: ["forum-replies"] });
    },
    onSuccess: (data, { postId }) => {
      const updatePostVotes = (posts: ForumPost[] | undefined) => {
        return posts ? posts.map(post => 
          post.id === postId 
            ? { ...post, upvotes: data.upvotes, has_upvoted: data.hasUpvoted ? 1 : 0 }
            : post
        ) : [];
      };

      queryClient.setQueryData(["forum-posts"], updatePostVotes);
      queryClient.setQueriesData({ queryKey: ["forum-replies"] }, updatePostVotes);
    },
  });
};