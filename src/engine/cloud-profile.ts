/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/engine/cloud-profile.ts
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
 *   - SubnetCalc-MacOS Cloud Profiles Heritage (IPSubnetcalc.swift)
 *
 * License: MIT (SPDX: MIT)
 * Architecture: Cross-Platform (macOS Apple Silicon & Intel, Windows x64 & x86, Linux)
 * ============================================================================
 */

export type CloudProviderId = "standard" | "aws" | "azure" | "gcp" | "oci";

export interface ReservedRoleItem {
  readonly ip: string;
  readonly role: string;
}

export interface CloudProfileInfo {
  readonly id: CloudProviderId;
  readonly name: string;
  readonly description: string;
  readonly minimumPrefix: number;
  readonly reservedCount: number;
  readonly usableStart: string | null;
  readonly usableEnd: string | null;
  readonly usableCount: string;
  readonly isProhibited: boolean;
  readonly reservedRoles: readonly ReservedRoleItem[];
}

export interface CloudProfileDefinition {
  readonly id: CloudProviderId;
  readonly name: string;
  readonly description: string;
  readonly minimumPrefix: number;
}

export const CLOUD_PROFILES: readonly CloudProfileDefinition[] = [
  {
    id: "standard",
    name: "Standard (RFC 1918)",
    description:
      "Standard IETF host allocation reserving network ID and broadcast address.",
    minimumPrefix: 32,
  },
  {
    id: "aws",
    name: "AWS VPC",
    description:
      "Amazon Web Services reserves 5 IP addresses per subnet (/28 minimum).",
    minimumPrefix: 28,
  },
  {
    id: "azure",
    name: "Azure VNet",
    description:
      "Microsoft Azure reserves 5 IP addresses per subnet (/29 minimum).",
    minimumPrefix: 29,
  },
  {
    id: "gcp",
    name: "Google Cloud (GCP)",
    description:
      "Google Cloud VPC reserves 4 IP addresses per subnet (/29 minimum).",
    minimumPrefix: 29,
  },
  {
    id: "oci",
    name: "Oracle Cloud (OCI)",
    description:
      "Oracle Cloud Infrastructure reserves 3 IP addresses per subnet (/30 minimum).",
    minimumPrefix: 30,
  },
] as const;

function formatUint32(val: number): string {
  const o1 = (val >>> 24) & 0xff;
  const o2 = (val >>> 16) & 0xff;
  const o3 = (val >>> 8) & 0xff;
  const o4 = val & 0xff;
  return `${o1}.${o2}.${o3}.${o4}`;
}

/**
 * Calculates cloud provider subnet reservation profiles for a given IPv4 network and prefix.
 * Strict mathematical parity with SubnetCalc-MacOS CloudProfile implementation.
 */
export function calculateCloudProfiles(
  networkUint32: number,
  prefix: number,
): CloudProfileInfo[] {
  const hostBits = 32 - prefix;
  const totalHosts = prefix === 32 ? 1 : Math.pow(2, hostBits);
  const broadcastUint32 = (networkUint32 + totalHosts - 1) >>> 0;

  return CLOUD_PROFILES.map((def) => {
    const isProhibited = prefix > def.minimumPrefix;

    if (isProhibited) {
      return {
        id: def.id,
        name: def.name,
        description: def.description,
        minimumPrefix: def.minimumPrefix,
        reservedCount: 0,
        usableStart: null,
        usableEnd: null,
        usableCount: "0 (Prohibited)",
        isProhibited: true,
        reservedRoles: [],
      };
    }

    let reservedCount = 0;
    let usableStart: string | null = null;
    let usableEnd: string | null = null;
    let usableCountNum = 0;
    const reservedRoles: ReservedRoleItem[] = [];

    switch (def.id) {
      case "standard": {
        if (prefix === 31) {
          // RFC 3021 Point-to-Point link: both addresses are usable, 0 reserved
          usableStart = formatUint32(networkUint32);
          usableEnd = formatUint32(broadcastUint32);
          usableCountNum = 2;
        } else if (prefix === 32) {
          // Single Host route: 0 reserved, 1 host
          usableStart = formatUint32(networkUint32);
          usableEnd = formatUint32(networkUint32);
          usableCountNum = 1;
        } else {
          reservedCount = 2;
          usableStart = formatUint32((networkUint32 + 1) >>> 0);
          usableEnd = formatUint32((broadcastUint32 - 1) >>> 0);
          usableCountNum = Math.max(0, totalHosts - 2);
          reservedRoles.push(
            { ip: formatUint32(networkUint32), role: "Network Address" },
            { ip: formatUint32(broadcastUint32), role: "Broadcast Address" },
          );
        }
        break;
      }

      case "aws": {
        // AWS reserves 5 IPs:
        // .0: Network address
        // .1: VPC Router (Default Gateway)
        // .2: Amazon-Provided DNS
        // .3: Future Use (Reserved by AWS)
        // .last: Broadcast address
        reservedCount = 5;
        usableStart = formatUint32((networkUint32 + 4) >>> 0);
        usableEnd = formatUint32((broadcastUint32 - 1) >>> 0);
        usableCountNum = Math.max(0, totalHosts - 5);
        reservedRoles.push(
          {
            ip: formatUint32(networkUint32),
            role: "Network Address (VPC Block)",
          },
          {
            ip: formatUint32((networkUint32 + 1) >>> 0),
            role: "VPC Router (Default Gateway)",
          },
          {
            ip: formatUint32((networkUint32 + 2) >>> 0),
            role: "Amazon-Provided DNS",
          },
          {
            ip: formatUint32((networkUint32 + 3) >>> 0),
            role: "Future Use (Reserved by AWS)",
          },
          { ip: formatUint32(broadcastUint32), role: "Broadcast Address" },
        );
        break;
      }

      case "azure": {
        // Azure reserves 5 IPs:
        // .0: Network address
        // .1: Default Gateway
        // .2: Primary Azure DNS
        // .3: Secondary Azure DNS
        // .last: Broadcast address
        reservedCount = 5;
        usableStart = formatUint32((networkUint32 + 4) >>> 0);
        usableEnd = formatUint32((broadcastUint32 - 1) >>> 0);
        usableCountNum = Math.max(0, totalHosts - 5);
        reservedRoles.push(
          { ip: formatUint32(networkUint32), role: "Network Address" },
          {
            ip: formatUint32((networkUint32 + 1) >>> 0),
            role: "Default Gateway",
          },
          {
            ip: formatUint32((networkUint32 + 2) >>> 0),
            role: "Primary Azure DNS",
          },
          {
            ip: formatUint32((networkUint32 + 3) >>> 0),
            role: "Secondary Azure DNS",
          },
          { ip: formatUint32(broadcastUint32), role: "Broadcast Address" },
        );
        break;
      }

      case "gcp": {
        // GCP reserves 4 IPs:
        // .0: Network address
        // .1: Default Gateway
        // .last-1: Future Use (Reserved by GCP)
        // .last: Broadcast address
        reservedCount = 4;
        usableStart = formatUint32((networkUint32 + 2) >>> 0);
        usableEnd = formatUint32((broadcastUint32 - 2) >>> 0);
        usableCountNum = Math.max(0, totalHosts - 4);
        reservedRoles.push(
          { ip: formatUint32(networkUint32), role: "Network Address" },
          {
            ip: formatUint32((networkUint32 + 1) >>> 0),
            role: "Default Gateway",
          },
          {
            ip: formatUint32((broadcastUint32 - 1) >>> 0),
            role: "Future Use (Reserved by GCP)",
          },
          { ip: formatUint32(broadcastUint32), role: "Broadcast Address" },
        );
        break;
      }

      case "oci": {
        // OCI reserves 3 IPs:
        // .0: Network address
        // .1: Default Gateway
        // .last: Broadcast address
        reservedCount = 3;
        usableStart = formatUint32((networkUint32 + 2) >>> 0);
        usableEnd = formatUint32((broadcastUint32 - 1) >>> 0);
        usableCountNum = Math.max(0, totalHosts - 3);
        reservedRoles.push(
          { ip: formatUint32(networkUint32), role: "Network Address" },
          {
            ip: formatUint32((networkUint32 + 1) >>> 0),
            role: "Default Gateway",
          },
          { ip: formatUint32(broadcastUint32), role: "Broadcast Address" },
        );
        break;
      }
    }

    return {
      id: def.id,
      name: def.name,
      description: def.description,
      minimumPrefix: def.minimumPrefix,
      reservedCount,
      usableStart,
      usableEnd,
      usableCount: usableCountNum.toLocaleString(),
      isProhibited: false,
      reservedRoles,
    };
  });
}
