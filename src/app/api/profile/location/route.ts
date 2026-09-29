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
    const input = body as { enabled?: unknown; latitude?: unknown; longitude?: unknown; address?: unknown; precision?: unknown; language?: unknown; action?: unknown };
    if (typeof input.address === "string" && input.address.length > 500) return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    if (input.enabled === false) {
      await prisma.profile.update({ where: { email: session.user.email }, data: { locationSharingEnabled: false, locationLatitude: null, locationLongitude: null, locationLabel: null, locationUpdatedAt: null } });
      return NextResponse.json({ ok: true, enabled: false });
    }
    const latitudeInput = input.latitude;
    const longitudeInput = input.longitude;
    let resolvedAddress = typeof input.address === "string" && input.address.trim() ? input.address.trim() : null;
    if ((typeof latitudeInput !== "number" || typeof longitudeInput !== "number") && typeof input.address === "string" && input.address.trim()) {
      try {
        const query = encodeURIComponent(input.address.trim());
        const language = input.language === "de" ? "de" : "en";
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&dedupe=1&accept-language=${language}&q=${query}`, { headers: { "User-Agent": "VIBE-Social/0.2 location picker" }, signal: AbortSignal.timeout(8000) });
        if (!response.ok) return NextResponse.json({ error: "AddressLookupUnavailable" }, { status: 503 });
        const results = await response.json() as Array<{ lat?: string; lon?: string; display_name?: string }>;
        if (!Array.isArray(results)) throw new Error("Invalid geocoder response");
        const candidates = results.filter((result) => result && result.lat != null && result.lon != null && String(result.lat).trim() !== "" && String(result.lon).trim() !== "" && validCoordinate(Number(result.lat), 90) && validCoordinate(Number(result.lon), 180)).slice(0, 5).map((result) => ({ latitude: Number(result.lat), longitude: Number(result.lon), label: typeof result.display_name === "string" ? result.display_name : resolvedAddress }));
        if (!candidates.length) return NextResponse.json({ error: "AddressNotFound" }, { status: 422 });
        // Lookup never publishes a location. The user chooses a candidate first.
        return NextResponse.json({ candidates });
      } catch {
        return NextResponse.json({ error: "AddressLookupUnavailable" }, { status: 503 });
      }
    }
    if (input.enabled !== true || !validCoordinate(latitudeInput, 90) || !validCoordinate(longitudeInput, 180)) return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    const precision = input.precision === "exact" ? "exact" : "approximate";
    const decimals = precision === "exact" ? 5 : 1;
    const latitude = Number(latitudeInput.toFixed(decimals));
    const longitude = Number(longitudeInput.toFixed(decimals));
    // Do not retain a street address when only an approximate location is shared.
    if (precision !== "exact") resolvedAddress = null;
    const updatedAt = new Date();
    await prisma.profile.update({ where: { email: session.user.email }, data: { locationSharingEnabled: true, locationLatitude: latitude, locationLongitude: longitude, locationLabel: resolvedAddress, locationPrecision: precision, locationUpdatedAt: updatedAt } });
    return NextResponse.json({ ok: true, enabled: true, precision, latitude, longitude, resolvedAddress, updatedAt: updatedAt.toISOString(), addressSaved: Boolean(resolvedAddress) });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
