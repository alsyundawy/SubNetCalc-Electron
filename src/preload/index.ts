import { contextBridge, ipcRenderer } from "electron";
import type { CalculateRequest, CalculateResult } from "../engine/types.js";

export interface IpcResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface SubNetCalcApi {
  ping: () => Promise<string>;
  getAppVersion: () => Promise<string>;
  calculate: (req: CalculateRequest) => Promise<IpcResponse<CalculateResult>>;
  formatPlainText: (result: CalculateResult) => Promise<string>;
}

const api: SubNetCalcApi = {
  ping: () => ipcRenderer.invoke("ping"),
  getAppVersion: () => ipcRenderer.invoke("get-app-version"),
  calculate: (req: CalculateRequest) => ipcRenderer.invoke("calculate", req),
  formatPlainText: (result: CalculateResult) => ipcRenderer.invoke("format-plain-text", result),
};

contextBridge.exposeInMainWorld("subnetcalc", api);
