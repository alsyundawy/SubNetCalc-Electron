import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { calculateSubnet } from "../src/engine/index.js";

// Check if subnetcalc exists in PATH
let subnetcalcPath: string | null = null;
try {
  subnetcalcPath = execSync("which subnetcalc", { encoding: "utf8" }).trim();
} catch {
  subnetcalcPath = null;
}

const testCases = [
  "132.252.150.154/28",
  "1.1.1.1/32",
  "10.0.0.0/8",
  "192.168.0.1/31",
  "192.168.0.0/31",
  "255.255.255.255/32",
  "172.16.5.100/20",
  "8.8.8.8/24",
  "192.0.2.1/29",
  "198.51.100.254/24",
  "203.0.113.45/30",
  "100.64.10.5/10",
  "127.0.0.1/8",
  "169.254.1.1/16",
  "172.31.255.254/12",
  "2001:638:501:4ef8:223:aeff:fea4:8ca9/64",
  "2401:3800:c001::68/128",
  "2001:db8::1/48",
  "fe80::1/64",
  "fd12:3456:789a:1::1/64",
  "2002:c000:201::1/48",
  "2001:4860:4860::8888/32",
];

describe.skipIf(!subnetcalcPath)("T7.2: Upstream CLI Oracle Comparison", () => {
  for (const tc of testCases) {
    it(`should match upstream CLI calculation for ${tc}`, () => {
      // Run upstream CLI with -n to disable DNS lookups
      const stdout = execSync(`${subnetcalcPath} ${tc} -n`, {
        encoding: "utf8",
      });

      const parsedCli: Record<string, string> = {};
      for (const line of stdout.split("\n")) {
        const eqIdx = line.indexOf("=");
        if (eqIdx !== -1) {
          const key = line.substring(0, eqIdx).trim();
          const val = line.substring(eqIdx + 1).trim();
          parsedCli[key] = val;
        }
      }

      const res = calculateSubnet({ input: tc });

      // Compare Network
      const expectedNet = parsedCli["Network"]?.split("/")[0]?.trim();
      expect(res.network.toLowerCase()).toBe(expectedNet?.toLowerCase());

      // Compare Netmask
      const expectedMask = parsedCli["Netmask"]?.trim();
      expect(res.netmask.toLowerCase()).toBe(expectedMask?.toLowerCase());

      // Compare Wildcard
      const expectedWildcard = parsedCli["Wildcard Mask"]?.trim();
      expect(res.wildcard.toLowerCase()).toBe(expectedWildcard?.toLowerCase());

      // Compare Host Bits
      const expectedHostBits = parsedCli["Host Bits"]?.trim();
      expect(res.hostBits.toString()).toBe(expectedHostBits);

      // Compare Max Hosts (extract first token before formula)
      const expectedMaxHosts = parsedCli["Max. Hosts"]?.split(/\s+/)[0]?.trim();
      if (expectedMaxHosts) {
        expect(res.maxHosts).toBe(expectedMaxHosts);
      }
    });
  }
});
