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
    { id: "flsm", label: "FLSM (Fixed)", icon: "📊" },
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
