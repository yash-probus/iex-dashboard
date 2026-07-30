import otpGenerator from 'otp-generator';
import nodemailer from 'nodemailer';

// In-memory store for OTPs. In production, use Redis or DB.
// Map<email, { otp, expiresAt }>
const otpStore = new Map<string, { otp: string; expiresAt: Date }>();

// Configure Nodemailer transport
// Note: In a real app, use environment variables for credentials.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const generateAndSendOTP = async (email: string): Promise<void> => {
  // Generate a 6-digit numeric OTP
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
    digits: true
  });

  // Store OTP with a 5-minute expiration
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  otpStore.set(email, { otp, expiresAt });

  // For development without SMTP setup, just log it.
  if (!process.env.SMTP_USER) {
    console.log(`[DEV MODE] Generated OTP for ${email}: ${otp}`);
    return;
  }

  // Send the email
  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"IEX Dashboard" <noreply@iexdashboard.com>',
    to: email,
    subject: 'Your Login OTP',
    text: `Your One-Time Password (OTP) for login is: ${otp}. It will expire in 5 minutes.`,
    html: `<p>Your One-Time Password (OTP) for login is: <strong>${otp}</strong>.</p><p>It will expire in 5 minutes.</p>`,
  });
};

export const verifyOTP = (email: string, enteredOtp: string): boolean => {
  const stored = otpStore.get(email);
  if (!stored) {
    return false;
  }

  // Check if expired
  if (stored.expiresAt < new Date()) {
    otpStore.delete(email); // Clean up expired OTP
    return false;
  }

  // Verify
  if (stored.otp === enteredOtp) {
    // Clear OTP after successful use
    otpStore.delete(email);
    return true;
  }

  return false;
};
