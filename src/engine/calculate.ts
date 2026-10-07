/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/engine/calculate.ts
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
