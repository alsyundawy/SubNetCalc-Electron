import React from "react";
import appIcon from "../assets/icon.png";

interface HeaderProps {
  version: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenAbout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  version,
  theme,
  onToggleTheme,
  onOpenAbout,
}) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <img
          src={appIcon}
          alt="SubNetCalc Logo"
          className="brand-logo-img"
        />
        <div>
          <div className="brand-title">
            SubNetCalc{" "}
            <span className="brand-badge">v{version || "1.0.0"}</span>
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-dim)" }}>
            High-Precision IPv4 & IPv6 Subnet Calculator
          </div>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="btn-icon"
          onClick={onToggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
        <button
          className="btn-icon"
          onClick={onOpenAbout}
          title="About SubNetCalc"
          aria-label="About"
        >
          ℹ️
        </button>
      </div>
    </header>
  );
};
