// const express = require("express");
// const requireAuth = require("../middleware/requireAuth");

// const router = express.Router();

// router.get("/me", requireAuth, (req, res) => {
//   res.json({
//     user: {
//       id: req.user.userId,
//       email: req.user.email,
//       role: req.user.role,        // ✅ add this
//       // disabled: req.user.disabled, // optional (not in token unless you add it)
//     },
//   });
// });

// module.exports = router;

const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const { getUserById } = require("../services/auth.service");

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  const user = getUserById(req.user.userId);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  return res.json({ user }); // ✅ includes role + disabled + targetLanguage
});

module.exports = router;
