const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const c = require("../controllers/roleplay.controller");

const router = express.Router();

router.use(requireAuth);

// list scenarios (for dropdown)
router.get("/scenarios", c.list);

// get translated scenario for this user
router.get("/scenarios/:id/prepare", c.prepare);

module.exports = router;