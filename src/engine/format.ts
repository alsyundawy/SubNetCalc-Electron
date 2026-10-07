/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/engine/format.ts
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

import { CalculateResult } from "./types.js";
import { parseIPv6ToBigInt } from "./parse.js";

function getGlobalUnicastPropLabel(key: string): string {
  if (key === "MAC Address (from EUI-64)") {
    return "MAC Address                     ";
  }
  if (key === "Solicited-Node Multicast") {
    return "Solicited Node Multicast Address";
  }
  return "Interface ID                    ";
}

function formatBitsLines(res: CalculateResult): string[] {
  if (res.family === 4) {
    return [`                    ${res.bits.grouped.join(" . ")}`];
  }
  return res.bits.grouped.map((group) => `                    ${group}`);
}

function formatFormula(res: CalculateResult): string {
  if (res.family === 4) {
    if (res.prefix === 31 || res.prefix === 32) {
      return `(2^${res.hostBits} - 0)`;
    }
    return `(2^${res.hostBits} - 2)`;
  }
  if (res.prefix === 128) {
    return `(2^0 - 0)`;
  }
  return `(2^${res.hostBits} - 1)`;
}

function formatMaxHostsAndRange(res: CalculateResult): string[] {
  if (res.role === "multicast") {
    return [];
  }
  const formula = formatFormula(res);
  const lines: string[] = [`Max. Hosts     = ${res.maxHosts}   ${formula}`];
  if (res.hostRange) {
    lines.push(
      `Host Range     = { ${res.hostRange.first} - ${res.hostRange.last} }`,
    );
  }
  return lines;
}

function formatPropertyLine(
  prop: { key: string; value: string },
  lines: string[],
): void {
  if (prop.key === "Role" || prop.key === "Class") {
    lines.push(`   - ${prop.value}`);
  } else if (prop.key === "Scope" && !prop.value.startsWith("Global")) {
    lines.push(`   - ${prop.value}`);
  } else if (
    prop.key === "Interface ID" ||
    prop.key === "MAC Address (from EUI-64)" ||
    prop.key === "Solicited-Node Multicast"
  ) {
    const label = getGlobalUnicastPropLabel(prop.key);
    if (!lines.includes("   - Global Unicast Properties:")) {
      lines.push(
        "   - Global Unicast Properties:",
        `      + ${label} = ${prop.value}`,
      );
    } else {
      lines.push(`      + ${label} = ${prop.value}`);
    }
  } else if (prop.key.startsWith("ULA ")) {
    const label = prop.key.replace("ULA ", "").padEnd(32, " ");
    if (!lines.includes("   - Unique Local Unicast Properties:")) {
      lines.push(
        "   - Unique Local Unicast Properties:",
        "      + Locally chosen",
        `      + ${label} = ${prop.value}`,
      );
    } else {
      lines.push(`      + ${label} = ${prop.value}`);
    }
  } else if (prop.key === "Multicast Scope") {
    lines.push(`      + Scope: ${prop.value}`);
  } else if (prop.key === "Corresponding Multicast MAC") {
    lines.push(`      + Corresponding multicast MAC address: ${prop.value}`);
  } else {
    lines.push(`   - ${prop.key}: ${prop.value}`);
  }
}

export function formatResultPlainText(res: CalculateResult): string {
  const broadcastText = res.broadcast
    ? res.broadcast
    : "not needed on Point-to-Point links";

  const propLines: string[] = [];
  for (const prop of res.properties) {
    formatPropertyLine(prop, propLines);
  }

  const allLines: string[] = [
    `Address        = ${res.address}`,
    ...formatBitsLines(res),
    `Network        = ${res.network} / ${res.prefix}`,
    `Netmask        = ${res.netmask}`,
    ...(res.family === 4 ? [`Broadcast      = ${broadcastText}`] : []),
    `Wildcard Mask  = ${res.wildcard}`,
    ...(res.family === 4 ? [`Hex. Address   = ${res.hex}`] : []),
    `Host Bits      = ${res.hostBits}`,
    ...formatMaxHostsAndRange(res),
    "Properties     = ",
    ...propLines,
    ...(res.dns?.hostname ? [`DNS Hostname   = ${res.dns.hostname}`] : []),
    ...(res.geo?.country
      ? [`GeoIP Country  = ${res.geo.country} (${res.geo.code})`]
      : []),
  ];

  return allLines.join("\n");
}

export function formatBitClassMap(addr: number, prefix: number): string {
  const firstOctet = (addr >>> 24) & 0xff;
  let classNetBits = 32;
  if (firstOctet <= 127) classNetBits = 8;
  else if (firstOctet <= 191) classNetBits = 16;
  else if (firstOctet <= 223) classNetBits = 24;

  const chars = Array.from({ length: 32 }, (_, i) => {
    if (i < Math.min(classNetBits, prefix)) return "n";
    if (i < prefix) return "s";
    return "h";
  });

  const octets = Array.from({ length: 4 }, (_, o) =>
    chars.slice(o * 8, o * 8 + 8).join(""),
  );
  return octets.join(".");
}

export function formatReverseDnsZone(address: string, family: 4 | 6): string {
  if (family === 4) {
    const octets = address.trim().split(".");
    octets.reverse();
    return `${octets.join(".")}.in-addr.arpa`;
  }

  const val = parseIPv6ToBigInt(address);
  if (val === null) {
    throw new Error(`Invalid IPv6 address for reverse DNS: "${address}"`);
  }
  const hex32 = val.toString(16).padStart(32, "0");
  const nibbles = hex32.split("");
  nibbles.reverse();
  return `${nibbles.join(".")}.ip6.arpa`;
}
