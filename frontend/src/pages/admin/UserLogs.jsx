import { useEffect, useState } from "react";
import { getUserLogs } from "../../api/api";
import { useNavigate, useParams, Link } from "react-router-dom";

export default function AdminUserLogs() {
  const { userId } = useParams();
  const [logs, setLogs] = useState([]);
  const [userName, setUserName] = useState("");
  const [totalLogs, setTotalLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function fetchUserLogs() {
    try {
      const data = await getUserLogs(userId);
      
      if (data && !data.detail) {
        const logsData = data.data || data.logs || [];
        setLogs(logsData);
        setUserName(data.username || `User #${userId}`);
        setTotalLogs(data.pagination?.total || data.totalLogs || logsData.length || 0);
      } else {
        navigate("/admin/users");
      }
    } catch (error) {
      console.error("Failed to fetch user logs:", error);
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p style={{ fontSize: 16, color: "#666" }}>⏳ Loading logs...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <Link
        to="/admin/users"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "#007bff",
          textDecoration: "none",
          fontWeight: 500,
          marginBottom: "20px",
          cursor: "pointer"
        }}
        onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
        onMouseLeave={(e) => e.target.style.textDecoration = "none"}
      >
        ← Back to Users
      </Link>

      {/* Header */}
      <div style={{
        backgroundColor: "#fff",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "20px",
        border: "1px solid #e0e0e0"
      }}>
        <h2 style={{ margin: 0, fontSize: 18, color: "#1a1a1a", fontWeight: 600 }}>
          📋 Activity Logs for <span style={{ color: "#007bff" }}>{userName}</span>
        </h2>
        <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: 13 }}>
          User ID: <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{userId}</span>
          {totalLogs > 0 && (
            <span style={{ marginLeft: "20px" }}>
              Total Logs: <span style={{ fontWeight: 600, color: "#007bff" }}>{totalLogs}</span>
            </span>
          )}
        </p>
      </div>

      {/* Logs Table */}
      {logs.length > 0 ? (
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          border: "1px solid #e0e0e0",
          overflowX: "auto"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid #e0e0e0" }}>
                <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Log ID</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Action</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Details</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>IP Address</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Device</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: "1px solid #e0e0e0",
                    backgroundColor: idx % 2 === 0 ? "#fff" : "#f8f9fa",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e8f4f8"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#fff" : "#f8f9fa"}
                >
                  <td style={{ padding: "12px 16px", color: "#1a1a1a", fontSize: 13, fontFamily: "monospace" }}>{log.id}</td>
                  <td style={{ padding: "12px 16px", color: "#1a1a1a", fontSize: 13 }}>
                    <span style={{
                      backgroundColor: "#e7f3ff",
                      color: "#0056b3",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#666", fontSize: 13 }}>{log.details}</td>
                    <td style={{ padding: "12px 16px", color: "#666", fontSize: 13, fontFamily: "monospace" }}>{log.ip_address || log.ip || "-"}</td>
                  <td style={{ padding: "12px 16px", color: "#666", fontSize: 13 }}>{log.device || "-"}</td>
                    <td style={{ padding: "12px 16px", color: "#666", fontSize: 12 }}>{log.timestamp || log.time ? new Date(log.timestamp || log.time).toLocaleString() : "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "40px",
          textAlign: "center",
          border: "1px solid #e0e0e0"
        }}>
          <p style={{ fontSize: 16, color: "#999" }}>📭 No logs found for this user</p>
        </div>
      )}
    </div>
  );
}
