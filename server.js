require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const User = require("./models/User");
const authRoutes = require("./routes/auth");
const staffRoutes = require("./routes/staff");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Serve the frontend (login page + dashboard)
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);

// Simple health check
app.get("/healthz", (req, res) => {
  res.json({ ok: true, dbConnected: require("mongoose").connection.readyState === 1 });
});

// Creates the very first admin account if the database has none yet,
// using the BOOTSTRAP_ADMIN_* values from .env
async function ensureBootstrapAdmin() {
  const adminExists = await User.findOne({ role: "admin" });
  if (adminExists) return;

  const name = process.env.BOOTSTRAP_ADMIN_NAME || "Super Admin";
  const email = (process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || "ChangeMe123!";

  await User.create({ name, email, password, role: "admin" });

  console.log("──────────────────────────────────────────────");
  console.log("👑 First-time setup: an admin account was created");
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log("   Please log in and change this password immediately.");
  console.log("──────────────────────────────────────────────");
}

async function start() {
  await connectDB();
  await ensureBootstrapAdmin();

  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
  });
}

start();
