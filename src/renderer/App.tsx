import React, { useState, useEffect, useCallback } from "react";
import { CalculateResult } from "@engine/types.js";
import { calculateSubnet, formatResultPlainText } from "@engine/index.js";
import { Header } from "./components/Header.js";
import { InputBar } from "./components/InputBar.js";
import { ResultCards } from "./components/ResultCards.js";
import { BitVisualizer } from "./components/BitVisualizer.js";
import { PropertiesList } from "./components/PropertiesList.js";
import { AboutModal } from "./components/AboutModal.js";

declare global {
  interface Window {
    subnetcalc?: {
      ping: () => Promise<string>;
      getAppVersion: () => Promise<string>;
      calculate: (req: any) => Promise<{ ok: boolean; data?: CalculateResult; error?: string }>;
      formatPlainText: (res: CalculateResult) => Promise<string>;
    };
  }
}

export const App: React.FC = () => {
  const [input, setInput] = useState("132.252.150.154/28");
  const [reverseDns, setReverseDns] = useState(false);
  const [geoip, setGeoip] = useState(false);
  const [uniqueLocal, setUniqueLocal] = useState(false);
  const [result, setResult] = useState<CalculateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Load history & theme from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("subnetcalc_theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
        document.documentElement.setAttribute("data-theme", savedTheme);
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
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
      window.subnetcalc.getAppVersion().then((v) => setAppVersion(v)).catch(() => {});
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("subnetcalc_theme", next);
    } catch {}
  };

  const executeCalculation = useCallback(async (targetInput: string) => {
    const clean = targetInput.trim();
    if (!clean) {
      setError("Please provide an IP address, CIDR, or hostname.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let calcRes: CalculateResult;

      if (window.subnetcalc?.calculate) {
        // Run via Electron IPC
        const res = await window.subnetcalc.calculate({
          input: clean,
          reverseDns,
          geoip,
          uniqueLocal: uniqueLocal ? "standard" : false,
        });

        if (!res.ok || !res.data) {
          throw new Error(res.error || "Calculation failed");
        }
        calcRes = res.data;
      } else {
        // Fallback directly to engine in browser/dev
        calcRes = calculateSubnet(
          {
            input: clean,
            uniqueLocal: uniqueLocal ? "standard" : false,
          },
          uniqueLocal ? new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x9a]) : undefined
        );
      }

      setResult(calcRes);

      // Update history
      setHistory((prev) => {
        const next = [clean, ...prev.filter((i) => i !== clean)].slice(0, 20);
        try {
          localStorage.setItem("subnetcalc_history", JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [reverseDns, geoip, uniqueLocal]);

  // Initial calculation on mount
  useEffect(() => {
    executeCalculation(input);
  }, []);

  const handleCopyText = async () => {
    if (!result) return;
    try {
      let text = "";
      if (window.subnetcalc?.formatPlainText) {
        text = await window.subnetcalc.formatPlainText(result);
      } else {
        text = formatResultPlainText(result);
      }
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const handleCopyJson = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
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
        onCalculate={() => executeCalculation(input)}
        onClear={() => {
          setInput("");
          setError(null);
        }}
      />

      {result && (
        <>
          <ResultCards result={result} />
          <BitVisualizer result={result} />
          <PropertiesList
            result={result}
            history={history}
            onSelectHistory={(item) => {
              setInput(item);
              executeCalculation(item);
            }}
            onCopyText={handleCopyText}
            onCopyJson={handleCopyJson}
          />
        </>
      )}

      <AboutModal
        version={appVersion}
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
};
