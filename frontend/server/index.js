const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { users, logs } = require("./data");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-this";
const ACCESS_TTL = 60 * 15; // 15 minutes (seconds) for demo

function signToken(payload, expiresIn = `${ACCESS_TTL}s`) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function authenticateToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ detail: "Missing Authorization header" });

  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return res.status(401).json({ detail: "Invalid Authorization format" });

  jwt.verify(parts[1], JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ detail: "Invalid or expired token" });
    req.user = payload;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ detail: "Not authenticated" });
  if (req.user.role !== "admin") return res.status(403).json({ detail: "Admin role required" });
  next();
}

// ---------- Auth: login/register/profile/refresh ----------
app.post("/login", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ detail: "username required" });

  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ detail: "Invalid credentials" });

  const access_token = signToken({ id: user.id, username: user.username, role: user.role });
  const refresh_token = signToken({ id: user.id }, "7d");

  return res.json({ access_token, refresh_token, role: user.role, username: user.username });
});

app.post("/register", (req, res) => {
  const { username, role } = req.body;
  if (!username) return res.status(400).json({ detail: "username required" });

  if (users.find(u => u.username === username)) return res.status(409).json({ detail: "User exists" });

  const newUser = { id: String(users.length + 1), username, role: role || "user", created_at: new Date().toISOString() };
  users.push(newUser);

  const access_token = signToken({ id: newUser.id, username: newUser.username, role: newUser.role });
  const refresh_token = signToken({ id: newUser.id }, "7d");

  res.status(201).json({ access_token, refresh_token, role: newUser.role, username: newUser.username });
});

app.post("/refresh-token", (req, res) => {
  const token = req.query.token || req.body.token;
  if (!token) return res.status(400).json({ detail: "refresh token required" });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ detail: "Invalid refresh token" });
    const user = users.find(u => u.id === payload.id);
    if (!user) return res.status(401).json({ detail: "User not found" });
    const access_token = signToken({ id: user.id, username: user.username, role: user.role });
    res.json({ access_token });
  });
});

app.post("/logout", authenticateToken, (req, res) => {
  // For stateless JWT, client should delete tokens. We keep endpoint for parity.
  res.json({ success: true });
});

app.get("/profile", authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ detail: "User not found" });
  // Do not return sensitive fields
  res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, created_at: user.created_at } });
});

// ---------- Admin endpoints: /admin/users, /admin/users/:id, /admin/users/:userId/logs ----------
app.get("/admin/users", authenticateToken, requireAdmin, (req, res) => {
  // Pagination & filtering
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "25", 10)));
  const search = (req.query.search || "").toLowerCase();
  const roleFilter = req.query.role;

  let results = users.slice();
  if (search) results = results.filter(u => u.username.toLowerCase().includes(search));
  if (roleFilter) results = results.filter(u => u.role === roleFilter);

  const total = results.length;
  const start = (page - 1) * limit;
  const items = results.slice(start, start + limit).map(u => ({ id: u.id, username: u.username, role: u.role, created_at: u.created_at }));

  res.json({ success: true, total, page, limit, items });
});

app.get("/admin/users/:id", authenticateToken, requireAdmin, (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ detail: "User not found" });
  res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, created_at: user.created_at } });
});

app.get("/admin/users/:id/logs", authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "25", 10)));

  const userLogs = logs.filter(l => l.userId === userId);
  const total = userLogs.length;
  const start = (page - 1) * limit;
  const items = userLogs.slice(start, start + limit).map(l => ({ id: l.id, action: l.action, ip: l.ip, timestamp: l.timestamp }));

  res.json({ success: true, total, page, limit, items });
});

// Also expose generic /users and /users/:id to match spec (admin-only)
app.get("/users", authenticateToken, requireAdmin, (req, res) => {
  // Reuse admin/users logic
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "25", 10)));
  const search = (req.query.search || "").toLowerCase();

  let results = users.slice();
  if (search) results = results.filter(u => u.username.toLowerCase().includes(search));

  const total = results.length;
  const start = (page - 1) * limit;
  const items = results.slice(start, start + limit).map(u => ({ id: u.id, username: u.username, role: u.role, created_at: u.created_at }));

  res.json({ success: true, total, page, limit, items });
});

app.get("/users/:id", authenticateToken, requireAdmin, (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ detail: "User not found" });
  res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, created_at: user.created_at } });
});

app.get("/users/:id/logs", authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.id;
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "25", 10)));

  const userLogs = logs.filter(l => l.userId === userId);
  const total = userLogs.length;
  const start = (page - 1) * limit;
  const items = userLogs.slice(start, start + limit).map(l => ({ id: l.id, action: l.action, ip: l.ip, timestamp: l.timestamp }));

  res.json({ success: true, total, page, limit, items });
});

// Generic logs endpoint
app.get("/logs", authenticateToken, requireAdmin, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "25", 10)));
  const action = req.query.action;
  const userId = req.query.user_id;

  let results = logs.slice();
  if (action) results = results.filter(l => l.action === action);
  if (userId) results = results.filter(l => l.userId === userId);

  const total = results.length;
  const start = (page - 1) * limit;
  const items = results.slice(start, start + limit).map(l => ({ id: l.id, userId: l.userId, action: l.action, ip: l.ip, timestamp: l.timestamp }));

  res.json({ success: true, total, page, limit, items });
});

// Start server
const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
