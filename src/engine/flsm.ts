/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/engine/flsm.ts
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

import { parseIPv4ToUint32, parseIPv6ToBigInt } from "./parse.js";
import { prefixToMask32, uint32ToIPv4 } from "./ipv4.js";
import { prefixToMask128, formatIPv6Canonical } from "./ipv6.js";
import type { AddressFamily } from "./types.js";

export interface FLSMSubnet {
  index: number;
  subnetId: string;
  prefix: number;
  netmask: string;
  wildcard: string;
  broadcast: string;
  hostRange: { first: string; last: string };
  totalHosts: number | string;
  usableHosts: number | string;
}

export interface FLSMResult {
  family: AddressFamily;
  baseNetwork: string;
  basePrefix: number;
  subnetsNeeded: number;
  borrowedBits: number;
  allocatedPrefix: number;
  totalSubnetsCreated: number;
  usableHostsPerSubnet: number | string;
  subnets: FLSMSubnet[];
}

function computeUsableHostsV4(prefix: number, subnetSize: number): number {
  if (prefix === 0) return 4294967294;
  if (prefix <= 30) return subnetSize - 2;
  if (prefix === 31) return 2;
  return 1;
}

function computeHostRangeV4(
  prefix: number,
  subAddr: number,
  bcastNum: number,
): { first: string; last: string } {
  if (prefix <= 30) {
    return {
      first: uint32ToIPv4(subAddr + 1),
      last: uint32ToIPv4(bcastNum - 1),
    };
  }
  if (prefix === 31) {
    return {
      first: uint32ToIPv4(subAddr),
      last: uint32ToIPv4(bcastNum),
    };
  }
  return {
    first: uint32ToIPv4(subAddr),
    last: uint32ToIPv4(subAddr),
  };
}

function calculateFLSMIPv4(
  networkInput: string,
  prefix: number,
  subnetsNeeded: number,
): FLSMResult {
  const baseAddr = parseIPv4ToUint32(networkInput);
  if (baseAddr === null) {
    throw new Error(`Invalid IPv4 network address: "${networkInput}"`);
  }
  if (prefix < 0 || prefix > 32) {
    throw new Error(`Prefix /${prefix} is out of range for IPv4 (0-32)`);
  }
  if (!Number.isInteger(subnetsNeeded) || subnetsNeeded < 1) {
    throw new Error("Number of subnets needed must be at least 1");
  }

  // Compute borrowed bits
  const borrowedBits =
    subnetsNeeded === 1 ? 0 : Math.ceil(Math.log2(subnetsNeeded));
  const allocatedPrefix = prefix + borrowedBits;

  if (allocatedPrefix > 32) {
    throw new Error(
      `Cannot allocate ${subnetsNeeded} subnets from /${prefix}: requires /${allocatedPrefix} which exceeds 32 bits capacity`,
    );
  }

  const mask = prefixToMask32(prefix);
  const networkStart = (baseAddr & mask) >>> 0;
  const subnetSize =
    allocatedPrefix === 0 ? 4294967296 : (2 ** (32 - allocatedPrefix)) >>> 0;
  const allocMask = prefixToMask32(allocatedPrefix);
  const allocMaskStr = uint32ToIPv4(allocMask);
  const wildcardStr = uint32ToIPv4(~allocMask >>> 0);

  const countToGenerate = Math.min(subnetsNeeded, 4096);
  const subnets: FLSMSubnet[] = [];
  const usableHosts = computeUsableHostsV4(allocatedPrefix, subnetSize);

  for (let i = 0; i < countToGenerate; i++) {
    const subAddr = (networkStart + i * subnetSize) >>> 0;
    const bcastNum =
      allocatedPrefix === 0 ? 0xffffffff : (subAddr + subnetSize - 1) >>> 0;
    const hostRange = computeHostRangeV4(allocatedPrefix, subAddr, bcastNum);

    subnets.push({
      index: i + 1,
      subnetId: uint32ToIPv4(subAddr),
      prefix: allocatedPrefix,
      netmask: allocMaskStr,
      wildcard: wildcardStr,
      broadcast: uint32ToIPv4(bcastNum),
      hostRange,
      totalHosts: subnetSize,
      usableHosts,
    });
  }

  return {
    family: 4,
    baseNetwork: uint32ToIPv4(networkStart),
    basePrefix: prefix,
    subnetsNeeded,
    borrowedBits,
    allocatedPrefix,
    totalSubnetsCreated: subnets.length,
    usableHostsPerSubnet: usableHosts,
    subnets,
  };
}

function calculateFLSMIPv6(
  networkInput: string,
  prefix: number,
  subnetsNeeded: number,
): FLSMResult {
  const baseAddr = parseIPv6ToBigInt(networkInput);
  if (baseAddr === null) {
    throw new Error(`Invalid IPv6 network address: "${networkInput}"`);
  }
  if (prefix < 0 || prefix > 128) {
    throw new Error(`Prefix /${prefix} is out of range for IPv6 (0-128)`);
  }
  if (!Number.isInteger(subnetsNeeded) || subnetsNeeded < 1) {
    throw new Error("Number of subnets needed must be at least 1");
  }

  const borrowedBits =
    subnetsNeeded === 1 ? 0 : Math.ceil(Math.log2(subnetsNeeded));
  const allocatedPrefix = prefix + borrowedBits;

  if (allocatedPrefix > 128) {
    throw new Error(
      `Cannot allocate ${subnetsNeeded} subnets from /${prefix}: requires /${allocatedPrefix} which exceeds 128 bits capacity`,
    );
  }

  const mask = prefixToMask128(prefix);
  const networkStart = baseAddr & mask;
  const allocMask = prefixToMask128(allocatedPrefix);
  const allocMaskStr = formatIPv6Canonical(allocMask);
  const wildcardMask = ~allocMask & ((1n << 128n) - 1n);
  const wildcardStr = formatIPv6Canonical(wildcardMask);

  const hostBits = 128 - allocatedPrefix;
  const stepSize = hostBits === 128 ? 1n << 128n : 1n << BigInt(hostBits);

  let totalHostsFormatted: string;
  let usableHostsFormatted: string;

  if (allocatedPrefix === 128) {
    totalHostsFormatted = "1";
    usableHostsFormatted = "1";
  } else if (allocatedPrefix === 127) {
    totalHostsFormatted = "2";
    usableHostsFormatted = "2";
  } else {
    const totalBig =
      hostBits === 128 ? (1n << 128n) - 1n : 1n << BigInt(hostBits);
    const usableBig = totalBig - 1n; // Subtract Subnet-Router Anycast RFC 4291
    totalHostsFormatted = totalBig.toLocaleString();
    usableHostsFormatted = usableBig.toLocaleString();
  }

  const countToGenerate = Math.min(subnetsNeeded, 4096);
  const subnets: FLSMSubnet[] = [];

  for (let i = 0; i < countToGenerate; i++) {
    const subAddr = networkStart + BigInt(i) * stepSize;
    const lastAddr = subAddr + stepSize - 1n;

    let firstHostStr: string;
    let lastHostStr: string;

    if (allocatedPrefix === 128) {
      firstHostStr = formatIPv6Canonical(subAddr);
      lastHostStr = firstHostStr;
    } else if (allocatedPrefix === 127) {
      firstHostStr = formatIPv6Canonical(subAddr);
      lastHostStr = formatIPv6Canonical(lastAddr);
    } else {
      // RFC 4291 Subnet-Router Anycast is address ::0, so first usable host is +1
      firstHostStr = formatIPv6Canonical(subAddr + 1n);
      lastHostStr = formatIPv6Canonical(lastAddr);
    }

    subnets.push({
      index: i + 1,
      subnetId: formatIPv6Canonical(subAddr),
      prefix: allocatedPrefix,
      netmask: allocMaskStr,
      wildcard: wildcardStr,
      broadcast: "N/A (Multicast RFC 4291)",
      hostRange: {
        first: firstHostStr,
        last: lastHostStr,
      },
      totalHosts: totalHostsFormatted,
      usableHosts: usableHostsFormatted,
    });
  }

  return {
    family: 6,
    baseNetwork: formatIPv6Canonical(networkStart),
    basePrefix: prefix,
    subnetsNeeded,
    borrowedBits,
    allocatedPrefix,
    totalSubnetsCreated: subnets.length,
    usableHostsPerSubnet: usableHostsFormatted,
    subnets,
  };
}

export function calculateFLSM(
  networkInput: string,
  prefix: number,
  subnetsNeeded: number,
  family?: AddressFamily,
): FLSMResult {
  const isV6 = family === 6 || networkInput.includes(":");
  if (isV6) {
    return calculateFLSMIPv6(networkInput, prefix, subnetsNeeded);
  }
  return calculateFLSMIPv4(networkInput, prefix, subnetsNeeded);
}
