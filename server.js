const express = require("express");

require("./db");

const inboxRoutes = require("./routes/inbox");
const mailRoutes = require("./routes/mail");
const sendRoutes = require("./routes/send");
const sentRoutes = require("./routes/sent");

const startSMTPServer = require("./smtp/smtpServer");

const app = express();

app.use(express.json());
app.use("/sent", sentRoutes);
app.use("/send", sendRoutes);
app.use("/inbox", inboxRoutes);
app.use("/mail", mailRoutes);

app.listen(3000, () => {
  console.log("🚀 API server running on port 3000");
});

startSMTPServer();
