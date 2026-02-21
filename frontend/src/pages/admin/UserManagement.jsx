import { useState, useEffect } from "react";
import { getProfile } from "../../api/api";

export default function UserManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  async function fetchCurrentUser() {
    try {
      const profile = await getProfile();
      setCurrentUser(profile);
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  }

  async function searchUsers() {
    if (!searchTerm.trim()) {
      setMessage({ text: "Please enter a search term", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const token = localStorage.getItem("access_token");
      
      // Use appropriate endpoint based on role
      const endpoint = currentUser?.role === "superadmin" 
        ? `/admin/users/all?search=${encodeURIComponent(searchTerm)}&limit=50`
        : `/admin/users?search=${encodeURIComponent(searchTerm)}&limit=50`;

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      
      // Handle different response formats
      const userList = data.data || data;
      
      // Filter out current user
      const filteredUsers = userList.filter(u => u.id !== currentUser?.id);
      
      setUsers(filteredUsers);
      
      if (filteredUsers.length === 0) {
        setMessage({ text: "No users found", type: "info" });
      }
    } catch (error) {
      setMessage({ text: error.message || "Failed to search users", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  function openModal(user, action) {
    setSelectedUser(user);
    setModalAction(action);
    setReason("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedUser(null);
    setModalAction("");
    setReason("");
  }

  async function handleLockUnlock() {
    if (!selectedUser || !modalAction) return;

    // For admin role, reason is required
    if (currentUser?.role === "admin" && !reason.trim()) {
      setMessage({ text: "Please provide a reason for this action", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://localhost:8000/admin/users/${selectedUser.id}/lock-unlock`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: modalAction,
            reason: reason.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to process request");
      }

      const result = await response.json();
      
      if (result.success) {
        if (result.action === "executed") {
          setMessage({ 
            text: `User ${modalAction}ed successfully`, 
            type: "success" 
          });
          // Refresh the user list
          searchUsers();
        } else if (result.action === "request_created") {
          setMessage({ 
            text: "Request sent to superadmin for approval", 
            type: "info" 
          });
        }
      }
      
      closeModal();
    } catch (error) {
      setMessage({ text: error.message || "Failed to process request", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "30px", maxWidth: "1200px" }}>
      <h2 style={{ marginBottom: "10px", color: "#1a1a1a" }}>User Management</h2>
      <p style={{ marginBottom: "30px", color: "#6b7280", fontSize: "14px" }}>
        Search and manage user accounts
        {currentUser?.role === "admin" && " (requires superadmin approval)"}
      </p>

      {/* Search Bar */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        marginBottom: "30px",
        alignItems: "center"
      }}>
        <input
          type="text"
          placeholder="Search by username, name, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && searchUsers()}
          style={{
            flex: 1,
            padding: "12px 16px",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "14px",
            outline: "none",
          }}
        />
        <button
          onClick={searchUsers}
          disabled={loading}
          style={{
            padding: "12px 24px",
            backgroundColor: "#0f766e",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: "500",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Message Display */}
      {message.text && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            backgroundColor:
              message.type === "error"
                ? "#fee2e2"
                : message.type === "success"
                ? "#d1fae5"
                : "#dbeafe",
            color:
              message.type === "error"
                ? "#991b1b"
                : message.type === "success"
                ? "#065f46"
                : "#1e40af",
            fontSize: "14px",
          }}
        >
          {message.text}
        </div>
      )}

      {/* Users Table */}
      {users.length > 0 && (
        <div style={{ 
          backgroundColor: "white", 
          borderRadius: "12px", 
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                <th style={tableHeaderStyle}>Photo</th>
                <th style={tableHeaderStyle}>ID</th>
                <th style={tableHeaderStyle}>Username</th>
                <th style={tableHeaderStyle}>Email</th>
                <th style={tableHeaderStyle}>Role</th>
                <th style={tableHeaderStyle}>Status</th>
                <th style={tableHeaderStyle}>Failed Attempts</th>
                <th style={tableHeaderStyle}>Country</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isLocked = user.account_locked || user.status === "locked";
                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: "1px solid #f3f4f6",
                      backgroundColor: isLocked ? "#fef2f2" : "white",
                    }}
                  >
                    {/* Photo Column */}
                    <td style={tableCellStyle}>
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
                    <td style={tableCellStyle}>{user.id}</td>
                    <td style={tableCellStyle}>
                      <strong>{user.username}</strong>
                    </td>
                    <td style={tableCellStyle}>{user.company_email}</td>
                    <td style={tableCellStyle}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "500",
                          backgroundColor:
                            user.role === "superadmin"
                              ? "#dbeafe"
                              : user.role === "admin"
                              ? "#fef3c7"
                              : "#f3f4f6",
                          color:
                            user.role === "superadmin"
                              ? "#1e40af"
                              : user.role === "admin"
                              ? "#92400e"
                              : "#374151",
                        }}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "500",
                          backgroundColor: isLocked ? "#fee2e2" : "#d1fae5",
                          color: isLocked ? "#991b1b" : "#065f46",
                        }}
                      >
                        {isLocked ? "🔒 Locked" : "✓ Active"}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor:
                            user.failed_login_attempts >= 3 ? "#fee2e2" : "#f3f4f6",
                          color:
                            user.failed_login_attempts >= 3 ? "#991b1b" : "#4b5563",
                        }}
                      >
                        {user.failed_login_attempts || 0}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      {user.last_login_country || "—"}
                    </td>
                    <td style={tableCellStyle}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        {isLocked ? (
                          <button
                            onClick={() => openModal(user, "unlock")}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#16a34a",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            🔓 Unlock
                          </button>
                        ) : (
                          <button
                            onClick={() => openModal(user, "lock")}
                            style={{
                              padding: "6px 12px",
                              backgroundColor: "#dc2626",
                              color: "white",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            🔒 Lock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedUser && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "30px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginBottom: "20px", color: "#1a1a1a" }}>
              {modalAction === "lock" ? "🔒 Lock User" : "🔓 Unlock User"}
            </h3>
            
            <div style={{ marginBottom: "20px", padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
              <p style={{ margin: "4px 0", fontSize: "14px", color: "#4b5563" }}>
                <strong>User:</strong> {selectedUser.username}
              </p>
              <p style={{ margin: "4px 0", fontSize: "14px", color: "#4b5563" }}>
                <strong>Email:</strong> {selectedUser.company_email}
              </p>
              <p style={{ margin: "4px 0", fontSize: "14px", color: "#4b5563" }}>
                <strong>Failed Attempts:</strong> {selectedUser.failed_login_attempts || 0}
              </p>
              {selectedUser.last_login_country && (
                <p style={{ margin: "4px 0", fontSize: "14px", color: "#4b5563" }}>
                  <strong>Last Login Country:</strong> {selectedUser.last_login_country}
                </p>
              )}
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                Reason {currentUser?.role === "admin" && <span style={{ color: "#dc2626" }}>*</span>}
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={`Explain why you want to ${modalAction} this user...`}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  minHeight: "100px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {currentUser?.role === "admin" && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: "#fef3c7",
                  color: "#92400e",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}
              >
                ℹ️ This action requires superadmin approval. Your request will be sent for review.
              </div>
            )}

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={closeModal}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleLockUnlock}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: modalAction === "lock" ? "#dc2626" : "#16a34a",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Processing..." : modalAction === "lock" ? "Lock User" : "Unlock User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const tableHeaderStyle = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: "12px",
  fontWeight: "600",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tableCellStyle = {
  padding: "16px",
  fontSize: "14px",
  color: "#1f2937",
};
