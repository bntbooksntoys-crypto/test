const express = require("express");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// All staff routes require a logged-in user
router.use(requireAuth);

// GET /api/staff — list everyone (admin + manager can view; staff sees only self)
router.get("/", async (req, res) => {
  try {
    if (req.user.role === "staff") {
      return res.json({ staff: [req.user.toSafeObject()] });
    }
    const staff = await User.find().sort({ createdAt: -1 });
    res.json({ staff: staff.map((u) => u.toSafeObject()) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load staff list." });
  }
});

// POST /api/staff — create a new staff account (admin only)
router.post("/", requireRole("admin"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || "staff",
    });

    res.status(201).json({ user: user.toSafeObject() });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || "Could not create staff account." });
  }
});

// PUT /api/staff/:id — edit a staff member's name/email/status (admin only)
router.put("/:id", requireRole("admin"), async (req, res) => {
  try {
    const { name, email, status } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ error: "Staff member not found." });

    if (name) user.name = name;
    if (email) user.email = email.toLowerCase();
    if (status) user.status = status;

    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || "Could not update staff account." });
  }
});

// PUT /api/staff/:id/role — change someone's role (admin only)
router.put("/:id/role", requireRole("admin"), async (req, res) => {
  try {
    const { role } = req.body;
    const { ROLES } = require("../models/User");

    if (!ROLES.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${ROLES.join(", ")}` });
    }

    if (req.params.id === String(req.user._id) && role !== "admin") {
      return res.status(400).json({ error: "You cannot remove your own admin role." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Staff member not found." });

    user.role = role;
    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Could not update role." });
  }
});

// PUT /api/staff/:id/password — reset a staff member's password (admin only)
router.put("/:id/password", requireRole("admin"), async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Staff member not found." });

    user.password = password; // pre-save hook will hash it
    await user.save();
    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Could not update password." });
  }
});

// DELETE /api/staff/:id — remove a staff account (admin only)
router.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ error: "You cannot delete your own account." });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ error: "Staff member not found." });

    if (target.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot delete the last remaining admin." });
      }
    }

    await target.deleteOne();
    res.json({ message: "Staff account deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete staff account." });
  }
});

module.exports = router;
