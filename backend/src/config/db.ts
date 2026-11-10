import { Pool, type QueryConfigValues } from "pg";
import "dotenv/config";

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

async function query(
  text: string,
  params?: QueryConfigValues<unknown[]>
) {
  return pool.query(text, params);
}

const db = { pool, query };

export = db;