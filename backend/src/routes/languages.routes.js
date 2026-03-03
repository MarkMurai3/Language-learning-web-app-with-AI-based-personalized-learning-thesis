const express = require("express");
const { getLanguages } = require("../controllers/languages.controller");

const router = express.Router();
router.get("/", getLanguages);

module.exports = router;