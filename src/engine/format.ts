import { CalculateResult } from "./types.js";

export function formatResultPlainText(res: CalculateResult): string {
  const lines: string[] = [];

  lines.push(`Address        = ${res.address}`);

  // Bits
  if (res.family === 4) {
    lines.push(`                    ${res.bits.grouped.join(" . ")}`);
  } else {
    for (const group of res.bits.grouped) {
      lines.push(`                    ${group}`);
    }
  }

  lines.push(`Network        = ${res.network} / ${res.prefix}`);
  lines.push(`Netmask        = ${res.netmask}`);

  if (res.family === 4) {
    if (res.broadcast) {
      lines.push(`Broadcast      = ${res.broadcast}`);
    } else {
      lines.push(`Broadcast      = not needed on Point-to-Point links`);
    }
  }

  lines.push(`Wildcard Mask  = ${res.wildcard}`);

  if (res.family === 4) {
    lines.push(`Hex. Address   = ${res.hex}`);
  }

  lines.push(`Host Bits      = ${res.hostBits}`);

  // Max Hosts & Range
  if (res.role !== "multicast") {
    let formula = "";
    if (res.family === 4) {
      if (res.prefix === 31 || res.prefix === 32) {
        formula = `(2^${res.hostBits} - 0)`;
      } else {
        formula = `(2^${res.hostBits} - 2)`;
      }
    } else {
      if (res.prefix === 128) {
        formula = `(2^0 - 0)`;
      } else {
        formula = `(2^${res.hostBits} - 1)`;
      }
    }
    lines.push(`Max. Hosts     = ${res.maxHosts}   ${formula}`);

    if (res.hostRange) {
      lines.push(
        `Host Range     = { ${res.hostRange.first} - ${res.hostRange.last} }`,
      );
    }
  }

  // Properties
  lines.push(`Properties     = `);
  for (const prop of res.properties) {
    if (prop.key === "Role") {
      lines.push(`   - ${prop.value}`);
    } else if (prop.key === "Class") {
      lines.push(`   - ${prop.value}`);
    } else if (prop.key === "Scope" && !prop.value.startsWith("Global")) {
      lines.push(`   - ${prop.value}`);
    } else if (
      prop.key === "Interface ID" ||
      prop.key === "MAC Address (from EUI-64)" ||
      prop.key === "Solicited-Node Multicast"
    ) {
      // Group under Global Unicast Properties if not already printed
      if (!lines.includes("   - Global Unicast Properties:")) {
        lines.push(`   - Global Unicast Properties:`);
      }
      const label =
        prop.key === "MAC Address (from EUI-64)"
          ? "MAC Address                     "
          : prop.key === "Solicited-Node Multicast"
            ? "Solicited Node Multicast Address"
            : "Interface ID                    ";
      lines.push(`      + ${label} = ${prop.value}`);
    } else if (prop.key.startsWith("ULA ")) {
      if (!lines.includes("   - Unique Local Unicast Properties:")) {
        lines.push(`   - Unique Local Unicast Properties:`);
        lines.push(`      + Locally chosen`);
      }
      const label = prop.key.replace("ULA ", "").padEnd(32, " ");
      lines.push(`      + ${label} = ${prop.value}`);
    } else if (prop.key === "Multicast Scope") {
      lines.push(`      + Scope: ${prop.value}`);
    } else if (prop.key === "Corresponding Multicast MAC") {
      lines.push(`      + Corresponding multicast MAC address: ${prop.value}`);
    } else {
      lines.push(`   - ${prop.key}: ${prop.value}`);
    }
  }

  if (res.dns?.hostname) {
    lines.push(`DNS Hostname   = ${res.dns.hostname}`);
  }
  if (res.geo?.country) {
    lines.push(`GeoIP Country  = ${res.geo.country} (${res.geo.code})`);
  }

  return lines.join("\n");
}
