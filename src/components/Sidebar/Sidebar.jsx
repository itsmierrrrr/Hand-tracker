import "./Sidebar.css";

const NAV = [
  { id: "dashboard", icon: "⊞", label: "Dashboard" },
  { id: "mouse",     icon: "◎", label: "Mouse" },
  { id: "keyboard",  icon: "⌨", label: "Keyboard" },
  { id: "media",     icon: "▶", label: "Media" },
  { id: "settings",  icon: "⚙", label: "Settings" },
];

/**
 * @param {{ activeTab: string, onTabChange: (id: string) => void }} props
 */
function Sidebar({ activeTab, onTabChange }) {
  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-dot" />
        <span className="sidebar-brand-name">Hand Controller Pro</span>
      </div>

      <div className="sidebar-section-label">Navigation</div>

      {NAV.map(({ id, icon, label }) => (
        <button
          key={id}
          className={`sidebar-item ${activeTab === id ? "active" : ""}`}
          onClick={() => onTabChange(id)}
        >
          <span className="sidebar-item-icon">{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  );
}

export default Sidebar;
