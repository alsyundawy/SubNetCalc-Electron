import { describe, it, expect } from "vitest";
import { calculateVLSM } from "../src/engine/vlsm.js";

describe("VLSM Calculation", () => {
  it("allocates subnets in descending order to avoid overlap and wasted space", () => {
    const reqs = [
      { name: "LAN 1", hostsNeeded: 60 },
      { name: "LAN 2", hostsNeeded: 28 },
      { name: "WAN", hostsNeeded: 2 },
    ];
    const res = calculateVLSM("192.168.0.0", 24, reqs);
    expect(res.allocations[0]!.prefix).toBe(26); // 64 addresses
    expect(res.allocations[1]!.prefix).toBe(27); // 32 addresses
    expect(res.allocations[2]!.prefix).toBe(30); // 4 addresses
    expect(res.allocations[0]!.subnetId).toBe("192.168.0.0");
    expect(res.allocations[1]!.subnetId).toBe("192.168.0.64");
    expect(res.allocations[2]!.subnetId).toBe("192.168.0.96");
    expect(res.allocations[0]!.usableHosts).toBe(62);
    expect(res.allocations[0]!.wastedHosts).toBe(2);
    expect(res.allocations[0]!.broadcast).toBe("192.168.0.63");
    expect(res.allocations[0]!.hostRange.first).toBe("192.168.0.1");
    expect(res.allocations[0]!.hostRange.last).toBe("192.168.0.62");
  });

  it("handles out-of-order requirements by sorting descending", () => {
    const reqs = [
      { name: "WAN", hostsNeeded: 2 },
      { name: "LAN 1", hostsNeeded: 60 },
      { name: "LAN 2", hostsNeeded: 28 },
    ];
    const res = calculateVLSM("10.0.0.0", 24, reqs);
    expect(res.allocations[0]!.name).toBe("LAN 1");
    expect(res.allocations[1]!.name).toBe("LAN 2");
    expect(res.allocations[2]!.name).toBe("WAN");
  });

  it("throws descriptive error when requirements exceed parent network capacity", () => {
    const reqs = [{ name: "Too Big", hostsNeeded: 300 }];
    expect(() => calculateVLSM("192.168.0.0", 24, reqs)).toThrow(/exceeds/i);
  });

  it("throws descriptive error for invalid IP or empty requirements", () => {
    expect(() => calculateVLSM("invalid.ip", 24, [{ name: "A", hostsNeeded: 10 }])).toThrow(/invalid/i);
    expect(() => calculateVLSM("192.168.0.0", 24, [])).toThrow(/at least one/i);
  });
});
