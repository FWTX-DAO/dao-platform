import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjects as getProjectsAction,
  getProjectById as getProjectByIdAction,
  getProjectUpdates as getProjectUpdatesAction,
  createProject as createProjectAction,
  updateProject as updateProjectAction,
  deleteProject as deleteProjectAction,
  createProjectUpdate as createProjectUpdateAction,
  joinProject as joinProjectAction,
  leaveProject as leaveProjectAction,
} from "@/app/_actions/projects";
import { queryKeys } from "../utils/query-client";
import { useAuthReady } from "./useAuthReady";

export interface Project {
  id: string;
  title: string;
  description: string;
  githubRepo: string;
  intent: string;
  tags: string | null;
  status: string;
  creator_id: string;
  creator_name: string | null;
  created_at: string;
  updated_at?: string;
  collaborators: number;
}

export interface ProjectCollaborator {
  userId: string;
  username: string | null;
  role: string | null;
  joinedAt: string;
}

export interface ProjectDetails extends Omit<Project, "collaborators"> {
  benefit: string;
  collaborators: ProjectCollaborator[];
  total_collaborators: number;
  user_is_collaborator: boolean;
  user_is_creator: boolean;
}

export interface ProjectUpdate {
  id: string;
  title: string;
  content: string;
  updateType?: string;
  author_name: string | null;
  authorId: string;
  created_at: string;
}

export interface ProjectInput {
  title: string;
  description: string;
  githubRepo?: string;
  intent?: string;
  benefitToFortWorth?: string;
  tags?: string | string[];
  status?: string;
}

export interface ProjectUpdateInput {
  title: string;
  content: string;
}

export interface ProjectUpdateData {
  id: string;
  title: string;
  description: string;
  githubRepo?: string;
  intent?: string;
  benefitToFortWorth?: string;
  tags?: string | string[];
  status?: string;
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

export const useProjects = () => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.projects.lists(),
    queryFn: () => getProjectsAction() as unknown as Promise<Project[]>,
    enabled: authReady,
    staleTime: 1000 * 60,
  });
};

export const useProjectDetails = (projectId: string | null) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId!),
    queryFn: () =>
      getProjectByIdAction(projectId!) as unknown as Promise<ProjectDetails>,
    enabled: authReady && !!projectId,
    staleTime: 1000 * 60,
  });
};

export const useProjectUpdates = (projectId: string | null) => {
  const authReady = useAuthReady();
  return useQuery({
    queryKey: queryKeys.projects.updates(projectId!),
    queryFn: () =>
      getProjectUpdatesAction(projectId!) as unknown as Promise<
        ProjectUpdate[]
      >,
    enabled: authReady && !!projectId,
    staleTime: 1000 * 60,
  });
};

// ============================================================================
// MUTATION HOOKS
// ============================================================================

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectData: ProjectInput) =>
      createProjectAction({
        title: projectData.title,
        description: projectData.description,
        githubRepo: projectData.githubRepo,
        intent: projectData.intent,
        benefit: projectData.benefitToFortWorth,
        tags: Array.isArray(projectData.tags)
          ? projectData.tags.join(",")
          : projectData.tags,
        status: projectData.status,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectData: ProjectUpdateData) =>
      updateProjectAction(projectData.id, {
        title: projectData.title,
        description: projectData.description,
        githubRepo: projectData.githubRepo,
        intent: projectData.intent,
        benefitToFortWorth: projectData.benefitToFortWorth,
        tags: Array.isArray(projectData.tags)
          ? projectData.tags.join(",")
          : projectData.tags,
        status: projectData.status,
      }),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.id),
      });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => deleteProjectAction(projectId),
    onSuccess: (_, deletedProjectId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.removeQueries({
        queryKey: queryKeys.projects.detail(deletedProjectId),
      });
    },
  });
};

export const useCreateProjectUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      updateData,
    }: {
      projectId: string;
      updateData: ProjectUpdateInput;
    }) =>
      createProjectUpdateAction(projectId, {
        title: updateData.title,
        content: updateData.content,
      }),
    onSuccess: (_result, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.updates(projectId),
      });
    },
  });
};

export const useJoinProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => joinProjectAction(projectId),
    onSuccess: (_result, projectId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
    },
  });
};

export const useLeaveProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => leaveProjectAction(projectId),
    onSuccess: (_result, projectId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
    },
  });
};
