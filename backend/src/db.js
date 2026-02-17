// const { Pool } = require("pg");

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: process.env.DATABASE_URL?.includes("sslmode=require")
//     ? { rejectUnauthorized: false }
//     : undefined,
// });

// module.exports = { pool };

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("[WARN] DATABASE_URL is missing. DB features will fail.");
}

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
});

module.exports = { pool };
