import { NextResponse, type NextRequest } from "next/server";
import { pinata } from "@/pinata_config";

const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unknown storage error.";
}

function safeUploadFileName(name: string, type: string) {
  const extension = name.includes(".") ? name.slice(name.lastIndexOf(".")).toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 8) : (type === "image/jpeg" ? ".jpg" : type === "image/png" ? ".png" : type === "image/webp" ? ".webp" : type === "image/gif" ? ".gif" : type === "image/avif" ? ".avif" : "");
  const base = name.replace(/\.[^.]*$/, "").normalize("NFKD").replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "vibe-upload";
  return `${base}-${Date.now().toString(36)}${extension}`.slice(0, 50);
}

export async function POST(request: NextRequest) {
  let fileInfo:
    | {
        name: string;
        size: number;
        type: string;
      }
    | null = null;
  let data: FormData;

  try {
    data = await request.formData();
  } catch (e) {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    const details = getErrorMessage(e);

    console.error("Image upload form parsing failed:", {
      details,
      contentLength,
    });

    if (contentLength > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "Image is too large. Please upload an image under 25 MB.",
          details,
        },
        { status: 413 },
      );
    }

    return NextResponse.json(
      {
        error:
          "Upload request could not be read. Please try exporting the image as JPG, PNG, or WebP and upload it again.",
        details,
      },
      { status: 400 },
    );
  }

  try {
    const file = data.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
    };

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error:
            "Unsupported image format. Please upload JPG, PNG, WebP, GIF, or AVIF.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "Image is too large. Please upload an image under 25 MB.",
        },
        { status: 400 },
      );
    }

    const normalizedFile = new File([await file.arrayBuffer()], safeUploadFileName(file.name, file.type), { type: file.type });
    const upload = await pinata.upload.public.file(normalizedFile);
    const url = await pinata.gateways.public.convert(upload.cid);

    if (!url) {
      return NextResponse.json(
        { error: "Upload succeeded, but no image URL was returned." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url }, { status: 200 });
  } catch (e) {
    const details = getErrorMessage(e);

    console.error("Image upload failed:", {
      details,
      file: fileInfo,
    });

    return NextResponse.json(
      {
        error: details.toLowerCase().includes("name") || details.toLowerCase().includes("filename")
          ? "The file name could not be accepted by storage. We shortened it automatically; please try uploading the file again."
          : "The image could not be uploaded. Check the file type and size, then try again. If it still fails, please contact support.",
        details: process.env.NODE_ENV === "development" ? details : undefined,
      },
      { status: 502 },
    );
  }
}
