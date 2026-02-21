const { v4: uuidv4 } = require("uuid");

// In-memory datastore for demo & testing
const users = [
  { id: "1", username: "alice", role: "admin", created_at: new Date().toISOString() },
  { id: "2", username: "bob", role: "user", created_at: new Date().toISOString() },
  { id: "3", username: "carol", role: "user", created_at: new Date().toISOString() }
];

const logs = [
  { id: uuidv4(), userId: "2", action: "login", ip: "10.0.0.1", timestamp: new Date().toISOString() },
  { id: uuidv4(), userId: "3", action: "file_open_confidential", ip: "10.0.0.2", timestamp: new Date().toISOString() },
  { id: uuidv4(), userId: "2", action: "usb_detect", ip: "10.0.0.1", timestamp: new Date().toISOString() }
];

module.exports = { users, logs };
