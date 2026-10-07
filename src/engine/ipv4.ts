/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/engine/ipv4.ts
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
 *   - SubnetCalc-MacOS Cloud Profiles Heritage (IPSubnetcalc.swift)
 *
 * License: MIT (SPDX: MIT)
 * Architecture: Cross-Platform (macOS Apple Silicon & Intel, Windows x64 & x86, Linux)
 * ============================================================================
 */

import { CalculateResult, PropertyItem, AddressRole } from "./types.js";
import { parseIPv4ToUint32 } from "./parse.js";
import { formatBitClassMap, formatReverseDnsZone } from "./format.js";
import { calculateCloudProfiles } from "./cloud-profile.js";

export function uint32ToIPv4(val: number): string {
  const octet1 = (val >>> 24) & 0xff;
  const octet2 = (val >>> 16) & 0xff;
  const octet3 = (val >>> 8) & 0xff;
  const octet4 = val & 0xff;
  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}

export function prefixToMask32(prefix: number): number {
  if (prefix === 0) return 0;
  if (prefix === 32) return 0xffffffff;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

export function getIPv4Bits(val: number, prefix: number) {
  let bitStr = "";
  const grouped: string[] = [];

  for (let i = 0; i < 4; i++) {
    const octet = (val >>> (24 - i * 8)) & 0xff;
    const bin = octet.toString(2).padStart(8, "0");
    grouped.push(bin);
    bitStr += bin;
  }

  const network = bitStr.substring(0, prefix);
  const host = bitStr.substring(prefix);

  return { network, host, grouped };
}

interface RoleResult {
  role: AddressRole;
  property: PropertyItem;
}

function determineIPv4Role(
  addr: number,
  network: number,
  broadcastNum: number,
  prefix: number,
  isMulticast: boolean,
  ipStr: string,
  netStr: string,
): RoleResult {
  if (isMulticast) {
    return {
      role: "multicast",
      property: { key: "Role", value: `${ipStr} is a MULTICAST address` },
    };
  }
  if (prefix === 31) {
    return {
      role: "host",
      property: {
        key: "Role",
        value: `${ipStr} is a HOST interface in ${netStr}/31 (RFC 3021 Point-to-Point)`,
      },
    };
  }
  if (prefix === 32) {
    return {
      role: "host",
      property: {
        key: "Role",
        value: `${ipStr} is a HOST address in ${ipStr}/32`,
      },
    };
  }
  if (addr === network) {
    return {
      role: "network",
      property: { key: "Role", value: `${ipStr} is a NETWORK address` },
    };
  }
  if (addr === broadcastNum) {
    return {
      role: "broadcast",
      property: {
        key: "Role",
        value: `${ipStr} is the BROADCAST address of ${netStr}/${prefix}`,
      },
    };
  }
  return {
    role: "host",
    property: {
      key: "Role",
      value: `${ipStr} is a HOST address in ${netStr}/${prefix}`,
    },
  };
}

function getIPv4ClassProperty(firstOctet: number): PropertyItem {
  if (firstOctet <= 127) {
    return { key: "Class", value: "Class A" };
  }
  if (firstOctet <= 191) {
    return { key: "Class", value: "Class B" };
  }
  if (firstOctet <= 223) {
    return { key: "Class", value: "Class C" };
  }
  if (firstOctet <= 239) {
    return { key: "Class", value: "Class D (Multicast)" };
  }
  if (firstOctet <= 255) {
    return { key: "Class", value: "Class E" };
  }
  return { key: "Class", value: "Invalid (not in class A, B, C or D)" };
}

function getIPv4MulticastProperties(
  addr: number,
  firstOctet: number,
): PropertyItem[] {
  const octet2 = (addr >>> 16) & 0xff;
  const octet3 = (addr >>> 8) & 0xff;

  let scope = "global";
  if (firstOctet === 224 && octet2 === 0 && octet3 === 0) {
    scope = "link-local";
  } else if (firstOctet === 224 && octet2 === 0 && octet3 === 1) {
    scope = "internetwork control";
  } else if (firstOctet === 239) {
    scope = "administratively scoped";
  }

  const lower23 = addr & 0x7fffff;
  const b1 = (lower23 >>> 16) & 0x7f;
  const b2 = (lower23 >>> 8) & 0xff;
  const b3 = lower23 & 0xff;
  const macStr = `01:00:5e:${b1.toString(16).padStart(2, "0")}:${b2.toString(16).padStart(2, "0")}:${b3.toString(16).padStart(2, "0")}`;

  return [
    { key: "Multicast Scope", value: scope },
    { key: "Corresponding Multicast MAC", value: macStr },
  ];
}

function getIPv4ScopeProperty(
  addr: number,
  firstOctet: number,
): PropertyItem | null {
  const octet2 = (addr >>> 16) & 0xff;
  const isPrivate =
    firstOctet === 10 ||
    (firstOctet === 172 && (octet2 & 0xf0) === 16) ||
    (firstOctet === 192 && octet2 === 168);

  if (isPrivate) {
    return { key: "Scope", value: "Private" };
  }
  if (firstOctet === 127) {
    return { key: "Scope", value: "Loopback" };
  }
  if (firstOctet === 169 && octet2 === 254) {
    return { key: "Scope", value: "Link-Local" };
  }
  if (firstOctet === 100 && (octet2 & 0xc0) === 64) {
    return { key: "Scope", value: "Shared Address Space (CGNAT)" };
  }
  return null;
}

interface HostRangeResult {
  maxHosts: string;
  hostRange: { first: string; last: string } | null;
}

function calculateIPv4HostRange(
  network: number,
  broadcastNum: number,
  prefix: number,
  isMulticast: boolean,
  ipStr: string,
  netStr: string,
  hostBits: number,
): HostRangeResult {
  if (isMulticast) {
    return { maxHosts: "0", hostRange: null };
  }
  if (prefix === 32) {
    return { maxHosts: "1", hostRange: { first: ipStr, last: ipStr } };
  }
  if (prefix === 31) {
    return {
      maxHosts: "2",
      hostRange: { first: netStr, last: uint32ToIPv4((network + 1) >>> 0) },
    };
  }
  const hostsNum = 2 ** hostBits - 2;
  return {
    maxHosts: hostsNum.toString(),
    hostRange: {
      first: uint32ToIPv4((network + 1) >>> 0),
      last: uint32ToIPv4((broadcastNum - 1) >>> 0),
    },
  };
}

export function calculateIPv4(ipStr: string, prefix: number): CalculateResult {
  const addr = parseIPv4ToUint32(ipStr);
  if (addr === null) {
    throw new Error(`Invalid IPv4 address: "${ipStr}"`);
  }
  if (prefix < 0 || prefix > 32) {
    throw new Error(`IPv4 prefix /${prefix} is out of range (0-32)`);
  }

  const mask = prefixToMask32(prefix);
  const wildcard = ~mask >>> 0;
  const network = (addr & mask) >>> 0;
  const broadcastNum = (network | wildcard) >>> 0;

  const netStr = uint32ToIPv4(network);
  const maskStr = uint32ToIPv4(mask);
  const wildcardStr = uint32ToIPv4(wildcard);
  const broadcastStr = prefix >= 31 ? null : uint32ToIPv4(broadcastNum);

  const hostBits = 32 - prefix;
  const hex = addr.toString(16).toUpperCase().padStart(8, "0");
  const bits = getIPv4Bits(addr, prefix);

  const firstOctet = (addr >>> 24) & 0xff;
  const isMulticast = firstOctet >= 224 && firstOctet <= 239;

  const { role, property: roleProp } = determineIPv4Role(
    addr,
    network,
    broadcastNum,
    prefix,
    isMulticast,
    ipStr,
    netStr,
  );

  const properties: PropertyItem[] = [
    roleProp,
    getIPv4ClassProperty(firstOctet),
  ];

  if (isMulticast) {
    properties.push(...getIPv4MulticastProperties(addr, firstOctet));
  }

  const scopeProp = getIPv4ScopeProperty(addr, firstOctet);
  if (scopeProp) {
    properties.push(scopeProp);
  }

  const { maxHosts, hostRange } = calculateIPv4HostRange(
    network,
    broadcastNum,
    prefix,
    isMulticast,
    ipStr,
    netStr,
    hostBits,
  );

  const cloudProfiles = calculateCloudProfiles(network, prefix);

  return {
    family: 4,
    address: uint32ToIPv4(addr),
    prefix,
    network: netStr,
    netmask: maskStr,
    wildcard: wildcardStr,
    broadcast: broadcastStr,
    hostBits,
    maxHosts,
    hostRange,
    hex,
    bits,
    role,
    properties,
    warnings: [],
    bitClassMap: formatBitClassMap(addr, prefix),
    reverseDnsZone: formatReverseDnsZone(uint32ToIPv4(addr), 4),
    cloudProfiles,
  };
}
