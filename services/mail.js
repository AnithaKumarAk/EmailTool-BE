require('dotenv').config();
const sgMail = require("@sendgrid/mail");

const sendMail = (mails, subject, message, template) => {
  sgMail.setApiKey(process.env.Mail_Secret);

  const msg = {
    to: mails,
    from: "mailbulksender@gmail.com", 
    subject: subject,
    text: message,
  };

  // Use template as HTML content if provided
  if (template && template !== " ") {
    msg.html = template;
  }

  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error("Failed to send email:", error.response?.body || error.message);
    });
};

module.exports = { sendMail };
