import { describe, it, expect } from "vitest";
import { summarizeRoutes } from "../src/engine/cidr.js";

describe("CIDR Supernetting", () => {
  it("aggregates 4 contiguous class C blocks into a single /22 route", () => {
    const routes = [
      "192.168.0.0/24",
      "192.168.1.0/24",
      "192.168.2.0/24",
      "192.168.3.0/24",
    ];
    const res = summarizeRoutes(routes);
    expect(res.aggregatedRoute).toBe("192.168.0.0/22");
    expect(res.supernetMask).toBe("255.255.252.0");
    expect(res.supernetPrefix).toBe(22);
    expect(res.totalAddresses).toBe(1024);
    expect(res.isContiguous).toBe(true);
    expect(res.minAddress).toBe("192.168.0.0");
    expect(res.maxAddress).toBe("192.168.3.255");
  });

  it("handles non-contiguous blocks and identifies gaps", () => {
    const routes = ["10.0.0.0/24", "10.0.2.0/24"];
    const res = summarizeRoutes(routes);
    // Spans 10.0.0.0 to 10.0.2.255 -> needs /22 to cover 10.0.0.0 through 10.0.3.255
    expect(res.aggregatedRoute).toBe("10.0.0.0/22");
    expect(res.isContiguous).toBe(false);
  });

  it("summarizes a single route to itself", () => {
    const routes = ["172.16.0.0/16"];
    const res = summarizeRoutes(routes);
    expect(res.aggregatedRoute).toBe("172.16.0.0/16");
    expect(res.supernetMask).toBe("255.255.0.0");
    expect(res.totalAddresses).toBe(65536);
    expect(res.isContiguous).toBe(true);
  });

  it("throws error for empty list or invalid routes", () => {
    expect(() => summarizeRoutes([])).toThrow(/at least one route/i);
    expect(() => summarizeRoutes(["invalid-route"])).toThrow(/invalid/i);
  });
});
