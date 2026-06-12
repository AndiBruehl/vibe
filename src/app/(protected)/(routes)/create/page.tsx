"use client";

import { Button, TextArea } from "@radix-ui/themes";
import { SendIcon, UploadCloudIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { postEntry } from "@/actions";

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
      setUploadError(
        "Image is too large. Please upload an image under 25 MB.",
      );
      return;
    }

    const data = new FormData();
    data.set("file", fileValue);

    setIsUploading(true);
    setUploadError("");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: data,
      });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(getUploadErrorMessage(result) || "Upload failed.");
        }

        if (typeof result.url !== "string") {
          throw new Error("Upload failed.");
        }

        setImageUrl(result.url);
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
