// auth.js – server‑side JWT helpers and middleware
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Load secret from .env (fallback to a static one for development)
function getJwtSecret() {
  try {
    const env = fs.readFileSync('.env', 'utf8');
    const match = env.match(/JWT_SECRET\s*=\s*([^\n]+)/);
    if (match) return match[1].trim();
  } catch (e) {
    // .env file missing – fall through to default
  }
  // default secret (replace with a secure value in production)
  return 'default_jwt_secret_please_change';
}

function generateToken(userId) {
  const payload = { userId };
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing Authorization header' }));
    return;
  }
  const token = authHeader.split(' ')[1]; // Bearer <token>
  const secret = getJwtSecret();
  try {
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid or expired token' }));
  }
}

module.exports = { generateToken, verifyToken };
