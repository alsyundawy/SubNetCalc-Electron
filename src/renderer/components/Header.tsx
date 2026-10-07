/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/renderer/components/Header.tsx
 * Version: 1.1.2
 * Date & Time: 2026-10-07T11:00:00+07:00
 *
 * Maintainer & Lead Developer:
 *   Harry Dertin Sutisna Alsyundawy (Alsyundawy IT Solution)
 *   Email: alsyundawy@gmail.com
 *   Website: https://alsyundawy.com
 *   GitHub: https://github.com/alsyundawy
 *
 * Original Heritage & Algorithmic Attribution:
 *   - Dr. Thomas Dreibholz (dreibh/subnetcalc - RFC Calculation Engine)
 *   - Julien Mulot (mulot/SubnetCalc - Original macOS Subnet Calculator)
 *
 * License: MIT (SPDX: MIT)
 * Architecture: Cross-Platform (macOS Apple Silicon & Intel, Windows x64 & x86, Linux)
 * ============================================================================
 */

/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/renderer/components/Header.tsx
 * Version: 1.1.2
 * Date & Time: 2026-10-07T11:00:00+07:00
 *
 * Maintainer & Lead Developer:
 *   Harry Dertin Sutisna Alsyundawy (Alsyundawy IT Solution)
 *   Email: alsyundawy@gmail.com
 *   Website: https://alsyundawy.com
 *   GitHub: https://github.com/alsyundawy
 *
 * Original Heritage & Algorithmic Attribution:
 *   - Dr. Thomas Dreibholz (dreibh/subnetcalc - RFC Calculation Engine)
 *   - Julien Mulot (mulot/SubnetCalc - Original macOS Subnet Calculator)
 *
 * License: MIT (SPDX: MIT)
 * Architecture: Cross-Platform (macOS Apple Silicon & Intel, Windows x64 & x86, Linux)
 * ============================================================================
 */

import React from "react";
import appIcon from "../assets/icon.png";
import { THEMES, THEME_GROUPS } from "../themes.js";

interface HeaderProps {
  version: string;
  currentThemeId: string;
  onSelectTheme: (themeId: string) => void;
  onOpenAbout: () => void;
}

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
            <span className="brand-badge">v{version || "1.1.2"}</span>
          </div>
          <div className="brand-subtitle">
            High-Precision IPv4 &amp; IPv6 Subnet Calculator Desktop Suite
          </div>
        </div>
      </div>

      <div className="header-actions">
        {/* Premier 25 Developer Theme Families Selector */}
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
            title="Switch Theme Palette (25 Developer Families)"
          >
            {THEME_GROUPS.map((group) => {
              const groupThemes = THEMES.filter((t) => t.group === group);
              if (groupThemes.length === 0) return null;
              return (
                <optgroup key={group} label={group}>
                  {groupThemes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.isDark ? "Dark" : "Light"})
                    </option>
                  ))}
                </optgroup>
              );
            })}
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
