import { AddressFamily, ParseResult } from "./types.js";

// Helper: check if a 32-bit unsigned number is contiguous bitmask (1s followed by 0s)
export function isContiguousMask32(val: number): {
  valid: boolean;
  prefix: number;
} {
  // If val is 0, prefix is 0
  if (val === 0) return { valid: true, prefix: 0 };

  // In 32-bit uint: ~val + 1 should be a power of 2 (i.e. (n & (n - 1)) === 0)
  // where n is the inverted mask + 1 in unsigned 32-bit
  const inv = ~val >>> 0;
  if (((inv + 1) & inv) === 0) {
    // Count leading ones
    let count = 0;
    for (let i = 31; i >= 0; i--) {
      if ((val & (1 << i)) !== 0) {
        count++;
      } else {
        break;
      }
    }
    return { valid: true, prefix: count };
  }
  return { valid: false, prefix: -1 };
}

// Helper: check if 128-bit BigInt is contiguous bitmask
export function isContiguousMask128(val: bigint): {
  valid: boolean;
  prefix: number;
} {
  if (val === 0n) return { valid: true, prefix: 0 };
  const mask128 = (1n << 128n) - 1n;
  if (val < 0n || val > mask128) return { valid: false, prefix: -1 };

  const inv = ~val & mask128;
  if (((inv + 1n) & inv) === 0n) {
    let count = 0;
    for (let i = 127n; i >= 0n; i--) {
      if ((val & (1n << i)) !== 0n) {
        count++;
      } else {
        break;
      }
    }
    return { valid: true, prefix: count };
  }
  return { valid: false, prefix: -1 };
}

export function parseIPv4ToUint32(ipStr: string): number | null {
  const parts = ipStr.trim().split(".");
  if (parts.length !== 4) return null;
  let res = 0;
  for (let i = 0; i < 4; i++) {
    const p = parts[i];
    if (!p || !/^\d+$/.test(p)) return null;
    const num = Number.parseInt(p, 10);
    if (num < 0 || num > 255) return null;
    // Check leading zero for numbers > 0 (e.g. 01 is invalid in standard strict dotted decimal)
    if (p.length > 1 && p.startsWith("0")) return null;
    res = ((res << 8) | num) >>> 0;
  }
  return res;
}

function expandIPv4Mapped(str: string): string | null {
  const lastColon = str.lastIndexOf(":");
  if (lastColon === -1) return str;
  const after = str.substring(lastColon + 1);
  if (!after.includes(".")) return str;
  const v4Val = parseIPv4ToUint32(after);
  if (v4Val === null) return null;
  const hex1 = ((v4Val >>> 16) & 0xffff).toString(16);
  const hex2 = (v4Val & 0xffff).toString(16);
  return str.substring(0, lastColon + 1) + hex1 + ":" + hex2;
}

function expandIPv6Hextets(str: string): string[] | null {
  const doubleColonCount = (str.match(/::/g) || []).length;
  if (doubleColonCount > 1) return null;

  if (doubleColonCount === 1) {
    const [left, right] = str.split("::");
    const leftParts = left ? left.split(":") : [];
    const rightParts = right ? right.split(":") : [];
    const missing = 8 - (leftParts.length + rightParts.length);
    if (missing < 1) return null;
    return [
      ...leftParts,
      ...Array.from({ length: missing }, () => "0"),
      ...rightParts,
    ];
  }

  const parts = str.split(":");
  return parts.length === 8 ? parts : null;
}

export function parseIPv6ToBigInt(ipStr: string): bigint | null {
  let str = ipStr.trim().toLowerCase();
  // Strip zone index if present
  const pctIdx = str.indexOf("%");
  if (pctIdx !== -1) {
    str = str.substring(0, pctIdx);
  }

  const expanded = expandIPv4Mapped(str);
  if (expanded === null) return null;

  const parts = expandIPv6Hextets(expanded);
  if (parts?.length !== 8) return null;

  let res = 0n;
  for (const part of parts) {
    if (!part || !/^[0-9a-fA-F]{1,4}$/.test(part)) return null;
    const val = BigInt(Number.parseInt(part, 16));
    res = (res << 16n) | val;
  }
  return res;
}

export function detectFamily(addrStr: string): AddressFamily | null {
  if (addrStr.includes(":")) {
    return 6;
  }
  if (addrStr.includes(".")) {
    return 4;
  }
  return null;
}

function splitAddressAndMask(
  trimmed: string,
  explicitPrefix?: string,
): { addressPart: string; maskPart?: string } {
  if (explicitPrefix?.trim()) {
    return { addressPart: trimmed, maskPart: explicitPrefix.trim() };
  }
  if (trimmed.includes("/")) {
    const slashParts = trimmed.split("/");
    if (slashParts.length > 2) {
      throw new Error("Invalid format: multiple / characters");
    }
    return {
      addressPart: (slashParts[0] ?? "").trim(),
      maskPart: slashParts[1]?.trim(),
    };
  }
  const spaceParts = trimmed.split(/\s+/);
  if (spaceParts.length >= 2) {
    return {
      addressPart: (spaceParts[0] ?? "").trim(),
      maskPart: spaceParts.slice(1).join(" ").trim(),
    };
  }
  return { addressPart: trimmed };
}

function parseNumericPrefix(maskPart: string, family: AddressFamily): number {
  const num = Number.parseInt(maskPart, 10);
  const max = family === 4 ? 32 : 128;
  if (num < 0 || num > max) {
    throw new Error(
      `IPv${family} prefix /${num} is out of range (must be between 0 and ${max})`,
    );
  }
  return num;
}

function parseNetmaskPrefix(maskPart: string, family: AddressFamily): number {
  if (family === 4) {
    const u32 = parseIPv4ToUint32(maskPart);
    if (u32 === null) {
      throw new Error(`Invalid IPv4 netmask: "${maskPart}"`);
    }
    const check = isContiguousMask32(u32);
    if (!check.valid) {
      throw new Error(
        `Non-contiguous IPv4 netmask is not allowed: "${maskPart}"`,
      );
    }
    return check.prefix;
  }

  const u128 = parseIPv6ToBigInt(maskPart);
  if (u128 === null) {
    throw new Error(`Invalid IPv6 netmask: "${maskPart}"`);
  }
  const check = isContiguousMask128(u128);
  if (!check.valid) {
    throw new Error(
      `Non-contiguous IPv6 netmask is not allowed: "${maskPart}"`,
    );
  }
  return check.prefix;
}

function resolveMaskPrefix(
  maskPart: string | undefined,
  family: AddressFamily,
): number {
  if (!maskPart) {
    return family === 4 ? 24 : 64;
  }
  if (/^\d+$/.test(maskPart)) {
    return parseNumericPrefix(maskPart, family);
  }
  return parseNetmaskPrefix(maskPart, family);
}

export function parseSubnetInput(
  input: string,
  explicitPrefix?: string,
): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Input string is empty");
  }

  const { addressPart: rawAddress, maskPart } = splitAddressAndMask(
    trimmed,
    explicitPrefix,
  );

  let addressPart = rawAddress;
  let zoneIndex: string | undefined;
  if (addressPart.includes("%")) {
    const [addr, zone] = addressPart.split("%");
    addressPart = (addr ?? "").trim();
    zoneIndex = zone ? zone.trim() : undefined;
  }

  let family = detectFamily(addressPart);
  family ??= maskPart?.includes(":") ? 6 : 4;

  const prefix = resolveMaskPrefix(maskPart, family);

  return {
    rawInput: input,
    addressString: addressPart,
    prefix,
    family,
    zoneIndex,
  };
}
