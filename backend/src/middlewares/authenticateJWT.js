const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  try {
    // Read token from cookie OR Authorization header
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

module.exports = authenticateJWT;