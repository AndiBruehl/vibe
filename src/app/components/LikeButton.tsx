"use client";

import { useRef, useState } from "react";
import { Heart } from "lucide-react";
import { togglePostLike } from "@/actions";
import useVibeLanguage from "./useVibeLanguage";

type Props = { postId: string; initialLiked: boolean; initialLikes: number; showCount?: boolean; showText?: boolean };

export default function LikeButton({ postId, initialLiked, initialLikes, showCount = true, showText = false }: Props) {
  const de = useVibeLanguage() === "de";
  const [state, setState] = useState({ liked: initialLiked, likes: initialLikes });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const busy = useRef(false);

  async function handleClick() {
    if (busy.current) return;
    busy.current = true;
    const previous = state;
    // Urgent local state, outside the asynchronous server action.
    setState({ liked: !previous.liked, likes: Math.max(0, previous.likes + (previous.liked ? -1 : 1)) });
    setPending(true);
    setError(false);
    try {
      const data = new FormData();
      data.set("postId", postId);
      setState(await togglePostLike(data));
    } catch {
      setState(previous);
      setError(true);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return <span className="inline-flex flex-wrap items-center gap-2">
    <button type="button" onClick={() => void handleClick()} disabled={pending}
      aria-pressed={state.liked} aria-label={state.liked ? (de ? "Gefällt mir zurücknehmen" : "Unlike post") : (de ? "Beitrag liken" : "Like post")}
      className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm transition hover:bg-black/5 dark:hover:bg-white/10">
      <Heart className="size-5" style={{ color: state.liked ? "#ef4444" : "var(--ig-text)", fill: state.liked ? "#ef4444" : "none" }} />
      {showCount && <span>{state.likes}{showText ? (de ? " Likes" : " likes") : ""}</span>}
    </button>
    {error && <span role="alert" className="text-xs">{de ? "Like konnte nicht gespeichert werden. Bitte erneut versuchen." : "Like could not be saved. Please try again."}</span>}
  </span>;
}
