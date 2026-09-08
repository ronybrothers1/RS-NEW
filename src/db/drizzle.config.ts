import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config();

const databaseUrl =
  process.env.DATABASE_ADMIN_URL?.trim() ||
  process.env.DATABASE_URL?.trim();

let dbCredentials: any;

if (databaseUrl) {
  dbCredentials = { url: databaseUrl };
} else {
  const sqlHost = process.env.SQL_HOST;
  const sqlDbName = process.env.SQL_DB_NAME;
  const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
  const password =
    process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

  if (!sqlHost) {
    throw new Error(
      "Database configuration missing. Set DATABASE_ADMIN_URL/DATABASE_URL or SQL_HOST."
    );
  }
  if (!sqlDbName) {
    throw new Error("SQL_DB_NAME must be set when DATABASE_URL is not used.");
  }
  if (!user) {
    throw new Error(
      "SQL_ADMIN_USER or SQL_USER must be set when DATABASE_URL is not used."
    );
  }
  if (!password) {
    throw new Error(
      "SQL_ADMIN_PASSWORD or SQL_PASSWORD must be set when DATABASE_URL is not used."
    );
  }

  dbCredentials = {
    host: sqlHost,
    port: Number.parseInt(process.env.SQL_PORT || "5432", 10),
    user,
    password,
    database: sqlDbName,
    ssl: process.env.SQL_SSL === "true",
  };
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  dbCredentials,
  verbose: true,
  strict: true,
});
