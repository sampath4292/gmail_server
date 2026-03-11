const Email = require("../models/Email");

// Get inbox for a specific email
exports.getInbox = async (req, res) => {
  try {
    const email = req.params.email;

    const mails = await Email.find({ to: email });

    res.json({
      success: true,
      count: mails.length,
      data: mails,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get mail by ID
exports.getMailById = async (req, res) => {
  try {
    const mail = await Email.findById(req.params.id);

    if (!mail) {
      return res.status(404).json({ message: "Mail not found" });
    }

    res.json(mail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// Delete mail by ID
exports.deleteMail = async (req, res) => {
  try {
    const mail = await Email.findByIdAndDelete(req.params.id);

    if (!mail) {
      return res.status(404).json({ message: "Mail not found" });
    }

    res.json({
      message: "Email deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
