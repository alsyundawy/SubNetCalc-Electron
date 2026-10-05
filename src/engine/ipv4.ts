import { CalculateResult, PropertyItem, AddressRole } from "./types.js";
import { parseIPv4ToUint32 } from "./parse.js";

export function uint32ToIPv4(val: number): string {
  const octet1 = (val >>> 24) & 0xff;
  const octet2 = (val >>> 16) & 0xff;
  const octet3 = (val >>> 8) & 0xff;
  const octet4 = val & 0xff;
  return `${octet1}.${octet2}.${octet3}.${octet4}`;
}

export function prefixToMask32(prefix: number): number {
  if (prefix === 0) return 0;
  if (prefix === 32) return 0xffffffff;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

export function getIPv4Bits(val: number, prefix: number) {
  let bitStr = "";
  const grouped: string[] = [];

  for (let i = 0; i < 4; i++) {
    const octet = (val >>> (24 - i * 8)) & 0xff;
    const bin = octet.toString(2).padStart(8, "0");
    grouped.push(bin);
    bitStr += bin;
  }

  const network = bitStr.substring(0, prefix);
  const host = bitStr.substring(prefix);

  return { network, host, grouped };
}

export function calculateIPv4(ipStr: string, prefix: number): CalculateResult {
  const addr = parseIPv4ToUint32(ipStr);
  if (addr === null) {
    throw new Error(`Invalid IPv4 address: "${ipStr}"`);
  }
  if (prefix < 0 || prefix > 32) {
    throw new Error(`IPv4 prefix /${prefix} is out of range (0-32)`);
  }

  const mask = prefixToMask32(prefix);
  const wildcard = ~mask >>> 0;
  const network = (addr & mask) >>> 0;
  const broadcastNum = (network | wildcard) >>> 0;

  const netStr = uint32ToIPv4(network);
  const maskStr = uint32ToIPv4(mask);
  const wildcardStr = uint32ToIPv4(wildcard);
  const broadcastStr = prefix >= 31 ? null : uint32ToIPv4(broadcastNum);

  const hostBits = 32 - prefix;
  const hex = addr.toString(16).toUpperCase().padStart(8, "0");
  const bits = getIPv4Bits(addr, prefix);

  const firstOctet = (addr >>> 24) & 0xff;
  const isMulticast = firstOctet >= 224 && firstOctet <= 239;

  let role: AddressRole = "host";
  const properties: PropertyItem[] = [];

  if (isMulticast) {
    role = "multicast";
    properties.push({ key: "Role", value: `${ipStr} is a MULTICAST address` });
  } else if (prefix === 31) {
    if (addr === network) {
      role = "network";
      properties.push({ key: "Role", value: `${ipStr} is a NETWORK address` });
    } else {
      role = "broadcast";
      properties.push({
        key: "Role",
        value: `${ipStr} is the BROADCAST address of ${netStr}/31`,
      });
    }
  } else if (prefix === 32) {
    role = "host";
    properties.push({
      key: "Role",
      value: `${ipStr} is a HOST address in ${ipStr}/32`,
    });
  } else {
    if (addr === network) {
      role = "network";
      properties.push({ key: "Role", value: `${ipStr} is a NETWORK address` });
    } else if (addr === broadcastNum) {
      role = "broadcast";
      properties.push({
        key: "Role",
        value: `${ipStr} is the BROADCAST address of ${netStr}/${prefix}`,
      });
    } else {
      role = "host";
      properties.push({
        key: "Role",
        value: `${ipStr} is a HOST address in ${netStr}/${prefix}`,
      });
    }
  }

  // Class Identification
  if (firstOctet <= 127) {
    properties.push({ key: "Class", value: "Class A" });
  } else if (firstOctet <= 191) {
    properties.push({ key: "Class", value: "Class B" });
  } else if (firstOctet <= 223) {
    properties.push({ key: "Class", value: "Class C" });
  } else if (firstOctet <= 239) {
    properties.push({ key: "Class", value: "Class D (Multicast)" });
  } else if (firstOctet <= 254) {
    properties.push({ key: "Class", value: "Class E" });
  } else {
    properties.push({
      key: "Class",
      value: "Invalid (not in class A, B, C or D)",
    });
  }

  // Special Class D multicast details
  if (isMulticast) {
    let scope = "global";
    if (
      firstOctet === 224 &&
      ((addr >>> 16) & 0xff) === 0 &&
      ((addr >>> 8) & 0xff) === 0
    ) {
      scope = "link-local";
    } else if (
      firstOctet === 224 &&
      ((addr >>> 16) & 0xff) === 0 &&
      ((addr >>> 8) & 0xff) === 1
    ) {
      scope = "internetwork control";
    } else if (firstOctet === 239) {
      scope = "administratively scoped";
    }
    properties.push({ key: "Multicast Scope", value: scope });

    // Multicast MAC: 01:00:5e:00:00:00 + lower 23 bits
    const lower23 = addr & 0x7fffff;
    const b1 = (lower23 >>> 16) & 0x7f;
    const b2 = (lower23 >>> 8) & 0xff;
    const b3 = lower23 & 0xff;
    const macStr = `01:00:5e:${b1.toString(16).padStart(2, "0")}:${b2.toString(16).padStart(2, "0")}:${b3.toString(16).padStart(2, "0")}`;
    properties.push({ key: "Corresponding Multicast MAC", value: macStr });
  }

  // RFC Properties
  // Private (RFC 1918): 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
  if (
    firstOctet === 10 ||
    (firstOctet === 172 && ((addr >>> 16) & 0xf0) === 16) ||
    (firstOctet === 192 && ((addr >>> 16) & 0xff) === 168)
  ) {
    properties.push({ key: "Scope", value: "Private" });
  } else if (firstOctet === 127) {
    properties.push({ key: "Scope", value: "Loopback" });
  } else if (firstOctet === 169 && ((addr >>> 16) & 0xff) === 254) {
    properties.push({ key: "Scope", value: "Link-Local" });
  } else if (firstOctet === 100 && ((addr >>> 16) & 0xc0) === 64) {
    properties.push({ key: "Scope", value: "Shared Address Space (CGNAT)" });
  }

  // Host Calculation
  let maxHosts = "0";
  let hostRange: { first: string; last: string } | null = null;

  if (!isMulticast) {
    if (prefix === 32) {
      maxHosts = "1";
      hostRange = { first: ipStr, last: ipStr };
    } else if (prefix === 31) {
      maxHosts = "2";
      hostRange = { first: netStr, last: uint32ToIPv4(network + 1) };
    } else {
      const hostsNum = 2 ** hostBits - 2;
      maxHosts = hostsNum.toString();
      hostRange = {
        first: uint32ToIPv4(network + 1),
        last: uint32ToIPv4(broadcastNum - 1),
      };
    }
  }

  return {
    family: 4,
    address: uint32ToIPv4(addr),
    prefix,
    network: netStr,
    netmask: maskStr,
    wildcard: wildcardStr,
    broadcast: broadcastStr,
    hostBits,
    maxHosts,
    hostRange,
    hex,
    bits,
    role,
    properties,
    warnings: [],
  };
}
