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
  subnetsNeeded: number | string;
  borrowedBits: number;
  allocatedPrefix: number;
  totalSubnetsCreated: number | string;
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
  subnetsNeededOrTargetPrefix: number,
  mode: "subnets" | "prefix" = "subnets",
): FLSMResult {
  const baseAddr = parseIPv4ToUint32(networkInput);
  if (baseAddr === null) {
    throw new Error(`Invalid IPv4 network address: "${networkInput}"`);
  }
  if (prefix < 0 || prefix > 32) {
    throw new Error(`Prefix /${prefix} is out of range for IPv4 (0-32)`);
  }

  let allocatedPrefix: number;
  let borrowedBits: number;
  let totalSubnets: number;

  if (mode === "prefix") {
    allocatedPrefix = subnetsNeededOrTargetPrefix;
    if (
      !Number.isInteger(allocatedPrefix) ||
      allocatedPrefix < prefix ||
      allocatedPrefix > 32
    ) {
      throw new Error(
        `Target prefix /${allocatedPrefix} must be between /${prefix} and /32 for IPv4`,
      );
    }
    borrowedBits = allocatedPrefix - prefix;
    totalSubnets = 2 ** borrowedBits;
  } else {
    const subnetsNeeded = subnetsNeededOrTargetPrefix;
    if (!Number.isInteger(subnetsNeeded) || subnetsNeeded < 1) {
      throw new Error("Number of subnets needed must be at least 1");
    }

    borrowedBits =
      subnetsNeeded === 1 ? 0 : Math.ceil(Math.log2(subnetsNeeded));
    allocatedPrefix = prefix + borrowedBits;

    if (allocatedPrefix > 32) {
      throw new Error(
        `Cannot allocate ${subnetsNeeded} subnets from /${prefix}: requires /${allocatedPrefix} which exceeds 32 bits capacity (IPv4 max /32)`,
      );
    }
    totalSubnets = 2 ** borrowedBits;
  }

  const mask = prefixToMask32(prefix);
  const networkStart = (baseAddr & mask) >>> 0;
  const subnetSize =
    allocatedPrefix === 0 ? 4294967296 : (2 ** (32 - allocatedPrefix)) >>> 0;
  const allocMask = prefixToMask32(allocatedPrefix);
  const allocMaskStr = uint32ToIPv4(allocMask);
  const wildcardStr = uint32ToIPv4(~allocMask >>> 0);

  const requestedCount =
    mode === "subnets" ? subnetsNeededOrTargetPrefix : totalSubnets;
  const countToGenerate = Math.min(requestedCount, 256);
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
    subnetsNeeded:
      mode === "subnets" ? subnetsNeededOrTargetPrefix : totalSubnets,
    borrowedBits,
    allocatedPrefix,
    totalSubnetsCreated: totalSubnets,
    usableHostsPerSubnet: usableHosts,
    subnets,
  };
}

function computeIPv6HostCapacity(allocatedPrefix: number): {
  totalHostsFormatted: string;
  usableHostsFormatted: string;
} {
  if (allocatedPrefix === 128) {
    return { totalHostsFormatted: "1", usableHostsFormatted: "1" };
  }
  if (allocatedPrefix === 127) {
    return { totalHostsFormatted: "2", usableHostsFormatted: "2" };
  }
  const hostBits = 128 - allocatedPrefix;
  const totalBig =
    hostBits === 128 ? (1n << 128n) - 1n : 1n << BigInt(hostBits);
  const usableBig = totalBig - 1n; // Subtract Subnet-Router Anycast RFC 4291
  return {
    totalHostsFormatted: totalBig.toLocaleString(),
    usableHostsFormatted: usableBig.toLocaleString(),
  };
}

function computeIPv6HostRange(
  allocatedPrefix: number,
  subAddr: bigint,
  lastAddr: bigint,
): { first: string; last: string } {
  if (allocatedPrefix === 128) {
    const s = formatIPv6Canonical(subAddr);
    return { first: s, last: s };
  }
  if (allocatedPrefix === 127) {
    return {
      first: formatIPv6Canonical(subAddr),
      last: formatIPv6Canonical(lastAddr),
    };
  }
  // RFC 4291 Subnet-Router Anycast is address ::0, so first usable host is +1
  return {
    first: formatIPv6Canonical(subAddr + 1n),
    last: formatIPv6Canonical(lastAddr),
  };
}

function calculateFLSMIPv6(
  networkInput: string,
  prefix: number,
  subnetsNeededOrTargetPrefix: number,
  mode: "subnets" | "prefix" = "subnets",
): FLSMResult {
  const baseAddr = parseIPv6ToBigInt(networkInput);
  if (baseAddr === null) {
    throw new Error(`Invalid IPv6 network address: "${networkInput}"`);
  }
  if (prefix < 0 || prefix > 128) {
    throw new Error(`Prefix /${prefix} is out of range for IPv6 (0-128)`);
  }

  let allocatedPrefix: number;
  let borrowedBits: number;
  let totalSubnetsBig: bigint;

  if (mode === "prefix") {
    allocatedPrefix = subnetsNeededOrTargetPrefix;
    if (
      !Number.isInteger(allocatedPrefix) ||
      allocatedPrefix < prefix ||
      allocatedPrefix > 128
    ) {
      throw new Error(
        `Target prefix /${allocatedPrefix} must be between /${prefix} and /128 for IPv6`,
      );
    }
    borrowedBits = allocatedPrefix - prefix;
    totalSubnetsBig = 1n << BigInt(borrowedBits);
  } else {
    const subnetsNeeded = subnetsNeededOrTargetPrefix;
    if (!Number.isInteger(subnetsNeeded) || subnetsNeeded < 1) {
      throw new Error("Number of subnets needed must be at least 1");
    }
    borrowedBits =
      subnetsNeeded === 1 ? 0 : Math.ceil(Math.log2(subnetsNeeded));
    allocatedPrefix = prefix + borrowedBits;

    if (allocatedPrefix > 128) {
      throw new Error(
        `Cannot allocate ${subnetsNeeded} subnets from /${prefix}: requires /${allocatedPrefix} which exceeds 128 bits capacity`,
      );
    }
    totalSubnetsBig = 1n << BigInt(borrowedBits);
  }

  const mask = prefixToMask128(prefix);
  const networkStart = baseAddr & mask;
  const allocMask = prefixToMask128(allocatedPrefix);
  const allocMaskStr = formatIPv6Canonical(allocMask);
  const wildcardMask = ~allocMask & ((1n << 128n) - 1n);
  const wildcardStr = formatIPv6Canonical(wildcardMask);

  const hostBits = 128 - allocatedPrefix;
  const stepSize = hostBits === 128 ? 1n << 128n : 1n << BigInt(hostBits);

  const { totalHostsFormatted, usableHostsFormatted } =
    computeIPv6HostCapacity(allocatedPrefix);

  const requestedCount =
    mode === "subnets"
      ? subnetsNeededOrTargetPrefix
      : totalSubnetsBig > 256n
        ? 256
        : Number(totalSubnetsBig);
  const countToGenerate = Math.min(requestedCount, 256);
  const subnets: FLSMSubnet[] = [];

  for (let i = 0; i < countToGenerate; i++) {
    const subAddr = networkStart + BigInt(i) * stepSize;
    const lastAddr = subAddr + stepSize - 1n;
    const hostRange = computeIPv6HostRange(allocatedPrefix, subAddr, lastAddr);

    subnets.push({
      index: i + 1,
      subnetId: formatIPv6Canonical(subAddr),
      prefix: allocatedPrefix,
      netmask: allocMaskStr,
      wildcard: wildcardStr,
      broadcast: "N/A (Multicast RFC 4291)",
      hostRange,
      totalHosts: totalHostsFormatted,
      usableHosts: usableHostsFormatted,
    });
  }

  const totalSubnetsFormatted =
    totalSubnetsBig <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(totalSubnetsBig)
      : totalSubnetsBig.toLocaleString();

  return {
    family: 6,
    baseNetwork: formatIPv6Canonical(networkStart),
    basePrefix: prefix,
    subnetsNeeded:
      mode === "subnets"
        ? subnetsNeededOrTargetPrefix
        : totalSubnetsBig <= BigInt(Number.MAX_SAFE_INTEGER)
          ? Number(totalSubnetsBig)
          : totalSubnetsFormatted,
    borrowedBits,
    allocatedPrefix,
    totalSubnetsCreated: totalSubnetsFormatted,
    usableHostsPerSubnet: usableHostsFormatted,
    subnets,
  };
}

export function calculateFLSM(
  networkInput: string,
  prefix: number,
  subnetsNeededOrTargetPrefix: number,
  family?: AddressFamily,
  mode: "subnets" | "prefix" = "subnets",
): FLSMResult {
  const isV6 = family === 6 || networkInput.includes(":");
  if (isV6) {
    return calculateFLSMIPv6(
      networkInput,
      prefix,
      subnetsNeededOrTargetPrefix,
      mode,
    );
  }
  return calculateFLSMIPv4(
    networkInput,
    prefix,
    subnetsNeededOrTargetPrefix,
    mode,
  );
}
