import express from "express";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);




// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Listener endpoint
app.post("/listener", async (req, res) => {
  try {
    const { name, phone, zip, page_url, ip } = req.body;

    // Insert into Supabase
    const { error } = await supabase
      .from("lead_listener_submissions")
      .insert([
        {
          name,
          phone,
          zip,
          page_url,
          ip,
          timestamp: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).send("Database error");
    }

    // Send Gmail alert
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.ALERT_EMAIL,
      subject: "New Lead Submission",
      text: `New lead received:\n\nName: ${name}\nPhone: ${phone}\nZip: ${zip}\nPage: ${page_url}\nIP: ${ip}`
    });

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Listener error:", err);
    return res.status(500).send("Server error");
  }
});
// Admin Overview Route
app.get("/admin/overview", async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Total leads
    const { data: totalLeadsData, error: totalLeadsError } = await supabase
      .from("lead_listener_submissions")
      .select("*", { count: "exact", head: true });

    if (totalLeadsError) throw totalLeadsError;

    // New leads (last 7 days)
    const { data: newLeadsData, error: newLeadsError } = await supabase
      .from("lead_listener_submissions")
      .select("*", { count: "exact", head: true })
      .gte("timestamp", sevenDaysAgo.toISOString());

    if (newLeadsError) throw newLeadsError;

    return res.json({
      totalLeads: totalLeadsData?.length ?? 0,
      newLeads: newLeadsData?.length ?? 0,
    });
  } catch (err) {
    console.error("Error in /admin/overview:", err);
    return res.status(500).json({
      error: "Failed to load overview stats",
      details: err.message,
    });
  }
});

// Port logic
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Lead listener running on port ${PORT}`);
});
