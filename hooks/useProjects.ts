import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@privy-io/react-auth";

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

const fetchProjects = async (): Promise<Project[]> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/projects", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.statusText}`);
  }

  return response.json();
};

const fetchProjectDetails = async (projectId: string): Promise<ProjectDetails> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/projects/${projectId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch project details: ${response.statusText}`);
  }

  return response.json();
};

const fetchProjectUpdates = async (projectId: string): Promise<ProjectUpdate[]> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/projects/${projectId}/updates`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch project updates: ${response.statusText}`);
  }

  return response.json();
};

const createProject = async (projectData: ProjectInput): Promise<Project> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create project: ${response.statusText}`);
  }

  return response.json();
};

const updateProject = async (projectData: ProjectUpdateData): Promise<Project> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/projects", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update project: ${response.statusText}`);
  }

  return response.json();
};

const deleteProject = async (projectId: string): Promise<void> => {
  const accessToken = await getAccessToken();
  const response = await fetch("/api/projects", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ id: projectId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete project: ${response.statusText}`);
  }
};

const createProjectUpdate = async ({ 
  projectId, 
  updateData 
}: { 
  projectId: string; 
  updateData: ProjectUpdateInput 
}): Promise<ProjectUpdate> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/projects/${projectId}/updates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error(`Failed to create project update: ${response.statusText}`);
  }

  return response.json();
};

const joinProject = async (projectId: string): Promise<void> => {
  const accessToken = await getAccessToken();
  const response = await fetch(`/api/projects/${projectId}/join`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to join project: ${response.statusText}`);
  }
};

// Query Hooks
export const useProjects = () => {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useProjectDetails = (projectId: string | null) => {
  return useQuery({
    queryKey: ["project-details", projectId],
    queryFn: () => fetchProjectDetails(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useProjectUpdates = (projectId: string | null) => {
  return useQuery({
    queryKey: ["project-updates", projectId],
    queryFn: () => fetchProjectUpdates(projectId!),
    enabled: !!projectId,
    staleTime: 1000 * 60, // 1 minute
  });
};

// Mutation Hooks
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createProject,
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
    onSuccess: (newProject) => {
      queryClient.setQueryData(["projects"], (oldData: Project[] | undefined) => {
        return oldData ? [newProject, ...oldData.filter(p => !p.id.startsWith('temp-'))] : [newProject];
      });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateProject,
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
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(["projects"], (oldData: Project[] | undefined) => {
        return oldData ? oldData.map(project => 
          project.id === updatedProject.id ? updatedProject : project
        ) : [updatedProject];
      });
      
      queryClient.invalidateQueries({ queryKey: ["project-details", updatedProject.id] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: (_, deletedProjectId) => {
      // Remove the project from the list
      queryClient.setQueryData(["projects"], (oldData: Project[] | undefined) => {
        return oldData ? oldData.filter(project => project.id !== deletedProjectId) : [];
      });
      
      // Remove project details from cache
      queryClient.removeQueries({ queryKey: ["project-details", deletedProjectId] });
      queryClient.removeQueries({ queryKey: ["project-updates", deletedProjectId] });
    },
  });
};

export const useCreateProjectUpdate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createProjectUpdate,
    onSuccess: (newUpdate, { projectId }) => {
      // Add the new update to the beginning of the updates list
      queryClient.setQueryData(["project-updates", projectId], (oldData: ProjectUpdate[] | undefined) => {
        return oldData ? [newUpdate, ...oldData] : [newUpdate];
      });
    },
  });
};

export const useJoinProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: joinProject,
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
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ["project-details", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};