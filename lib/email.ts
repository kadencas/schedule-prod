import nodemailer from "nodemailer";

// Create the transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports (like 587)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Optionally, verify the transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP configuration error:", error);
  } else {
  }
});

export default transporter;

export async function sendResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

  const message = {
    from: `"When Support" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset your password",
    html: `
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link expires in 1 hour.</p>
    `,
  };

  await transporter.sendMail(message);
}