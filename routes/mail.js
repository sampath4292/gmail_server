const express = require("express");
const router = express.Router();

const { getMailById, deleteMail } = require("../controllers/mailController");

router.get("/:id", getMailById);
router.delete("/:id", deleteMail);

module.exports = router;
