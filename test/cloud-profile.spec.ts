/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: test/cloud-profile.spec.ts
 * Version: 1.1.2
 * Date & Time: 2026-10-07T11:00:00+07:00
 *
 * Maintainer & Lead Developer:
 *   Harry Dertin Sutisna Alsyundawy (Alsyundawy IT Solution)
 *   Email: alsyundawy@gmail.com
 *   Website: https://alsyundawy.com
 *   GitHub: https://github.com/alsyundawy
 *
 * License: MIT (SPDX: MIT)
 * Architecture: Cross-Platform (macOS Apple Silicon & Intel, Windows x64 & x86, Linux)
 * ============================================================================
 */

import { describe, it, expect } from "vitest";
import { calculateCloudProfiles } from "../src/engine/cloud-profile.js";
import { parseIPv4ToUint32 } from "../src/engine/parse.js";
import { calculateSubnet } from "../src/engine/calculate.js";

describe("Cloud Reservation Profiles Engine (Parity with SubnetCalc-MacOS)", () => {
  it("calculates 10.0.0.0/24 across all 5 cloud profiles correctly", () => {
    const netUint = parseIPv4ToUint32("10.0.0.0")!;
    const profiles = calculateCloudProfiles(netUint, 24);

    expect(profiles).toHaveLength(5);

    // 1. Standard (RFC 1918)
    const standard = profiles.find((p) => p.id === "standard")!;
    expect(standard.isProhibited).toBe(false);
    expect(standard.reservedCount).toBe(2);
    expect(standard.usableStart).toBe("10.0.0.1");
    expect(standard.usableEnd).toBe("10.0.0.254");
    expect(standard.usableCount).toBe("254");
    expect(standard.reservedRoles).toHaveLength(2);

    // 2. AWS VPC
    const aws = profiles.find((p) => p.id === "aws")!;
    expect(aws.isProhibited).toBe(false);
    expect(aws.reservedCount).toBe(5);
    expect(aws.usableStart).toBe("10.0.0.4");
    expect(aws.usableEnd).toBe("10.0.0.254");
    expect(aws.usableCount).toBe("251");
    expect(aws.reservedRoles).toHaveLength(5);
    expect(aws.reservedRoles[1]?.role).toBe("VPC Router (Default Gateway)");

    // 3. Azure VNet
    const azure = profiles.find((p) => p.id === "azure")!;
    expect(azure.isProhibited).toBe(false);
    expect(azure.reservedCount).toBe(5);
    expect(azure.usableStart).toBe("10.0.0.4");
    expect(azure.usableEnd).toBe("10.0.0.254");
    expect(azure.usableCount).toBe("251");

    // 4. Google Cloud (GCP)
    const gcp = profiles.find((p) => p.id === "gcp")!;
    expect(gcp.isProhibited).toBe(false);
    expect(gcp.reservedCount).toBe(4);
    expect(gcp.usableStart).toBe("10.0.0.2");
    expect(gcp.usableEnd).toBe("10.0.0.253");
    expect(gcp.usableCount).toBe("252");

    // 5. Oracle Cloud (OCI)
    const oci = profiles.find((p) => p.id === "oci")!;
    expect(oci.isProhibited).toBe(false);
    expect(oci.reservedCount).toBe(3);
    expect(oci.usableStart).toBe("10.0.0.2");
    expect(oci.usableEnd).toBe("10.0.0.254");
    expect(oci.usableCount).toBe("253");
  });

  it("enforces cloud minimum prefix boundaries (prohibition checks)", () => {
    const netUint = parseIPv4ToUint32("192.168.1.0")!;
    // /29 subnet
    const profiles = calculateCloudProfiles(netUint, 29);

    const standard = profiles.find((p) => p.id === "standard")!;
    expect(standard.isProhibited).toBe(false);

    // AWS requires /28 minimum -> /29 must be prohibited
    const aws = profiles.find((p) => p.id === "aws")!;
    expect(aws.isProhibited).toBe(true);
    expect(aws.usableCount).toBe("0 (Prohibited)");
    expect(aws.usableStart).toBeNull();

    // Azure allows /29
    const azure = profiles.find((p) => p.id === "azure")!;
    expect(azure.isProhibited).toBe(false);

    // GCP allows /29
    const gcp = profiles.find((p) => p.id === "gcp")!;
    expect(gcp.isProhibited).toBe(false);

    // OCI allows /29 (minimum is /30)
    const oci = profiles.find((p) => p.id === "oci")!;
    expect(oci.isProhibited).toBe(false);
  });

  it("handles point-to-point /31 and host /32 in Standard RFC profile", () => {
    const net31 = parseIPv4ToUint32("10.0.0.0")!;
    const p31 = calculateCloudProfiles(net31, 31).find(
      (p) => p.id === "standard",
    )!;
    expect(p31.reservedCount).toBe(0);
    expect(p31.usableCount).toBe("2");
    expect(p31.usableStart).toBe("10.0.0.0");
    expect(p31.usableEnd).toBe("10.0.0.1");

    const net32 = parseIPv4ToUint32("10.0.0.5")!;
    const p32 = calculateCloudProfiles(net32, 32).find(
      (p) => p.id === "standard",
    )!;
    expect(p32.reservedCount).toBe(0);
    expect(p32.usableCount).toBe("1");
    expect(p32.usableStart).toBe("10.0.0.5");
    expect(p32.usableEnd).toBe("10.0.0.5");
  });

  it("integrates cloud profiles into calculateSubnet output", async () => {
    const res = await calculateSubnet({ input: "172.16.0.1/20" });
    expect(res.family).toBe(4);
    expect(res.cloudProfiles).toBeDefined();
    expect(res.cloudProfiles).toHaveLength(5);
    const aws = res.cloudProfiles?.find((p) => p.id === "aws");
    expect(aws?.usableStart).toBe("172.16.0.4");
  });
});
