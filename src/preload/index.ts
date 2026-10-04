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
