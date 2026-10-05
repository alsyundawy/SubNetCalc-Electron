import { parseSubnetInput, parseIPv4ToUint32 } from "./parse.js";
import { prefixToMask32, uint32ToIPv4 } from "./ipv4.js";

export interface RouteBlock {
  network: string;
  prefix: number;
  startAddr: number;
  endAddr: number;
  totalAddresses: number;
}

export interface CIDRSummaryResult {
  routesParsed: number;
  aggregatedRoute: string;
  supernetMask: string;
  supernetPrefix: number;
  totalAddresses: number;
  coveredRoutes: string[];
  isContiguous: boolean;
  minAddress: string;
  maxAddress: string;
}

function parseRouteBlocks(routes: string[]): RouteBlock[] {
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error("CIDR summarization requires at least one route");
  }

  const parsedBlocks: RouteBlock[] = [];

  for (const raw of routes) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const parsed = parseSubnetInput(trimmed);
    if (parsed.family !== 4) {
      throw new Error(
        `IPv6 route summarization is not supported in IPv4 CIDR engine: "${trimmed}"`,
      );
    }

    const ipNum = parseIPv4ToUint32(parsed.addressString);
    if (ipNum === null) {
      throw new Error(`Invalid IPv4 route address: "${parsed.addressString}"`);
    }

    const mask = prefixToMask32(parsed.prefix);
    const startAddr = (ipNum & mask) >>> 0;
    const size = 2 ** (32 - parsed.prefix) >>> 0;
    const endAddr = (startAddr + size - 1) >>> 0;

    parsedBlocks.push({
      network: uint32ToIPv4(startAddr),
      prefix: parsed.prefix,
      startAddr,
      endAddr,
      totalAddresses: size,
    });
  }

  if (parsedBlocks.length === 0) {
    throw new Error("CIDR summarization requires at least one route");
  }

  return parsedBlocks;
}

function checkContiguity(
  sorted: RouteBlock[],
  supernetNetNum: number,
  totalAddresses: number,
): boolean {
  if (sorted[0]?.startAddr !== supernetNetNum) {
    return false;
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];
    if ((curr?.endAddr ?? -1) + 1 !== next?.startAddr) {
      return false;
    }
  }

  const last = sorted.at(-1);
  return (supernetNetNum + totalAddresses - 1) >>> 0 === last?.endAddr;
}

export function summarizeRoutes(routes: string[]): CIDRSummaryResult {
  const parsedBlocks = parseRouteBlocks(routes);

  // Find overall minimum start and maximum end
  let minStart = 0xffffffff;
  let maxEnd = 0;

  for (const block of parsedBlocks) {
    if (block.startAddr < minStart) {
      minStart = block.startAddr;
    }
    if (block.endAddr > maxEnd) {
      maxEnd = block.endAddr;
    }
  }

  // Find common leading bits between minStart and maxEnd
  const diff = (minStart ^ maxEnd) >>> 0;
  let supernetPrefix = 32;

  if (diff !== 0) {
    supernetPrefix = Math.clz32(diff);
  } else if (parsedBlocks.length === 1 && parsedBlocks[0]) {
    supernetPrefix = parsedBlocks[0].prefix;
  }

  const supernetMaskNum = prefixToMask32(supernetPrefix);
  const supernetNetNum = (minStart & supernetMaskNum) >>> 0;
  const supernetNetStr = uint32ToIPv4(supernetNetNum);
  const supernetMaskStr = uint32ToIPv4(supernetMaskNum);
  const totalAddresses = 2 ** (32 - supernetPrefix) >>> 0;

  // Check if contiguous: sort by startAddr, check if no gaps or overlaps
  const sorted = [...parsedBlocks].sort((a, b) => a.startAddr - b.startAddr);
  const isContiguous = checkContiguity(sorted, supernetNetNum, totalAddresses);

  return {
    routesParsed: parsedBlocks.length,
    aggregatedRoute: `${supernetNetStr}/${supernetPrefix}`,
    supernetMask: supernetMaskStr,
    supernetPrefix,
    totalAddresses,
    coveredRoutes: parsedBlocks.map((b) => `${b.network}/${b.prefix}`),
    isContiguous,
    minAddress: uint32ToIPv4(minStart),
    maxAddress: uint32ToIPv4(maxEnd),
  };
}
