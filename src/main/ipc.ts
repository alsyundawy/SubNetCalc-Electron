import { ipcMain, app } from "electron";
import crypto from "node:crypto";
import { GeoInfo } from "@engine/types.js";
import {
  resolveHostnameWithTimeout,
  lookupReverseDns,
  ResolvedHost,
} from "./dns.js";
import { initGeoIP, lookupGeoIP } from "./geoip.js";

/**
 * Registers low-footprint IPC handlers once during application startup.
 * Pure calculations and plain text formatting execute locally in the renderer,
 * leaving IPC exclusively for system, network, and native crypto capabilities.
 */
export function registerIpcHandlers(): void {
  ipcMain.handle("get-app-version", (): string => {
    return app.getVersion();
  });

  ipcMain.handle(
    "resolve-hostname",
    async (
      _event,
      hostname: string,
      preferredFamily: 4 | 6 = 4,
    ): Promise<ResolvedHost | null> => {
      if (!hostname || typeof hostname !== "string") return null;
      return resolveHostnameWithTimeout(hostname, preferredFamily);
    },
  );

  ipcMain.handle(
    "lookup-reverse-dns",
    async (_event, ipStr: string): Promise<string | null> => {
      if (!ipStr || typeof ipStr !== "string") return null;
      return lookupReverseDns(ipStr);
    },
  );

  ipcMain.handle(
    "lookup-geoip",
    async (_event, ipStr: string): Promise<GeoInfo | null> => {
      if (!ipStr || typeof ipStr !== "string") return null;
      await initGeoIP();
      return lookupGeoIP(ipStr);
    },
  );

  ipcMain.handle("get-random-bytes", (_event, length: number): number[] => {
    const len = Math.min(Math.max(1, length || 5), 64);
    return Array.from(crypto.randomBytes(len));
  });
}
