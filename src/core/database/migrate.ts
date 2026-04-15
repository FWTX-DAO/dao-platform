import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import { resolve } from "node:path";

async function runMigrations() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  const db = drizzle({ client: pool });

  console.log("Running migrations...");

  await migrate(db, {
    migrationsFolder: resolve(__dirname, "./migrations"),
  });

  console.log("Migrations applied successfully");
  await pool.end();
}

runMigrations()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
