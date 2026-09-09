"use client";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { useFormStatus } from "react-dom";
import { unstable_rethrow } from "next/navigation";
import { PinataSDK } from "pinata";
import TopicPicker from "./TopicPicker";
import { MAX_POST_IMAGES } from "@/post-images";

const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const DRAFT_KEY = "vibe.postDraft.v1";

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

function Submit({ disabled, editing }: { disabled: boolean; editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
    >
      {pending ? "Saving…" : editing ? "Save changes" : "Publish"}
    </button>
  );
}
export default function PostComposer({
  action,
  postId,
  initialImages = [],
  description = "",
  topics = [],
}: {
  action: (data: FormData) => Promise<void>;
  postId?: string;
  initialImages?: string[];
  description?: string;
  topics?: string[];
}) {
  const [images, setImages] = useState(initialImages);
  const [draftDescription, setDraftDescription] = useState(description);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const uploading = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const isDraftable = !postId;

  useEffect(() => {
    if (!isDraftable) return;
    try {
      const value = localStorage.getItem(DRAFT_KEY);
      if (!value) return;
      const draft = JSON.parse(value) as { images?: unknown; description?: unknown };
      if (Array.isArray(draft.images) && draft.images.every((image) => typeof image === "string")) setImages(draft.images.slice(0, MAX_POST_IMAGES));
      if (typeof draft.description === "string") setDraftDescription(draft.description);
    } catch { localStorage.removeItem(DRAFT_KEY); }
  }, [isDraftable]);

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ images, description: draftDescription, savedAt: Date.now() }));
    setProgress("Draft saved on this device.");
  }
  async function upload(files: File[]) {
    if (!files.length || uploading.current) return;
    setError("");
    if (images.length + files.length > MAX_POST_IMAGES) {
      setError("A post can contain at most 4 images.");
      return;
    }
    for (const file of files) {
      if (
        !ALLOWED_IMAGE_TYPES.has(file.type) ||
        file.size > MAX_IMAGE_SIZE_BYTES
      ) {
        setError("Use JPG, PNG, WebP, GIF or AVIF files up to 25 MB each.");
        return;
      }
    }
    uploading.current = true;
    setBusy(true);
    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(`Uploading ${i + 1}/${files.length}…`);
        const url = await getSignedUploadUrl();
        const upload = await pinata.upload.public.file(files[i]).url(url);
        setImages((current) => [...current, getGatewayUrl(upload.cid)]);
      }
    } catch (failure) {
      setError(
        `${failure instanceof Error ? failure.message : "Upload failed."} Successfully uploaded images are kept. Select the remaining files to retry.`,
      );
    } finally {
      uploading.current = false;
      setBusy(false);
      setProgress("");
    }
  }
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void upload(Array.from(event.dataTransfer.files));
  }
  return (
    <form
      action={async (data) => {
        if (uploading.current || !images.length) return;
        setError("");
        try {
          if (isDraftable) localStorage.removeItem(DRAFT_KEY);
          await action(data);
        } catch (failure) {
          unstable_rethrow(failure);
          setError(
            failure instanceof Error
              ? failure.message
              : "Could not save this post.",
          );
        }
      }}
      className="space-y-4"
    >
      {postId && <input type="hidden" name="postId" value={postId} />}
      <input type="hidden" name="imagesSet" value="1" />
      {images.map((url, i) => (
        <input key={i} type="hidden" name="images" value={url} />
      ))}
      <fieldset disabled={busy} className="space-y-3">
        <legend className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
          Images · {images.length}/4
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <img
                src={url}
                alt={`Selected image ${i + 1}`}
                className="aspect-square w-full bg-slate-100 object-contain dark:bg-slate-900"
              />
              <div className="flex items-center justify-between gap-1 p-2 text-xs">
                <span>{i === 0 ? "Cover" : `Image ${i + 1}`}</span>
                {i > 0 && (
                  <button
                    type="button"
                    aria-label={`Move image ${i + 1} left`}
                    onClick={() =>
                      setImages((current) => {
                        const next = [...current];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        return next;
                      })
                    }
                    className="rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    ←
                  </button>
                )}
                <button
                  type="button"
                  aria-label={`Remove image ${i + 1}`}
                  onClick={() =>
                    setImages((current) =>
                      current.filter((_, index) => index !== i),
                    )
                  }
                  className="rounded p-2 text-red-600 dark:text-red-400"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        {images.length < MAX_POST_IMAGES && (
          <div onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (event.currentTarget === event.target) setIsDragging(false); }} onDrop={handleDrop}
            className={`relative overflow-hidden rounded-2xl bg-gray-400 shadow-lg transition dark:bg-slate-700 ${isDragging ? "ring-4 ring-orange-400 ring-offset-2 dark:ring-offset-slate-950" : ""}`}>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex min-h-48 w-full flex-col items-center justify-center gap-3 p-6 from-(--ig-orange) to-(--ig-red) enabled:hover:bg-linear-to-tr focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <span className="rounded-xl bg-white/95 px-5 py-3 font-semibold text-slate-900">
                {isDragging ? "Drop images to upload" : "Upload images"}
              </span>
              <span className="rounded-full bg-slate-900/70 px-3 py-1 text-xs text-white">
                Drag & drop or choose files · Up to 4 images · 25 MB each
              </span>
            </button>
            <input
              ref={fileInput}
              aria-label="Choose images"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                event.target.value = "";
                void upload(files);
              }}
            />
          </div>
        )}
      </fieldset>
      {progress && (
        <p role="status" className="text-sm">
          {progress}
        </p>
      )}
      <label className="block text-sm font-medium">
        Description
        <textarea
          name="description"
          value={draftDescription}
          onChange={(event) => setDraftDescription(event.target.value)}
          rows={4}
          className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-gray-900 dark:text-white"
        />
      </label>
      <TopicPicker initial={topics} />
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <div className={`grid gap-3 ${isDraftable ? "sm:grid-cols-2" : ""}`}>
        {isDraftable && <button type="button" onClick={saveDraft} className="min-h-12 rounded-xl border-2 border-red-500 bg-red-50 px-4 py-3 text-base font-bold text-red-700 transition hover:bg-red-100 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50">Save draft</button>}
        <Submit disabled={busy || !images.length} editing={!!postId} />
      </div>
    </form>
  );
}
