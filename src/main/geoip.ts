import fs from "node:fs";
import path from "node:path";
import maxmind, { Reader, CountryResponse } from "maxmind";
import { app } from "electron";
import { GeoInfo } from "@engine/types.js";

let geoReader: Reader<CountryResponse> | null = null;
let readerInitialized = false;

export async function initGeoIP(customPath?: string): Promise<boolean> {
  if (readerInitialized && geoReader) return true;

  const candidatePaths: string[] = [];
  if (customPath) {
    candidatePaths.push(customPath);
  }

  try {
    const userData = app.getPath("userData");
    candidatePaths.push(
      path.join(userData, "GeoLite2-Country.mmdb"),
      path.join(userData, "GeoIP2-Country.mmdb"),
      path.join(userData, "Country.mmdb")
    );
  } catch {
    // app.getPath might fail if called before app ready
  }

  // Also check project/data directory
  candidatePaths.push(
    path.join(process.cwd(), "GeoLite2-Country.mmdb"),
    path.join(__dirname, "../../GeoLite2-Country.mmdb")
  );

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const buffer = fs.readFileSync(p);
        geoReader = new Reader<CountryResponse>(buffer);
        readerInitialized = true;
        return true;
      } catch (err) {
        console.warn(`Failed reading MMDB at ${p}:`, err);
      }
    }
  }

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
