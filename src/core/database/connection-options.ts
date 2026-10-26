import type { PoolConfig } from "pg";

/** psql's sslrootcert=system is not a file path; pg uses system CAs by default. */
export function databaseConnectionOptions(
  connectionString: string,
): PoolConfig {
  const url = new URL(connectionString);
  if (url.searchParams.get("sslrootcert") === "system")
    url.searchParams.delete("sslrootcert");
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true },
  };
}
