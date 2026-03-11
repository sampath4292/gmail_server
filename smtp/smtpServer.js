// smtp/smtpServer.js

const { SMTPServer } = require("smtp-server");
const { simpleParser } = require("mailparser");
const Email = require("../models/Email");

function startSMTPServer() {
  const smtpServer = new SMTPServer({
    authOptional: true,
    disabledCommands: ["STARTTLS"],

    async onData(stream, session, callback) {
      let emailData = "";

      stream.on("data", (chunk) => {
        emailData += chunk.toString();
      });

      stream.on("end", async () => {
        try {
          const parsedEmail = await simpleParser(emailData);

          await Email.create({
            from,
            to,
            subject,
            message,
            folder: "sent",
          });

          console.log("📨 Email stored in database");

          callback();
        } catch (error) {
          console.error("SMTP Error:", error);
          callback(error);
        }
      });
    },
  });

  smtpServer.listen(2525, () => {
    console.log("📧 SMTP Email Server running on port 2525");
  });
}

module.exports = startSMTPServer;
