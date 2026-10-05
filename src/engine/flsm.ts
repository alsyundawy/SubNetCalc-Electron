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
  const subnetSize = 2 ** (32 - allocatedPrefix) >>> 0;
  const allocMask = prefixToMask32(allocatedPrefix);
  const allocMaskStr = uint32ToIPv4(allocMask);
  const wildcardStr = uint32ToIPv4(~allocMask >>> 0);

  const countToGenerate = Math.min(subnetsNeeded, 4096);
  const subnets: FLSMSubnet[] = [];

  let usableHosts = 0;
  if (allocatedPrefix <= 30) {
    usableHosts = subnetSize - 2;
  } else if (allocatedPrefix === 31) {
    usableHosts = 2;
  } else {
    usableHosts = 1;
  }

  for (let i = 0; i < countToGenerate; i++) {
    const subAddr = (networkStart + i * subnetSize) >>> 0;
    const bcastNum = (subAddr + subnetSize - 1) >>> 0;

    let firstHost = "";
    let lastHost = "";

    if (allocatedPrefix <= 30) {
      firstHost = uint32ToIPv4(subAddr + 1);
      lastHost = uint32ToIPv4(bcastNum - 1);
    } else if (allocatedPrefix === 31) {
      firstHost = uint32ToIPv4(subAddr);
      lastHost = uint32ToIPv4(bcastNum);
    } else {
      firstHost = uint32ToIPv4(subAddr);
      lastHost = uint32ToIPv4(subAddr);
    }

    subnets.push({
      index: i + 1,
      subnetId: uint32ToIPv4(subAddr),
      prefix: allocatedPrefix,
      netmask: allocMaskStr,
      wildcard: wildcardStr,
      broadcast: uint32ToIPv4(bcastNum),
      hostRange: { first: firstHost, last: lastHost },
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
