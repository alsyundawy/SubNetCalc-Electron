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

  it("handles /0 prefix boundary accurately without 32-bit overflow", () => {
    const res = calculateFLSM("0.0.0.0", 0, 1);
    expect(res.allocatedPrefix).toBe(0);
    expect(res.totalSubnetsCreated).toBe(1);
    expect(res.usableHostsPerSubnet).toBe(4294967294);
    expect(res.subnets[0]?.totalHosts).toBe(4294967296);
    expect(res.subnets[0]?.broadcast).toBe("255.255.255.255");
    expect(res.subnets[0]?.hostRange.first).toBe("0.0.0.1");
    expect(res.subnets[0]?.hostRange.last).toBe("255.255.255.254");
  });

  it("throws error for invalid IP or negative subnets", () => {
    expect(() => calculateFLSM("invalid.ip", 24, 4)).toThrow(/invalid/i);
    expect(() => calculateFLSM("192.168.1.0", 24, 0)).toThrow(/at least 1/i);
  });

  describe("IPv6 FLSM Calculation", () => {
    it("divides 2001:db8::/48 into 4 equal subnets (/50)", () => {
      const res = calculateFLSM("2001:db8::", 48, 4);
      expect(res.family).toBe(6);
      expect(res.subnets).toHaveLength(4);
      expect(res.allocatedPrefix).toBe(50);
      expect(res.borrowedBits).toBe(2);

      const [s0, s1, s2, s3] = res.subnets;
      expect(s0?.subnetId).toBe("2001:db8::");
      expect(s0?.broadcast).toBe("N/A (Multicast RFC 4291)");
      expect(s0?.hostRange.first).toBe("2001:db8::1");
      expect(s0?.hostRange.last).toBe("2001:db8:0:3fff:ffff:ffff:ffff:ffff");

      expect(s1?.subnetId).toBe("2001:db8:0:4000::");
      expect(s1?.hostRange.first).toBe("2001:db8:0:4000::1");
      expect(s1?.hostRange.last).toBe("2001:db8:0:7fff:ffff:ffff:ffff:ffff");

      expect(s2?.subnetId).toBe("2001:db8:0:8000::");
      expect(s3?.subnetId).toBe("2001:db8:0:c000::");
    });

    it("divides 2001:db8::/60 into 16 equal subnets on /64 boundary", () => {
      const res = calculateFLSM("2001:db8::", 60, 16);
      expect(res.allocatedPrefix).toBe(64);
      expect(res.borrowedBits).toBe(4);
      expect(res.subnets).toHaveLength(16);
      expect(res.subnets[0]?.subnetId).toBe("2001:db8::");
      expect(res.subnets[1]?.subnetId).toBe("2001:db8:0:1::");
      expect(res.subnets[15]?.subnetId).toBe("2001:db8:0:f::");
    });

    it("handles IPv6 single subnet needed", () => {
      const res = calculateFLSM("2001:db8::", 64, 1);
      expect(res.allocatedPrefix).toBe(64);
      expect(res.borrowedBits).toBe(0);
      expect(res.subnets).toHaveLength(1);
    });

    it("throws error when requested subnets exceed 128 bits capacity", () => {
      expect(() => calculateFLSM("2001:db8::", 127, 4)).toThrow(/exceeds/i);
    });

    it("handles /128 single host and /127 inter-router links correctly", () => {
      const res128 = calculateFLSM("2001:db8::1", 128, 1);
      expect(res128.subnets[0]?.usableHosts).toBe("1");
      expect(res128.subnets[0]?.hostRange.first).toBe("2001:db8::1");
      expect(res128.subnets[0]?.hostRange.last).toBe("2001:db8::1");

      const res127 = calculateFLSM("2001:db8::", 127, 1);
      expect(res127.subnets[0]?.usableHosts).toBe("2");
    });

    it("throws error for out-of-range prefix or invalid IPv6", () => {
      expect(() => calculateFLSM("2001:db8::", 129, 4)).toThrow(
        /out of range/i,
      );
      expect(() => calculateFLSM("2001:invalid::", 64, 4)).toThrow(/invalid/i);
    });
  });
});
