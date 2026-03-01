const ROLEPLAY_SCENARIOS = [
  {
    id: "hotel_checkin",
    title: "Hotel check-in",
    description:
      "You arrive at a hotel. Check in, confirm your booking, ask about breakfast/Wi-Fi, and request anything you need. The assistant is the receptionist.",
    starterUser: "Hi, I have a reservation under the name Márk Murai.",
    systemPrompt: `
You are a hotel receptionist.
The user is checking in.
Be realistic and friendly.
Ask short follow-up questions to keep the conversation going.
`,
  },
  // add more here...
];

function getScenarioById(id) {
  return ROLEPLAY_SCENARIOS.find((s) => s.id === id) || null;
}

function listScenarios() {
  // Return minimal list for dropdowns
  return ROLEPLAY_SCENARIOS.map(({ id, title, description }) => ({ id, title, description }));
}

module.exports = { getScenarioById, listScenarios };