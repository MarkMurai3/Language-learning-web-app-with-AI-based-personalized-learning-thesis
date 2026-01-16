const express = require("express");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

router.get("/me", requireAuth, (req, res) => {
  // req.user comes from the JWT payload
  res.json({
    user: {
      id: req.user.userId,
      email: req.user.email,
    },
  });
});

module.exports = router;
