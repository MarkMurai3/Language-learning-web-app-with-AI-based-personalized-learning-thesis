// const { generateOpenAIReply } = require("./openaiChat.service");

// async function generateChatReply({ provider, messages }) {
//   if (provider === "openai") {
//     return generateOpenAIReply(messages);
//   }

//   // placeholder for later
//   if (provider === "phi2") {
//     throw new Error("phi2 provider not implemented yet");
//   }

//   throw new Error("Unknown provider");
// }

// module.exports = { generateChatReply };

//NEW ONE
// const { generateOpenAIReply } = require("./openaiChat.service");
// const { generatePhi2Reply } = require("./phi2Chat.service");

// async function generateChatReply({ provider, messages }) {
//   if (provider === "openai") {
//     return generateOpenAIReply(messages);
//   }

//   if (provider === "phi2") {
//     return generatePhi2Reply(messages);
//   }

//   throw new Error("Unknown provider");
// }

// module.exports = { generateChatReply };

const { generateOpenAIReply } = require("./openaiChat.service");
const { generateLlamaReply } = require("./llamaChat.service");

async function generateChatReply({ provider, messages }) {
  if (provider === "openai") return generateOpenAIReply(messages);
  if (provider === "llama3") return generateLlamaReply(messages);

  throw new Error("Unknown provider");
}

module.exports = { generateChatReply };
