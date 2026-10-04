import { parseIPv6ToBigInt } from "./parse.js";
import { formatIPv6Canonical } from "./ipv6.js";

export interface UniqueLocalResult {
  address: string;
  globalIdHex: string;
  subnetIdHex: string;
}

/**
 * RFC 4193 Unique Local IPv6 Address Generator
 * Sets prefix 0xfd (8 bits) + 40-bit Global ID (random 5 bytes)
 * Preserves the bits after /48 (Subnet ID + Interface ID)
 */
export function generateUniqueLocal(
  ipv6Str: string,
  random5Bytes: Uint8Array
): UniqueLocalResult {
  if (random5Bytes.length !== 5) {
    throw new Error("random5Bytes must be exactly 5 bytes (40 bits)");
  }

  const addr = parseIPv6ToBigInt(ipv6Str);
  if (addr === null) {
    throw new Error(`Invalid IPv6 address for ULA generation: "${ipv6Str}"`);
  }

  // Preserve lower 80 bits (bits 48 to 127)
  const lower80Mask = (1n << 80n) - 1n;
  const lower80 = addr & lower80Mask;

  // Construct top 48 bits: 0xfd (8 bits) + 40 bits of random bytes
  let top48 = 0xfdn;
  let globalIdHex = "";
  for (let i = 0; i < 5; i++) {
    const b = random5Bytes[i] ?? 0;
    top48 = (top48 << 8n) | BigInt(b);
    globalIdHex += b.toString(16).padStart(2, "0");
  }

  const ulaBigInt = (top48 << 80n) | lower80;
  const subnetId = Number((lower80 >> 64n) & 0xffffn);
  const subnetIdHex = subnetId.toString(16).padStart(4, "0");

  return {
    address: formatIPv6Canonical(ulaBigInt),
    globalIdHex,
    subnetIdHex,
  };
}
