const { _adminListUsers, _adminSetUserDisabled } = require("./auth.service");

function listUsers() {
  // Return safe fields only (no password hash)
  return _adminListUsers().map((u) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    disabled: !!u.disabled,
    targetLanguage: u.targetLanguage,
  }));
}

function setUserDisabled(id, disabled) {
  const u = _adminSetUserDisabled(id, disabled);
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    disabled: !!u.disabled,
    targetLanguage: u.targetLanguage,
  };
}

module.exports = { listUsers, setUserDisabled };
