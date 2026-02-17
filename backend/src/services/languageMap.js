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

const MAP = {
  "English": { yt: "en", franc: "eng" },
  "French": { yt: "fr", franc: "fra" },
  "Spanish": { yt: "es", franc: "spa" },
  "German": { yt: "de", franc: "deu" },
  "Italian": { yt: "it", franc: "ita" },
  "Portuguese": { yt: "pt", franc: "por" },

  "Mandarin Chinese": { yt: "zh", franc: "cmn" }, // franc uses cmn often
  "Arabic": { yt: "ar", franc: "ara" },
  "Russian": { yt: "ru", franc: "rus" },
  "Japanese": { yt: "ja", franc: "jpn" },
  "Korean": { yt: "ko", franc: "kor" },
  "Hindi": { yt: "hi", franc: "hin" },

  "Thai": { yt: "th", franc: "tha" },
  "Vietnamese": { yt: "vi", franc: "vie" },
  "Indonesian": { yt: "id", franc: "ind" },
  "Bengali": { yt: "bn", franc: "ben" },
  "Urdu": { yt: "ur", franc: "urd" },

  "Turkish": { yt: "tr", franc: "tur" },
  "Polish": { yt: "pl", franc: "pol" },
  "Swedish": { yt: "sv", franc: "swe" },
  "Finnish": { yt: "fi", franc: "fin" },
  "Romanian": { yt: "ro", franc: "ron" },
  "Dutch": { yt: "nl", franc: "nld" },
  "Czech": { yt: "cs", franc: "ces" },
  "Greek": { yt: "el", franc: "ell" },
  "Bulgarian": { yt: "bg", franc: "bul" },

  "Swahili": { yt: "sw", franc: "swa" },
  "Afrikaans": { yt: "af", franc: "afr" },
  "Norwegian": { yt: "no", franc: "nor" }, // (sometimes nb/nn; no is OK for many APIs)
  "Tagalog": { yt: "tl", franc: "tgl" },
  "Ukrainian": { yt: "uk", franc: "ukr" },
  "Hebrew": { yt: "he", franc: "heb" },
  "Malay": { yt: "ms", franc: "msa" },
  "Tamil": { yt: "ta", franc: "tam" },
};

function getLangCodes(name) {
  return MAP[name] || { yt: "en", franc: "eng" };
}

module.exports = { getLangCodes };
