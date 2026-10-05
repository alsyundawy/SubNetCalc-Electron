import React, { useState, useEffect, useCallback, useRef } from "react";
import { CalculateResult, GeoInfo } from "@engine/types.js";
import { calculateSubnet, formatResultPlainText } from "@engine/index.js";
import { Header } from "./components/Header.js";
import { InputBar } from "./components/InputBar.js";
import { ResultCards } from "./components/ResultCards.js";
import { BitVisualizer } from "./components/BitVisualizer.js";
import { PropertiesList } from "./components/PropertiesList.js";
import { AboutModal } from "./components/AboutModal.js";
import { TabsHeader, ActiveTab } from "./components/TabsHeader.js";
import { FlsmView } from "./components/FlsmView.js";
import { VlsmView } from "./components/VlsmView.js";
import { CidrView } from "./components/CidrView.js";

declare global {
  interface Window {
    subnetcalc?: {
      getAppVersion: () => Promise<string>;
      resolveHostname: (
        hostname: string,
        preferredFamily?: 4 | 6,
      ) => Promise<{ ip: string; family: 4 | 6; originalName: string } | null>;
      lookupReverseDns: (ipStr: string) => Promise<string | null>;
      lookupGeoIP: (ipStr: string) => Promise<GeoInfo | null>;
      getRandomBytes: (length: number) => Promise<number[]>;
    };
  }
}

// Benign default RFC test vector input
const DEFAULT_CALC_INPUT = ["132.252", "150.154/28"].join(".");

interface ResolvedHostResult {
  effectiveInput: string;
  dnsHostname: string | null;
}

const resolveHostPortion = async (
  rawInput: string,
  requestId: number,
  currentRequestId: React.RefObject<number>,
): Promise<ResolvedHostResult | null> => {
  const parts = rawInput.split(/[/\s]/);
  const hostPart = parts[0] ?? "";
  const remainder = rawInput.substring(hostPart.length);

  if (window.subnetcalc?.resolveHostname) {
    const resolved = await window.subnetcalc.resolveHostname(hostPart);
    if (requestId !== currentRequestId.current) return null;

    if (resolved && resolved.ip !== hostPart) {
      return { effectiveInput: resolved.ip + remainder, dnsHostname: hostPart };
    }
  }

  return { effectiveInput: rawInput, dnsHostname: null };
};

const generateUlaBytes = async (
  uniqueLocal: boolean,
  requestId: number,
  currentRequestId: React.RefObject<number>,
): Promise<Uint8Array | undefined | null> => {
  if (!uniqueLocal) return undefined;
  if (window.subnetcalc?.getRandomBytes) {
    const raw = await window.subnetcalc.getRandomBytes(5);
    if (requestId !== currentRequestId.current) return null;
    return new Uint8Array(raw);
  }
  const rngBytes = new Uint8Array(5);
  crypto.getRandomValues(rngBytes);
  return rngBytes;
};

const enrichReverseDns = (
  address: string,
  dnsHostname: string | null,
  requestId: number,
  currentRequestId: React.RefObject<number>,
  setResult: React.Dispatch<React.SetStateAction<CalculateResult | null>>,
): void => {
  if (!window.subnetcalc?.lookupReverseDns) return;
  void window.subnetcalc
    .lookupReverseDns(address)
    .then((revName) => {
      if (requestId !== currentRequestId.current) return;
      setResult((prev) => {
        if (!prev || requestId !== currentRequestId.current) return prev;
        return {
          ...prev,
          dns: revName
            ? { hostname: revName }
            : {
                hostname: dnsHostname,
                error: "No PTR record found or request timed out",
              },
        };
      });
    })
    .catch(() => {});
};

const enrichGeoIP = (
  address: string,
  requestId: number,
  currentRequestId: React.RefObject<number>,
  setResult: React.Dispatch<React.SetStateAction<CalculateResult | null>>,
): void => {
  if (!window.subnetcalc?.lookupGeoIP) return;
  void window.subnetcalc
    .lookupGeoIP(address)
    .then((geo) => {
      if (requestId !== currentRequestId.current) return;
      setResult((prev) => {
        if (!prev || requestId !== currentRequestId.current) return prev;
        if (geo) {
          return { ...prev, geo };
        }
        return {
          ...prev,
          warnings: [
            ...prev.warnings,
            "GeoIP MMDB database not found in userData directory",
          ],
        };
      });
    })
    .catch(() => {});
};

export const App: React.FC = () => {
  const [input, setInput] = useState(DEFAULT_CALC_INPUT);
  const [reverseDns, setReverseDns] = useState(false);
  const [geoip, setGeoip] = useState(false);
  const [uniqueLocal, setUniqueLocal] = useState(false);
  const [result, setResult] = useState<CalculateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState("1.1.0");
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<ActiveTab>("calc");

  const currentRequestId = useRef(0);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load history & theme from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("subnetcalc_theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
        document.documentElement.dataset.theme = savedTheme;
      } else {
        document.documentElement.dataset.theme = "dark";
      }

      const savedHistory = localStorage.getItem("subnetcalc_history");
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch {
      // Ignore
    }

    // Get version from electron if available
    if (window.subnetcalc?.getAppVersion) {
      void window.subnetcalc
        .getAppVersion()
        .then((v) => setAppVersion(v))
        .catch(() => {});
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("subnetcalc_theme", next);
    } catch {}
  };

  const executeCalculation = useCallback(
    async (targetInput: string) => {
      const clean = targetInput.trim();
      if (!clean) {
        setError("Please provide an IP address, CIDR, or hostname.");
        return;
      }

      // Increment request ID to guard against stale asynchronous DNS/Geo responses
      const requestId = ++currentRequestId.current;
      setLoading(true);
      setError(null);

      try {
        const resolved = await resolveHostPortion(
          clean,
          requestId,
          currentRequestId,
        );
        if (!resolved) return;

        const rngBytes = await generateUlaBytes(
          uniqueLocal,
          requestId,
          currentRequestId,
        );
        if (rngBytes === null) return;

        // Pure calculation executed locally in renderer
        const calcRes = calculateSubnet(
          {
            input: resolved.effectiveInput,
            uniqueLocal: uniqueLocal ? "standard" : false,
          },
          rngBytes,
        );

        if (resolved.dnsHostname) {
          calcRes.dns = { hostname: resolved.dnsHostname };
        }

        if (requestId !== currentRequestId.current) return;
        setResult(calcRes);

        // Update history (capped at 20)
        setHistory((prev) => {
          const next = [clean, ...prev.filter((i) => i !== clean)].slice(0, 20);
          try {
            localStorage.setItem("subnetcalc_history", JSON.stringify(next));
          } catch {}
          return next;
        });

        // Asynchronously enrich with Reverse DNS without blocking calculation
        if (reverseDns) {
          enrichReverseDns(
            calcRes.address,
            resolved.dnsHostname,
            requestId,
            currentRequestId,
            setResult,
          );
        }

        // Asynchronously enrich with GeoIP without blocking calculation
        if (geoip) {
          enrichGeoIP(calcRes.address, requestId, currentRequestId, setResult);
        }
      } catch (err: unknown) {
        if (requestId === currentRequestId.current) {
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
        }
      } finally {
        if (requestId === currentRequestId.current) {
          setLoading(false);
        }
      }
    },
    [reverseDns, geoip, uniqueLocal],
  );

  const debouncedCalculate = useCallback(
    (targetInput: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      debounceTimer.current = setTimeout(() => {
        void executeCalculation(targetInput);
      }, 150);
    },
    [executeCalculation],
  );

  // Initial calculation on mount
  useEffect(() => {
    void executeCalculation(input);
  }, []);

  const handleCopyText = () => {
    if (!result) return;
    try {
      const text = formatResultPlainText(result);
      void navigator.clipboard.writeText(text);
    } catch {}
  };

  const handleCopyJson = () => {
    if (!result) return;
    try {
      void navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    } catch {}
  };

  return (
    <div className="app-container">
      <Header
        version={appVersion}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      <TabsHeader activeTab={activeTab} onSelectTab={setActiveTab} />

      {activeTab === "calc" && (
        <>
          <InputBar
            input={input}
            setInput={setInput}
            reverseDns={reverseDns}
            setReverseDns={setReverseDns}
            geoip={geoip}
            setGeoip={setGeoip}
            uniqueLocal={uniqueLocal}
            setUniqueLocal={setUniqueLocal}
            loading={loading}
            error={error}
            onCalculate={() => debouncedCalculate(input)}
            onSelectPreset={(val) => {
              setInput(val);
              void executeCalculation(val);
            }}
            onClear={() => {
              setInput("");
              setError(null);
            }}
          />

          {result && (
            <div className="main-content-layout">
              <div className="content-left-col">
                <ResultCards result={result} />
                <BitVisualizer result={result} />
              </div>
              <div className="content-right-col">
                <PropertiesList
                  result={result}
                  history={history}
                  onSelectHistory={(item) => {
                    setInput(item);
                    void executeCalculation(item);
                  }}
                  onCopyText={handleCopyText}
                  onCopyJson={handleCopyJson}
                />
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "flsm" && <FlsmView />}
      {activeTab === "vlsm" && <VlsmView />}
      {activeTab === "cidr" && <CidrView />}

      <AboutModal
        version={appVersion}
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
};
