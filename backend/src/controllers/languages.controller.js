const { listLanguages } = require("../services/languages.service");

async function getLanguages(req, res) {
  return res.json({ languages: listLanguages() });
}

module.exports = { getLanguages };