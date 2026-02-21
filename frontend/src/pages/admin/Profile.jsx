import { useEffect, useState } from "react";
import { getProfile, getAccessToken } from "../../api/api";
import { useNavigate } from "react-router-dom";

export default function AdminProfile() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAdminProfile() {
    try {
      const token = getAccessToken();
      if (!token) {
        navigate("/");
        return;
      }

      const profileData = await getProfile();
      if (profileData && !profileData.detail) {
        setAdmin(profileData);
      }
    } catch (error) {
      console.error("Failed to fetch admin profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadMessage({ text: "", type: "" });

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const token = getAccessToken();
      const res = await fetch("http://localhost:8000/profile/photo", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const updatedAdmin = await res.json();
        setAdmin(updatedAdmin);
        setUploadMessage({ text: "✅ Photo updated successfully!", type: "success" });
        setTimeout(() => setUploadMessage({ text: "", type: "" }), 3000);
      } else {
        const error = await res.json();
        setUploadMessage({ text: `❌ ${error.detail || "Upload failed"}`, type: "error" });
      }
    } catch (err) {
      setUploadMessage({ text: `❌ ${err.message}`, type: "error" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <p style={{ fontSize: 16, color: "#666" }}>⏳ Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {uploadMessage.text && (
        <div style={{
          backgroundColor: uploadMessage.type === "success" ? "#d1fae5" : "#fee2e2",
          color: uploadMessage.type === "success" ? "#065f46" : "#991b1b",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "14px",
          fontWeight: 500
        }}>
          {uploadMessage.text}
        </div>
      )}
      {admin ? (
        <div style={{
          backgroundColor: "#fff",
          borderRadius: "12px",
          padding: "40px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          border: "1px solid #e0e0e0"
        }}>
          {/* Profile Header */}
          <div style={{ display: "flex", gap: "30px", alignItems: "flex-start", marginBottom: "40px" }}>
            {/* Avatar with actual image and upload */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}>
              <div style={{
                width: "120px",
                height: "120px",
                borderRadius: "12px",
                backgroundColor: "#f0f0f0",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "48px",
                flexShrink: 0,
                border: "2px solid #e0e0e0"
              }}>
                {admin.profile_photo ? (
                  <img 
                    src={`http://localhost:8000${admin.profile_photo}?t=${Date.now()}`}
                    alt={admin.name}
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
                  display: admin.profile_photo ? "none" : "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "48px",
                  backgroundColor: "#dc3545",
                  width: "100%",
                  height: "100%"
                }}>
                  🛡️
                </div>
              </div>
              {/* Photo Upload Input */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  id="adminPhotoInput"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  style={{ display: "none" }}
                />
                <label
                  htmlFor="adminPhotoInput"
                  style={{
                    display: "inline-block",
                    padding: "8px 16px",
                    backgroundColor: uploading ? "#ccc" : "#dc3545",
                    color: "white",
                    borderRadius: "6px",
                    cursor: uploading ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    fontWeight: 600,
                    transition: "background-color 0.2s",
                    opacity: uploading ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => !uploading && (e.target.style.backgroundColor = "#bb2d3b")}
                  onMouseLeave={(e) => !uploading && (e.target.style.backgroundColor = "#dc3545")}
                >
                  {uploading ? "⏳ Uploading..." : "📸 Change Photo"}
                </label>
              </div>
            </div>

            {/* Basic Info */}
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: "0 0 8px 0", fontSize: 28, color: "#1a1a1a", fontWeight: 600 }}>
                {admin.username}
              </h1>
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <span style={{
                  backgroundColor: "#dc3545",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase"
                }}>
                  🛡 {admin.role}
                </span>
                <span style={{
                  backgroundColor: "#28a745",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600"
                }}>
                  ✓ Active
                </span>
              </div>
            </div>
          </div>

          {/* Profile Details Grid */}
          <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "30px" }}>
            <h2 style={{ margin: "0 0 20px 0", fontSize: 16, color: "#1a1a1a", fontWeight: 600 }}>Profile Details</h2>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "25px"
            }}>
              {/* User ID */}
              <div>
                <p style={{ margin: "0 0 6px 0", color: "#666", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>User ID</p>
                <p style={{ margin: 0, color: "#1a1a1a", fontSize: 16, fontWeight: 600, fontFamily: "monospace" }}>
                  {admin.id}
                </p>
              </div>

              {/* Email */}
              <div>
                <p style={{ margin: "0 0 6px 0", color: "#666", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Company Email</p>
                <p style={{ margin: 0, color: "#1a1a1a", fontSize: 16, fontWeight: 500 }}>
                  {admin.company_email || "N/A"}
                </p>
              </div>

              {/* Role */}
              <div>
                <p style={{ margin: "0 0 6px 0", color: "#666", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Role</p>
                <p style={{ margin: 0, color: "#1a1a1a", fontSize: 16, fontWeight: 600, textTransform: "capitalize" }}>
                  {admin.role}
                </p>
              </div>

              {/* Account Status */}
              <div>
                <p style={{ margin: "0 0 6px 0", color: "#666", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</p>
                <p style={{ margin: 0, color: "#28a745", fontSize: 16, fontWeight: 600 }}>
                  ✓ {admin.status || "active"}
                </p>
              </div>

              {/* Last Login */}
              <div>
                <p style={{ margin: "0 0 6px 0", color: "#666", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Last Login</p>
                <p style={{ margin: 0, color: "#1a1a1a", fontSize: 16, fontWeight: 500 }}>
                  {admin.last_login ? new Date(admin.last_login).toLocaleString() : "N/A"}
                </p>
              </div>

              {/* Account Created */}
              <div>
                <p style={{ margin: "0 0 6px 0", color: "#666", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Joined</p>
                <p style={{ margin: 0, color: "#1a1a1a", fontSize: 16, fontWeight: 500 }}>
                  {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div style={{ marginTop: "30px", paddingTop: "30px", borderTop: "1px solid #e0e0e0" }}>
            <h2 style={{ margin: "0 0 15px 0", fontSize: 16, color: "#1a1a1a", fontWeight: 600 }}>Permissions</h2>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <span style={{
                backgroundColor: "#e7f3ff",
                color: "#0056b3",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "500"
              }}>
                View All Logs
              </span>
              <span style={{
                backgroundColor: "#e7f3ff",
                color: "#0056b3",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "500"
              }}>
                Manage Users
              </span>
              <span style={{
                backgroundColor: "#e7f3ff",
                color: "#0056b3",
                padding: "8px 16px",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "500"
              }}>
                System Access
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p style={{ fontSize: 16, color: "#666" }}>Failed to load profile</p>
        </div>
      )}
    </div>
  );
}
