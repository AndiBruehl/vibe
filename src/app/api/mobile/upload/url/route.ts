import { getMobileSession } from "@/mobile-auth";
import { pinata } from "@/pinata_config";
import { NextResponse, type NextRequest } from "next/server";

const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
];

function getGatewayBaseUrl() {
  const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL;

  if (!gateway) {
    return "https://gateway.pinata.cloud/ipfs";
  }

  const normalizedGateway = gateway.startsWith("http")
    ? gateway
    : `https://${gateway}`;

  return `${normalizedGateway.replace(/\/$/, "")}/ipfs`;
}

export async function GET(request: NextRequest) {
  const session = await getMobileSession(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = await pinata.upload.public.createSignedURL({
      expires: 60,
      maxFileSize: MAX_IMAGE_SIZE_BYTES,
      mimeTypes: ALLOWED_IMAGE_TYPES,
    });

    return NextResponse.json({
      gatewayBaseUrl: getGatewayBaseUrl(),
      url,
    });
  } catch (error) {
    console.error("Could not create mobile Pinata upload URL:", error);

    return NextResponse.json(
      { error: "Could not prepare image upload." },
      { status: 500 },
    );
  }
}

