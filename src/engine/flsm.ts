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

import { parseIPv4ToUint32 } from "./parse.js";
import { prefixToMask32, uint32ToIPv4 } from "./ipv4.js";

export interface FLSMSubnet {
  index: number;
  subnetId: string;
  prefix: number;
  netmask: string;
  wildcard: string;
  broadcast: string;
  hostRange: { first: string; last: string };
  totalHosts: number;
  usableHosts: number;
}

export interface FLSMResult {
  baseNetwork: string;
  basePrefix: number;
  subnetsNeeded: number;
  borrowedBits: number;
  allocatedPrefix: number;
  totalSubnetsCreated: number;
  usableHostsPerSubnet: number;
  subnets: FLSMSubnet[];
}

function computeUsableHosts(prefix: number, subnetSize: number): number {
  if (prefix === 0) return 4294967294;
  if (prefix <= 30) return subnetSize - 2;
  if (prefix === 31) return 2;
  return 1;
}

function computeHostRange(
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

export function calculateFLSM(
  networkInput: string,
  prefix: number,
  subnetsNeeded: number,
): FLSMResult {
  const baseAddr = parseIPv4ToUint32(networkInput);
  if (baseAddr === null) {
    throw new Error(`Invalid IPv4 network address: "${networkInput}"`);
  }
  if (prefix < 0 || prefix > 32) {
    throw new Error(`Prefix /${prefix} is out of range (0-32)`);
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
  const usableHosts = computeUsableHosts(allocatedPrefix, subnetSize);

  for (let i = 0; i < countToGenerate; i++) {
    const subAddr = (networkStart + i * subnetSize) >>> 0;
    const bcastNum =
      allocatedPrefix === 0 ? 0xffffffff : (subAddr + subnetSize - 1) >>> 0;
    const hostRange = computeHostRange(allocatedPrefix, subAddr, bcastNum);

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
