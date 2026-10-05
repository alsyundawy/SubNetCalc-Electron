import { parseIPv4ToUint32 } from "./parse.js";
import { prefixToMask32, uint32ToIPv4 } from "./ipv4.js";

export interface VLSMRequirement {
  name: string;
  hostsNeeded: number;
}

export interface VLSMAllocation {
  name: string;
  hostsNeeded: number;
  allocatedHosts: number;
  usableHosts: number;
  subnetId: string;
  prefix: number;
  netmask: string;
  wildcard: string;
  broadcast: string;
  hostRange: { first: string; last: string };
  wastedHosts: number;
}

export interface VLSMResult {
  baseNetwork: string;
  basePrefix: number;
  totalCapacity: number;
  totalAllocated: number;
  totalNeeded: number;
  unallocatedHosts: number;
  utilizationPercent: number;
  allocations: VLSMAllocation[];
}

function validateVLSMInputs(
  networkInput: string,
  prefix: number,
  subnets: VLSMRequirement[],
): number {
  const baseAddr = parseIPv4ToUint32(networkInput);
  if (baseAddr === null) {
    throw new Error(`Invalid IPv4 network address: "${networkInput}"`);
  }
  if (prefix < 0 || prefix > 32) {
    throw new Error(`Prefix /${prefix} is out of range (0-32)`);
  }
  if (!Array.isArray(subnets) || subnets.length === 0) {
    throw new Error("VLSM requires at least one subnet requirement");
  }

  for (const req of subnets) {
    if (!req.name || typeof req.name !== "string") {
      throw new Error("Subnet requirement name must be a non-empty string");
    }
    if (!Number.isInteger(req.hostsNeeded) || req.hostsNeeded < 1) {
      throw new Error(`Subnet "${req.name}" must require at least 1 host`);
    }
  }

  return baseAddr;
}

function computeAllocationBlock(hostsNeeded: number): {
  allocPrefix: number;
  blockSize: number;
} {
  const neededWithOverhead = hostsNeeded + 2;
  const power = Math.ceil(Math.log2(Math.max(neededWithOverhead, 4)));
  const allocPrefix = 32 - power;
  const blockSize = 2 ** power >>> 0;
  return { allocPrefix, blockSize };
}

function computeHostRange(
  allocPrefix: number,
  subAddr: number,
  bcastNum: number,
  blockSize: number,
): { usable: number; firstHost: string; lastHost: string } {
  if (allocPrefix <= 30) {
    return {
      usable: blockSize - 2,
      firstHost: uint32ToIPv4(subAddr + 1),
      lastHost: uint32ToIPv4(bcastNum - 1),
    };
  }
  if (allocPrefix === 31) {
    return {
      usable: 2,
      firstHost: uint32ToIPv4(subAddr),
      lastHost: uint32ToIPv4(bcastNum),
    };
  }
  return {
    usable: 1,
    firstHost: uint32ToIPv4(subAddr),
    lastHost: uint32ToIPv4(subAddr),
  };
}

export function calculateVLSM(
  networkInput: string,
  prefix: number,
  subnets: VLSMRequirement[],
): VLSMResult {
  const baseAddr = validateVLSMInputs(networkInput, prefix, subnets);
  const sorted = [...subnets].sort((a, b) => b.hostsNeeded - a.hostsNeeded);

  const parentMask = prefixToMask32(prefix);
  const baseNet = (baseAddr & parentMask) >>> 0;
  const totalCapacity = 2 ** (32 - prefix) >>> 0;
  const parentEnd = (baseNet + totalCapacity) >>> 0;

  let cursor = baseNet;
  let totalNeeded = 0;
  let totalAllocated = 0;
  const allocations: VLSMAllocation[] = [];

  for (const req of sorted) {
    totalNeeded += req.hostsNeeded;

    const { allocPrefix, blockSize } = computeAllocationBlock(req.hostsNeeded);

    // Verify alignment
    if (cursor % blockSize !== 0) {
      const rem = cursor % blockSize;
      cursor = (cursor + (blockSize - rem)) >>> 0;
    }

    if (cursor + blockSize > parentEnd || cursor < baseNet) {
      throw new Error(
        `Total requirements exceeds parent network capacity: cannot allocate ${blockSize} addresses for "${req.name}" within /${prefix} (${totalCapacity} total addresses)`,
      );
    }

    const subAddr = cursor;
    const bcastNum = (subAddr + blockSize - 1) >>> 0;
    const mask = prefixToMask32(allocPrefix);
    const maskStr = uint32ToIPv4(mask);
    const wildcardStr = uint32ToIPv4(~mask >>> 0);

    const { usable, firstHost, lastHost } = computeHostRange(
      allocPrefix,
      subAddr,
      bcastNum,
      blockSize,
    );
    const wasted = Math.max(0, usable - req.hostsNeeded);

    allocations.push({
      name: req.name,
      hostsNeeded: req.hostsNeeded,
      allocatedHosts: blockSize,
      usableHosts: usable,
      subnetId: uint32ToIPv4(subAddr),
      prefix: allocPrefix,
      netmask: maskStr,
      wildcard: wildcardStr,
      broadcast: uint32ToIPv4(bcastNum),
      hostRange: { first: firstHost, last: lastHost },
      wastedHosts: wasted,
    });

    totalAllocated += blockSize;
    cursor = (cursor + blockSize) >>> 0;
  }

  const unallocatedHosts = Math.max(0, totalCapacity - totalAllocated);
  const utilizationPercent =
    totalCapacity > 0
      ? Number(((totalAllocated / totalCapacity) * 100).toFixed(2))
      : 0;

  return {
    baseNetwork: uint32ToIPv4(baseNet),
    basePrefix: prefix,
    totalCapacity,
    totalAllocated,
    totalNeeded,
    unallocatedHosts,
    utilizationPercent,
    allocations,
  };
}
