"use client";

import { Button, TextArea } from "@radix-ui/themes";
import { SendIcon, UploadCloudIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { postEntry } from "@/actions";
import Image from "next/image";

export default function CreatePage() {
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!file) return;

    const data = new FormData();
    data.set("file", file);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsUploading(true);

    fetch("/api/upload", {
      method: "POST",
      body: data,
    })
      .then((res) => res.json())
      .then((result) => setImageUrl(result.url))
      .catch((error) => console.error(error))
      .finally(() => setIsUploading(false));
  }, [file]);

  return (
    <form
      action={async (formData) => {
        const id = await postEntry(formData);
        router.push(`/post/${id}`);
      }}
      className="h-full"
    >
      <input type="hidden" name="image" value={imageUrl} />

      <div className="flex h-screen items-center justify-center gap-4">
        <div className="flex gap-4">
          <div className="relative">
            <div className="group relative flex size-64 items-center justify-center rounded-md bg-gray-400 p-2 transition-all duration-200 hover:bg-gray-500 hover:shadow-lg">
              {imageUrl && (
                <Image
                  src={imageUrl}
                  alt="Uploaded"
                  className="h-full w-full rounded-md object-contain"
                />
              )}

              <input
                type="file"
                className="hidden"
                ref={fileInRef}
                accept="image/*"
                onChange={(ev) => setFile(ev.target.files?.[0] || null)}
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
