import { describe, it, expect } from "vitest";
import { exportToCsv, escapeCsvField } from "../src/engine/export.js";

describe("CSV Export", () => {
  it("formats objects into RFC 4180 compliant CSV text", () => {
    const data = [
      { name: "LAN, Primary", subnetId: "192.168.1.0", mask: "255.255.255.0" },
      { name: "WAN Link", subnetId: "10.0.0.0", mask: "255.255.255.252" },
    ];
    const csv = exportToCsv(data, [
      { key: "name", label: "Subnet Name" },
      { key: "subnetId", label: "Subnet ID" },
      { key: "mask", label: "Mask" },
    ]);

    expect(csv).toContain("Subnet Name,Subnet ID,Mask");
    expect(csv).toContain('"LAN, Primary",192.168.1.0,255.255.255.0');
    expect(csv).toContain("WAN Link,10.0.0.0,255.255.255.252");
  });

  it("escapes quotes and newlines according to RFC 4180", () => {
    expect(escapeCsvField('Test "Quotes"')).toBe('"Test ""Quotes"""');
    expect(escapeCsvField("Line1\nLine2")).toBe('"Line1\nLine2"');
  });

  it("neutralizes potential spreadsheet formula injection", () => {
    expect(escapeCsvField("=1+1")).toBe("'=1+1");
    expect(escapeCsvField("@SUM(A1)")).toBe("'@SUM(A1)");
    // Normal negative numbers should not be modified
    expect(escapeCsvField("-42")).toBe("-42");
  });
});
