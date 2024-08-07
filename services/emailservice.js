// emailService.js
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  logger: true, // Enable logging
  debug: true,
});

const mailOptions = {
  from: process.env.EMAIL_USER,
  to: "memonriyazwork@gmail.com",
  subject: "Test Email",
  text: "This is a test email.",
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.log("Error sending email:", error);
  } else {
    console.log("Email sent:", info.response);
  }
});

const sendMeetingDetails = (email, meetingId, password) => {
  console.log("Sending email to:", email); // Debugging line
  console.log("Meeting ID:", meetingId);
  console.log("Password:", password);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Meeting Details",
    text: `Your meeting details are:\nMeeting ID: ${meetingId}\nPassword: ${password}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

module.exports = { sendMeetingDetails };
