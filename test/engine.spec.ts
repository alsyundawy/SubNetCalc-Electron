import { describe, it, expect } from "vitest";
import {
  parseSubnetInput,
  calculateIPv4,
  calculateIPv6,
  generateUniqueLocal,
  formatResultPlainText,
  calculateSubnet,
  formatBitClassMap,
  formatReverseDnsZone,
} from "../src/engine/index.js";

describe("T1: Subnet Input Parser", () => {
  it("should parse standard CIDR", () => {
    const res = parseSubnetInput("192.168.1.1/24");
    expect(res.family).toBe(4);
    expect(res.addressString).toBe("192.168.1.1");
    expect(res.prefix).toBe(24);
  });

  it("should parse space-separated prefix", () => {
    const res = parseSubnetInput("192.168.1.1 24");
    expect(res.family).toBe(4);
    expect(res.addressString).toBe("192.168.1.1");
    expect(res.prefix).toBe(24);
  });

  it("should parse dotted netmask with slash and space", () => {
    const res1 = parseSubnetInput("10.0.0.1/255.255.0.0");
    expect(res1.prefix).toBe(16);

    const res2 = parseSubnetInput("10.0.0.1 255.255.255.0");
    expect(res2.prefix).toBe(24);
  });

  it("should use default prefix if omitted (24 for IPv4, 64 for IPv6)", () => {
    const v4 = parseSubnetInput("1.2.3.4");
    expect(v4.prefix).toBe(24);

    const v6 = parseSubnetInput("2001:db8::1");
    expect(v6.prefix).toBe(64);
  });

  it("should reject non-contiguous netmasks", () => {
    expect(() => parseSubnetInput("192.168.1.1/255.0.255.0")).toThrow(
      "Non-contiguous",
    );
    expect(() => parseSubnetInput("2001:db8::1/ffff:0:ffff::")).toThrow(
      "Non-contiguous",
    );
  });

  it("should reject out-of-range prefixes", () => {
    expect(() => parseSubnetInput("192.168.1.1/33")).toThrow("out of range");
    expect(() => parseSubnetInput("2001:db8::1/129")).toThrow("out of range");
  });

  it("should extract zone index for IPv6", () => {
    const res = parseSubnetInput("fe80::1%eth0/64");
    expect(res.addressString).toBe("fe80::1");
    expect(res.zoneIndex).toBe("eth0");
    expect(res.prefix).toBe(64);
  });
});

describe("T2: IPv4 Engine", () => {
  it("should match upstream fixture 132.252.150.154/28", () => {
    const res = calculateIPv4("132.252.150.154", 28);
    expect(res.network).toBe("132.252.150.144");
    expect(res.netmask).toBe("255.255.255.240");
    expect(res.wildcard).toBe("0.0.0.15");
    expect(res.broadcast).toBe("132.252.150.159");
    expect(res.hostBits).toBe(4);
    expect(res.maxHosts).toBe("14");
    expect(res.hostRange).toEqual({
      first: "132.252.150.145",
      last: "132.252.150.158",
    });
    expect(res.hex).toBe("84FC969A");
    expect(res.role).toBe("host");
    expect(res.properties.some((p) => p.value.includes("Class B"))).toBe(true);
  });

  it("should handle /31 RFC 3021 point-to-point correctly", () => {
    const res = calculateIPv4("192.168.0.1", 31);
    expect(res.network).toBe("192.168.0.0");
    expect(res.netmask).toBe("255.255.255.254");
    expect(res.broadcast).toBeNull();
    expect(res.maxHosts).toBe("2");
    expect(res.hostRange).toEqual({
      first: "192.168.0.0",
      last: "192.168.0.1",
    });
    expect(res.role).toBe("host");

    const netRes = calculateIPv4("192.168.0.0", 31);
    expect(netRes.role).toBe("host");
    expect(netRes.broadcast).toBeNull();
  });

  it("identifies both addresses in /31 as usable host interfaces per RFC 3021", () => {
    const res1 = calculateIPv4("10.0.0.0", 31);
    const res2 = calculateIPv4("10.0.0.1", 31);
    expect(res1.role).toBe("host");
    expect(res2.role).toBe("host");
    expect(res1.broadcast).toBeNull();
  });

  it("should handle /32 single host correctly", () => {
    const res = calculateIPv4("1.1.1.1", 32);
    expect(res.network).toBe("1.1.1.1");
    expect(res.netmask).toBe("255.255.255.255");
    expect(res.broadcast).toBeNull();
    expect(res.maxHosts).toBe("1");
    expect(res.hostRange).toEqual({
      first: "1.1.1.1",
      last: "1.1.1.1",
    });
    expect(res.hex).toBe("01010101");
  });

  it("should handle 10.0.0.0/8 network address", () => {
    const res = calculateIPv4("10.0.0.0", 8);
    expect(res.network).toBe("10.0.0.0");
    expect(res.broadcast).toBe("10.255.255.255");
    expect(res.maxHosts).toBe("16777214");
    expect(res.role).toBe("network");
    expect(res.properties.some((p) => p.value === "Private")).toBe(true);
  });

  it("identifies 255.255.255.255 as Class E (Experimental / Reserved)", () => {
    const res = calculateIPv4("255.255.255.255", 32);
    expect(res.network).toBe("255.255.255.255");
    expect(res.hex).toBe("FFFFFFFF");
    const classProp = res.properties.find((p) => p.key === "Class");
    expect(classProp?.value).toBe("Class E");
  });

  it("should handle multicast 224.0.0.1/24", () => {
    const res = calculateIPv4("224.0.0.1", 24);
    expect(res.role).toBe("multicast");
    expect(
      res.properties.some(
        (p) => p.key === "Multicast Scope" && p.value === "link-local",
      ),
    ).toBe(true);
    expect(
      res.properties.some(
        (p) =>
          p.key === "Corresponding Multicast MAC" &&
          p.value === "01:00:5e:00:00:01",
      ),
    ).toBe(true);
  });
});

describe("T3: IPv6 Engine", () => {
  it("should match upstream fixture 2001:638:501:4ef8:223:aeff:fea4:8ca9/64 with EUI-64", () => {
    const res = calculateIPv6("2001:638:501:4ef8:223:aeff:fea4:8ca9", 64);
    expect(res.network).toBe("2001:638:501:4ef8::");
    expect(res.netmask).toBe("ffff:ffff:ffff:ffff::");
    expect(res.wildcard).toBe("::ffff:ffff:ffff:ffff");
    expect(res.hostBits).toBe(64);
    expect(res.maxHosts).toBe("18446744073709551615");
    expect(res.hostRange).toEqual({
      first: "2001:638:501:4ef8::1",
      last: "2001:638:501:4ef8:ffff:ffff:ffff:ffff",
    });

    const iid = res.properties.find((p) => p.key === "Interface ID")?.value;
    expect(iid).toBe("0223:aeff:fea4:8ca9");

    const mac = res.properties.find(
      (p) => p.key === "MAC Address (from EUI-64)",
    )?.value;
    expect(mac).toBe("00:23:ae:a4:8c:a9");

    const sn = res.properties.find(
      (p) => p.key === "Solicited-Node Multicast",
    )?.value;
    expect(sn).toBe("ff02::1:ffa4:8ca9");
  });

  it("should match upstream fixture 2401:3800:c001::68/128", () => {
    const res = calculateIPv6("2401:3800:c001::68", 128);
    expect(res.network).toBe("2401:3800:c001::68");
    expect(res.netmask).toBe("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff");
    expect(res.wildcard).toBe("::");
    expect(res.hostBits).toBe(0);
    expect(res.maxHosts).toBe("1");
    expect(res.hostRange).toEqual({
      first: "2401:3800:c001::68",
      last: "2401:3800:c001::68",
    });

    const iid = res.properties.find((p) => p.key === "Interface ID")?.value;
    expect(iid).toBe("0000:0000:0000:0068");

    const sn = res.properties.find(
      (p) => p.key === "Solicited-Node Multicast",
    )?.value;
    expect(sn).toBe("ff02::1:ff00:0068");
  });
});

describe("T4: Unique Local IPv6 & Formatter", () => {
  it("should generate deterministic ULA with injected RNG matching upstream", () => {
    const bytes5 = new Uint8Array([0x5b, 0xec, 0xa5, 0xf4, 0xb3]);
    const ula = generateUniqueLocal(
      "2001:638:501:4ef8:223:aeff:fea4:8ca9",
      bytes5,
    );
    expect(ula.address).toBe("fd5b:eca5:f4b3:4ef8:223:aeff:fea4:8ca9");
    expect(ula.globalIdHex).toBe("5beca5f4b3");
    expect(ula.subnetIdHex).toBe("4ef8");

    const res = calculateSubnet(
      {
        input: "2001:638:501:4ef8:223:aeff:fea4:8ca9/64",
        uniqueLocal: "standard",
      },
      bytes5,
    );
    expect(res.address).toBe("fd5b:eca5:f4b3:4ef8:223:aeff:fea4:8ca9");
    expect(res.network).toBe("fd5b:eca5:f4b3:4ef8::");
  });

  it("should reject ULA generation for IPv4", () => {
    const bytes5 = new Uint8Array(5);
    expect(() =>
      calculateSubnet(
        { input: "192.168.1.1/24", uniqueLocal: "standard" },
        bytes5,
      ),
    ).toThrow("not valid for IPv4");
  });

  it("should format plain text output matching CLI structure", () => {
    const res = calculateIPv4("132.252.150.154", 28);
    const text = formatResultPlainText(res);
    expect(text).toContain("Address        = 132.252.150.154");
    expect(text).toContain("Network        = 132.252.150.144 / 28");
    expect(text).toContain("Netmask        = 255.255.255.240");
    expect(text).toContain("Broadcast      = 132.252.150.159");
    expect(text).toContain("Max. Hosts     = 14   (2^4 - 2)");
    expect(text).toContain(
      "Host Range     = { 132.252.150.145 - 132.252.150.158 }",
    );
    expect(text).toContain("Class B");
  });
});

describe("T5: Bit Classification Map & Reverse DNS Zones", () => {
  it("generates bit classification string with n, s, h characters", () => {
    // 10.32.2.52/30 (Class A: 8 net bits, 22 subnet bits, 2 host bits)
    const map = formatBitClassMap(0x0a200234, 30);
    expect(map).toBe("nnnnnnnn.ssssssss.ssssssss.sssssshh");
  });

  it("generates bit classification string for Class B and Class C", () => {
    // 172.16.1.1/24 (Class B: 16 net bits, 8 subnet bits, 8 host bits)
    const mapB = formatBitClassMap(0xac100101, 24);
    expect(mapB).toBe("nnnnnnnn.nnnnnnnn.ssssssss.hhhhhhhh");

    // 192.168.1.1/28 (Class C: 24 net bits, 4 subnet bits, 4 host bits)
    const mapC = formatBitClassMap(0xc0a80101, 28);
    expect(mapC).toBe("nnnnnnnn.nnnnnnnn.nnnnnnnn.sssshhhh");
  });

  it("generates ip6.arpa reverse DNS zone string", () => {
    const arpa = formatReverseDnsZone("2001:db8::1", 6);
    expect(arpa).toBe(
      "1.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.0.8.b.d.0.1.0.0.2.ip6.arpa",
    );
  });

  it("generates in-addr.arpa reverse DNS zone string for IPv4", () => {
    const arpa = formatReverseDnsZone("192.168.1.50", 4);
    expect(arpa).toBe("50.1.168.192.in-addr.arpa");
  });
});
