import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load environment variables
config({ path: '.env.local' });

export default defineConfig({
  schema: './src/core/database/schema.ts',
  out: './src/core/database/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  tablesFilter: ['!_*'],
  breakpoints: true,
});
