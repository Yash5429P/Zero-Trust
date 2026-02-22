import { useEffect, useState } from "react";
import { getProfile, getAccessToken } from "../api/api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {

    const [user, setUser] = useState(null);
    const [logs, setLogs] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState({ text: "", type: "" });
    const [agentInfo, setAgentInfo] = useState(null);
    const [downloadingAgent, setDownloadingAgent] = useState(false);
    const navigate = useNavigate();

    const role = localStorage.getItem("role");
    const loginType = localStorage.getItem("loginType");

    // ========== LOGOUT ==========
    function logout() {
        localStorage.clear();
        window.dispatchEvent(new Event("logout"));
        navigate("/");
    }

    // ========== PROFILE API ==========
    async function loadProfile() {
        const res = await getProfile();

        if (res.detail || !res) return logout(); 
        setUser(res);
    }

    // ========== UPLOAD PROFILE PHOTO ==========
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
                const updatedUser = await res.json();
                setUser(updatedUser);
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

    // ========== FETCH LOGS FOR ADMIN ==========
    async function loadLogs() {
        const token = getAccessToken();

        const res = await fetch("http://127.0.0.1:8000/logs", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
            const data = await res.json();
            setLogs(data);
        }
    }

    // ========== FETCH AGENT INFO ==========
    async function loadAgentInfo() {
        const token = getAccessToken();

        try {
            const res = await fetch("http://127.0.0.1:8000/agent/info", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setAgentInfo(data);
            }
        } catch (err) {
            console.error("Error loading agent info:", err);
        }
    }

    // ========== DOWNLOAD AGENT ==========
    async function handleDownloadAgent() {
        setDownloadingAgent(true);
        const token = getAccessToken();

        try {
            const res = await fetch("http://127.0.0.1:8000/agent/download", {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const error = await res.json();
                setUploadMessage({ 
                    text: `❌ Download failed: ${error.detail || "Unknown error"}`, 
                    type: "error" 
                });
                setDownloadingAgent(false);
                return;
            }

            // Create blob and download
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "zero-trust-agent.exe";
            document.body.appendChild(link);
            link.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(link);

            setUploadMessage({ 
                text: "✅ Agent downloaded successfully!", 
                type: "success" 
            });
            setTimeout(() => setUploadMessage({ text: "", type: "" }), 3000);
        } catch (err) {
            console.error("Download error:", err);
            setUploadMessage({ 
                text: `❌ Download failed: ${err.message}`, 
                type: "error" 
            });
        } finally {
            setDownloadingAgent(false);
        }
    }


    // ========== Auto Load Profile & Logs ==========
    useEffect(() => {
        const token = getAccessToken();
        if (!token) return navigate("/");

        loadProfile();
        loadAgentInfo();
        if (role === "admin") loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div style={{ padding: "40px", backgroundColor: "#f8f9fa", minHeight: "100vh", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 32, color: "#1a1a1a", fontWeight: 600 }}>🔐 User Dashboard</h1>
                    <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: 14 }}>Welcome to your secure workspace</p>
                </div>

            </div>

            {/* MESSAGE */}
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

            {/* USER INFO CARD */}
            {user ? (
                <div style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "24px",
                    marginBottom: 30,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    border: "1px solid #e0e0e0"
                }}>
                    <h2 style={{ margin: "0 0 20px 0", color: "#1a1a1a", fontSize: 18, fontWeight: 600 }}>👤 Profile Information</h2>
                    <div style={{ display: "flex", gap: 30, alignItems: "flex-start", marginBottom: 20 }}>
                        {/* User Image with Upload */}
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
                                flexShrink: 0,
                                border: "2px solid #e0e0e0",
                                position: "relative"
                            }}>
                                {user.profile_photo ? (
                                    <img 
                                        src={`http://localhost:8000${user.profile_photo}?t=${Date.now()}`}
                                        alt={user.name}
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
                                    fontSize: "48px",
                                    backgroundColor: "#007bff",
                                    width: "100%",
                                    height: "100%"
                                }}>
                                    👤
                                </div>
                            </div>
                            {/* Photo Upload Input */}
                            <div style={{ position: "relative" }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="photoInput"
                                    onChange={handlePhotoUpload}
                                    disabled={uploading}
                                    style={{ display: "none" }}
                                />
                                <label
                                    htmlFor="photoInput"
                                    style={{
                                        display: "inline-block",
                                        padding: "8px 16px",
                                        backgroundColor: uploading ? "#ccc" : "#007bff",
                                        color: "white",
                                        borderRadius: "6px",
                                        cursor: uploading ? "not-allowed" : "pointer",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                        transition: "background-color 0.2s",
                                        opacity: uploading ? 0.6 : 1
                                    }}
                                    onMouseEnter={(e) => !uploading && (e.target.style.backgroundColor = "#0056b3")}
                                    onMouseLeave={(e) => !uploading && (e.target.style.backgroundColor = "#007bff")}
                                >
                                    {uploading ? "⏳ Uploading..." : "📸 Change Photo"}
                                </label>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                                <div>
                                    <p style={{ margin: 0, color: "#666", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>User ID</p>
                                    <p style={{ margin: "8px 0 0 0", color: "#1a1a1a", fontSize: 16, fontWeight: 500, fontFamily: "monospace" }}>{user.id}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, color: "#666", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Username</p>
                                    <p style={{ margin: "8px 0 0 0", color: "#1a1a1a", fontSize: 16, fontWeight: 500 }}>{user.username}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, color: "#666", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Name</p>
                                    <p style={{ margin: "8px 0 0 0", color: "#1a1a1a", fontSize: 16, fontWeight: 500 }}>{user.name}</p>
                                </div>
                                <div>
                                    <p style={{ margin: 0, color: "#666", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.5 }}>Role</p>
                                    <p style={{
                                        margin: "8px 0 0 0",
                                        color: user.role === "admin" ? "#dc3545" : "#007bff",
                                        fontSize: 16,
                                        fontWeight: 600,
                                        textTransform: "capitalize"
                                    }}>
                                        {user.role === "admin" ? "🛡 " : "👥 "}{user.role}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "24px",
                    marginBottom: 30,
                    textAlign: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                }}>
                    <p style={{ color: "#666", fontSize: 14 }}>⏳ Loading user information...</p>
                </div>
            )}

            {/* AGENT DOWNLOAD SECTION */}
            {agentInfo && (
                <div style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "24px",
                    marginBottom: 30,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    border: "1px solid #e0e0e0"
                }}>
                    <h2 style={{ margin: "0 0 20px 0", color: "#1a1a1a", fontSize: 18, fontWeight: 600 }}>
                        🤖 Zero Trust Agent
                    </h2>
                    <p style={{ margin: "0 0 20px 0", color: "#666", fontSize: 14, lineHeight: 1.5 }}>
                        Download and install the Zero Trust Agent on your device to enable real-time monitoring, 
                        USB device tracking, and geolocation detection.
                    </p>

                    {/* Agent Features */}
                    <div style={{ marginBottom: 20 }}>
                        <h3 style={{ margin: "0 0 12px 0", color: "#1a1a1a", fontSize: 14, fontWeight: 600 }}>Features:</h3>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            {agentInfo.features?.map((feature, idx) => (
                                <div key={idx} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                                    <span style={{ color: "#28a745", fontSize: 18, flexShrink: 0 }}>✓</span>
                                    <span style={{ color: "#666", fontSize: 13 }}>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Installation Steps */}
                    <div style={{ 
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        padding: "16px",
                        marginBottom: 20,
                        border: "1px solid #e0e0e0"
                    }}>
                        <h3 style={{ margin: "0 0 12px 0", color: "#1a1a1a", fontSize: 14, fontWeight: 600 }}>
                            Installation Steps:
                        </h3>
                        <ol style={{ margin: 0, paddingLeft: 20, color: "#666" }}>
                            {agentInfo.installation_steps?.map((step, idx) => (
                                <li key={idx} style={{ marginBottom: 8, fontSize: 13, lineHeight: 1.5 }}>
                                    {step}
                                </li>
                            ))}
                        </ol>
                    </div>

                    {/* Download Button */}
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                        <button
                            onClick={handleDownloadAgent}
                            disabled={downloadingAgent}
                            style={{
                                padding: "12px 24px",
                                backgroundColor: downloadingAgent ? "#ccc" : "#28a745",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: downloadingAgent ? "not-allowed" : "pointer",
                                fontSize: "14px",
                                fontWeight: 600,
                                transition: "background-color 0.2s",
                                opacity: downloadingAgent ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => !downloadingAgent && (e.target.style.backgroundColor = "#218838")}
                            onMouseLeave={(e) => !downloadingAgent && (e.target.style.backgroundColor = "#28a745")}
                        >
                            {downloadingAgent ? "⏳ Downloading..." : "📥 Download Agent (v" + agentInfo.version + ")"}
                        </button>
                        <span style={{ color: "#999", fontSize: 12 }}>
                            {agentInfo.agent_name} • {agentInfo.description}
                        </span>
                    </div>
                </div>
            )}

            {/* Warning for personal login users */}
            {loginType === "personal" && role !== "admin" && (
                <div style={{
                    backgroundColor: "#fff3cd",
                    border: "1px solid #ffc107",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: 30,
                    color: "#856404"
                }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
                        ⚠️ Personal Email Login — Limited features are active on your account.
                    </p>
                </div>
            )}

            {/* LOGS SECTION — ADMIN ONLY */}
            {role === "admin" && (
                <div>
                    <h2 style={{ margin: "0 0 20px 0", color: "#1a1a1a", fontSize: 24, fontWeight: 600 }}>🛡 Admin Activity Logs</h2>

                    {logs.length > 0 ? (
                        <div style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            overflow: "hidden"
                        }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ backgroundColor: "#f1f3f5", borderBottom: "2px solid #e0e0e0" }}>
                                        <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>ID</th>
                                        <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Action</th>
                                        <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Details</th>
                                        <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>IP</th>
                                        <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Device</th>
                                        <th style={{ padding: "16px", textAlign: "left", fontWeight: 600, color: "#1a1a1a", fontSize: 13 }}>Timestamp</th>
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
                                            <td style={{ padding: "14px 16px", color: "#1a1a1a", fontSize: 13 }}>{log.id}</td>
                                            <td style={{ padding: "14px 16px", color: "#1a1a1a", fontSize: 13 }}>
                                                <span style={{ backgroundColor: "#e7f3ff", color: "#0056b3", padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 500 }}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ padding: "14px 16px", color: "#666", fontSize: 13 }}>{log.details || "-"}</td>
                                            <td style={{ padding: "14px 16px", color: "#666", fontSize: 13, fontFamily: "monospace" }}>{log.ip || "-"}</td>
                                            <td style={{ padding: "14px 16px", color: "#666", fontSize: 12 }}>{log.device?.slice(0, 25) + "..." || "-"}</td>
                                            <td style={{ padding: "14px 16px", color: "#666", fontSize: 13 }}>{new Date(log.time).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            padding: "40px",
                            textAlign: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                        }}>
                            <p style={{ color: "#999", fontSize: 14 }}>📭 No activity logs found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
