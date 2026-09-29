import { auth } from "@/auth";
import { prisma } from "@/db";
import { NextResponse } from "next/server";

const validCoordinate = (value: unknown, limit: number): value is number => typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    const input = body as { enabled?: unknown; latitude?: unknown; longitude?: unknown; address?: unknown; precision?: unknown; language?: unknown };
    if (typeof input.address === "string" && input.address.length > 500) return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    if (input.enabled === false) {
      await prisma.profile.update({ where: { email: session.user.email }, data: { locationSharingEnabled: false, locationLatitude: null, locationLongitude: null, locationLabel: null, locationUpdatedAt: null } });
      return NextResponse.json({ ok: true, enabled: false });
    }
    let latitudeInput = input.latitude;
    let longitudeInput = input.longitude;
    let resolvedAddress = typeof input.address === "string" && input.address.trim() ? input.address.trim() : null;
    if ((typeof latitudeInput !== "number" || typeof longitudeInput !== "number") && typeof input.address === "string" && input.address.trim()) {
      try {
        const query = encodeURIComponent(input.address.trim());
        const language = input.language === "de" ? "de" : "en";
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&dedupe=1&accept-language=${language}&q=${query}`, { headers: { "User-Agent": "VIBE-Social/0.2 location picker" }, signal: AbortSignal.timeout(8000) });
        if (!response.ok) return NextResponse.json({ error: "AddressLookupUnavailable" }, { status: 503 });
        const results = await response.json() as Array<{ lat?: string; lon?: string; display_name?: string }>;
        if (!Array.isArray(results)) throw new Error("Invalid geocoder response");
        const best = results.find((result) => result && result.lat != null && result.lon != null && validCoordinate(Number(result.lat), 90) && validCoordinate(Number(result.lon), 180));
        if (!best?.lat || !best.lon) return NextResponse.json({ error: "AddressNotFound" }, { status: 422 });
        latitudeInput = Number(best.lat);
        longitudeInput = Number(best.lon);
        resolvedAddress = typeof best.display_name === "string" ? best.display_name.trim() || resolvedAddress : resolvedAddress;
      } catch {
        return NextResponse.json({ error: "AddressLookupUnavailable" }, { status: 503 });
      }
    }
    if (input.enabled !== true || !validCoordinate(latitudeInput, 90) || !validCoordinate(longitudeInput, 180)) return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    const precision = input.precision === "exact" ? "exact" : "approximate";
    // A manually entered address must retain enough precision to point to the
    // requested street/building; coarse rounding would collapse it to values
    // such as 51 and 11 and make the address appear wrong on the map.
    const decimals = typeof input.address === "string" && input.address.trim() ? 5 : (precision === "exact" ? 2 : 1);
    const latitude = Number(latitudeInput.toFixed(decimals));
    const longitude = Number(longitudeInput.toFixed(decimals));
    await prisma.profile.update({ where: { email: session.user.email }, data: { locationSharingEnabled: true, locationLatitude: latitude, locationLongitude: longitude, locationLabel: resolvedAddress, locationPrecision: precision, locationUpdatedAt: new Date() } });
    return NextResponse.json({ ok: true, enabled: true, precision, latitude, longitude, resolvedAddress, addressSaved: Boolean(resolvedAddress) });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
