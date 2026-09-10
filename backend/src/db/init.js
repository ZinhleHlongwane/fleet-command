// Reads schema.sql and runs it against the database configured in .env.
// This is what "npm run db:init" calls. It's safe to run more than once
// because every CREATE TABLE in schema.sql uses "IF NOT EXISTS".

const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

async function main() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  console.log("Creating tables (if they don't already exist)...");
  await pool.query(schemaSql);
  console.log("Done. Your database is ready.");

  await pool.end();
}

main().catch((err) => {
  console.error("Failed to initialize the database:", err.message);
  process.exit(1);
});
