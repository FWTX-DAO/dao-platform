import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

// Create the connection following Drizzle docs pattern
const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create the drizzle instance
export const db = drizzle(client, { schema });

// Export schema for use in queries
export * from './schema';

// Export types
export type Database = typeof db;