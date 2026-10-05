import { CalculateResult, PropertyItem, AddressRole } from "./types.js";
import { parseIPv6ToBigInt } from "./parse.js";
import { formatReverseDnsZone } from "./format.js";

const MASK_128 = (1n << 128n) - 1n;

export function bigIntToHextets(val: bigint): number[] {
  const hextets: number[] = [];
  for (let i = 7; i >= 0; i--) {
    const shift = BigInt(i * 16);
    const h = Number((val >> shift) & 0xffffn);
    hextets.push(h);
  }
  return hextets;
}

export function hextetsToBigInt(hextets: number[]): bigint {
  let val = 0n;
  for (let i = 0; i < 8; i++) {
    val = (val << 16n) | BigInt(hextets[i] ?? 0);
  }
  return val;
}

// RFC 5952 IPv6 canonical text representation
export function formatIPv6Canonical(val: bigint): string {
  const hextets = bigIntToHextets(val);

  // Find longest run of zeros of length >= 2
  let maxStart = -1;
  let maxLength = 0;

  let currentStart = -1;
  let currentLength = 0;

  for (let i = 0; i < 8; i++) {
    if (hextets[i] === 0) {
      if (currentStart === -1) {
        currentStart = i;
        currentLength = 1;
      } else {
        currentLength++;
      }
    } else {
      if (currentLength > maxLength) {
        maxLength = currentLength;
        maxStart = currentStart;
      }
      currentStart = -1;
      currentLength = 0;
    }
  }
  if (currentLength > maxLength) {
    maxLength = currentLength;
    maxStart = currentStart;
  }

  // RFC 5952: "The symbol \"::\" MUST NOT be used to shorten just one 16-bit 0 field"
  if (maxLength < 2) {
    return hextets.map((h) => h.toString(16)).join(":");
  }

  const left = hextets.slice(0, maxStart).map((h) => h.toString(16));
  const right = hextets.slice(maxStart + maxLength).map((h) => h.toString(16));

  const leftStr = left.join(":");
  const rightStr = right.join(":");

  return `${leftStr}::${rightStr}`;
}

export function prefixToMask128(prefix: number): bigint {
  if (prefix === 0) return 0n;
  if (prefix === 128) return MASK_128;
  const hostBits = BigInt(128 - prefix);
  const hostMask = (1n << hostBits) - 1n;
  return (MASK_128 ^ hostMask) & MASK_128;
}

export function getIPv6Bits(val: bigint, prefix: number) {
  let bitStr = "";
  const grouped: string[] = [];

  for (let i = 7; i >= 0; i--) {
    const shift = BigInt(i * 16);
    const h = Number((val >> shift) & 0xffffn);
    const bin1 = ((h >>> 8) & 0xff).toString(2).padStart(8, "0");
    const bin2 = (h & 0xff).toString(2).padStart(8, "0");
    const hex = h.toString(16).padStart(4, "0");
    grouped.push(`${hex} = ${bin1} ${bin2}`);
    bitStr += bin1 + bin2;
  }

  const network = bitStr.substring(0, prefix);
  const host = bitStr.substring(prefix);

  return { network, host, grouped };
}

export function extractEUI64Mac(interfaceId: bigint): string | null {
  // interfaceId is 64-bit BigInt
  const bytes: number[] = [];
  for (let i = 7; i >= 0; i--) {
    bytes.push(Number((interfaceId >> BigInt(i * 8)) & 0xffn));
  }

  // EUI-64 check: middle bytes are 0xff, 0xfe
  if (bytes[3] === 0xff && bytes[4] === 0xfe) {
    // Invert Universal/Local bit (bit 1 of first byte)
    const b0 = (bytes[0] ?? 0) ^ 0x02;
    const b1 = bytes[1] ?? 0;
    const b2 = bytes[2] ?? 0;
    const b3 = bytes[5] ?? 0;
    const b4 = bytes[6] ?? 0;
    const b5 = bytes[7] ?? 0;

    const hexParts = [b0, b1, b2, b3, b4, b5].map((b) =>
      b.toString(16).padStart(2, "0"),
    );
    return hexParts.join(":");
  }

  return null;
}

function determineIPv6Role(
  addr: bigint,
  prefix: number,
  network: bigint,
  addrCanon: string,
  netCanon: string,
): { role: AddressRole; roleProperty: PropertyItem } {
  if (addr === 0n && prefix === 128) {
    return {
      role: "unspecified",
      roleProperty: { key: "Role", value: `${addrCanon} is the UNSPECIFIED address` },
    };
  }
  if (addr >> 120n === 0xffn) {
    return {
      role: "multicast",
      roleProperty: { key: "Role", value: `${addrCanon} is a MULTICAST address` },
    };
  }
  if (prefix === 128) {
    return {
      role: "host",
      roleProperty: { key: "Role", value: `${addrCanon} is a HOST address in ${addrCanon}/128` },
    };
  }
  if (addr === network) {
    return {
      role: "network",
      roleProperty: { key: "Role", value: `${addrCanon} is a NETWORK address` },
    };
  }
  return {
    role: "host",
    roleProperty: { key: "Role", value: `${addrCanon} is a HOST address in ${netCanon}/${prefix}` },
  };
}

function getMulticastScopeName(scopeNibble: number): string {
  switch (scopeNibble) {
    case 1:
      return "interface-local";
    case 2:
      return "link-local";
    case 3:
      return "realm-local";
    case 4:
      return "admin-local";
    case 5:
      return "site-local";
    case 8:
      return "organization-local";
    case 0xe:
      return "global";
    default:
      return "reserved";
  }
}

function identifyIPv6ScopeProperties(addr: bigint): PropertyItem[] {
  const firstHextet = Number((addr >> 112n) & 0xffffn);

  if (addr === 0n) {
    return [{ key: "Scope", value: "Unspecified" }];
  }
  if (addr === 1n) {
    return [{ key: "Scope", value: "Loopback" }];
  }
  if (addr >> 120n === 0xffn) {
    const flags = Number((addr >> 116n) & 0x0fn);
    const scopeNibble = Number((addr >> 112n) & 0x0fn);
    const scopeName = getMulticastScopeName(scopeNibble);
    return [
      { key: "Multicast Scope", value: scopeName },
      { key: "Multicast Flags", value: `0x${flags.toString(16)}` },
    ];
  }
  if (addr >> 118n === 0x3f8n) {
    return [{ key: "Scope", value: "Link-Local Unicast (RFC 4291)" }];
  }
  if (addr >> 121n === 0x7en) {
    const isLocal = ((addr >> 120n) & 1n) === 1n;
    const globalId = (addr >> 80n) & 0xffffffffffn;
    const subnetId = (addr >> 64n) & 0xffffn;
    return [
      { key: "Scope", value: "Unique Local Unicast (RFC 4193)" },
      { key: "ULA Type", value: isLocal ? "Locally Assigned (L=1)" : "IETF Reserved (L=0)" },
      { key: "ULA Global ID", value: `0x${globalId.toString(16).padStart(10, "0")}` },
      { key: "ULA Subnet ID", value: `0x${subnetId.toString(16).padStart(4, "0")}` },
    ];
  }
  if (firstHextet === 0x2002) {
    const v4Num = Number((addr >> 80n) & 0xffffffffn);
    const v4 = `${(v4Num >>> 24) & 0xff}.${(v4Num >>> 16) & 0xff}.${(v4Num >>> 8) & 0xff}.${v4Num & 0xff}`;
    return [
      { key: "Scope", value: "6to4 Anycast (RFC 3056)" },
      { key: "6to4 Encapsulated IPv4", value: v4 },
    ];
  }
  if (addr >> 32n === 0xffffn && addr >> 48n === 0n) {
    return [{ key: "Scope", value: "IPv4-Mapped (RFC 4291)" }];
  }
  if (addr >> 125n === 1n) {
    return [{ key: "Scope", value: "Global Unicast" }];
  }
  return [];
}

function getGlobalUnicastProperties(addr: bigint, interfaceId: bigint): PropertyItem[] {
  const h4 = Number((interfaceId >> 48n) & 0xffffn).toString(16).padStart(4, "0");
  const h5 = Number((interfaceId >> 32n) & 0xffffn).toString(16).padStart(4, "0");
  const h6 = Number((interfaceId >> 16n) & 0xffffn).toString(16).padStart(4, "0");
  const h7 = Number(interfaceId & 0xffffn).toString(16).padStart(4, "0");
  const iidStr = `${h4}:${h5}:${h6}:${h7}`;

  const low24 = Number(addr & 0xffffffn);
  const snHex1 = ((low24 >>> 16) & 0xff).toString(16).padStart(2, "0");
  const snHex2 = (low24 & 0xffff).toString(16).padStart(4, "0");
  const solMulticast = `ff02::1:ff${snHex1}:${snHex2}`;

  const props: PropertyItem[] = [
    { key: "Interface ID", value: iidStr },
    { key: "Solicited-Node Multicast", value: solMulticast },
  ];

  const mac = extractEUI64Mac(interfaceId);
  if (mac) {
    props.push({ key: "MAC Address (from EUI-64)", value: mac });
  }
  return props;
}

export function calculateIPv6(ipStr: string, prefix: number): CalculateResult {
  const addr = parseIPv6ToBigInt(ipStr);
  if (addr === null) {
    throw new Error(`Invalid IPv6 address: "${ipStr}"`);
  }
  if (prefix < 0 || prefix > 128) {
    throw new Error(`IPv6 prefix /${prefix} is out of range (0-128)`);
  }

  const mask = prefixToMask128(prefix);
  const wildcard = ~mask & MASK_128;
  const network = addr & mask;
  const lastAddr = network | wildcard;

  const addrCanon = formatIPv6Canonical(addr);
  const netCanon = formatIPv6Canonical(network);
  const maskCanon = formatIPv6Canonical(mask);
  const wildcardCanon = formatIPv6Canonical(wildcard);

  const hostBits = 128 - prefix;
  const hex = addr.toString(16).toUpperCase().padStart(32, "0");
  const bits = getIPv6Bits(addr, prefix);

  const { role, roleProperty } = determineIPv6Role(
    addr,
    prefix,
    network,
    addrCanon,
    netCanon,
  );
  const properties: PropertyItem[] = [
    roleProperty,
    ...identifyIPv6ScopeProperties(addr),
  ];

  // Global Unicast Properties (Interface ID, Solicited Node Multicast, EUI-64)
  if (prefix <= 64 || addr >> 125n === 1n) {
    const interfaceId = addr & 0xffffffffffffffffn;
    properties.push(...getGlobalUnicastProperties(addr, interfaceId));
  }

  // Hosts and Range Calculation
  let maxHosts: string;
  let hostRange: { first: string; last: string } | null = null;

  if (prefix === 128) {
    maxHosts = "1";
    hostRange = { first: addrCanon, last: addrCanon };
  } else {
    const hostCountBig = (1n << BigInt(hostBits)) - 1n;
    maxHosts = hostCountBig.toString();
    const firstHostBig = network + 1n;
    hostRange = {
      first: formatIPv6Canonical(firstHostBig),
      last: formatIPv6Canonical(lastAddr),
    };
  }

  return {
    family: 6,
    address: addrCanon,
    prefix,
    network: netCanon,
    netmask: maskCanon,
    wildcard: wildcardCanon,
    broadcast: null,
    hostBits,
    maxHosts,
    hostRange,
    hex,
    bits,
    role,
    properties,
    warnings: [],
    reverseDnsZone: formatReverseDnsZone(addrCanon, 6),
  };
}
