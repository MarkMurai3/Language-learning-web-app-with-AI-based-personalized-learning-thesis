const path = require("path");
const envPath = path.join(__dirname, "..", ".env");

const result = require("dotenv").config({ path: envPath, debug: true });

console.log("[DEBUG] dotenv path:", envPath);
console.log("[DEBUG] dotenv parsed keys:", Object.keys(result.parsed || {}));
console.log("[DEBUG] ADMIN_EMAIL from parsed:", result.parsed?.ADMIN_EMAIL);
console.log("[DEBUG] ADMIN_EMAIL from process.env:", process.env.ADMIN_EMAIL);

const app = require("./app");


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
