import { db } from './index';
import { eq, and, desc, sql } from 'drizzle-orm';
import { 
  users, 
  members, 
  forumPosts, 
  projects, 
  meetingNotes,
  projectCollaborators,
  forumVotes,
  type NewUser,
  type NewMember,
  type NewForumPost,
  type NewProject,
  type NewMeetingNote
} from './schema';

// User operations
export const userOperations = {
  // Create or update user from Privy auth
  async upsertFromPrivy(privyDid: string, email?: string) {
    const userId = crypto.randomUUID();
    const existingUser = await db.select().from(users).where(eq(users.privyDid, privyDid)).get();
    
    if (existingUser) {
      return existingUser;
    }

    const newUser: NewUser = {
      id: userId,
      privyDid,
      username: email?.split('@')[0] || `user_${userId.slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.insert(users).values(newUser);
    
    // Auto-create basic membership
    const newMember: NewMember = {
      id: crypto.randomUUID(),
      userId,
      membershipType: 'basic',
      contributionPoints: 0,
      votingPower: 1,
      status: 'active',
    };
    
    await db.insert(members).values(newMember);
    
    return db.select().from(users).where(eq(users.id, userId)).get();
  },

  async getByPrivyDid(privyDid: string) {
    return db.select().from(users).where(eq(users.privyDid, privyDid)).get();
  },

  async updateProfile(userId: string, updates: Partial<NewUser>) {
    await db.update(users)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(users.id, userId));
  }
};

// Member operations
export const memberOperations = {
  async getMembershipStatus(userId: string) {
    return db.select().from(members).where(eq(members.userId, userId)).get();
  },

  async updateMembership(userId: string, updates: Partial<NewMember>) {
    await db.update(members)
      .set({ ...updates, updatedAt: new Date().toISOString() })
      .where(eq(members.userId, userId));
  },

  async addContributionPoints(userId: string, points: number) {
    const member = await this.getMembershipStatus(userId);
    if (member) {
      await db.update(members)
        .set({ 
          contributionPoints: member.contributionPoints + points,
          updatedAt: new Date().toISOString() 
        })
        .where(eq(members.userId, userId));
    }
  }
};

// Forum operations
export const forumOperations = {
  async createPost(post: Omit<NewForumPost, 'id' | 'createdAt' | 'updatedAt'>) {
    const newPost: NewForumPost = {
      ...post,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.insert(forumPosts).values(newPost);
    
    // Award contribution points
    await memberOperations.addContributionPoints(post.authorId, 5);
    
    return newPost;
  },

  async getPostsWithVotes(limit = 20, offset = 0) {
    const posts = await db
      .select({
        post: forumPosts,
        author: users,
        voteCount: sql<number>`
          (SELECT COALESCE(SUM(vote_type), 0) 
           FROM forum_votes 
           WHERE forum_votes.post_id = forum_posts.id)
        `.as('vote_count')
      })
      .from(forumPosts)
      .leftJoin(users, eq(forumPosts.authorId, users.id))
      .where(eq(forumPosts.parentId, sql`NULL`))
      .orderBy(desc(forumPosts.createdAt))
      .limit(limit)
      .offset(offset);
    
    return posts;
  },

  async voteOnPost(postId: string, userId: string, voteType: 1 | -1) {
    // Check if user already voted
    const existingVote = await db
      .select()
      .from(forumVotes)
      .where(and(
        eq(forumVotes.postId, postId),
        eq(forumVotes.userId, userId)
      ))
      .get();

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // Remove vote if same type
        await db.delete(forumVotes)
          .where(and(
            eq(forumVotes.postId, postId),
            eq(forumVotes.userId, userId)
          ));
      } else {
        // Update vote type
        await db.update(forumVotes)
          .set({ voteType })
          .where(and(
            eq(forumVotes.postId, postId),
            eq(forumVotes.userId, userId)
          ));
      }
    } else {
      // Create new vote
      await db.insert(forumVotes).values({
        postId,
        userId,
        voteType,
        createdAt: new Date().toISOString(),
      });
    }
  }
};

// Project operations
export const projectOperations = {
  async createProject(project: Omit<NewProject, 'id' | 'createdAt' | 'updatedAt'>) {
    const newProject: NewProject = {
      ...project,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.insert(projects).values(newProject);
    
    // Add creator as collaborator
    await db.insert(projectCollaborators).values({
      projectId: newProject.id,
      userId: project.creatorId,
      role: 'owner',
      joinedAt: new Date().toISOString(),
    });
    
    // Award contribution points
    await memberOperations.addContributionPoints(project.creatorId, 20);
    
    return newProject;
  },

  async getProjectsWithCollaborators(limit = 20, offset = 0) {
    const projectList = await db
      .select({
        project: projects,
        creator: users,
        collaboratorCount: sql<number>`
          (SELECT COUNT(*) 
           FROM project_collaborators 
           WHERE project_collaborators.project_id = projects.id)
        `.as('collaborator_count')
      })
      .from(projects)
      .leftJoin(users, eq(projects.creatorId, users.id))
      .orderBy(desc(projects.createdAt))
      .limit(limit)
      .offset(offset);
    
    return projectList;
  },

  async joinProject(projectId: string, userId: string, role = 'contributor') {
    await db.insert(projectCollaborators).values({
      projectId,
      userId,
      role,
      joinedAt: new Date().toISOString(),
    });
    
    // Award contribution points
    await memberOperations.addContributionPoints(userId, 10);
  }
};

// Meeting notes operations
export const meetingNotesOperations = {
  async createMeetingNote(note: Omit<NewMeetingNote, 'id' | 'createdAt' | 'updatedAt'>) {
    const newNote: NewMeetingNote = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.insert(meetingNotes).values(newNote);
    
    // Award contribution points
    await memberOperations.addContributionPoints(note.authorId, 15);
    
    return newNote;
  },

  async getMeetingNotes(limit = 20, offset = 0) {
    return db
      .select({
        note: meetingNotes,
        author: users,
      })
      .from(meetingNotes)
      .leftJoin(users, eq(meetingNotes.authorId, users.id))
      .orderBy(desc(meetingNotes.date), desc(meetingNotes.createdAt))
      .limit(limit)
      .offset(offset);
  },

  async searchMeetingNotes(searchTerm: string) {
    return db
      .select({
        note: meetingNotes,
        author: users,
      })
      .from(meetingNotes)
      .leftJoin(users, eq(meetingNotes.authorId, users.id))
      .where(sql`
        ${meetingNotes.title} LIKE ${'%' + searchTerm + '%'} OR
        ${meetingNotes.notes} LIKE ${'%' + searchTerm + '%'} OR
        ${meetingNotes.tags} LIKE ${'%' + searchTerm + '%'}
      `)
      .orderBy(desc(meetingNotes.date));
  }
};

// Export all operations
export const dbOperations = {
  users: userOperations,
  members: memberOperations,
  forums: forumOperations,
  projects: projectOperations,
  meetingNotes: meetingNotesOperations,
};