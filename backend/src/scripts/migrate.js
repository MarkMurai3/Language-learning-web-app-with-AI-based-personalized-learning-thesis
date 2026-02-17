require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { pool } = require("../db");

async function run() {
  const dir = path.join(__dirname, "..", "..", "migrations");
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".sql")).sort();

  for (const f of files) {
    const sql = fs.readFileSync(path.join(dir, f), "utf8");
    console.log("Running", f);
    await pool.query(sql);
  }

  await pool.end();
  console.log("Done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
