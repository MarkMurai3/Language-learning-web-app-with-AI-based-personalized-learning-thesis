const map = {
  English: "en",
  French: "fr",
  Spanish: "es",
  Italian: "it",
  German: "de",
  Hungarian: "hu",
};

function toLangCode(name) {
  return map[name] || "en";
}

module.exports = { toLangCode };
