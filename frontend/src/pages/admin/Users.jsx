import { useEffect, useState } from "react";
import { getAccessToken } from "../../api/api";
import { useNavigate, Link } from "react-router-dom";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, users]);

  async function fetchUsers() {
    try {
      const token = getAccessToken();
      if (!token) {
        navigate("/");
        return;
      }

      const res = await fetch("http://127.0.0.1:8000/users", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        setFilteredUsers(data);
      } else if (res.status === 403) {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }

  function filterUsers() {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = users.filter((user) =>
      user.id?.toString().includes(query) ||
      user.username?.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
    setFilteredUsers(filtered);
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p style={{ fontSize: 16, color: "#666" }}>⏳ Loading users...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search Bar */}
      <div style={{ marginBottom: "25px" }}>
        <input
          type="text"
          placeholder="Search by ID, username, name, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            maxWidth: "500px",
            padding: "10px 16px",
            border: "1px solid #e0e0e0",
            borderRadius: "6px",
            fontSize: "14px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
          }}
        />
      </div>

      {/* Stats */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "16px",
        marginBottom: "25px"
      }}>
        <div style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          <p style={{ margin: 0, color: "#666", fontSize: 12, fontWeight: 500 }}>Total Users</p>
          <p style={{ margin: "8px 0 0 0", fontSize: 24, fontWeight: 600, color: "#1a1a1a" }}>
            {users.length}
          </p>
        </div>
        <div style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          <p style={{ margin: 0, color: "#666", fontSize: 12, fontWeight: 500 }}>Active Users</p>
          <p style={{ margin: "8px 0 0 0", fontSize: 24, fontWeight: 600, color: "#28a745" }}>
            {users.filter(u => u.status === "active")?.length || 0}
          </p>
        </div>
        <div style={{
          backgroundColor: "#fff",
          padding: "20px",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          <p style={{ margin: 0, color: "#666", fontSize: 12, fontWeight: 500 }}>Admin Users</p>
          <p style={{ margin: "8px 0 0 0", fontSize: 24, fontWeight: 600, color: "#dc3545" }}>
            {users.filter(u => u.role === "admin")?.length || 0}
          </p>
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length > 0 ? (
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
                <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Photo</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>ID</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Username</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Email</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Role</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Status</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: "1px solid #e0e0e0",
                    backgroundColor: idx % 2 === 0 ? "#fff" : "#f8f9fa",
                    transition: "background-color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e8f4f8"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? "#fff" : "#f8f9fa"}
                >
                  {/* Photo Column */}
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <div style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      backgroundColor: "#f0f0f0",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid #e0e0e0"
                    }}>
                      {user.profile_photo ? (
                        <img 
                          src={`http://localhost:8000${user.profile_photo}`}
                          alt={user.username}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div style={{
                        display: user.profile_photo ? "none" : "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        width: "100%",
                        height: "100%"
                      }}>
                        👤
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#1a1a1a", fontSize: 13, fontFamily: "monospace" }}>{user.id}</td>
                  <td style={{ padding: "12px 16px", color: "#1a1a1a", fontSize: 13, fontWeight: 500 }}>{user.username}</td>
                  <td style={{ padding: "12px 16px", color: "#666", fontSize: 13 }}>{user.company_email || "-"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    <span style={{
                      backgroundColor: user.role === "admin" ? "#ffebee" : "#e7f3ff",
                      color: user.role === "admin" ? "#c82333" : "#0056b3",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "capitalize"
                    }}>
                      {user.role === "admin" ? "🛡" : "👥"} {user.role}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    <span style={{
                      backgroundColor: user.status === "active" ? "#c8e6c9" : "#ffcdd2",
                      color: user.status === "active" ? "#2e7d32" : "#c82333",
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      textTransform: "capitalize"
                    }}>
                      {user.status === "active" ? "✓" : "✕"} {user.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    <Link
                      to={`/admin/users/${user.id}/logs`}
                      style={{
                        color: "#007bff",
                        textDecoration: "none",
                        fontWeight: 500,
                        cursor: "pointer"
                      }}
                      onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                      onMouseLeave={(e) => e.target.style.textDecoration = "none"}
                    >
                      View Logs →
                    </Link>
                  </td>
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
          <p style={{ fontSize: 16, color: "#999" }}>
            {searchQuery ? "📭 No users found matching your search" : "📭 No users found"}
          </p>
        </div>
      )}
    </div>
  );
}
