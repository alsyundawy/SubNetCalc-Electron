import { CalculateRequest, CalculateResult } from "./types.js";
import { parseSubnetInput } from "./parse.js";
import { calculateIPv4 } from "./ipv4.js";
import { calculateIPv6 } from "./ipv6.js";
import { generateUniqueLocal } from "./uniquelocal.js";

export function calculateSubnet(
  req: CalculateRequest,
  rng5Bytes?: Uint8Array,
): CalculateResult {
  const parsed = parseSubnetInput(req.input, req.prefix);
  const warnings: string[] = [];

  if (parsed.zoneIndex) {
    warnings.push(
      `IPv6 zone index "%${parsed.zoneIndex}" ignored in subnet calculations`,
    );
  }

  // Handle Unique Local generation if requested
  if (req.uniqueLocal) {
    if (parsed.family === 4) {
      throw new Error(
        "Unique Local IPv6 address generation is not valid for IPv4 addresses",
      );
    }

    if (!rng5Bytes) {
      throw new Error("RNG 5 bytes required for Unique Local generation");
    }

    const ula = generateUniqueLocal(parsed.addressString, rng5Bytes);
    const result = calculateIPv6(ula.address, parsed.prefix);
    result.warnings = warnings;
    return result;
  }

  if (parsed.family === 4) {
    const result = calculateIPv4(parsed.addressString, parsed.prefix);
    result.warnings = warnings;
    return result;
  } else {
    const result = calculateIPv6(parsed.addressString, parsed.prefix);
    result.warnings = warnings;
    return result;
  }
}
