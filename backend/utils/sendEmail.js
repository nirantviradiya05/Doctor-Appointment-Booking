import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",   // ✅ safer than just `service: "gmail"`
  port: 465,                // use SSL
  secure: true,             // true for port 465, false for 587
  auth: {
    user: process.env.EMAIL_USER, // Gmail address
    pass: process.env.EMAIL_PASS, // Google App Password
  },
});

export const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"Medique App" <${process.env.EMAIL_USER}>`, // ✅ sender name + email
      to,
      subject,
      text,
    });

    console.log("📩 Email sent to:", to);
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
  }
};
