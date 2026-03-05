const express = require("express");
const router = express.Router();
const controller = require("./assistant.controller");
const authenticate = require("../../common/middleware/auth.middleware");

router.use(authenticate);

router.post("/chat", controller.askAssistant);

module.exports = router;
