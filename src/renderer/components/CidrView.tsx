import React, { useState, useId, useMemo } from "react";
import { summarizeRoutes, CIDRSummaryResult } from "@engine/cidr.js";

const PRESET_CONTIGUOUS = `192.168.0.0/24
192.168.1.0/24
192.168.2.0/24
192.168.3.0/24`;

const PRESET_BRANCHES = `10.10.0.0/20
10.10.16.0/20
10.10.32.0/19`;

const PRESET_DISCONTIGUOUS = `172.16.1.0/24
172.16.5.0/24`;

export const CidrView: React.FC = () => {
  const [routesText, setRoutesText] = useState(PRESET_CONTIGUOUS);
  const [copied, setCopied] = useState(false);

  const routesTextareaId = useId();

  const { result, error } = useMemo<{
    result: CIDRSummaryResult | null;
    error: string | null;
  }>(() => {
    const lines = routesText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return {
        result: null,
        error: "Enter at least one IPv4 CIDR route to summarize.",
      };
    }

    try {
      const res = summarizeRoutes(lines);
      return { result: res, error: null };
    } catch (err: unknown) {
      return {
        result: null,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }, [routesText]);

  const handleCopyAggregate = () => {
    if (!result) return;
    try {
      void navigator.clipboard.writeText(result.aggregatedRoute);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="view-tab-content">
      <div className="cidr-layout">
        {/* Left Side: Route Input & Presets */}
        <div className="cidr-input-panel">
          <div className="panel-header">
            <label htmlFor={routesTextareaId} className="control-label">
              Input IPv4 Routes (one per line):
            </label>
            <div className="preset-buttons-row">
              <button
                type="button"
                className="btn-preset-sm"
                onClick={() => setRoutesText(PRESET_CONTIGUOUS)}
              >
                Contiguous 4x /24
              </button>
              <button
                type="button"
                className="btn-preset-sm"
                onClick={() => setRoutesText(PRESET_BRANCHES)}
              >
                Branch Blocks
              </button>
              <button
                type="button"
                className="btn-preset-sm"
                onClick={() => setRoutesText(PRESET_DISCONTIGUOUS)}
              >
                Gapped /24s
              </button>
            </div>
          </div>

          <textarea
            id={routesTextareaId}
            className="cidr-textarea"
            rows={10}
            value={routesText}
            onChange={(e) => setRoutesText(e.target.value)}
            placeholder="e.g.&#10;192.168.0.0/24&#10;192.168.1.0/24&#10;192.168.2.0/24"
            aria-label="Routes to summarize"
          />

          <div className="textarea-footer">
            <span className="text-dim">
              {
                routesText
                  .split("\n")
                  .map((l) => l.trim())
                  .filter(Boolean).length
              }{" "}
              routes detected
            </span>
            <button
              type="button"
              className="btn-clear-sm"
              onClick={() => setRoutesText("")}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Right Side: Summarized Result */}
        <div className="cidr-result-panel">
          {error && <div className="error-banner">{error}</div>}

          {result && (
            <div className="cidr-summary-card">
              <div className="card-badge-row">
                <span className="section-title">
                  CIDR Route Summarization Result
                </span>
                <span
                  className={`status-pill ${result.isContiguous ? "success" : "warning"}`}
                >
                  {result.isContiguous
                    ? "✓ Contiguous Block"
                    : "⚠️ Non-Contiguous (Gaps Detected)"}
                </span>
              </div>

              <div className="aggregate-route-hero">
                <div className="aggregate-route-label">
                  Minimal Aggregated Supernet Route
                </div>
                <div className="aggregate-route-display">
                  <span className="hero-route">{result.aggregatedRoute}</span>
                  <button
                    type="button"
                    className="btn-copy-hero"
                    onClick={handleCopyAggregate}
                    title="Copy aggregate route to clipboard"
                  >
                    {copied ? "✓ Copied" : "📋 Copy Route"}
                  </button>
                </div>
              </div>

              <div className="cidr-metrics-grid">
                <div className="metric-pill">
                  <span className="metric-label">Supernet Mask</span>
                  <span className="metric-val">{result.supernetMask}</span>
                </div>
                <div className="metric-pill">
                  <span className="metric-label">Supernet Prefix</span>
                  <span className="metric-val">/{result.supernetPrefix}</span>
                </div>
                <div className="metric-pill">
                  <span className="metric-label">Total Supernet Addrs</span>
                  <span className="metric-val highlight">
                    {result.totalAddresses.toLocaleString()}
                  </span>
                </div>
                <div className="metric-pill">
                  <span className="metric-label">Spanned Address Range</span>
                  <span
                    className="metric-val"
                    style={{ fontSize: "11px", wordBreak: "break-all" }}
                  >
                    {result.minAddress} - {result.maxAddress}
                  </span>
                </div>
              </div>

              <div className="covered-routes-list">
                <div className="covered-routes-title">
                  Covered Input Routes ({result.coveredRoutes.length}):
                </div>
                <div className="routes-pills-wrap">
                  {result.coveredRoutes.map((r, i) => (
                    <span key={`${r}-${i}`} className="route-tag">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
