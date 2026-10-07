/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/renderer/utils/classifier.ts
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

import { CalculateResult } from "@engine/types.js";
import { parseIPv4ToUint32 } from "@engine/parse.js";

export interface IpClassification {
  label: string;
  badgeClass:
    "rfc1918" | "public" | "cgnat" | "loopback" | "reserved" | "linklocal";
  description: string;
}

function isRfc1918(o1: number, o2: number): boolean {
  if (o1 === 10) return true;
  if (o1 === 172 && (o2 & 0xf0) === 16) return true;
  return o1 === 192 && o2 === 168;
}

function isDocumentationV4(val: number, o1: number, o2: number): boolean {
  const o3 = (val >>> 8) & 0xff;
  if (o1 === 192 && o2 === 0 && o3 === 2) return true;
  if (o1 === 198 && o2 === 51 && o3 === 100) return true;
  return o1 === 203 && o2 === 0 && o3 === 113;
}

function classifyIPv4(address: string): IpClassification {
  const val = parseIPv4ToUint32(address);
  if (val === null) {
    return {
      label: "Unknown",
      badgeClass: "reserved",
      description: "Address could not be validated",
    };
  }

  const o1 = (val >>> 24) & 0xff;
  const o2 = (val >>> 16) & 0xff;

  if (isRfc1918(o1, o2)) {
    return {
      label: "RFC 1918 Private",
      badgeClass: "rfc1918",
      description: "Private network space not routable on the public internet",
    };
  }

  if (o1 === 127) {
    return {
      label: "Loopback RFC 1122",
      badgeClass: "loopback",
      description: "Host loopback address space for internal IPC",
    };
  }

  if (o1 === 169 && o2 === 254) {
    return {
      label: "Link-Local RFC 3927",
      badgeClass: "linklocal",
      description: "Auto-configured address for single link segment",
    };
  }

  if (o1 === 100 && (o2 & 0xc0) === 64) {
    return {
      label: "CGNAT RFC 6598",
      badgeClass: "cgnat",
      description: "Carrier-Grade NAT shared address space",
    };
  }

  if (o1 >= 224 && o1 <= 239) {
    return {
      label: "Multicast RFC 5771",
      badgeClass: "reserved",
      description: "IPv4 multicast host group space",
    };
  }

  if (isDocumentationV4(val, o1, o2)) {
    return {
      label: "Documentation RFC 5737",
      badgeClass: "reserved",
      description: "Reserved for documentation and example code",
    };
  }

  if (o1 >= 240 || o1 === 0) {
    return {
      label: "Reserved RFC 1112",
      badgeClass: "reserved",
      description: "Experimental or future reserved space",
    };
  }

  return {
    label: "Public Internet",
    badgeClass: "public",
    description: "Globally routable public IPv4 address space",
  };
}

function classifyIPv6(address: string): IpClassification {
  const addrLower = address.toLowerCase();

  if (addrLower === "::1") {
    return {
      label: "Loopback RFC 4291",
      badgeClass: "loopback",
      description: "IPv6 loopback host interface address",
    };
  }

  if (addrLower === "::") {
    return {
      label: "Unspecified RFC 4291",
      badgeClass: "reserved",
      description: "IPv6 unspecified source address",
    };
  }

  if (addrLower.startsWith("ff")) {
    return {
      label: "Multicast RFC 4291",
      badgeClass: "reserved",
      description: "IPv6 multicast address space",
    };
  }

  if (/^fe[89ab]/.test(addrLower)) {
    return {
      label: "Link-Local RFC 4291",
      badgeClass: "linklocal",
      description: "IPv6 link-local unicast interface address",
    };
  }

  if (addrLower.startsWith("fc") || addrLower.startsWith("fd")) {
    return {
      label: "ULA RFC 4193",
      badgeClass: "rfc1918",
      description: "IPv6 Unique Local Address space",
    };
  }

  if (addrLower.startsWith("2001:db8")) {
    return {
      label: "Documentation RFC 3849",
      badgeClass: "reserved",
      description: "IPv6 documentation prefix",
    };
  }

  if (addrLower.startsWith("2002:")) {
    return {
      label: "6to4 Anycast RFC 3056",
      badgeClass: "cgnat",
      description: "IPv6 6to4 transition gateway prefix",
    };
  }

  if (addrLower.includes("::ffff:")) {
    return {
      label: "IPv4-Mapped RFC 4291",
      badgeClass: "cgnat",
      description: "IPv4 mapped into IPv6 address structure",
    };
  }

  if (addrLower.startsWith("2") || addrLower.startsWith("3")) {
    return {
      label: "Public GUA RFC 4291",
      badgeClass: "public",
      description: "Globally routable IPv6 unicast address space",
    };
  }

  return {
    label: "IPv6 Unicast",
    badgeClass: "public",
    description: "General IPv6 address space",
  };
}

export function classifyAddress(result: CalculateResult): IpClassification {
  return result.family === 4
    ? classifyIPv4(result.address)
    : classifyIPv6(result.address);
}
