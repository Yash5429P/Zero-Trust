import { useState, useEffect } from "react";

export default function PendingRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalAction, setModalAction] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  async function fetchPendingRequests() {
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:8000/admin/requests/pending?limit=100", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch pending requests");
      }

      const data = await response.json();
      setRequests(data.data || []);

      if ((data.data || []).length === 0) {
        setMessage({ text: "No pending requests", type: "info" });
      }
    } catch (error) {
      setMessage({ text: error.message || "Failed to fetch requests", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  function openModal(request, action) {
    setSelectedRequest(request);
    setModalAction(action);
    setComment("");
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedRequest(null);
    setModalAction("");
    setComment("");
  }

  async function handleReview() {
    if (!selectedRequest || !modalAction) return;

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://localhost:8000/admin/requests/${selectedRequest.id}/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: modalAction,
            comment: comment.trim() || null,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to review request");
      }

      const result = await response.json();
      
      if (result.success) {
        setMessage({ 
          text: `Request ${modalAction}ed successfully${result.executed ? ` and action executed` : ''}`, 
          type: "success" 
        });
        // Refresh the list
        fetchPendingRequests();
      }
      
      closeModal();
    } catch (error) {
      setMessage({ text: error.message || "Failed to review request", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  function parseUserDetails(detailsJson) {
    try {
      return JSON.parse(detailsJson);
    } catch {
      return {};
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div style={{ padding: "30px", maxWidth: "1400px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <div>
          <h2 style={{ marginBottom: "8px", color: "#1a1a1a" }}>Pending Lock/Unlock Requests</h2>
          <p style={{ color: "#6b7280", fontSize: "14px" }}>
            Review and approve/reject requests from admins
          </p>
        </div>
        <button
          onClick={fetchPendingRequests}
          disabled={loading}
          style={{
            padding: "10px 20px",
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
          {loading ? "Refreshing..." : "🔄 Refresh"}
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

      {/* Requests Grid */}
      {requests.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(450px, 1fr))", gap: "20px" }}>
          {requests.map((request) => {
            const userDetails = parseUserDetails(request.user_details);
            const isLockRequest = request.action === "lock";

            return (
              <div
                key={request.id}
                style={{
                  backgroundColor: "white",
                  borderRadius: "12px",
                  padding: "24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  border: `2px solid ${isLockRequest ? "#fee2e2" : "#d1fae5"}`,
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
                  <div>
                    <h3 style={{ margin: 0, color: "#1a1a1a", fontSize: "16px" }}>
                      {isLockRequest ? "🔒 Lock Request" : "🔓 Unlock Request"}
                    </h3>
                    <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#9ca3af" }}>
                      Request #{request.id}
                    </p>
                  </div>
                  <span
                    style={{
                      padding: "4px 12px",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      backgroundColor: isLockRequest ? "#fee2e2" : "#d1fae5",
                      color: isLockRequest ? "#991b1b" : "#065f46",
                    }}
                  >
                    {request.action.toUpperCase()}
                  </span>
                </div>

                {/* Target User Info */}
                <div style={{ marginBottom: "16px", padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
                  <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#6b7280", fontWeight: "600" }}>
                    Target User
                  </h4>
                  <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    {/* User Photo */}
                    <div style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "8px",
                      backgroundColor: "#e5e7eb",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      flexShrink: 0,
                      border: "1px solid #d1d5db"
                    }}>
                      {userDetails.profile_photo ? (
                        <img 
                          src={`http://localhost:8000${userDetails.profile_photo}`}
                          alt={request.target_username}
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
                        display: userDetails.profile_photo ? "none" : "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px",
                        width: "100%",
                        height: "100%"
                      }}>
                        👤
                      </div>
                    </div>
                    {/* User Info */}
                    <div style={{ flex: 1 }}>
                      <strong style={{ color: "#1f2937", fontSize: "14px" }}>{request.target_username}</strong>
                      <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: "12px" }}>{userDetails.email || "—"}</p>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#9ca3af" }}>Role:</span>
                      <br />
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "500",
                          backgroundColor: "#f3f4f6",
                          color: "#374151",
                        }}
                      >
                        {userDetails.role || "—"}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: "#9ca3af" }}>Status:</span>
                      <br />
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "500",
                          backgroundColor: userDetails.account_locked ? "#fee2e2" : "#d1fae5",
                          color: userDetails.account_locked ? "#991b1b" : "#065f46",
                        }}
                      >
                        {userDetails.account_locked ? "Locked" : "Active"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Security Info */}
                <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#fef3c7", borderRadius: "8px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "13px" }}>
                    <div>
                      <span style={{ color: "#92400e", fontSize: "11px" }}>Failed Attempts</span>
                      <br />
                      <strong style={{ color: "#78350f", fontSize: "16px" }}>
                        {userDetails.failed_attempts || 0}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: "#92400e", fontSize: "11px" }}>Risk Score</span>
                      <br />
                      <strong
                        style={{
                          color: "#78350f",
                          fontSize: "16px",
                        }}
                      >
                        {request.risk_score?.toFixed(1) || "0.0"}
                      </strong>
                    </div>
                  </div>
                  {userDetails.last_login_country && (
                    <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #fde68a" }}>
                      <span style={{ color: "#92400e", fontSize: "11px" }}>Last Login Country</span>
                      <br />
                      <strong style={{ color: "#78350f" }}>{userDetails.last_login_country}</strong>
                    </div>
                  )}
                </div>

                {/* Request Details */}
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      Requested by: <strong style={{ color: "#1f2937" }}>{request.requested_by_username}</strong>
                    </span>
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                      {formatDate(request.created_at)}
                    </span>
                  </div>
                  {request.reason && (
                    <div style={{ padding: "12px", backgroundColor: "#f9fafb", borderRadius: "6px", fontSize: "13px", color: "#4b5563" }}>
                      <strong style={{ color: "#6b7280", fontSize: "11px", textTransform: "uppercase" }}>Reason:</strong>
                      <br />
                      {request.reason}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => openModal(request, "reject")}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#f3f4f6",
                      color: "#374151",
                      border: "1px solid #d1d5db",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    ✕ Reject
                  </button>
                  <button
                    onClick={() => openModal(request, "approve")}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#0f766e",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: "500",
                    }}
                  >
                    ✓ Approve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {showModal && selectedRequest && (
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
              {modalAction === "approve" ? "✓ Approve Request" : "✕ Reject Request"}
            </h3>
            
            <div style={{ marginBottom: "20px", padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
              <p style={{ margin: "4px 0", fontSize: "14px", color: "#4b5563" }}>
                <strong>Action:</strong> {selectedRequest.action.toUpperCase()}
              </p>
              <p style={{ margin: "4px 0", fontSize: "14px", color: "#4b5563" }}>
                <strong>Target User:</strong> {selectedRequest.target_username}
              </p>
              <p style={{ margin: "4px 0", fontSize: "14px", color: "#4b5563" }}>
                <strong>Requested by:</strong> {selectedRequest.requested_by_username}
              </p>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "500" }}>
                Comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Add a comment about this ${modalAction}...`}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  fontSize: "14px",
                  minHeight: "80px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>

            {modalAction === "approve" && (
              <div
                style={{
                  padding: "12px",
                  backgroundColor: modalAction === "approve" ? "#d1fae5" : "#fee2e2",
                  color: modalAction === "approve" ? "#065f46" : "#991b1b",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginBottom: "20px",
                }}
              >
                ⚠️ {selectedRequest.action === "lock" 
                  ? "This will immediately lock the user account and terminate all active sessions."
                  : "This will immediately unlock the user account and reset failed login attempts."}
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
                onClick={handleReview}
                disabled={loading}
                style={{
                  padding: "10px 20px",
                  backgroundColor: modalAction === "approve" ? "#0f766e" : "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Processing..." : modalAction === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
