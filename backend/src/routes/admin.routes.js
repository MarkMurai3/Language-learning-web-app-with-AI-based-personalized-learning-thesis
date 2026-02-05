const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const c = require("../controllers/admin.controller");

const router = express.Router();

router.use(requireAuth, requireAdmin);

// users
router.get("/users", c.getUsers);
router.patch("/users/:id", c.patchUser);

// blocked videos
router.get("/blocked-videos", c.getBlocked);
router.post("/blocked-videos", c.addBlocked);
router.delete("/blocked-videos/:videoId", c.deleteBlocked);

// seed channels
router.get("/seed-channels", c.getSeeds);
router.post("/seed-channels", c.addSeed);
router.delete("/seed-channels/:language/:channelId", c.deleteSeed);

module.exports = router;
