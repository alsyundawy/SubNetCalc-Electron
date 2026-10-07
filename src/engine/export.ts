/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/engine/export.ts
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

export interface CsvColumn<T> {
  key: keyof T;
  label: string;
}

function stringifyCsvValue(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }
  if (typeof val === "string") {
    return val;
  }
  if (
    typeof val === "number" ||
    typeof val === "boolean" ||
    typeof val === "bigint"
  ) {
    return val.toString();
  }
  return JSON.stringify(val);
}

export function escapeCsvField(val: unknown): string {
  let str = stringifyCsvValue(val);

  // Security: Mitigate formula injection if string starts with formula triggers
  // e.g. =, +, -, @ followed by non-digit
  if (/^[=+@\t\r-]/.test(str) && !/^[+-]?\d+(\.\d+)?$/.test(str)) {
    str = `'${str}`;
  }

  // RFC 4180: If field contains comma, quote, or newline, escape double quotes and wrap in quotes
  if (
    str.includes(",") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replaceAll('"', '""')}"`;
  }

  return str;
}

export function exportToCsv<T>(data: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvField(c.label)).join(",");
  const rows = data.map((item) =>
    columns.map((c) => escapeCsvField(item[c.key])).join(","),
  );
  return [header, ...rows].join("\r\n");
}
