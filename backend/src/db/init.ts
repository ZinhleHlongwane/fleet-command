import fs from "fs";
import path from "path";
import db = require("../config/db");

const { pool } = db;

async function main(): Promise<void> {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  console.log("Creating tables (if they don't already exist)...");
  await pool.query(schemaSql);
  console.log("Done. Your database is ready.");

  await pool.end();
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);

  console.error("Failed to initialize the database:", message);
  process.exit(1);
});