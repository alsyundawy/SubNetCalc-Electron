/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/preload/index.ts
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

import { contextBridge, ipcRenderer } from "electron";
import type { GeoInfo } from "../engine/types.js";

export interface ResolvedHostInfo {
  ip: string;
  family: 4 | 6;
  originalName: string;
}

export interface SubNetCalcApi {
  getAppVersion: () => Promise<string>;
  resolveHostname: (
    hostname: string,
    preferredFamily?: 4 | 6,
  ) => Promise<ResolvedHostInfo | null>;
  lookupReverseDns: (ipStr: string) => Promise<string | null>;
  lookupGeoIP: (ipStr: string) => Promise<GeoInfo | null>;
  getRandomBytes: (length: number) => Promise<number[]>;
}

const api: SubNetCalcApi = {
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  resolveHostname: (hostname, preferredFamily = 4) =>
    ipcRenderer.invoke("resolve-hostname", hostname, preferredFamily),
  lookupReverseDns: (ipStr) => ipcRenderer.invoke("lookup-reverse-dns", ipStr),
  lookupGeoIP: (ipStr) => ipcRenderer.invoke("lookup-geoip", ipStr),
  getRandomBytes: (length) => ipcRenderer.invoke("get-random-bytes", length),
};

contextBridge.exposeInMainWorld("subnetcalc", api);
