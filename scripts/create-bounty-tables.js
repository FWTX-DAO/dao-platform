import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function createBountyTables() {
  try {
    // Create innovation_bounties table first (since others reference it)
    console.log('Creating innovation_bounties table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS innovation_bounties (
        id text PRIMARY KEY NOT NULL,
        organization_name text NOT NULL,
        organization_type text NOT NULL,
        organization_contact text,
        organization_website text,
        sponsor_first_name text,
        sponsor_last_name text,
        sponsor_email text,
        sponsor_phone text,
        sponsor_title text,
        sponsor_department text,
        sponsor_linkedin text,
        organization_size text,
        organization_industry text,
        organization_address text,
        organization_city text,
        organization_state text,
        organization_zip text,
        title text NOT NULL,
        problem_statement text NOT NULL,
        use_case text NOT NULL,
        current_state text,
        common_tools_used text,
        desired_outcome text NOT NULL,
        technical_requirements text,
        constraints text,
        deliverables text,
        bounty_amount integer,
        bounty_type text DEFAULT 'fixed',
        deadline text,
        category text,
        tags text,
        status text DEFAULT 'draft',
        screening_notes text,
        screened_by text,
        screened_at text,
        published_at text,
        submitter_id text NOT NULL,
        is_anonymous integer DEFAULT 0 NOT NULL,
        view_count integer DEFAULT 0 NOT NULL,
        proposal_count integer DEFAULT 0 NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (screened_by) REFERENCES users(id) ON UPDATE no action ON DELETE no action,
        FOREIGN KEY (submitter_id) REFERENCES users(id) ON UPDATE no action ON DELETE no action
      )
    `);
    console.log('✅ innovation_bounties table created');

    // Create bounty_proposals table
    console.log('Creating bounty_proposals table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS bounty_proposals (
        id text PRIMARY KEY NOT NULL,
        bounty_id text NOT NULL,
        project_id text,
        proposer_id text NOT NULL,
        proposal_title text NOT NULL,
        proposal_description text NOT NULL,
        approach text NOT NULL,
        timeline text,
        budget text,
        team_members text,
        status text DEFAULT 'submitted',
        review_notes text,
        reviewed_by text,
        reviewed_at text,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (bounty_id) REFERENCES innovation_bounties(id) ON UPDATE no action ON DELETE no action,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON UPDATE no action ON DELETE no action,
        FOREIGN KEY (proposer_id) REFERENCES users(id) ON UPDATE no action ON DELETE no action,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON UPDATE no action ON DELETE no action
      )
    `);
    console.log('✅ bounty_proposals table created');

    // Create bounty_comments table
    console.log('Creating bounty_comments table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS bounty_comments (
        id text PRIMARY KEY NOT NULL,
        bounty_id text NOT NULL,
        author_id text NOT NULL,
        content text NOT NULL,
        parent_id text,
        is_internal integer DEFAULT 0 NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        FOREIGN KEY (bounty_id) REFERENCES innovation_bounties(id) ON UPDATE no action ON DELETE no action,
        FOREIGN KEY (author_id) REFERENCES users(id) ON UPDATE no action ON DELETE no action,
        FOREIGN KEY (parent_id) REFERENCES bounty_comments(id) ON UPDATE no action ON DELETE no action
      )
    `);
    console.log('✅ bounty_comments table created');

    console.log('\n🎉 All bounty tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    process.exit(1);
  }
}

createBountyTables();