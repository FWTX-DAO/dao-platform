import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

// Load environment variables
config({ path: '.env.local' });

export default defineConfig({
  schema: './src/core/database/schema.ts',
  out: './src/core/database/migrations',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
  verbose: true,
  strict: true,
  // Improve migration performance
  tablesFilter: ['!_*'], // Exclude internal tables
  breakpoints: true, // Enable SQL breakpoints for debugging
});