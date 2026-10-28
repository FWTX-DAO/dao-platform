import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { databaseConnectionOptions } from "./connection-options";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool(databaseConnectionOptions(process.env.DATABASE_URL));

// Create the drizzle instance
export const db = drizzle(pool, { schema });

// Export schema for use in queries
export * from "./schema";
export * from "./talent-schema";

// Export types
export type Database = typeof db;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
