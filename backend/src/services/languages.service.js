const { listLanguageNames } = require("./languageMap");

function listLanguages() {
  return listLanguageNames();
}

module.exports = { listLanguages };