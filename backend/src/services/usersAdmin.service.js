// backend/src/services/usersAdmin.service.js
const { _adminListUsers, _adminSetUserDisabled } = require("./auth.service");

function toSafeUser(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    disabled: !!row.disabled,
    targetLanguage: row.target_language, // <-- correct column name from SQL
  };
}

async function listUsers() {
  const rows = await _adminListUsers();
  return rows.map(toSafeUser);
}

async function setUserDisabled(id, disabled) {
  const row = await _adminSetUserDisabled(id, disabled);
  if (!row) return null;
  return toSafeUser(row);
}

module.exports = { listUsers, setUserDisabled };