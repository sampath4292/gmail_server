const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "localhost",
  port: 2525,
  secure: false,
  // Local dev against non-TLS SMTP server.
  ignoreTLS: true,
});

transporter
  .sendMail({
    from: "alice@test.com",
    to: "bob@test.com",
    subject: "Hello",
    text: "This is my first email server test",
  })
  .then((info) => {
    console.log("Email sent:", info.response);
  })
  .catch((error) => {
    console.error("Send failed:", error.message);
    process.exitCode = 1;
  });
