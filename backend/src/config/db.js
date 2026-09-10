// This file sets up one shared connection pool to PostgreSQL.
// Every other file that needs the database imports { query } from here
// instead of creating its own connection, so we don't open a new
// connection every time a route handler runs.

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});

// Small helper so route files can just do db.query(sql, values)
// instead of pool.query(sql, values) everywhere.
async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
