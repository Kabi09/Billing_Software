const jwt = require("jsonwebtoken");
const dotenv=require("dotenv")
dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || "Hello_World";

// Basic auth: verify token
function auth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No token, authorization denied",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, name }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
}

// Role-based access: admin, employee etc.
function allowRoles(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not allowed",
      });
    }
    next();
  };
}

module.exports = {
  auth,
  allowRoles,
};
