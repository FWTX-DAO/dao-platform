import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPosts as getPostsAction,
  getReplies as getRepliesAction,
  createPost as createPostAction,
  updatePost as updatePostAction,
  deletePost as deletePostAction,
  vote as voteAction,
} from "@/app/_actions/forum";
import { queryKeys } from "@shared/constants/query-keys";
import { useAuthReady } from "./useAuthReady";

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorId: string;
  authorPrivyDid?: string | null;
  category: string;
  upvotes: number;
  replyCount: number;
  createdAt: string | Date;
  updatedAt?: string | Date;
  hasUpvoted: number;
}

export interface ForumPostInput {
  title: string;
  content: string;
  category?: string;
  parentId?: string;
}

export interface ForumPostUpdate {
  id: string;
  title: string;
  content: string;
  category: string;
}

// Query Hooks
export const useForumPosts = () => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.forum.posts(),
    queryFn: () => getPostsAction() as unknown as Promise<ForumPost[]>,
    enabled: authReady,
    staleTime: 1000 * 60,
  });
};

export const useForumReplies = (postId: string | null) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.forum.replies(postId!),
    queryFn: () => getRepliesAction(postId!) as unknown as Promise<ForumPost[]>,
    enabled: authReady && !!postId,
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
        parentId: postData.parentId,
      }) as unknown as Promise<ForumPost>,
    onMutate: async (newPost) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.forum.posts() });

      const previousPosts = queryClient.getQueryData<ForumPost[]>(
        queryKeys.forum.posts(),
      );

      const optimisticPost: ForumPost = {
        id: `temp-${Date.now()}`,
        title: newPost.title,
        content: newPost.content,
        authorName: "You",
        authorId: "temp",
        category: newPost.category || "general",
        upvotes: 0,
        replyCount: 0,
        createdAt: new Date().toISOString(),
        hasUpvoted: 0,
      };

      if (newPost.parentId) {
        queryClient.setQueryData<ForumPost[]>(
          queryKeys.forum.replies(newPost.parentId!),
          (old) => (old ? [optimisticPost, ...old] : [optimisticPost]),
        );
      } else {
        queryClient.setQueryData<ForumPost[]>(queryKeys.forum.posts(), (old) =>
          old ? [optimisticPost, ...old] : [optimisticPost],
        );
      }

      return { previousPosts, parentId: newPost.parentId };
    },
    onError: (_err, _newPost, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(
          queryKeys.forum.posts(),
          context.previousPosts,
        );
      }
      if (context?.parentId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.forum.replies(context.parentId!),
        });
      }
    },
    onSuccess: (_result, variables) => {
      if (variables.parentId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.forum.replies(variables.parentId!),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.forum.posts() });
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.forum.posts() });
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
      await queryClient.cancelQueries({ queryKey: queryKeys.forum.posts() });

      const previousPosts = queryClient.getQueryData<ForumPost[]>(
        queryKeys.forum.posts(),
      );

      queryClient.setQueryData<ForumPost[]>(queryKeys.forum.posts(), (old) =>
        old
          ? old.map(
              (post): ForumPost =>
                post.id === updatedPost.id
                  ? {
                      ...post,
                      title: updatedPost.title,
                      content: updatedPost.content,
                      category: updatedPost.category,
                      updatedAt: new Date().toISOString(),
                    }
                  : post,
            )
          : [],
      );

      return { previousPosts };
    },
    onError: (_err, _updatedPost, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(
          queryKeys.forum.posts(),
          context.previousPosts,
        );
      }
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forum.posts() });
      const parentId = (variables as any).parentId;
      if (parentId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.forum.replies(parentId!),
          exact: true,
        });
      }
    },
  });
};

export const useDeleteForumPost = (parentId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (postId: string) => deletePostAction(postId),
    onSuccess: (_, deletedPostId) => {
      queryClient.setQueryData(
        queryKeys.forum.posts(),
        (oldData: ForumPost[] | undefined) => {
          if (!oldData) return [];
          return oldData
            .filter((post) => post.id !== deletedPostId)
            .map((post) => {
              if (parentId && post.id === parentId) {
                return {
                  ...post,
                  replyCount: Math.max(0, post.replyCount - 1),
                };
              }
              return post;
            });
        },
      );

      if (parentId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.forum.replies(parentId!),
          exact: true,
        });
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
      await queryClient.cancelQueries({ queryKey: queryKeys.forum.posts() });
      if (parentId) {
        await queryClient.cancelQueries({
          queryKey: queryKeys.forum.replies(parentId!),
        });
      }

      const previousPosts = queryClient.getQueryData<ForumPost[]>(
        queryKeys.forum.posts(),
      );
      const previousReplies = parentId
        ? queryClient.getQueryData<ForumPost[]>(
            queryKeys.forum.replies(parentId!),
          )
        : undefined;

      const updatePostVotesOptimistic = (
        posts: ForumPost[] | undefined,
      ): ForumPost[] => {
        return posts
          ? posts.map((post) => {
              if (post.id === postId) {
                const currentlyUpvoted = post.hasUpvoted === 1;
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

                return {
                  ...post,
                  upvotes: newUpvotes,
                  hasUpvoted: newHasUpvoted,
                };
              }
              return post;
            })
          : [];
      };

      queryClient.setQueryData(
        queryKeys.forum.posts(),
        updatePostVotesOptimistic,
      );
      if (parentId) {
        queryClient.setQueryData(
          queryKeys.forum.replies(parentId!),
          updatePostVotesOptimistic,
        );
      }

      return { previousPosts, previousReplies, parentId };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(
          queryKeys.forum.posts(),
          context.previousPosts,
        );
      }
      if (context?.parentId && context?.previousReplies) {
        queryClient.setQueryData(
          queryKeys.forum.replies(context.parentId!),
          context.previousReplies,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forum.posts() });
      if (parentId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.forum.replies(parentId!),
        });
      }
    },
  });
};
