"use client";

import { createStory, deleteStory } from "@/actions";
import { PinataSDK } from "pinata";
import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";

type Story = {
  id: string;
  authorEmail: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string | null;
  slides: { id: string; storyId: string; imageUrl: string; expiresAt: string }[];
  storyIds: string[];
  seen: boolean;
};

const pinata = new PinataSDK({ pinataJwt: "", pinataGateway: process.env.NEXT_PUBLIC_GATEWAY_URL });
const gatewayUrl = (cid: string) => {
  const gateway = process.env.NEXT_PUBLIC_GATEWAY_URL;
  return gateway ? `${(gateway.startsWith("http") ? gateway : `https://${gateway}`).replace(/\/$/, "")}/ipfs/${cid}` : `https://gateway.pinata.cloud/ipfs/${cid}`;
};

export default function StoriesBar({ stories: suppliedStories, viewerEmail }: { stories: Story[]; viewerEmail: string }) {
  const [openStoryIndex, setOpenStoryIndex] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [creating, setCreating] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const elapsedSlideTime = useRef(0);

  const [now, setNow] = useState(0);
  const stories = useMemo(() => suppliedStories.map((story) => ({
    ...story, slides: story.slides.filter((item) => Date.parse(item.expiresAt) > now),
  })).filter((story) => story.slides.length > 0), [suppliedStories, now]);

  useEffect(() => {
    const check = () => {
      const current = Date.now();
      const expired = stories.some((story) => story.slides.some((item) => Date.parse(item.expiresAt) <= current));
      if (expired) {
        setOpenStoryIndex(null);
        setPaused(false);
        setSlide(0);
        setNow(current);
      }
    };
    check();
    const expiry = Math.min(...stories.flatMap((story) => story.slides.map((item) => Date.parse(item.expiresAt))));
    const timer = Number.isFinite(expiry) ? window.setTimeout(check, Math.min(2147483647, Math.max(0, expiry - Date.now()))) : undefined;
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [stories]);

  const openStory = openStoryIndex === null ? null : stories[openStoryIndex] ?? null;

  useEffect(() => {
    if (!openStory) return;
    setSlide(0);
  }, [openStoryIndex]);

  useEffect(() => {
    elapsedSlideTime.current = 0;
    setSlideProgress(0);
  }, [openStoryIndex, slide]);

  useEffect(() => {
    const currentSlide = openStory?.slides[slide];
    if (!currentSlide) return;
    void fetch(`/api/stories/${currentSlide.storyId}/view`, { method: "POST" });
  }, [openStory, slide]);

  useEffect(() => {
    if (!openStory || openStoryIndex === null || paused) return;
    const timer = window.setTimeout(() => {
      if (slide < openStory.slides.length - 1) {
        setSlide((current) => current + 1);
      } else if (openStoryIndex < stories.length - 1) {
        setOpenStoryIndex((current) => current === null ? null : current + 1);
      } else {
        setOpenStoryIndex(null);
      }
    }, Math.max(0, 15000 - elapsedSlideTime.current));
    return () => window.clearTimeout(timer);
  }, [openStory, openStoryIndex, paused, slide, stories.length]);

  useEffect(() => {
    if (!openStory) {
      setSlideProgress(0);
      return;
    }

    if (paused) return;
    const startedAt = Date.now() - elapsedSlideTime.current;
    const timer = window.setInterval(() => {
      elapsedSlideTime.current = Math.min(15000, Date.now() - startedAt);
      setSlideProgress((elapsedSlideTime.current / 15000) * 100);
    }, 80);

    return () => window.clearInterval(timer);
  }, [openStory, openStoryIndex, paused, slide]);

  function previous() {
    if (slide > 0) { setSlide((current) => current - 1); return; }
    if (openStoryIndex && openStoryIndex > 0) setOpenStoryIndex(openStoryIndex - 1);
  }

  function next() {
    if (!openStory || openStoryIndex === null) return;
    if (slide < openStory.slides.length - 1) { setSlide((current) => current + 1); return; }
    if (openStoryIndex < stories.length - 1) setOpenStoryIndex(openStoryIndex + 1);
    else setOpenStoryIndex(null);
  }

  async function upload(files: File[]) {
    if (!files.length || busy) return;
    if (images.length + files.length > 4) { setError("A story can contain up to 4 slides."); return; }
    if (files.some((file) => !file.type.startsWith("image/") || file.size > 25 * 1024 * 1024)) { setError("Use images up to 25 MB each."); return; }
    setBusy(true); setError("");
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const response = await fetch("/api/upload/url", { cache: "no-store" });
        const result = await response.json() as { url?: string };
        if (!response.ok || !result.url) throw new Error("Upload could not be prepared.");
        const upload = await pinata.upload.public.file(file).url(result.url);
        uploaded.push(gatewayUrl(upload.cid));
      }
      setImages((current) => [...current, ...uploaded]);
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Upload failed."); }
    finally { setBusy(false); }
  }

  async function publish() {
    if (!images.length) return;
    setBusy(true); setError("");
    try {
      const data = new FormData(); images.forEach((image) => data.append("images", image));
      await createStory(data); window.location.reload();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Story could not be published."); setBusy(false); }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void upload(Array.from(event.dataTransfer.files));
  }

  return <>
    <section className="-mx-4 px-4 md:mx-0 md:px-0">
      <div className="overflow-x-auto pb-2"><div className="flex min-w-max gap-4 md:gap-5">
        <button type="button" onClick={() => setCreating(true)} className="group flex w-20 shrink-0 flex-col items-center" aria-label="Create story">
          <span className="flex size-16 items-center justify-center rounded-full bg-linear-to-br from-(--ig-orange) to-(--ig-red) p-0.5 shadow-md"><span className="flex size-full items-center justify-center rounded-full bg-white text-orange-500 dark:bg-slate-950"><Plus /></span></span>
          <span className="mt-2 w-full truncate text-center text-xs font-medium text-slate-600 dark:text-slate-400">Your story</span>
        </button>
        {stories.map((story, index) => <button key={story.id} type="button" onClick={() => setOpenStoryIndex(index)} className="group flex w-20 shrink-0 flex-col items-center">
          <span className={`rounded-full p-0.75 ${story.seen ? "bg-slate-300 dark:bg-slate-600" : "bg-linear-to-br from-(--ig-orange) to-(--ig-red)"}`}><span className="grid size-16 place-items-center overflow-hidden rounded-full bg-white p-1 dark:bg-slate-950">{story.authorAvatar ? <img src={story.authorAvatar} alt="" className="size-14 rounded-full bg-slate-200 object-cover" /> : <span className="grid size-14 place-items-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">{story.authorUsername[0] || story.authorName[0] || "?"}</span>}</span></span>
          <span className="mt-2 w-full truncate text-center text-xs font-medium text-slate-600 dark:text-slate-400">{story.authorUsername || story.authorName}</span>
        </button>)}
      </div></div>
    </section>

    {creating && <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/70 p-4"><section className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Create story</h2><button onClick={() => setCreating(false)} aria-label="Close"><X /></button></div><p className="mt-1 text-sm text-slate-500">Stories disappear after 24 hours. Add up to 4 images.</p><div className="mt-5 grid grid-cols-4 gap-2">{images.map((image, index) => <img key={`${image}-${index}`} src={image} alt="Selected story slide" className="aspect-square rounded-lg object-cover" />)}</div><div onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }} onDrop={handleDrop} className={`mt-5 rounded-xl border border-dashed border-orange-400 transition ${dragging ? "bg-orange-100 ring-4 ring-orange-300 dark:bg-orange-500/20" : ""}`}><button disabled={busy || images.length >= 4} onClick={() => input.current?.click()} className="w-full p-5 font-semibold text-orange-600 disabled:opacity-50">{busy ? "Uploading…" : dragging ? "Drop images to upload" : "Drag & drop images or choose files"}</button></div><input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(event) => { void upload(Array.from(event.target.files || [])); event.target.value = ""; }} />{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<button disabled={busy || !images.length} onClick={() => void publish()} className="mt-5 w-full rounded-xl bg-linear-to-r from-(--ig-orange) to-(--ig-red) px-4 py-3 font-semibold text-white disabled:opacity-50">Publish story</button></section></div>}

    {openStory && <div className="fixed inset-0 z-[100] grid place-items-center bg-black p-2 sm:p-6"><section onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerCancel={() => setPaused(false)} onPointerLeave={() => setPaused(false)} className="relative flex h-full w-full max-w-md flex-col overflow-hidden rounded-2xl bg-slate-950"><div className="absolute inset-x-3 top-3 z-20 flex gap-1">{openStory.slides.map((_, index) => <span key={index} className={`h-1 flex-1 rounded-full ${index <= slide ? "bg-white" : "bg-white/35"}`} />)}</div><div className="absolute inset-x-4 top-7 z-20 flex items-center justify-between text-white"><span className="text-sm font-semibold">{openStory.authorUsername || openStory.authorName}</span><button type="button" onClick={() => setOpenStoryIndex(null)} aria-label="Close story"><X /></button></div><button className="absolute inset-y-0 left-0 z-0 w-1/3" aria-label="Previous slide" onClick={previous} /><img src={openStory.slides[slide]?.imageUrl} alt="Story" className="h-full w-full object-contain" /><button className="absolute inset-y-0 right-0 z-0 w-1/3" aria-label="Next slide" onClick={next} /><div className="absolute bottom-4 left-4 right-4 z-10 h-1.5 overflow-hidden rounded-full bg-white/25"><div className="h-full rounded-full bg-linear-to-r from-yellow-300 to-orange-500 transition-[width] duration-75" style={{ width: `${slideProgress}%` }} /></div>{openStory.authorEmail === viewerEmail && <form action={async (data) => { await deleteStory(data); setOpenStoryIndex(null); window.location.reload(); }} className="absolute bottom-8 right-4 z-20"><input type="hidden" name="storyId" value={openStory.slides[slide]?.storyId} /><button className="rounded-full bg-black/60 p-3 text-white" aria-label="Delete story"><Trash2 size={18} /></button></form>}</section></div>}
  </>;
}
