import { db, users, forumPosts, projects, meetingNotes } from './index';
import { generateId } from '../../shared/utils/id-generator';

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Create sample users
    console.log('Creating sample users...');
    const sampleUsers = await db.insert(users).values([
      {
        id: generateId(),
        privyDid: 'did:privy:demo-admin',
        username: 'FortWorthAdmin',
        bio: 'Fort Worth DAO Administrator',
        avatarUrl: null,
      },
      {
        id: generateId(),
        privyDid: 'did:privy:demo-member',
        username: 'CivicInnovator',
        bio: 'Passionate about civic tech and blockchain governance',
        avatarUrl: null,
      },
      {
        id: generateId(),
        privyDid: 'did:privy:demo-developer',
        username: 'Web3Developer',
        bio: 'Building the future of decentralized governance',
        avatarUrl: null,
      },
    ]).returning();

    console.log(`✓ Created ${sampleUsers.length} users`);

    // Create sample forum posts
    console.log('Creating sample forum posts...');
    const samplePosts = await db.insert(forumPosts).values([
      {
        id: generateId(),
        authorId: sampleUsers[0]!.id,
        title: 'Welcome to Fort Worth DAO!',
        content: 'This is our community forum where we discuss ideas, proposals, and collaborate on making Fort Worth a leader in Web3 civic innovation. Feel free to introduce yourself and share your ideas!',
        category: 'General',
        parentId: null,
      },
      {
        id: generateId(),
        authorId: sampleUsers[1]!.id,
        title: 'Proposal: Blockchain-based Voting System for Local Elections',
        content: 'I propose we develop a transparent, secure voting system using blockchain technology for Fort Worth municipal elections. This would increase voter confidence and participation while ensuring tamper-proof results.',
        category: 'Governance',
        parentId: null,
      },
      {
        id: generateId(),
        authorId: sampleUsers[2]!.id,
        title: 'Technical Workshop: Smart Contract Development',
        content: 'Join us for a hands-on workshop on smart contract development using Solidity. We\'ll cover the basics and build a simple DAO contract together.',
        category: 'Education',
        parentId: null,
      },
    ]).returning();

    console.log(`✓ Created ${samplePosts.length} forum posts`);

    // Create sample projects
    console.log('Creating sample projects...');
    const sampleProjects = await db.insert(projects).values([
      {
        id: generateId(),
        creatorId: sampleUsers[1]!.id,
        title: 'Fort Worth Transit DAO',
        description: 'A decentralized platform for community-driven public transit improvements',
        githubRepo: 'https://github.com/fwtx-dao/transit-dao',
        intent: 'Improve public transportation through community governance',
        benefitToFortWorth: 'Creates transparent, community-driven decision making for transit routes and schedules, potentially reducing commute times by 20%',
        status: 'active',
        tags: 'transit,governance,infrastructure',
      },
      {
        id: generateId(),
        creatorId: sampleUsers[2]!.id,
        title: 'Civic NFT Rewards',
        description: 'NFT-based rewards system for civic participation',
        githubRepo: 'https://github.com/fwtx-dao/civic-nft',
        intent: 'Incentivize community participation in local governance',
        benefitToFortWorth: 'Increases civic engagement by gamifying participation in town halls, voting, and community service',
        status: 'proposed',
        tags: 'nft,rewards,engagement',
      },
    ]).returning();

    console.log(`✓ Created ${sampleProjects.length} projects`);

    // Create sample meeting notes
    console.log('Creating sample meeting notes...');
    const sampleMeetingNotes = await db.insert(meetingNotes).values([
      {
        id: generateId(),
        authorId: sampleUsers[0]!.id,
        title: 'Q1 2024 Community Planning Session',
        date: '2024-01-15',
        attendees: 'FortWorthAdmin,CivicInnovator,Web3Developer',
        agenda: '1. Q1 Goals\n2. Budget Review\n3. New Project Proposals',
        notes: 'Discussed expanding the DAO\'s reach through educational workshops. Budget allocated for 3 major initiatives. Strong community interest in blockchain governance solutions.',
        actionItems: 'Schedule blockchain workshop for February\nCreate project submission guidelines\nSet up community treasury wallet',
        tags: 'planning,quarterly,budget',
      },
      {
        id: generateId(),
        authorId: sampleUsers[2]!.id,
        title: 'Technical Infrastructure Meeting',
        date: '2024-01-18',
        attendees: 'Web3Developer,TechLead,SecurityExpert',
        agenda: '1. Platform Security\n2. Scalability Planning\n3. Tool Selection',
        notes: 'Decided to implement Turso for database needs due to edge deployment capabilities. Security audit scheduled for next month. Drizzle ORM chosen for type safety.',
        actionItems: 'Implement 2FA for all admin accounts\nResearch IPFS integration\nCreate backup strategy document',
        tags: 'technical,infrastructure,security',
      },
    ]).returning();

    console.log(`✓ Created ${sampleMeetingNotes.length} meeting notes`);

    console.log('\n✅ Database seeding complete!');
    console.log('You can now use these demo accounts:');
    console.log('- did:privy:demo-admin (Admin user)');
    console.log('- did:privy:demo-member (Regular member)');
    console.log('- did:privy:demo-developer (Developer)');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seed function
seed().then(() => {
  console.log('Seed script finished');
  process.exit(0);
});