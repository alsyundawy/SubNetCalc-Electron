/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/renderer/components/FlsmView.tsx
 * Version: 1.1.2
 * Date & Time: 2026-10-09T10:15:00+07:00
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

import React, { useState, useId, useMemo, useEffect } from "react";
import { calculateFLSM, FLSMResult, FLSMSubnet } from "@engine/flsm.js";
import { parseSubnetInput } from "@engine/parse.js";
import { exportToCsv } from "@engine/export.js";
import { downloadCsv } from "../utils/download.js";

const DEFAULT_FLSM_NETWORK = "192.168.1.0/24"; // NOSONAR: S1313 Documentation sample subnet for interactive calculator

export const FlsmView: React.FC = () => {
  const [networkInput, setNetworkInput] = useState(DEFAULT_FLSM_NETWORK);
  const [targetPrefix, setTargetPrefix] = useState<number>(26);
  const [subnetsNeededInput, setSubnetsNeededInput] = useState<string>("4");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const baseNetworkInputId = useId();
  const subnetsSliderId = useId();
  const subnetsNumberId = useId();
  const subnetsCountId = useId();

  const parsedBase = useMemo(() => {
    try {
      const parsed = parseSubnetInput(networkInput);
      const maxPrefix = parsed.family === 4 ? 32 : 128;
      const basePrefix = Math.min(Math.max(parsed.prefix, 0), maxPrefix);
      return {
        parsed,
        basePrefix,
        maxPrefix,
        family: parsed.family,
        error: null,
      };
    } catch (err: unknown) {
      return {
        parsed: null,
        basePrefix: 0,
        maxPrefix: 32,
        family: 4 as const,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }, [networkInput]);

  // Synchronize targetPrefix and subnetsNeededInput whenever base network or family changes
  useEffect(() => {
    if (!parsedBase.parsed) return;
    setTargetPrefix((prev) => {
      if (prev < parsedBase.basePrefix || prev > parsedBase.maxPrefix) {
        const nextDef = Math.min(
          parsedBase.basePrefix + 2,
          parsedBase.maxPrefix,
        );
        const borrowed = nextDef - parsedBase.basePrefix;
        const subCount = borrowed <= 52 ? 2 ** borrowed : 2 ** 52;
        setSubnetsNeededInput(subCount.toString());
        return nextDef;
      }
      return prev;
    });
  }, [parsedBase.basePrefix, parsedBase.maxPrefix, parsedBase.parsed]);

  const { result, error } = useMemo<{
    result: FLSMResult | null;
    error: string | null;
  }>(() => {
    if (parsedBase.error) {
      return { result: null, error: parsedBase.error };
    }
    if (!parsedBase.parsed) {
      return { result: null, error: "Invalid base network" };
    }
    try {
      const res = calculateFLSM(
        parsedBase.parsed.addressString,
        parsedBase.basePrefix,
        targetPrefix,
        parsedBase.family,
        "prefix",
      );
      return { result: res, error: null };
    } catch (err: unknown) {
      return {
        result: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }, [parsedBase, targetPrefix]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number.parseInt(e.target.value, 10);
    if (!Number.isNaN(val)) {
      setTargetPrefix(val);
      const borrowed = Math.max(0, val - parsedBase.basePrefix);
      const subCount = borrowed <= 52 ? 2 ** borrowed : 2 ** 52;
      setSubnetsNeededInput(subCount.toString());
    }
  };

  const handlePrefixNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = Number.parseInt(raw, 10);
    if (
      !Number.isNaN(parsed) &&
      parsed >= parsedBase.basePrefix &&
      parsed <= parsedBase.maxPrefix
    ) {
      setTargetPrefix(parsed);
      const borrowed = Math.max(0, parsed - parsedBase.basePrefix);
      const subCount = borrowed <= 52 ? 2 ** borrowed : 2 ** 52;
      setSubnetsNeededInput(subCount.toString());
    }
  };

  const handleSubnetsNeededChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setSubnetsNeededInput(raw);
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      const borrowed = parsed === 1 ? 0 : Math.ceil(Math.log2(parsed));
      const nextPrefix = Math.min(
        parsedBase.basePrefix + borrowed,
        parsedBase.maxPrefix,
      );
      setTargetPrefix(nextPrefix);
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

      const safeBaseName = result.baseNetwork.replace(/[:.]/g, "_");
      downloadCsv(
        csv,
        `flsm_${safeBaseName}_${result.basePrefix}_to_${result.allocatedPrefix}.csv`,
      );
    } catch {
      // Ignore
    }
  };

  const handleCopySubnet = (sub: FLSMSubnet) => {
    try {
      const isV6 = sub.broadcast.startsWith("N/A");
      const text = isV6
        ? `${sub.subnetId}/${sub.prefix} (Hosts: ${sub.hostRange.first} - ${sub.hostRange.last})`
        : `${sub.subnetId}/${sub.prefix} (Hosts: ${sub.hostRange.first} - ${sub.hostRange.last}, BC: ${sub.broadcast})`;
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
            Base Network / CIDR <span className="control-label-hint">({parsedBase.family === 6 ? "IPv6: /0–/128" : "IPv4: /0–/32"})</span>:
          </label>
          <input
            id={baseNetworkInputId}
            type="text"
            className="input-text"
            value={networkInput}
            onChange={(e) => setNetworkInput(e.target.value)}
            placeholder={
              parsedBase.family === 6
                ? "e.g. 2001:db8::/64 (max /128)"
                : "e.g. 192.168.1.0/24 (max /32)"
            }
            aria-label="Base network CIDR"
          />
        </div>

        <div className="control-group subnets-slider-group">
          <label htmlFor={subnetsSliderId} className="control-label">
            Target Prefix: <strong>/{targetPrefix}</strong>{" "}
            <span className="control-label-hint">
              ({result ? result.totalSubnetsCreated : 1} subnets · borrowed {Math.max(0, targetPrefix - parsedBase.basePrefix)} bits)
            </span>
          </label>
          <div className="slider-container">
            <input
              id={subnetsSliderId}
              type="range"
              min={parsedBase.basePrefix}
              max={parsedBase.maxPrefix}
              value={targetPrefix}
              onChange={handleSliderChange}
              className="range-slider"
              aria-label={`Target subnet prefix slider (${parsedBase.basePrefix} to ${parsedBase.maxPrefix})`}
            />
            <div className="prefix-input-wrap">
              <span className="prefix-lead-slash">/</span>
              <input
                id={subnetsNumberId}
                type="number"
                min={parsedBase.basePrefix}
                max={parsedBase.maxPrefix}
                value={targetPrefix}
                onChange={handlePrefixNumberChange}
                className="input-number"
                aria-label="Target prefix direct number input"
              />
            </div>
          </div>
        </div>

        <div className="control-group subnets-count-group">
          <label htmlFor={subnetsCountId} className="control-label">
            Subnets Needed:
          </label>
          <input
            id={subnetsCountId}
            type="number"
            min="1"
            className="input-number small"
            value={subnetsNeededInput}
            onChange={handleSubnetsNeededChange}
            placeholder="e.g. 4, 16"
            aria-label="Number of subnets direct input"
          />
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
            {result.totalSubnetsCreated !== result.subnets.length && (
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-dim)",
                  padding: "4px 8px",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Showing preview of first {result.subnets.length} of {result.totalSubnetsCreated} subnets
              </div>
            )}
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
