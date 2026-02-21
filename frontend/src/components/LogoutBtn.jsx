import { useNavigate } from "react-router-dom";

export default function LogoutBtn() {
  const navigate = useNavigate();

  function logout() {
    localStorage.clear();
    window.dispatchEvent(new Event('logout'));
    navigate("/");
  }

  return (
    <button 
      onClick={logout}
      style={{
        background: "#dc3545",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: 4,
        cursor: "pointer",
        fontSize: 14,
        fontWeight: 500,
        transition: "all 0.3s"
      }}
      onMouseEnter={(e) => e.target.style.background = "#c82333"}
      onMouseLeave={(e) => e.target.style.background = "#dc3545"}
    >
      Logout
    </button>
  );
}
