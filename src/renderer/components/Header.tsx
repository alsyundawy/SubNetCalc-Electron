import React from "react";
import appIcon from "../assets/icon.png";
import { THEMES } from "../themes.js";

interface HeaderProps {
  version: string;
  currentThemeId: string;
  onSelectTheme: (themeId: string) => void;
  onOpenAbout: () => void;
}

const THEME_GROUPS = [
  "Catppuccin",
  "Dracula",
  "Gruvbox",
  "Solarized",
  "Tomorrow",
] as const;

export const Header: React.FC<HeaderProps> = ({
  version,
  currentThemeId,
  onSelectTheme,
  onOpenAbout,
}) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <img
          src={appIcon}
          alt="SubNetCalc Electron Logo"
          className="brand-logo-img"
        />
        <div>
          <div className="brand-title">
            SubNetCalc Electron{" "}
            <span className="brand-badge">v{version || "1.1.1"}</span>
          </div>
          <div className="brand-subtitle">
            High-Precision IPv4 &amp; IPv6 Subnet Calculator Desktop Suite
          </div>
        </div>
      </div>

      <div className="header-actions">
        {/* Modern Multi-Theme Selector */}
        <div className="theme-picker-wrapper">
          <span
            className="theme-picker-icon"
            aria-hidden="true"
            title="Theme Selector"
          >
            🎨
          </span>
          <select
            className="theme-selector"
            value={currentThemeId}
            onChange={(e) => onSelectTheme(e.target.value)}
            aria-label="Select Color Theme"
            title="Switch Theme Palette"
          >
            {THEME_GROUPS.map((group) => (
              <optgroup key={group} label={group}>
                {THEMES.filter((t) => t.group === group).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.isDark ? "Dark" : "Light"})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn-header-about"
          onClick={onOpenAbout}
          title="About SubNetCalc Electron"
          aria-label="About"
        >
          <span className="about-icon">ℹ️</span>
          <span className="about-label">About</span>
        </button>
      </div>
    </header>
  );
};
