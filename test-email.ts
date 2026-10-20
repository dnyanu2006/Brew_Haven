import "dotenv/config";
import nodemailer from "nodemailer";

async function main() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP_USER or SMTP_PASS is missing from .env");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: { user, pass },
  });

  await transporter.verify();
  console.log("Gmail SMTP connection successful!");

  const info = await transporter.sendMail({
  from: process.env.EMAIL_FROM || user,
  to: user,
  subject: "Brew Haven SMTP Test",
  text: "Success! Gmail email sending is configured for Brew Haven.",
});

console.log("Message ID:", info.messageId);
console.log("Accepted:", info.accepted);
console.log("Rejected:", info.rejected);

  console.log("Message accepted by SMTP server.");
console.log("Recipient:", user);
}

main().catch((error) => {
  console.error("Email test failed:", error.message);
  process.exitCode = 1;
});
