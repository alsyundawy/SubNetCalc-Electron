/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/renderer/components/TabsHeader.tsx
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

export type ActiveTab = "calc" | "flsm" | "vlsm" | "cidr";

interface TabsHeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const TabsHeader: React.FC<TabsHeaderProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const tabs: { id: ActiveTab; label: string; icon: string }[] = [
    { id: "calc", label: "Calculator", icon: "🔢" },
    { id: "flsm", label: "FLSM", icon: "📊" },
    { id: "vlsm", label: "VLSM (Variable)", icon: "📐" },
    { id: "cidr", label: "CIDR Supernetting", icon: "🌐" },
  ];

  return (
    <nav
      className="tabs-nav"
      role="tablist"
      aria-label="Subnet Calculator Modes"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            className={`tab-btn ${isActive ? "active" : ""}`}
            onClick={() => onSelectTab(tab.id)}
            type="button"
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
