const express = require("express");
const nodemailer = require("nodemailer");

const router = express.Router();

// Create transporter for local SMTP server
const transporter = nodemailer.createTransport({
  host: "localhost",
  port: 2525,
  secure: false,
  ignoreTLS: true,
});

// POST /send - Send an email
router.post("/", async (req, res) => {
  try {
    const { from, to, subject, message } = req.body;
    if (!from.includes("@") || !to.includes("@")) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address",
      });
    }
    // Validate required fields
    if (!from || !to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: from, to, subject, message",
      });
    }

    // Send email via local SMTP
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text: message,
    });

    res.json({
      success: true,
      message: "Email sent successfully",
      response: info.response,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("Send email error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
