/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/renderer/components/FlsmView.tsx
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
import { calculateFLSM, FLSMResult, FLSMSubnet } from "@engine/flsm.js";
import { parseSubnetInput } from "@engine/parse.js";
import { exportToCsv } from "@engine/export.js";
import { downloadCsv } from "../utils/download.js";

const DEFAULT_FLSM_NETWORK = "192.168.1.0/24"; // NOSONAR: S1313 Documentation sample subnet for interactive calculator

export const FlsmView: React.FC = () => {
  const [networkInput, setNetworkInput] = useState(DEFAULT_FLSM_NETWORK);
  const [subnetsCount, setSubnetsCount] = useState(4);
  const [customSubnetsInput, setCustomSubnetsInput] = useState("4");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const baseNetworkInputId = useId();
  const subnetsSliderId = useId();
  const subnetsNumberId = useId();

  const { result, error } = useMemo<{
    result: FLSMResult | null;
    error: string | null;
  }>(() => {
    try {
      const parsed = parseSubnetInput(networkInput);
      if (parsed.family !== 4) {
        return {
          result: null,
          error: "FLSM currently supports IPv4 networks only.",
        };
      }
      const res = calculateFLSM(
        parsed.addressString,
        parsed.prefix,
        subnetsCount,
      );
      return { result: res, error: null };
    } catch (err: unknown) {
      return {
        result: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }, [networkInput, subnetsCount]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseInt(e.target.value, 10);
    setSubnetsCount(val);
    setCustomSubnetsInput(val.toString());
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomSubnetsInput(raw);
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= 512) {
      setSubnetsCount(parsed);
    }
  };

  const handleExportCsv = () => {
    if (!result || result.subnets.length === 0) return;
    try {
      const csv = exportToCsv<FLSMSubnet>(result.subnets, [
        { key: "index", label: "Subnet #" },
        { key: "subnetId", label: "Subnet ID" },
        { key: "prefix", label: "Prefix" },
        { key: "netmask", label: "Netmask" },
        { key: "broadcast", label: "Broadcast" },
        { key: "usableHosts", label: "Usable Hosts" },
        { key: "totalHosts", label: "Total Hosts" },
      ]);

      downloadCsv(csv, `flsm_${result.baseNetwork}_${result.basePrefix}.csv`);
    } catch {
      // Ignore
    }
  };

  const handleCopySubnet = (sub: FLSMSubnet) => {
    try {
      const text = `${sub.subnetId}/${sub.prefix} (Hosts: ${sub.hostRange.first} - ${sub.hostRange.last}, BC: ${sub.broadcast})`;
      void navigator.clipboard.writeText(text);
      setCopiedIndex(sub.index);
      setTimeout(() => setCopiedIndex(null), 1500);
    } catch {}
  };

  return (
    <div className="view-tab-content">
      {/* Control Bar */}
      <div className="view-control-bar">
        <div className="control-group">
          <label htmlFor={baseNetworkInputId} className="control-label">
            Base Network / CIDR:
          </label>
          <input
            id={baseNetworkInputId}
            type="text"
            className="input-text"
            value={networkInput}
            onChange={(e) => setNetworkInput(e.target.value)}
            placeholder="e.g. 192.168.1.0/24"
            aria-label="Base network CIDR"
          />
        </div>

        <div className="control-group subnets-slider-group">
          <label htmlFor={subnetsSliderId} className="control-label">
            Subnets Needed: <strong>{subnetsCount}</strong>
          </label>
          <div className="slider-container">
            <input
              id={subnetsSliderId}
              type="range"
              min="1"
              max="128"
              value={subnetsCount}
              onChange={handleSliderChange}
              className="range-slider"
              aria-label="Number of subnets slider"
            />
            <input
              id={subnetsNumberId}
              type="number"
              min="1"
              max="512"
              value={customSubnetsInput}
              onChange={handleNumberChange}
              className="input-number"
              aria-label="Number of subnets direct input"
            />
          </div>
        </div>

        <div className="control-actions">
          <button
            type="button"
            className="btn-export-csv"
            onClick={handleExportCsv}
            disabled={!result || result.subnets.length === 0}
            title="Download subnets table as RFC 4180 CSV"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Summary Cards */}
      {result && (
        <>
          <div className="view-metrics-grid">
            <div className="metric-pill">
              <span className="metric-label">Allocated Prefix</span>
              <span className="metric-val highlight">
                /{result.allocatedPrefix}
              </span>
            </div>
            <div className="metric-pill">
              <span className="metric-label">Borrowed Bits</span>
              <span className="metric-val">{result.borrowedBits} bits</span>
            </div>
            <div className="metric-pill">
              <span className="metric-label">Subnets Created</span>
              <span className="metric-val">{result.totalSubnetsCreated}</span>
            </div>
            <div className="metric-pill">
              <span className="metric-label">Usable Hosts/Subnet</span>
              <span className="metric-val">
                {result.usableHostsPerSubnet.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Subnets Table */}
          <div className="table-wrapper">
            <table className="data-table" aria-label="FLSM Subnets Table">
              <thead>
                <tr>
                  <th scope="col" style={{ width: "45px" }}>
                    #
                  </th>
                  <th scope="col">Subnet ID</th>
                  <th scope="col">Netmask</th>
                  <th scope="col">Usable Host Range</th>
                  <th scope="col">Broadcast</th>
                  <th scope="col" style={{ width: "80px" }}>
                    Hosts
                  </th>
                  <th scope="col" style={{ width: "60px" }}>
                    Copy
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.subnets.map((sub) => (
                  <tr key={sub.index}>
                    <td className="cell-mono text-dim">{sub.index}</td>
                    <td className="cell-mono highlight font-bold">
                      {sub.subnetId}/{sub.prefix}
                    </td>
                    <td className="cell-mono text-dim">{sub.netmask}</td>
                    <td className="cell-mono">
                      {sub.hostRange.first} - {sub.hostRange.last}
                    </td>
                    <td className="cell-mono text-dim">{sub.broadcast}</td>
                    <td className="cell-mono text-right">{sub.usableHosts}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-cell-action"
                        onClick={() => handleCopySubnet(sub)}
                        title="Copy subnet summary"
                      >
                        {copiedIndex === sub.index ? "✓" : "📋"}
                      </button>
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
