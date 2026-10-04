import fs from "node:fs/promises";
import path from "node:path";
import { Reader, CountryResponse } from "maxmind";
import { app } from "electron";
import { GeoInfo } from "@engine/types.js";

let geoReader: Reader<CountryResponse> | null = null;
let readerInitialized = false;

/**
 * Initializes the GeoIP MMDB reader once and asynchronously.
 * readerInitialized is set to true even on a miss (database absent)
 * to ensure the app never spins or re-scans the filesystem on subsequent lookups.
 */
export async function initGeoIP(customPath?: string): Promise<boolean> {
  if (readerInitialized) return geoReader !== null;

  const candidatePaths: string[] = [];
  if (customPath) {
    candidatePaths.push(customPath);
  }

  try {
    const userData = app.getPath("userData");
    candidatePaths.push(
      path.join(userData, "GeoLite2-Country.mmdb"),
      path.join(userData, "GeoIP2-Country.mmdb"),
      path.join(userData, "Country.mmdb"),
    );
  } catch {
    // app.getPath might fail if called before app ready
  }

  // Also check project/data directory
  candidatePaths.push(
    path.join(process.cwd(), "GeoLite2-Country.mmdb"),
    path.join(__dirname, "../../GeoLite2-Country.mmdb"),
  );

  for (const p of candidatePaths) {
    try {
      // Async read avoids blocking the main event loop
      const buffer = await fs.readFile(p);
      geoReader = new Reader<CountryResponse>(buffer);
      readerInitialized = true;
      return true;
    } catch {
      // Continue to next candidate path if file does not exist or cannot be read
    }
  }

  // Marked initialized even on miss so we do not attempt disk I/O per query
  readerInitialized = true;
  return false;
}

export function lookupGeoIP(ipStr: string): GeoInfo | null {
  if (!geoReader) return null;
  try {
    const res = geoReader.get(ipStr);
    if (res?.country?.names?.en && res.country.iso_code) {
      return {
        country: res.country.names.en,
        code: res.country.iso_code,
      };
    }
  } catch {
    // lookup error
  }
  return null;
}
