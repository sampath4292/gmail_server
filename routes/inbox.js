const express = require("express");
const router = express.Router();

const { getInbox } = require("../controllers/mailController");

router.get("/:email", getInbox);

module.exports = router;
