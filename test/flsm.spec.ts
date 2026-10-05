import { describe, it, expect } from "vitest";
import { calculateFLSM } from "../src/engine/flsm.js";

describe("FLSM Calculation", () => {
  it("divides 192.168.1.0/24 into 4 equal subnets (/26)", () => {
    const res = calculateFLSM("192.168.1.0", 24, 4);
    expect(res.subnets).toHaveLength(4);
    expect(res.allocatedPrefix).toBe(26);
    expect(res.borrowedBits).toBe(2);

    const [s0, s1, s2, s3] = res.subnets;
    expect(s0?.subnetId).toBe("192.168.1.0");
    expect(s0?.broadcast).toBe("192.168.1.63");
    expect(s0?.hostRange.first).toBe("192.168.1.1");
    expect(s0?.hostRange.last).toBe("192.168.1.62");
    expect(s0?.usableHosts).toBe(62);

    expect(s1?.subnetId).toBe("192.168.1.64");
    expect(s1?.broadcast).toBe("192.168.1.127");

    expect(s2?.subnetId).toBe("192.168.1.128");
    expect(s2?.broadcast).toBe("192.168.1.191");

    expect(s3?.subnetId).toBe("192.168.1.192");
    expect(s3?.broadcast).toBe("192.168.1.255");
  });

  it("handles 1 subnet needed (0 borrowed bits)", () => {
    const res = calculateFLSM("10.0.0.0", 8, 1);
    expect(res.allocatedPrefix).toBe(8);
    expect(res.borrowedBits).toBe(0);
    expect(res.subnets).toHaveLength(1);
    const [s0] = res.subnets;
    expect(s0?.subnetId).toBe("10.0.0.0");
  });

  it("throws error when requested subnets exceed 32 bits capacity", () => {
    expect(() => calculateFLSM("192.168.1.0", 31, 4)).toThrow(/exceeds/i);
  });

  it("throws error for invalid IP or negative subnets", () => {
    expect(() => calculateFLSM("invalid.ip", 24, 4)).toThrow(/invalid/i);
    expect(() => calculateFLSM("192.168.1.0", 24, 0)).toThrow(/at least 1/i);
  });
});
