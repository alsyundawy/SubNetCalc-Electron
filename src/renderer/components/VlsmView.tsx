/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/renderer/components/VlsmView.tsx
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

import React, { useState, useId, useMemo } from "react";
import {
  calculateVLSM,
  VLSMResult,
  VLSMRequirement,
  VLSMAllocation,
} from "@engine/vlsm.js";
import { parseSubnetInput } from "@engine/parse.js";
import { exportToCsv } from "@engine/export.js";
import { downloadCsv } from "../utils/download.js";

const DEFAULT_REQUIREMENTS: VLSMRequirement[] = [
  { name: "LAN 1 - Engineering", hostsNeeded: 60 },
  { name: "LAN 2 - Operations", hostsNeeded: 28 },
  { name: "WAN Point-to-Point", hostsNeeded: 2 },
];

const DEFAULT_VLSM_NETWORK = "192.168.0.0/24"; // NOSONAR: S1313 Documentation sample subnet for interactive calculator

function getUtilizationColor(percent: number): string {
  if (percent > 90) return "var(--accent-red)";
  if (percent > 70) return "var(--accent-amber)";
  return "var(--accent-emerald)";
}

export const VlsmView: React.FC = () => {
  const [networkInput, setNetworkInput] = useState(DEFAULT_VLSM_NETWORK);
  const [requirements, setRequirements] =
    useState<VLSMRequirement[]>(DEFAULT_REQUIREMENTS);
  const [newName, setNewName] = useState("");
  const [newHosts, setNewHosts] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const baseNetworkInputId = useId();
  const newSubnetNameId = useId();
  const newSubnetHostsId = useId();

  const { result, error } = useMemo<{
    result: VLSMResult | null;
    error: string | null;
  }>(() => {
    try {
      if (requirements.length === 0) {
        return {
          result: null,
          error: "Please add at least one subnet requirement.",
        };
      }
      const parsed = parseSubnetInput(networkInput);
      if (parsed.family !== 4) {
        return {
          result: null,
          error:
            "VLSM is designed for IPv4 networks only (max prefix /32). For IPv6 subnetting, please use the FLSM tab.",
        };
      }
      if (parsed.prefix > 32) {
        return {
          result: null,
          error: `IPv4 prefix /${parsed.prefix} is out of range (max prefix is /32).`,
        };
      }
      const res = calculateVLSM(
        parsed.addressString,
        parsed.prefix,
        requirements,
      );
      return { result: res, error: null };
    } catch (err: unknown) {
      return {
        result: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }, [networkInput, requirements]);

  const handleAddRequirement = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = newName.trim() || `Subnet ${requirements.length + 1}`;
    const hosts = Number.parseInt(newHosts, 10);
    if (Number.isNaN(hosts) || hosts < 1) return;

    setRequirements((prev) => [...prev, { name, hostsNeeded: hosts }]);
    setNewName("");
    setNewHosts("");
  };

  const handleRemoveRequirement = (idx: number) => {
    setRequirements((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateHosts = (idx: number, val: string) => {
    const num = Number.parseInt(val, 10);
    if (!Number.isNaN(num) && num >= 1) {
      setRequirements((prev) =>
        prev.map((r, i) => (i === idx ? { ...r, hostsNeeded: num } : r)),
      );
    }
  };

  const handleExportCsv = () => {
    if (!result || result.allocations.length === 0) return;
    try {
      const csv = exportToCsv<VLSMAllocation>(result.allocations, [
        { key: "name", label: "Subnet Name" },
        { key: "hostsNeeded", label: "Hosts Needed" },
        { key: "allocatedHosts", label: "Block Size" },
        { key: "prefix", label: "Prefix" },
        { key: "subnetId", label: "Subnet ID" },
        { key: "netmask", label: "Netmask" },
        { key: "broadcast", label: "Broadcast" },
        { key: "usableHosts", label: "Usable Hosts" },
        { key: "wastedHosts", label: "Wasted Hosts" },
      ]);

      downloadCsv(csv, `vlsm_${result.baseNetwork}_${result.basePrefix}.csv`);
    } catch {
      // Ignore
    }
  };

  const handleCopyAllocation = (alloc: VLSMAllocation, idx: number) => {
    try {
      const text = `${alloc.name}: ${alloc.subnetId}/${alloc.prefix} (Hosts: ${alloc.hostRange.first} - ${alloc.hostRange.last}, BC: ${alloc.broadcast})`;
      void navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {}
  };

  return (
    <div className="view-tab-content">
      {/* Top Config Bar */}
      <div className="view-control-bar">
        <div className="control-group">
          <label htmlFor={baseNetworkInputId} className="control-label">
            Base Parent Network / CIDR <span className="control-label-hint">(IPv4 only: /0–/32)</span>:
          </label>
          <input
            id={baseNetworkInputId}
            type="text"
            className="input-text"
            value={networkInput}
            onChange={(e) => setNetworkInput(e.target.value)}
            placeholder="e.g. 192.168.0.0/24 (max /32)"
            aria-label="Parent network CIDR (IPv4 only /0–/32)"
          />
        </div>

        <form onSubmit={handleAddRequirement} className="vlsm-add-form">
          <div className="control-group">
            <label htmlFor={newSubnetNameId} className="control-label">
              Name:
            </label>
            <input
              id={newSubnetNameId}
              type="text"
              className="input-text small"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Sales LAN"
              aria-label="New subnet name"
            />
          </div>
          <div className="control-group">
            <label htmlFor={newSubnetHostsId} className="control-label">
              Hosts:
            </label>
            <input
              id={newSubnetHostsId}
              type="number"
              min="1"
              max="65534"
              className="input-number small"
              value={newHosts}
              onChange={(e) => setNewHosts(e.target.value)}
              placeholder="1-65534"
              aria-label="Required host count"
            />
          </div>
          <button type="submit" className="btn-add-subnet">
            + Add Subnet
          </button>
        </form>

        <div className="control-actions">
          <button
            type="button"
            className="btn-export-csv"
            onClick={handleExportCsv}
            disabled={!result || result.allocations.length === 0}
            title="Download VLSM table as RFC 4180 CSV"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Utilization & Metrics */}
      {result && (
        <>
          <div className="vlsm-capacity-section">
            <div className="capacity-bar-header">
              <span>
                Address Pool Allocation:{" "}
                <strong>
                  {result.totalAllocated} / {result.totalCapacity} addresses (
                  {result.utilizationPercent}%)
                </strong>
              </span>
              <span className="text-dim">
                {result.unallocatedHosts} unallocated
              </span>
            </div>
            <progress
              className="capacity-progress-track capacity-progress-bar"
              value={Math.min(result.utilizationPercent, 100)}
              max={100}
              aria-label="Address pool allocation progress"
              style={{
                accentColor: getUtilizationColor(result.utilizationPercent),
              }}
            >
              <div
                className="capacity-progress-fill"
                style={{
                  width: `${Math.min(result.utilizationPercent, 100)}%`,
                  backgroundColor: getUtilizationColor(
                    result.utilizationPercent,
                  ),
                }}
              />
            </progress>
          </div>

          <div className="view-metrics-grid">
            <div className="metric-pill">
              <span className="metric-label">Total Required</span>
              <span className="metric-val">{result.totalNeeded} hosts</span>
            </div>
            <div className="metric-pill">
              <span className="metric-label">Total Allocated</span>
              <span className="metric-val highlight">
                {result.totalAllocated} addresses
              </span>
            </div>
            <div className="metric-pill">
              <span className="metric-label">Free Space</span>
              <span className="metric-val">
                {result.unallocatedHosts} addresses
              </span>
            </div>
            <div className="metric-pill">
              <span className="metric-label">Subnets Allocated</span>
              <span className="metric-val">{result.allocations.length}</span>
            </div>
          </div>

          {/* Allocations Table */}
          <div className="table-wrapper">
            <table className="data-table" aria-label="VLSM Allocations Table">
              <thead>
                <tr>
                  <th scope="col">Subnet Name</th>
                  <th scope="col" style={{ width: "90px" }}>
                    Needed
                  </th>
                  <th scope="col">Subnet ID</th>
                  <th scope="col">Usable Range</th>
                  <th scope="col">Broadcast</th>
                  <th scope="col" style={{ width: "80px" }}>
                    Usable
                  </th>
                  <th scope="col" style={{ width: "70px" }}>
                    Wasted
                  </th>
                  <th scope="col" style={{ width: "70px" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.allocations.map((alloc, idx) => (
                  <tr key={`${alloc.name}-${idx}`}>
                    <td className="font-bold">{alloc.name}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        className="input-number table-inline"
                        value={alloc.hostsNeeded}
                        onChange={(e) => handleUpdateHosts(idx, e.target.value)}
                        aria-label={`Required hosts for ${alloc.name}`}
                      />
                    </td>
                    <td className="cell-mono highlight font-bold">
                      {alloc.subnetId}/{alloc.prefix}
                    </td>
                    <td className="cell-mono">
                      {alloc.hostRange.first} - {alloc.hostRange.last}
                    </td>
                    <td className="cell-mono text-dim">{alloc.broadcast}</td>
                    <td className="cell-mono text-right">
                      {alloc.usableHosts}
                    </td>
                    <td className="cell-mono text-dim text-right">
                      +{alloc.wastedHosts}
                    </td>
                    <td>
                      <div className="cell-actions-row">
                        <button
                          type="button"
                          className="btn-cell-action"
                          onClick={() => handleCopyAllocation(alloc, idx)}
                          title="Copy subnet details"
                        >
                          {copiedIndex === idx ? "✓" : "📋"}
                        </button>
                        <button
                          type="button"
                          className="btn-cell-action danger"
                          onClick={() => handleRemoveRequirement(idx)}
                          title="Delete requirement"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
