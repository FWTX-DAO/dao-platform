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
} from "@/app/_actions/projects";

export interface Project {
  id: string;
  title: string;
  description: string;
  github_repo: string;
  intent: string;
  benefit_to_fort_worth: string;
  status: string;
  tags: string;
  creator_id: string;
  creator_name: string;
  creator_avatar?: string;
  created_at: string;
  updated_at?: string;
  collaborators: number;
}

export interface ProjectDetails extends Omit<Project, 'collaborators'> {
  collaborators: Array<{
    user_id: string;
    username: string;
    avatar_url?: string;
    role: string;
    joined_at: string;
  }>;
  total_collaborators: number;
  user_is_collaborator: boolean;
  user_is_creator: boolean;
}

export interface ProjectUpdate {
  id: string;
  title: string;
  content: string;
  update_type: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  updated_at?: string;
}

export interface ProjectInput {
  title: string;
  description: string;
  githubRepo: string;
  intent: string;
  benefitToFortWorth: string;
  tags?: string | string[];
  status?: string;
}

export interface ProjectUpdateInput {
  title: string;
  content: string;
  updateType?: string;
}

export interface ProjectUpdateData {
  id: string;
  title: string;
  description: string;
  githubRepo: string;
  intent: string;
  benefitToFortWorth: string;
  tags?: string | string[];
  status?: string;
}

// Query Hooks
export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => getProjectsAction() as Promise<Project[]>,
    staleTime: 1000 * 60,
  });
};

export const useProjectDetails = (projectId: string | null) => {
  return useQuery({
    queryKey: ["project-details", projectId],
    queryFn: () => getProjectByIdAction(projectId!) as Promise<ProjectDetails>,
    enabled: !!projectId,
    staleTime: 1000 * 60,
  });
};

export const useProjectUpdates = (projectId: string | null) => {
  return useQuery({
    queryKey: ["project-updates", projectId],
    queryFn: () => getProjectUpdatesAction(projectId!) as Promise<ProjectUpdate[]>,
    enabled: !!projectId,
    staleTime: 1000 * 60,
  });
};

// Mutation Hooks
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
        tags: Array.isArray(projectData.tags) ? projectData.tags.join(',') : projectData.tags,
        status: projectData.status,
      }),
    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previousProjects = queryClient.getQueryData<Project[]>(["projects"]);

      const optimisticProject: Project = {
        id: `temp-${Date.now()}`,
        title: newProject.title,
        description: newProject.description,
        github_repo: newProject.githubRepo,
        intent: newProject.intent,
        benefit_to_fort_worth: newProject.benefitToFortWorth,
        status: newProject.status || 'proposed',
        tags: Array.isArray(newProject.tags) ? newProject.tags.join(',') : (newProject.tags || ''),
        creator_id: 'temp',
        creator_name: 'You',
        created_at: new Date().toISOString(),
        collaborators: 1,
      };

      queryClient.setQueryData<Project[]>(["projects"], (old) =>
        old ? [optimisticProject, ...old] : [optimisticProject]
      );

      return { previousProjects };
    },
    onError: (_err, _newProject, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
        benefit: projectData.benefitToFortWorth,
        tags: Array.isArray(projectData.tags) ? projectData.tags.join(',') : projectData.tags,
        status: projectData.status,
      }),
    onMutate: async (updatedProjectData) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      await queryClient.cancelQueries({ queryKey: ["project-details", updatedProjectData.id] });

      const previousProjects = queryClient.getQueryData<Project[]>(["projects"]);
      const previousDetails = queryClient.getQueryData<ProjectDetails>(["project-details", updatedProjectData.id]);

      queryClient.setQueryData<Project[]>(["projects"], (old) =>
        old ? old.map((project): Project => {
          if (project.id === updatedProjectData.id) {
            return {
              ...project,
              title: updatedProjectData.title,
              description: updatedProjectData.description,
              github_repo: updatedProjectData.githubRepo,
              intent: updatedProjectData.intent,
              benefit_to_fort_worth: updatedProjectData.benefitToFortWorth,
              status: updatedProjectData.status || project.status,
              tags: Array.isArray(updatedProjectData.tags) ? updatedProjectData.tags.join(',') : (updatedProjectData.tags || project.tags),
              updated_at: new Date().toISOString(),
            };
          }
          return project;
        }) : []
      );

      return { previousProjects, previousDetails };
    },
    onError: (_err, updatedProjectData, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects);
      }
      if (context?.previousDetails) {
        queryClient.setQueryData(["project-details", updatedProjectData.id], context.previousDetails);
      }
    },
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-details", variables.id] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => deleteProjectAction(projectId),
    onSuccess: (_, deletedProjectId) => {
      queryClient.setQueryData(["projects"], (oldData: Project[] | undefined) => {
        return oldData ? oldData.filter(project => project.id !== deletedProjectId) : [];
      });
      queryClient.removeQueries({ queryKey: ["project-details", deletedProjectId] });
      queryClient.removeQueries({ queryKey: ["project-updates", deletedProjectId] });
    },
  });
};

export const useCreateProjectUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, updateData }: { projectId: string; updateData: ProjectUpdateInput }) =>
      createProjectUpdateAction(projectId, {
        title: updateData.title,
        content: updateData.content,
      }),
    onSuccess: (_result, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["project-updates", projectId] });
    },
  });
};

export const useJoinProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => joinProjectAction(projectId),
    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      await queryClient.cancelQueries({ queryKey: ["project-details", projectId] });

      const previousProjects = queryClient.getQueryData<Project[]>(["projects"]);
      const previousDetails = queryClient.getQueryData<ProjectDetails>(["project-details", projectId]);

      queryClient.setQueryData<Project[]>(["projects"], (old) =>
        old ? old.map(project =>
          project.id === projectId
            ? { ...project, collaborators: project.collaborators + 1 }
            : project
        ) : []
      );

      if (previousDetails) {
        queryClient.setQueryData<ProjectDetails>(["project-details", projectId], {
          ...previousDetails,
          user_is_collaborator: true,
          total_collaborators: previousDetails.total_collaborators + 1,
        });
      }

      return { previousProjects, previousDetails };
    },
    onError: (_err, projectId, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects);
      }
      if (context?.previousDetails) {
        queryClient.setQueryData(["project-details", projectId], context.previousDetails);
      }
    },
  });
};
