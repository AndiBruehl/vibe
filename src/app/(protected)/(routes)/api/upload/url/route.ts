import { auth } from "@/auth";
import { pinata } from "@/pinata_config";
import { NextResponse } from "next/server";

const MAX_MEDIA_SIZE_BYTES = 100 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown upload signing error.";
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = await pinata.upload.public.createSignedURL({
      expires: 60,
      maxFileSize: MAX_MEDIA_SIZE_BYTES,
      mimeTypes: ALLOWED_MEDIA_TYPES,
    });

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    const details = getErrorMessage(error);

    console.error("Could not create Pinata signed upload URL:", details);

    return NextResponse.json(
      {
        error: "Could not prepare image upload. Please try again.",
        details,
      },
      { status: 500 },
    );
  }
}
