const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT sent in the Authorization header and attaches
// the logged-in user to req.user
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Not authenticated. Please log in." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);

    if (!user || user.status !== "active") {
      return res.status(401).json({ error: "Account not found or disabled." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session. Please log in again." });
  }
}

// Restricts a route to specific roles, e.g. requireRole("admin")
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires role: ${allowedRoles.join(" or ")}.`,
      });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
