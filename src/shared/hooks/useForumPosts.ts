import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPosts as getPostsAction,
  getReplies as getRepliesAction,
  createPost as createPostAction,
  updatePost as updatePostAction,
  deletePost as deletePostAction,
  vote as voteAction,
} from "@/app/_actions/forum";

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_id: string;
  author_privy_did?: string | null;
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

// Query Hooks
export const useForumPosts = () => {
  return useQuery({
    queryKey: ["forum-posts"],
    queryFn: () => getPostsAction() as unknown as Promise<ForumPost[]>,
    staleTime: 1000 * 60,
  });
};

export const useForumReplies = (postId: string | null) => {
  return useQuery({
    queryKey: ["forum-replies", postId],
    queryFn: () => getRepliesAction(postId!) as unknown as Promise<ForumPost[]>,
    enabled: !!postId,
    staleTime: 1000 * 60,
  });
};

// Mutation Hooks
export const useCreateForumPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postData: ForumPostInput) =>
      createPostAction({
        title: postData.title,
        content: postData.content,
        category: postData.category,
        parentId: postData.parent_id,
      }) as unknown as Promise<ForumPost>,
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
    onSuccess: (_result, variables) => {
      if (variables.parent_id) {
        queryClient.invalidateQueries({ queryKey: ["forum-replies", variables.parent_id] });
        queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      }
    },
  });
};

export const useUpdateForumPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postData: ForumPostUpdate) =>
      updatePostAction(postData.id, {
        title: postData.title,
        content: postData.content,
        category: postData.category,
      }),
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
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      const parentId = (variables as any).parent_id;
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ["forum-replies", parentId], exact: true });
      }
    },
  });
};

export const useDeleteForumPost = (parentId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => deletePostAction(postId),
    onSuccess: (_, deletedPostId) => {
      queryClient.setQueryData(["forum-posts"], (oldData: ForumPost[] | undefined) => {
        if (!oldData) return [];
        return oldData
          .filter(post => post.id !== deletedPostId)
          .map(post => {
            if (parentId && post.id === parentId) {
              return { ...post, reply_count: Math.max(0, post.reply_count - 1) };
            }
            return post;
          });
      });

      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ["forum-replies", parentId], exact: true });
      }
    },
  });
};

export const useVoteOnPost = (parentId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, voteType }: { postId: string; voteType: number }) =>
      voteAction(postId, voteType),
    onMutate: async ({ postId, voteType }) => {
      await queryClient.cancelQueries({ queryKey: ["forum-posts"] });
      if (parentId) {
        await queryClient.cancelQueries({ queryKey: ["forum-replies", parentId] });
      }

      const previousPosts = queryClient.getQueryData<ForumPost[]>(["forum-posts"]);
      const previousReplies = parentId
        ? queryClient.getQueryData<ForumPost[]>(["forum-replies", parentId])
        : undefined;

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
      if (parentId) {
        queryClient.setQueryData(["forum-replies", parentId], updatePostVotesOptimistic);
      }

      return { previousPosts, previousReplies, parentId };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["forum-posts"], context.previousPosts);
      }
      if (context?.parentId && context?.previousReplies) {
        queryClient.setQueryData(["forum-replies", context.parentId], context.previousReplies);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-posts"] });
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ["forum-replies", parentId] });
      }
    },
  });
};
