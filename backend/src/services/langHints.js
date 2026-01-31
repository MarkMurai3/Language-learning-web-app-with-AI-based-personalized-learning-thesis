const HINTS = {
  English: {
    learnStop: ["learn", "lesson", "comprehensible input", "beginner", "a1", "a2", "grammar"],
    interestMap: {
      Music: ["music"],
      Gaming: ["gaming", "gameplay"],
      Movies: ["movies", "film"],
      Travel: ["travel", "vlog"],
      Technology: ["tech", "programming"],
    },
  },

  Spanish: {
    learnStop: ["aprender", "clase", "lección", "input comprensible", "principiantes", "gramática", "a1", "a2"],
    interestMap: {
      Music: ["música", "canciones"],
      Gaming: ["gameplay", "videojuegos", "gaming"],
      Movies: ["películas", "cine"],
      Travel: ["viajes", "vlog"],
      Technology: ["tecnología", "programación"],
    },
  },

  French: {
    learnStop: ["apprendre", "cours", "leçon", "compréhensible", "débutant", "grammaire", "a1", "a2"],
    interestMap: {
      Music: ["musique", "chansons"],
      Gaming: ["gaming", "jeux vidéo", "gameplay"],
      Movies: ["films", "cinéma"],
      Travel: ["voyage", "vlog"],
      Technology: ["technologie", "programmation"],
    },
  },
};

function getHints(languageName) {
  return (
    HINTS[languageName] || {
      learnStop: ["learn", "lesson", "grammar", "beginner", "a1", "a2"],
      interestMap: {},
    }
  );
}

module.exports = { getHints };
