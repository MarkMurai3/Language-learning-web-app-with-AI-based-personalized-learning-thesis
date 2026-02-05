const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const recommendationRoutes = require("./routes/recommendation.routes");
const interestsRoutes = require("./routes/interests.routes");
const profileRoutes = require("./routes/profile.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const historyRoutes = require("./routes/history.routes");
const chatRoutes = require("./routes/chat.routes");
const ttsRoutes = require("./routes/tts.routes");
const sttRoutes = require("./routes/stt.routes");
const sttLocalRoutes = require("./routes/sttLocal.routes");
const searchRoutes = require("./routes/search.routes");
const adminRoutes = require("./routes/admin.routes");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api", userRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/interests", interestsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/tts", ttsRoutes);
app.use("/api/stt", sttRoutes);
app.use("/api/stt/local", sttLocalRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/admin", adminRoutes);



// Temporary test route
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend is running",
  });
});

module.exports = app;
