export type AddressFamily = 4 | 6;

export type AddressRole =
  "host" | "network" | "broadcast" | "multicast" | "unspecified";

export interface PropertyItem {
  key: string;
  value: string;
}

export interface BitRepresentation {
  network: string;
  host: string;
  grouped: string[];
}

export interface HostRange {
  first: string;
  last: string;
}

export interface CalculateRequest {
  input: string;
  prefix?: string;
  reverseDns?: boolean;
  geoip?: boolean;
  uniqueLocal?: false | "standard" | "hq";
}

export interface DnsInfo {
  hostname: string | null;
  error?: string;
}

export interface GeoInfo {
  country: string;
  code: string;
}

export interface CalculateResult {
  family: AddressFamily;
  address: string;
  prefix: number;
  network: string;
  netmask: string;
  wildcard: string;
  broadcast: string | null;
  hostBits: number;
  maxHosts: string;
  hostRange: HostRange | null;
  hex: string;
  bits: BitRepresentation;
  role: AddressRole;
  properties: PropertyItem[];
  dns?: DnsInfo;
  geo?: GeoInfo | null;
  warnings: string[];
}

export interface ParseResult {
  rawInput: string;
  addressString: string;
  prefix: number;
  family: AddressFamily;
  zoneIndex?: string;
}
