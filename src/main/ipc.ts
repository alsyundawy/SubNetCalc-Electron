import { ipcMain, app } from "electron";
import crypto from "node:crypto";
import { CalculateRequest, CalculateResult } from "@engine/types.js";
import { calculateSubnet, parseSubnetInput, formatResultPlainText } from "@engine/index.js";
import { resolveHostnameWithTimeout, lookupReverseDns } from "./dns.js";
import { initGeoIP, lookupGeoIP } from "./geoip.js";

export type IpcResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function registerIpcHandlers(): void {
  ipcMain.handle("ping", async (): Promise<string> => {
    return "pong";
  });

  ipcMain.handle("get-app-version", async (): Promise<string> => {
    return app.getVersion();
  });

  ipcMain.handle(
    "calculate",
    async (
      _event,
      req: CalculateRequest
    ): Promise<IpcResponse<CalculateResult>> => {
      try {
        if (!req || typeof req.input !== "string" || !req.input.trim()) {
          return { ok: false, error: "Please enter a valid IP address or CIDR notation." };
        }

        // Initialize GeoIP if needed
        if (req.geoip) {
          await initGeoIP();
        }

        // Check if input is a hostname that needs resolution
        let effectiveInput = req.input.trim();
        let dnsHostname: string | null = null;
        let dnsError: string | undefined;

        // Extract address portion
        const parts = effectiveInput.split(/[\/\s]/);
        const hostPart = parts[0]!;
        const remainder = effectiveInput.substring(hostPart.length);

        const resolved = await resolveHostnameWithTimeout(hostPart);
        if (resolved && resolved.ip !== hostPart) {
          dnsHostname = hostPart;
          effectiveInput = resolved.ip + remainder;
        }

        // RNG 5 bytes for ULA if requested
        let rngBytes: Uint8Array | undefined;
        if (req.uniqueLocal) {
          rngBytes = crypto.randomBytes(5);
        }

        const result = calculateSubnet(
          {
            ...req,
            input: effectiveInput,
          },
          rngBytes
        );

        // Reverse DNS lookup if requested
        if (req.reverseDns) {
          const revName = await lookupReverseDns(result.address);
          if (revName) {
            result.dns = { hostname: revName };
          } else {
            result.dns = { hostname: dnsHostname, error: "No PTR record found or request timed out" };
          }
        } else if (dnsHostname) {
          result.dns = { hostname: dnsHostname };
        }

        // GeoIP lookup if requested
        if (req.geoip) {
          const geo = lookupGeoIP(result.address);
          if (geo) {
            result.geo = geo;
          } else {
            result.warnings.push("GeoIP MMDB database not found in userData directory");
          }
        }

        return { ok: true, data: result };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, error: message };
      }
    }
  );

  ipcMain.handle(
    "format-plain-text",
    async (_event, result: CalculateResult): Promise<string> => {
      try {
        return formatResultPlainText(result);
      } catch {
        return "";
      }
    }
  );
}
