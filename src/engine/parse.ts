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
    const num = parseInt(p, 10);
    if (num < 0 || num > 255) return null;
    // Check leading zero for numbers > 0 (e.g. 01 is invalid in standard strict dotted decimal)
    if (p.length > 1 && p.startsWith("0")) return null;
    res = ((res << 8) | num) >>> 0;
  }
  return res;
}

export function parseIPv6ToBigInt(ipStr: string): bigint | null {
  let str = ipStr.trim().toLowerCase();
  // Strip zone index if present
  const pctIdx = str.indexOf("%");
  if (pctIdx !== -1) {
    str = str.substring(0, pctIdx);
  }

  // Check for IPv4-mapped / IPv4-compatible (e.g., ::ffff:192.168.1.1)
  const lastColon = str.lastIndexOf(":");
  if (lastColon !== -1) {
    const after = str.substring(lastColon + 1);
    if (after.includes(".")) {
      const v4Val = parseIPv4ToUint32(after);
      if (v4Val === null) return null;
      const hex1 = ((v4Val >>> 16) & 0xffff).toString(16);
      const hex2 = (v4Val & 0xffff).toString(16);
      str = str.substring(0, lastColon + 1) + hex1 + ":" + hex2;
    }
  }

  const doubleColonCount = (str.match(/::/g) || []).length;
  if (doubleColonCount > 1) return null;

  let parts: string[];
  if (doubleColonCount === 1) {
    const [left, right] = str.split("::");
    const leftParts = left ? left.split(":") : [];
    const rightParts = right ? right.split(":") : [];
    const missing = 8 - (leftParts.length + rightParts.length);
    if (missing < 1) return null;
    parts = [...leftParts, ...Array(missing).fill("0"), ...rightParts];
  } else {
    parts = str.split(":");
    if (parts.length !== 8) return null;
  }

  if (parts.length !== 8) return null;

  let res = 0n;
  for (const part of parts) {
    if (!part || !/^[0-9a-fA-F]{1,4}$/.test(part)) return null;
    const val = BigInt(parseInt(part, 16));
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

export function parseSubnetInput(
  input: string,
  explicitPrefix?: string,
): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Input string is empty");
  }

  let addressPart = trimmed;
  let maskPart: string | undefined = explicitPrefix?.trim();

  // If no explicitPrefix, split by / or whitespace
  if (!maskPart) {
    if (trimmed.includes("/")) {
      const slashParts = trimmed.split("/");
      if (slashParts.length > 2) {
        throw new Error("Invalid format: multiple / characters");
      }
      addressPart = slashParts[0]!.trim();
      maskPart = slashParts[1]?.trim();
    } else {
      const spaceParts = trimmed.split(/\s+/);
      if (spaceParts.length >= 2) {
        addressPart = spaceParts[0]!.trim();
        maskPart = spaceParts.slice(1).join(" ").trim();
      }
    }
  }

  let zoneIndex: string | undefined;
  if (addressPart.includes("%")) {
    const [addr, zone] = addressPart.split("%");
    addressPart = addr!.trim();
    zoneIndex = zone!.trim();
  }

  // Detect family from addressPart
  let family = detectFamily(addressPart);

  // If addressPart doesn't look like an IP, it might be a hostname
  // For hostname, family will be determined during DNS resolution (default family 4 or 6)
  if (family === null) {
    // If maskPart has colons, hint IPv6
    if (maskPart && maskPart.includes(":")) {
      family = 6;
    } else {
      family = 4;
    }
  }

  // Calculate default prefix if maskPart is missing
  let prefix: number;
  if (!maskPart) {
    prefix = family === 4 ? 32 : 128;
  } else {
    // Check if maskPart is numeric prefix
    if (/^\d+$/.test(maskPart)) {
      const num = parseInt(maskPart, 10);
      if (family === 4) {
        if (num < 0 || num > 32) {
          throw new Error(
            `IPv4 prefix /${num} is out of range (must be between 0 and 32)`,
          );
        }
        prefix = num;
      } else {
        if (num < 0 || num > 128) {
          throw new Error(
            `IPv6 prefix /${num} is out of range (must be between 0 and 128)`,
          );
        }
        prefix = num;
      }
    } else {
      // Netmask string representation
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
        prefix = check.prefix;
      } else {
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
        prefix = check.prefix;
      }
    }
  }

  return {
    rawInput: input,
    addressString: addressPart,
    prefix,
    family,
    zoneIndex,
  };
}
