// const map = {
//   English: "en",
//   French: "fr",
//   Spanish: "es",
//   Italian: "it",
//   German: "de",
//   Hungarian: "hu",
// };

// function toLangCode(name) {
//   return map[name] || "en";
// }

// module.exports = { toLangCode };


// YouTube relevanceLanguage wants ISO-639-1 (2-letter) in most cases.
// franc returns ISO-639-3 (3-letter).
// We keep both codes per language so adding languages later is easy.

const LANGS = {
  English:   { yt: "en", franc: "eng" },
  French:    { yt: "fr", franc: "fra" },
  Spanish:   { yt: "es", franc: "spa" },
  Italian:   { yt: "it", franc: "ita" },
  German:    { yt: "de", franc: "deu" },
  Hungarian: { yt: "hu", franc: "hun" },
  // Later: just add more lines here
};

function getLangCodes(languageName) {
  return LANGS[languageName] || LANGS.English;
}

module.exports = { LANGS, getLangCodes };
