"use client";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { unstable_rethrow } from "next/navigation";
import { PinataSDK } from "pinata";
import TopicPicker from "./TopicPicker";
import ProfileTagPicker, { type TaggedProfile } from "./ProfileTagPicker";
import MentionTextarea from "./MentionTextarea";
import { IMAGE_MEDIA_TYPE, MAX_POST_IMAGES, VIDEO_MEDIA_TYPE } from "@/post-images";
import useVibeLanguage from "./useVibeLanguage";
import { savePostDraft } from "@/draft-actions";

const MAX_MEDIA_SIZE_BYTES = 100 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
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

function safeUploadFile(file: File) {
  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase().replace(/[^a-z0-9.]/g, "").slice(0, 8) : "";
  const base = file.name.replace(/\.[^.]*$/, "").normalize("NFKD").replace(/[^a-zA-Z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 38) || "vibe-media";
  return new File([file], `${base}-${Date.now().toString(36)}${extension}`.slice(0, 50), { type: file.type, lastModified: file.lastModified });
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

function SaveDraftButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const de = useVibeLanguage() === "de";
  return <button type="submit" name="intent" value="draft" disabled={disabled || pending} className="min-h-12 rounded-xl border border-orange-400 bg-orange-500/10 px-4 py-3 font-bold text-orange-700 disabled:opacity-50 dark:text-orange-200">{pending ? (de ? "Wird gespeichert…" : "Saving…") : (de ? "Als Entwurf speichern" : "Save draft")}</button>;
}

function Submit({ disabled, editing }: { disabled: boolean; editing: boolean }) {
  const { pending } = useFormStatus();
  const de = useVibeLanguage() === "de";
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
    >
      {pending ? <><LoaderCircle size={18} className="animate-spin" />{de ? "Wird gespeichert…" : "Saving…"}</> : editing ? (de ? "Änderungen speichern" : "Save changes") : (de ? "Veröffentlichen" : "Publish")}
    </button>
  );
}
export default function PostComposer({
  action,
  postId,
  initialImages = [],
  initialMediaTypes = [],
  initialVideoPosters = [],
  description = "",
  topics = [],
  taggedProfiles = [],
  accountDrafts = false,
  draftId,
  onDraftSaved,
}: {
  action: (data: FormData) => Promise<void>;
  postId?: string;
  initialImages?: string[];
  initialMediaTypes?: string[];
  initialVideoPosters?: string[];
  description?: string;
  topics?: string[];
  taggedProfiles?: TaggedProfile[];
  accountDrafts?: boolean;
  draftId?: string;
  onDraftSaved?: (id: string) => void;
}) {
  const de = useVibeLanguage() === "de";
  const isDraftable = !postId && !accountDrafts;
  const [images, setImages] = useState(initialImages);
  const [mediaTypes, setMediaTypes] = useState<(typeof IMAGE_MEDIA_TYPE | typeof VIDEO_MEDIA_TYPE)[]>(() => initialImages.map((_, index) => initialMediaTypes[index] === VIDEO_MEDIA_TYPE ? VIDEO_MEDIA_TYPE : IMAGE_MEDIA_TYPE));
  const [videoPosters, setVideoPosters] = useState(() => initialImages.map((_, index) => initialVideoPosters[index] || ""));
  const [videoDurations, setVideoDurations] = useState<Record<number, number>>({});
  const [posterFrameTimes, setPosterFrameTimes] = useState<Record<number, number>>({});
  const [draftDescription, setDraftDescription] = useState(description);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [draftReady, setDraftReady] = useState(!isDraftable);
  const [draftStatus, setDraftStatus] = useState("");
  const uploading = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const posterInput = useRef<HTMLInputElement>(null);
  const posterTarget = useRef<number | null>(null);
  const videoRefs = useRef<Record<number, HTMLVideoElement | null>>({});

  useEffect(() => {
    if (!isDraftable) return;
    try {
      const value = localStorage.getItem(DRAFT_KEY);
      if (!value) return;
      const draft = JSON.parse(value) as { images?: unknown; mediaTypes?: unknown; description?: unknown };
      if (Array.isArray(draft.images) && draft.images.every((image) => typeof image === "string")) setImages(draft.images.slice(0, MAX_POST_IMAGES));
      if (Array.isArray(draft.mediaTypes)) setMediaTypes(draft.mediaTypes.slice(0, MAX_POST_IMAGES).map((type) => type === VIDEO_MEDIA_TYPE ? VIDEO_MEDIA_TYPE : IMAGE_MEDIA_TYPE));
      if (typeof draft.description === "string") setDraftDescription(draft.description);
    } catch { localStorage.removeItem(DRAFT_KEY); }
    finally { setDraftReady(true); }
  }, [isDraftable]);

  useEffect(() => {
    if (!isDraftable || !draftReady) return;
    const timer = window.setTimeout(() => {
      if (!images.length && !draftDescription.trim()) {
        localStorage.removeItem(DRAFT_KEY);
        setDraftStatus("");
        return;
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ images, mediaTypes, description: draftDescription, savedAt: Date.now() }));
      setDraftStatus(de ? "Entwurf automatisch gespeichert" : "Draft saved automatically");
    }, 700);
    return () => window.clearTimeout(timer);
  }, [draftDescription, draftReady, de, images, isDraftable, mediaTypes]);

  function discardDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setImages([]);
    setMediaTypes([]);
    setDraftDescription("");
    setDraftStatus(de ? "Entwurf verworfen" : "Draft discarded");
  }
  async function upload(files: File[]) {
    if (!files.length || uploading.current) return;
    setError("");
    if (images.length + files.length > MAX_POST_IMAGES) {
      setError(de ? "Ein Beitrag kann höchstens 4 Medien enthalten." : "A post can contain at most 4 media items.");
      return;
    }
    for (const file of files) {
      if (
        (!ALLOWED_IMAGE_TYPES.has(file.type) && !ALLOWED_VIDEO_TYPES.has(file.type)) ||
        file.size > MAX_MEDIA_SIZE_BYTES
      ) {
        setError(de ? "Nutze Bilder oder MP4, WebM und MOV-Videos bis 100 MB pro Datei." : "Use images or MP4, WebM and MOV videos up to 100 MB each.");
        return;
      }
    }
    uploading.current = true;
    setBusy(true);
    try {
      for (let i = 0; i < files.length; i++) {
        setProgress(de ? `Wird hochgeladen ${i + 1}/${files.length}…` : `Uploading ${i + 1}/${files.length}…`);
        const url = await getSignedUploadUrl();
        const upload = await pinata.upload.public.file(safeUploadFile(files[i])).url(url);
        setImages((current) => [...current, getGatewayUrl(upload.cid)]);
        setMediaTypes((current) => [...current, ALLOWED_VIDEO_TYPES.has(files[i].type) ? VIDEO_MEDIA_TYPE : IMAGE_MEDIA_TYPE]);
        setVideoPosters((current) => [...current, ""]);
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
  async function uploadPoster(file: File | undefined) {
    const index = posterTarget.current;
    posterTarget.current = null;
    if (index === null || !file) return;
    if (!ALLOWED_IMAGE_TYPES.has(file.type) || file.size > 25 * 1024 * 1024) { setError(de ? "Das Vorschaubild muss ein Bild unter 25 MB sein." : "The poster must be an image under 25 MB."); return; }
    setBusy(true); setError("");
    try {
      const url = await getSignedUploadUrl();
      const upload = await pinata.upload.public.file(safeUploadFile(file)).url(url);
      setVideoPosters((current) => current.map((value, currentIndex) => currentIndex === index ? getGatewayUrl(upload.cid) : value));
    } catch { setError(de ? "Das Vorschaubild konnte nicht hochgeladen werden. Bitte erneut versuchen." : "The poster could not be uploaded. Please try again."); }
    finally { setBusy(false); }
  }
  async function saveVideoFrameAsPoster(index: number) {
    const video = videoRefs.current[index];
    if (!video || !video.videoWidth || !video.videoHeight) { setError(de ? "Der Videoframe ist noch nicht bereit. Bitte warte kurz und versuche es erneut." : "The video frame is not ready yet. Please wait a moment and try again."); return; }
    setBusy(true); setError("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
      if (!blob) throw new Error("frame");
      if (blob.size > 25 * 1024 * 1024) throw new Error("frame-too-large");
      const url = await getSignedUploadUrl();
      const upload = await pinata.upload.public.file(safeUploadFile(new File([blob], `video-frame-${index + 1}.jpg`, { type: "image/jpeg" }))).url(url);
      setVideoPosters((current) => current.map((value, currentIndex) => currentIndex === index ? getGatewayUrl(upload.cid) : value));
    } catch {
      setError(de ? "Der gewählte Frame konnte nicht gespeichert werden. Wähle alternativ ein eigenes Vorschaubild." : "The selected frame could not be saved. You can choose a custom poster image instead.");
    } finally { setBusy(false); }
  }
  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void upload(Array.from(event.dataTransfer.files));
  }
  return (
    <form
      action={async (data) => {
        if (uploading.current || busy) return;
        if (accountDrafts && data.get("intent") === "draft") {
          setBusy(true);
          setError("");
          try {
            const result = await savePostDraft(data);
            if (result.id) onDraftSaved?.(result.id);
            else setError(result.error === "empty" ? (de ? "Füge zuerst Text, Medien oder Tags hinzu." : "Add text, media or tags first.") : (de ? "Entwurf konnte nicht gespeichert werden. Bitte versuche es erneut." : "Could not save draft. Please try again."));
          } catch {
            setError(de ? "Verbindung unterbrochen. Dein Entwurf bleibt im Editor. Bitte erneut versuchen." : "Connection interrupted. Your draft remains in the editor. Please try again.");
          } finally { setBusy(false); }
          return;
        }
        if (!images.length) {
          setError(de ? "Füge mindestens ein Bild oder Video zum Veröffentlichen hinzu." : "Add at least one image or video before publishing.");
          return;
        }
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
      {draftId && <input type="hidden" name="draftId" value={draftId} />}
      <input type="hidden" name="imagesSet" value="1" />
      {images.map((url, i) => (
        <input key={i} type="hidden" name="images" value={url} />
      ))}
      {mediaTypes.map((type, i) => <input key={`type-${i}`} type="hidden" name="mediaType" value={type} />)}
      {images.map((_, i) => <input key={`poster-${i}`} type="hidden" name="videoPoster" value={videoPosters[i] || ""} />)}
      <fieldset disabled={busy} className="space-y-3">
        <legend className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
          {de ? "Medien" : "Media"} · {images.length}/4
        </legend>
        <div className="grid grid-cols-2 gap-3">
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
            >
              {mediaTypes[i] === VIDEO_MEDIA_TYPE ? <><video ref={(element) => { videoRefs.current[i] = element; }} src={url} poster={videoPosters[i] || undefined} controls crossOrigin="anonymous" preload="metadata" onLoadedMetadata={(event) => { const duration = event.currentTarget.duration; if (!Number.isFinite(duration) || duration <= 0) return; setVideoDurations((current) => ({ ...current, [i]: duration })); setPosterFrameTimes((current) => current[i] === undefined ? { ...current, [i]: duration >= 5 ? 3 : duration / 2 } : current); }} className="aspect-square w-full bg-slate-950 object-contain" /><div className="space-y-2 p-2"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { posterTarget.current = i; posterInput.current?.click(); }} className="rounded-lg border border-cyan-400/60 px-2 py-1 text-xs font-bold text-cyan-700 dark:text-cyan-300">{videoPosters[i] ? (de ? "Vorschaubild ändern" : "Change poster") : (de ? "Vorschaubild wählen" : "Choose poster")}</button>{videoDurations[i] ? <button type="button" disabled={busy} onClick={() => void saveVideoFrameAsPoster(i)} className="rounded-lg border border-violet-400/60 px-2 py-1 text-xs font-bold text-violet-700 disabled:opacity-50 dark:text-violet-300">{de ? "Diesen Frame verwenden" : "Use this frame"}</button> : null}</div>{videoDurations[i] ? <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">{de ? `Frame bei ${posterFrameTimes[i]?.toFixed(1) ?? "0.0"} Sekunden` : `Frame at ${posterFrameTimes[i]?.toFixed(1) ?? "0.0"} seconds`}<input type="range" min="0" max={videoDurations[i]} step="0.1" value={posterFrameTimes[i] ?? 0} onChange={(event) => { const time = Number(event.target.value); setPosterFrameTimes((current) => ({ ...current, [i]: time })); const video = videoRefs.current[i]; if (video) video.currentTime = time; }} className="mt-1 w-full accent-violet-600" /></label> : <p className="text-xs text-slate-500 dark:text-slate-400">{de ? "Frame-Editor wird geladen…" : "Loading frame editor…"}</p>}</div></> : <img src={url} alt={`${de ? "Ausgewähltes Bild" : "Selected image"} ${i + 1}`} className="aspect-square w-full bg-slate-100 object-contain dark:bg-slate-900" />}
              <div className="flex items-center justify-between gap-1 p-2 text-xs">
                    <span>{i === 0 ? (de ? "Titelmedium" : "Cover media") : `${mediaTypes[i] === VIDEO_MEDIA_TYPE ? (de ? "Video" : "Video") : (de ? "Bild" : "Image")} ${i + 1}`}</span>
                {i > 0 && (
                  <button
                    type="button"
                    aria-label={`${de ? "Bild" : "Move image"} ${i + 1} ${de ? "nach links verschieben" : "left"}`}
                    onClick={() =>
                      setImages((current) => {
                        const next = [...current];
                        [next[i - 1], next[i]] = [next[i], next[i - 1]];
                        setMediaTypes((currentTypes) => { const nextTypes = [...currentTypes]; [nextTypes[i - 1], nextTypes[i]] = [nextTypes[i], nextTypes[i - 1]]; return nextTypes; });
                        setVideoPosters((currentPosters) => { const nextPosters = [...currentPosters]; [nextPosters[i - 1], nextPosters[i]] = [nextPosters[i], nextPosters[i - 1]]; return nextPosters; });
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
                  aria-label={`${de ? "Bild entfernen" : "Remove image"} ${i + 1}`}
                  onClick={() => {
                    setImages((current) => current.filter((_, index) => index !== i));
                    setMediaTypes((current) => current.filter((_, index) => index !== i));
                    setVideoPosters((current) => current.filter((_, index) => index !== i));
                  }}
                  className="rounded p-2 text-red-600 dark:text-red-400"
                >
                  {de ? "Entfernen" : "Remove"}
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
                {isDragging ? (de ? "Medien zum Hochladen ablegen" : "Drop media to upload") : (de ? "Medien hochladen" : "Upload media")}
              </span>
              <span className="rounded-full bg-slate-900/70 px-3 py-1 text-xs text-white">
                {de ? "Bilder oder Videos hierher ziehen · Bis zu 4 Medien · Bilder bis 25 MB, Videos bis 100 MB" : "Drag & drop images or videos · Up to 4 items · images 25 MB, videos 100 MB"}
              </span>
            </button>
            <input
              ref={fileInput}
              aria-label={de ? "Medien auswählen" : "Choose media"}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                event.target.value = "";
                void upload(files);
              }}
            />
            <input ref={posterInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="hidden" onChange={(event) => { void uploadPoster(event.target.files?.[0]); event.target.value = ""; }} />
          </div>
        )}
      </fieldset>
      {(progress || draftStatus) && (
        <p role="status" className="text-sm">
          {progress || draftStatus}
        </p>
      )}
      <label className="block text-sm font-medium">
        {de ? "Beschreibung" : "Description"}
        <MentionTextarea
          name="description"
          value={draftDescription}
          onChange={(event) => setDraftDescription(event.target.value)}
          rows={4}
          className="mt-2 block w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-700 dark:bg-gray-900 dark:text-white"
        />
      </label>
      <TopicPicker initial={topics} />
      <ProfileTagPicker initial={taggedProfiles} />
      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
      <div className={`grid gap-3 ${isDraftable || accountDrafts ? "sm:grid-cols-2" : ""}`}>
        {accountDrafts && <SaveDraftButton disabled={busy} />}
        {isDraftable && <button type="button" onClick={discardDraft} className="min-h-12 rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3 text-base font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">{de ? "Entwurf verwerfen" : "Discard draft"}</button>}
        <Submit disabled={busy || !images.length} editing={!!postId} />
      </div>
    </form>
  );
}
