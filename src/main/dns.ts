/**
 * ============================================================================
 * SubNetCalc Electron Desktop - Production-Grade Subnet Suite
 * ============================================================================
 * File: src/main/dns.ts
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

import dns from "node:dns/promises";
import { isIP } from "node:net";

export interface ResolvedHost {
  ip: string;
  family: 4 | 6;
  originalName: string;
}

export async function resolveHostnameWithTimeout(
  hostname: string,
  preferredFamily: 4 | 6 = 4,
  timeoutMs = 3000,
): Promise<ResolvedHost | null> {
  const cleanHost = hostname.trim();

  // If already an IP address, return immediately
  const ipType = isIP(cleanHost);
  if (ipType === 4 || ipType === 6) {
    return {
      ip: cleanHost,
      family: ipType,
      originalName: cleanHost,
    };
  }

  // Handle IDN (internationalized domain names) via URL or punycode domain conversion
  let asciiDomain = cleanHost;
  try {
    const url = new URL(`https://${cleanHost}`);
    asciiDomain = url.hostname;
  } catch {
    // If not a valid URL format, keep original
  }

  let timer: NodeJS.Timeout | undefined;
  let timedOut = false;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      reject(new Error("DNS query timeout"));
    }, timeoutMs);
  });

  try {
    const lookupPromise = (async () => {
      // Lookup both A and AAAA asynchronously
      let v4: string | null = null;
      let v6: string | null = null;

      try {
        const res4 = await dns.resolve4(asciiDomain);
        if (!timedOut && res4 && res4.length > 0) v4 = res4[0] ?? null;
      } catch {
        // Ignore resolution errors
      }

      try {
        const res6 = await dns.resolve6(asciiDomain);
        if (!timedOut && res6 && res6.length > 0) v6 = res6[0] ?? null;
      } catch {
        // Ignore resolution errors
      }

      if (timedOut) return null;

      if (preferredFamily === 6 && v6) {
        return { ip: v6, family: 6 as const, originalName: cleanHost };
      }
      if (preferredFamily === 4 && v4) {
        return { ip: v4, family: 4 as const, originalName: cleanHost };
      }
      if (v6) {
        return { ip: v6, family: 6 as const, originalName: cleanHost };
      }
      if (v4) {
        return { ip: v4, family: 4 as const, originalName: cleanHost };
      }
      return null;
    })();

    return await Promise.race([lookupPromise, timeoutPromise]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function lookupReverseDns(
  ipStr: string,
  timeoutMs = 3000,
): Promise<string | null> {
  let timer: NodeJS.Timeout | undefined;
  let timedOut = false;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      reject(new Error("Reverse DNS timeout"));
    }, timeoutMs);
  });

  try {
    const revPromise = dns.reverse(ipStr).then((res) => {
      if (timedOut) return null;
      return res && res.length > 0 ? (res[0] ?? null) : null;
    });
    return await Promise.race([revPromise, timeoutPromise]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
