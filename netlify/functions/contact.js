const nodemailer = require("nodemailer");

const requiredFields = ["name", "email", "service", "budget", "message"];

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  };
}

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

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return json(204, {});
  }

  if (event.httpMethod !== "POST") {
    return json(405, {
      message: "Method not allowed."
    });
  }

  let payload = {};

  try {
    payload = JSON.parse(event.body || "{}");
  } catch (_error) {
    return json(400, {
      message: "Please send valid JSON."
    });
  }

  const missingFields = requiredFields.filter((field) => !String(payload[field] || "").trim());

  if (missingFields.length > 0) {
    return json(400, {
      message: "Please complete every required field.",
      missingFields
    });
  }

  if (!hasEmailConfig()) {
    console.log("Service request received without email config:", payload);
    return json(202, {
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
      to: process.env.CONTACT_TO,
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

    return json(200, {
      message: "Thanks, your request was sent successfully."
    });
  } catch (error) {
    console.error("Email delivery failed:", error);
    return json(502, {
      message: "The request was received, but email delivery failed. Please check SMTP settings."
    });
  }
};

