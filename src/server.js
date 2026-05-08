const path = require("path");
const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

const requiredFields = ["name", "email", "service", "budget", "message"];

function createTransporter() {
  const secure = String(process.env.SMTP_SECURE).toLowerCase() === "true";

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function hasEmailConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.CONTACT_TO
  );
}

app.post("/api/contact", async (req, res) => {
  const payload = req.body || {};
  const missingFields = requiredFields.filter((field) => !String(payload[field] || "").trim());

  if (missingFields.length > 0) {
    return res.status(400).json({
      message: "Please complete every required field.",
      missingFields
    });
  }

  if (!hasEmailConfig()) {
    console.log("Service request received without email config:", payload);
    return res.status(202).json({
      message:
        "Request received. Email delivery is not configured yet, so the details were logged on the server."
    });
  }

  try {
    const transporter = createTransporter();
    const safePhone = payload.phone ? String(payload.phone).trim() : "Not provided";
    const safeTimeline = payload.timeline ? String(payload.timeline).trim() : "Flexible";

    await transporter.sendMail({
      from: `"Portfolio Services" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_TO && payload.email,
      replyTo: payload.email,
      subject: `New ${payload.service} request from ${payload.name}`,
      text: [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        `Phone: ${safePhone}`,
        `Service: ${payload.service}`,
        `Budget: ${payload.budget}`,
        `Timeline: ${safeTimeline}`,
        "",
        "Project Details:",
        payload.message
      ].join("\n")
    });

    return res.json({
      message: "Thanks, your request was sent successfully."
    });
  } catch (error) {
    console.error("Email delivery failed:", error);
    return res.status(502).json({
      message: "The request was received, but email delivery failed. Please check SMTP settings."
    });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Portfolio server running at http://localhost:${PORT}`);
});
