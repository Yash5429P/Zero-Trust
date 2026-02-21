import { useEffect, useState } from "react";
import { getAccessToken } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  // ---------------- Load Logs Function ----------------
  async function fetchLogs() {
    const token = getAccessToken();
    if (!token) {
      alert("Unauthorized! Please login.");
      navigate("/");
      return;
    }

    const res = await fetch("http://127.0.0.1:8000/logs", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      alert("Session expired. Login again.");
      logout();
      return;
    }

    if (res.status === 403) {
      alert("Access Denied — Admin Only.");
      navigate("/dashboard");
      return;
    }

    const data = await res.json();
    setLogs(data);
    setLoading(false);
  }

  // ---------------- Logout ----------------
  function logout() {
    localStorage.clear();
    navigate("/");
  }

  // ---------------- On Component Load ----------------
  useEffect(() => {
    if (role !== "admin") {
      alert("Admin Access Required!");
      navigate("/dashboard");
      return;
    }
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ width: "100%", backgroundColor: "#f8f9fa", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", margin: 0, padding: 0 }}>
      {/* Header - Full Width */}
      <div style={{ width: "100%", backgroundColor: "#fff", borderBottom: "1px solid #e0e0e0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 32, color: "#1a1a1a", fontWeight: 600 }}>🛡 Admin Control Panel</h1>
            <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: 14 }}>Monitor and manage system logs</p>
          </div>
          <button
            onClick={logout}
            style={{
              background: "#dc3545",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              transition: "all 0.3s",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
            onMouseEnter={(e) => e.target.style.background = "#c82333"}
            onMouseLeave={(e) => e.target.style.background = "#dc3545"}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Action Bar - Full Width */}
      <div style={{ width: "100%", borderBottom: "1px solid #e0e0e0", backgroundColor: "#fff" }}>
        <div style={{ padding: "15px 0" }}>
          <button
            onClick={fetchLogs}
            style={{
              background: "#007bff",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              transition: "all 0.3s",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
            onMouseEnter={(e) => e.target.style.background = "#0056b3"}
            onMouseLeave={(e) => e.target.style.background = "#007bff"}
          >
            🔄 Refresh Logs
          </button>
        </div>
      </div>

      {/* Content - Full Width */}
      {loading ? (
        <div style={{ width: "100%", textAlign: "center", padding: "40px 0" }}>
          <p style={{ fontSize: 16, color: "#666" }}>⏳ Loading logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div style={{ width: "100%", textAlign: "center", padding: "40px 0" }}>
          <p style={{ fontSize: 16, color: "#999" }}>📭 No logs found</p>
        </div>
      ) : (
        <div style={{ width: "100%", overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f3f5", borderBottom: "2px solid #e0e0e0" }}>
                <th style={{ padding: "16px 0", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>ID</th>
                <th style={{ padding: "16px 0", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>User</th>
                <th style={{ padding: "16px 0", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Action</th>
                <th style={{ padding: "16px 0", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Details</th>
                <th style={{ padding: "16px 0", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>IP</th>
                <th style={{ padding: "16px 0", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Device</th>
                <th style={{ padding: "16px 0", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, idx) => (
                <tr 
                  key={l.id}
                  style={{ 
                    borderBottom: "1px solid #e0e0e0",
                    backgroundColor: idx % 2 === 0 ? "#fff" : "#f8f9fa",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e8f4f8"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#fff" : "#f8f9fa"}
                >
                  <td style={{ padding: "14px 0", color: "#1a1a1a", fontSize: 13 }}>{l.id}</td>
                  <td style={{ padding: "14px 0", color: "#1a1a1a", fontSize: 13, fontWeight: 500 }}>{l.username}</td>
                  <td style={{ padding: "14px 0", color: "#1a1a1a", fontSize: 13 }}>
                    <span style={{ backgroundColor: "#e7f3ff", color: "#0056b3", padding: "4px 8px", borderRadius: 4, fontSize: 12 }}>
                      {l.action}
                    </span>
                  </td>
                  <td style={{ padding: "14px 0", color: "#666", fontSize: 13 }}>{l.details}</td>
                  <td style={{ padding: "14px 0", color: "#666", fontSize: 13, fontFamily: "monospace" }}>{l.ip || l.ip_address || "-"}</td>
                  <td style={{ padding: "14px 0", color: "#666", fontSize: 13 }}>{l.device || "-"}</td>
                  <td style={{ padding: "14px 0", color: "#666", fontSize: 13 }}>{l.timestamp || l.time || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
