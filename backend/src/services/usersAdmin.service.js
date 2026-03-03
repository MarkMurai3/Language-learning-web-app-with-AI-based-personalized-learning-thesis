const { _adminListUsers, _adminSetUserDisabled } = require("./auth.service");

async function listUsers() {
  const rows = await _adminListUsers();
  return rows.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    disabled: !!u.disabled,
    targetLanguage: u.target_language,
  }));
}

async function setUserDisabled(id, disabled) {
  const u = await _adminSetUserDisabled(id, disabled);
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    disabled: !!u.disabled,
    targetLanguage: u.target_language,
  };
}

module.exports = { listUsers, setUserDisabled };