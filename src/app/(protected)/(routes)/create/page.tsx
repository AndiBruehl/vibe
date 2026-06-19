"use client";

import { Button, TextArea } from "@radix-ui/themes";
import { SendIcon, UploadCloudIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PinataSDK } from "pinata";

import { postEntry } from "@/actions";
// TopicPicker temporarily disabled
// import TopicPicker from "@/app/components/TopicPicker";

const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

function getUploadErrorMessage(result: { error?: unknown; details?: unknown }) {
  const error = typeof result.error === "string" ? result.error : null;
  const details = typeof result.details === "string" ? result.details : null;

  return [error, details].filter(Boolean).join(" ");
}

function getGatewayUrl(cid: string) {
  const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL;

  if (!gateway) {
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }

  const normalizedGateway = gateway.startsWith("http")
    ? gateway
    : `https://${gateway}`;

  return `${normalizedGateway.replace(/\/$/, "")}/ipfs/${cid}`;
}

async function getSignedUploadUrl() {
  const response = await fetch("/api/upload/url", {
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(getUploadErrorMessage(result) || "Upload failed.");
  }

  if (typeof result.url !== "string") {
    throw new Error("Upload failed.");
  }

  return result.url;
}

const pinata = new PinataSDK({
  pinataJwt: "",
  pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL,
});

export default function CreatePage() {
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileChange(fileValue: File | null) {
    setImageUrl("");

    if (!fileValue) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.has(fileValue.type)) {
      setUploadError(
        "Unsupported image format. Please upload JPG, PNG, WebP, GIF, or AVIF.",
      );
      return;
    }

    if (fileValue.size > MAX_IMAGE_SIZE_BYTES) {
      setUploadError("Image is too large. Please upload an image under 25 MB.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const signedUploadUrl = await getSignedUploadUrl();
      const upload = await pinata.upload.public
        .file(fileValue)
        .url(signedUploadUrl);

      setImageUrl(getGatewayUrl(upload.cid));
    } catch (error) {
      setImageUrl("");
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form
      action={async (formData) => {
        const id = await postEntry(formData);
        router.push(`/post/${id}`);
      }}
      className="h-full"
    >
      <input type="hidden" name="image" value={imageUrl || ""} />

      <div className="flex h-screen items-center justify-center gap-4">
        <div className="flex gap-4">
          <div className="relative">
            <div className="group relative flex size-64 items-center justify-center rounded-md bg-gray-400 p-2 transition-all duration-200 hover:bg-gray-500 hover:shadow-lg">
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt="Uploaded"
                  className="h-full w-full rounded-md object-contain"
                />
              )}

              <input
                type="file"
                className="hidden"
                ref={fileInRef}
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={(ev) => {
                  void handleFileChange(ev.target.files?.[0] || null);
                  ev.target.value = "";
                }}
              />

              {!imageUrl && !isUploading && (
                <Button
                  type="button"
                  variant="surface"
                  className="pointer-events-none"
                >
                  <UploadCloudIcon />
                  Upload Image
                </Button>
              )}

              {!imageUrl && isUploading && (
                <Button
                  type="button"
                  variant="surface"
                  className="pointer-events-none"
                >
                  Uploading...
                </Button>
              )}

              {uploadError && !isUploading && (
                <p className="absolute bottom-3 left-3 right-3 z-20 rounded-md bg-white/90 px-3 py-2 text-center text-sm font-semibold text-red-600 shadow dark:bg-gray-900/90">
                  {uploadError}
                </p>
              )}

              <button
                type="button"
                onClick={() => fileInRef.current?.click()}
                className="absolute inset-0 z-10 cursor-pointer rounded-md"
                aria-label="Upload image"
              />

              <div className="pointer-events-none absolute inset-0 rounded-md bg-linear-to-tr from-(--ig-orange) to-(--ig-red) opacity-0 mix-blend-overlay transition-opacity duration-200 group-hover:opacity-100" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <TextArea
              name="description"
              className="h-52"
              placeholder="Describe your image..."
            />
            {/* TopicPicker disabled temporarily */}
            <Button
              type="submit"
              className="mt-2 w-full"
              disabled={!imageUrl || isUploading}
            >
              <SendIcon size={18} />
              Publish
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
