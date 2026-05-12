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
  from: `"Faiq's Development Services" <${process.env.SMTP_USER}>`,
  to: process.env.CONTACT_TO,
  replyTo: payload.email,
  subject: `New ${payload.service} request from ${payload.name}`,

  html: `
    <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6;">
      
      <h2 style="margin-bottom: 10px;">New Service Request</h2>

      <h3 style="margin-bottom: 8px;">Client Details</h3>

      <table 
        cellpadding="10" 
        cellspacing="0" 
        border="1"
        style="border-collapse: collapse; width: 100%; margin-bottom: 25px;"
      >
        <tr style="background-color: #f5f5f5;">
          <th align="left">Name</th>
          <th align="left">Email</th>
          <th align="left">Phone</th>
        </tr>

        <tr>
          <td>${payload.name}</td>
          <td>${payload.email}</td>
          <td>${safePhone}</td>
        </tr>
      </table>

      <h3 style="margin-bottom: 8px;">Project Details</h3>

      <table 
        cellpadding="10" 
        cellspacing="0" 
        border="1"
        style="border-collapse: collapse; width: 100%; margin-bottom: 25px;"
      >
        <tr style="background-color: #f5f5f5;">
          <th align="left">Service</th>
          <th align="left">Budget</th>
          <th align="left">Timeline</th>
        </tr>

        <tr>
          <td>${payload.service}</td>
          <td>${payload.budget}</td>
          <td>${safeTimeline}</td>
        </tr>
      </table>

      <h3 style="margin-bottom: 8px;">Project Message</h3>

      <div
        style="
          padding: 15px;
          background-color: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 6px;
          white-space: pre-wrap;
        "
      >
        ${payload.message}
      </div>

    </div>
  `,

  text: `
    Client Details
    ---------------
    Name: ${payload.name}
    Email: ${payload.email}
    Phone: ${safePhone}

    Project Details
    ----------------
    Service: ${payload.service}
    Budget: ${payload.budget}
    Timeline: ${safeTimeline}

    Project Message
    ----------------
    ${payload.message}
  `
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
