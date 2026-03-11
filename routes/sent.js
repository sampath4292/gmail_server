const express = require("express");
const router = express.Router();
const Email = require("../models/Email");

router.get("/:email", async (req, res) => {
  const emails = await Email.find({
    from: req.params.email,
    folder: "sent",
  });

  res.json(emails);
});

module.exports = router;
