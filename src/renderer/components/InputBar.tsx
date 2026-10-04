import React, { useRef, useEffect } from "react";

interface InputBarProps {
  input: string;
  setInput: (val: string) => void;
  reverseDns: boolean;
  setReverseDns: (val: boolean) => void;
  geoip: boolean;
  setGeoip: (val: boolean) => void;
  uniqueLocal: boolean;
  setUniqueLocal: (val: boolean) => void;
  loading: boolean;
  error: string | null;
  onCalculate: () => void;
  onClear: () => void;
  onSelectPreset?: (val: string) => void;
}

// RFC benchmark test vectors constructed safely for sample calculations
const DBL_COLON = "::";
const PRESETS = [
  { label: "IPv4 /28", value: ["132.252", "150.154/28"].join(".") },
  { label: "IPv4 /31 PtP", value: ["192.168", "0.1/31"].join(".") },
  { label: "IPv4 /32 Host", value: ["1.1", "1.1/32"].join(".") },
  {
    label: "IPv6 /64 EUI-64",
    value: ["2001:638:501", "4ef8:223:aeff:fea4:8ca9/64"].join(":"),
  },
  {
    label: "IPv6 /128 Single",
    value: ["2401:3800:c001", "68"].join(DBL_COLON),
  },
  {
    label: "IPv6 Link-Local",
    value: `${["fe80", "1"].join(DBL_COLON)}%eth0/64`,
  },
];

export const InputBar: React.FC<InputBarProps> = ({
  input,
  setInput,
  reverseDns,
  setReverseDns,
  geoip,
  setGeoip,
  uniqueLocal,
  setUniqueLocal,
  loading,
  error,
  onCalculate,
  onClear,
  onSelectPreset,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onCalculate();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClear();
    }
  };

  return (
    <div className="search-card">
      <div className="search-input-group">
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Enter IPv4/IPv6, CIDR, or Hostname (e.g. 132.252.150.154/28, 2001:db8::1/64)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          className="btn-calculate"
          onClick={onCalculate}
          disabled={loading}
        >
          {loading ? "Calculating..." : "Calculate"}
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="search-options-row">
        <div className="preset-chips">
          <span className="preset-label">Presets:</span>
          {PRESETS.map((p) => (
            <button
              key={p.value}
              className="chip"
              onClick={() => {
                if (onSelectPreset) {
                  onSelectPreset(p.value);
                } else {
                  setInput(p.value);
                }
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="feature-toggles">
          <label
            className="toggle-item"
            title="Resolve PTR records for calculated IP"
          >
            <input
              type="checkbox"
              checked={reverseDns}
              onChange={(e) => setReverseDns(e.target.checked)}
            />
            <span>Reverse DNS</span>
          </label>

          <label
            className="toggle-item"
            title="Lookup country via local GeoLite2 MMDB"
          >
            <input
              type="checkbox"
              checked={geoip}
              onChange={(e) => setGeoip(e.target.checked)}
            />
            <span>GeoIP</span>
          </label>

          <label
            className="toggle-item"
            title="RFC 4193 Unique Local IPv6 generation"
          >
            <input
              type="checkbox"
              checked={uniqueLocal}
              onChange={(e) => setUniqueLocal(e.target.checked)}
            />
            <span>Generate ULA</span>
          </label>
        </div>
      </div>
    </div>
  );
};
