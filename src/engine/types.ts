/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/engine/types.ts
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

/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/engine/types.ts
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

import type { CloudProfileInfo } from "./cloud-profile.js";

export type AddressFamily = 4 | 6;

export type AddressRole =
  "host" | "network" | "broadcast" | "multicast" | "unspecified";

export interface PropertyItem {
  key: string;
  value: string;
}

export interface BitRepresentation {
  network: string;
  host: string;
  grouped: string[];
}

export interface HostRange {
  first: string;
  last: string;
}

export interface CalculateRequest {
  input: string;
  prefix?: string;
  reverseDns?: boolean;
  geoip?: boolean;
  uniqueLocal?: false | "standard" | "hq";
}

export interface DnsInfo {
  hostname: string | null;
  error?: string;
}

export interface GeoInfo {
  country: string;
  code: string;
}

export interface CalculateResult {
  family: AddressFamily;
  address: string;
  prefix: number;
  network: string;
  netmask: string;
  wildcard: string;
  broadcast: string | null;
  hostBits: number;
  maxHosts: string;
  hostRange: HostRange | null;
  hex: string;
  bits: BitRepresentation;
  role: AddressRole;
  properties: PropertyItem[];
  dns?: DnsInfo;
  geo?: GeoInfo | null;
  warnings: string[];
  bitClassMap?: string;
  reverseDnsZone?: string;
  cloudProfiles?: CloudProfileInfo[];
}

export interface ParseResult {
  rawInput: string;
  addressString: string;
  prefix: number;
  family: AddressFamily;
  zoneIndex?: string;
}

export type {
  CloudProfileInfo,
  CloudProviderId,
  ReservedRoleItem,
} from "./cloud-profile.js";
