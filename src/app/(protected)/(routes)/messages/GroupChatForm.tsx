"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import EmojiPicker from "@/app/components/EmojiPicker";
import MentionTextarea from "@/app/components/MentionTextarea";
import useVibeLanguage from "@/app/components/useVibeLanguage";
import { ChevronDown, UsersRound } from "lucide-react";

type GroupChatFormProps = {};

type ProfileSuggestion = {
  id: string;
  username: string | null;
  name: string | null;
  avatar: string | null;
};

export default function GroupChatForm(_: GroupChatFormProps) {
  const language = useVibeLanguage();
  const de = language === "de";
  const [isExpanded, setIsExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [selected, setSelected] = useState<ProfileSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const initialMessageRef = useRef<HTMLTextAreaElement>(null);

  function insertInitialMessageEmoji(emoji: string) {
    const textarea = initialMessageRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.setRangeText(emoji, start, end, "end");
    textarea.focus();
  }

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(""), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    if (!query) {
      setSuggestions([]);
      return;
    }

    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/profiles/search?q=${encodeURIComponent(query)}`,
        );
        if (res.ok) {
          const data = await res.json();
          // filter out already selected
          const filtered = (data as ProfileSuggestion[]).filter(
            (p) => !selected.some((s) => s.id === p.id),
          );
          setSuggestions(filtered);
        } else {
          setSuggestions([]);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(id);
  }, [query, selected]);

  const hiddenParticipantValue = useMemo(
    () =>
      selected
        .map((s) => s.username)
        .filter(Boolean)
        .join(","),
    [selected],
  );

  const handleAdd = (profile: ProfileSuggestion) => {
    if (selected.some((s) => s.id === profile.id)) return;
    setSelected((p) => [...p, profile]);
    setQuery("");
    setSuggestions([]);
  };

  const handleRemove = (id: string) => {
    setSelected((p) => p.filter((s) => s.id !== id));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selected.length < 2) {
      setToastMessage(de ? "Füge mindestens zwei weitere Mitglieder hinzu." : "Please add at least two other members.");
      return;
    }

    const form = event.currentTarget;
    // ensure hidden input is up to date
    const hidden = form.elements.namedItem(
      "participantUsernames",
    ) as HTMLInputElement | null;
    if (hidden) hidden.value = hiddenParticipantValue;

    try {
      const res = await fetch(`/api/conversations/create`, {
        method: "POST",
        body: new FormData(form),
      });
      if (!res.ok) {
        const err = await res.text();
        setToastMessage(err || (de ? "Gruppe konnte nicht erstellt werden." : "Could not create group"));
        return;
      }
      const data = await res.json();
      if (data?.id) {
        window.location.href = `/messages/${data.id}`;
      }
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : de ? "Netzwerkfehler" : "Network error");
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-2xl bg-white shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((current) => !current)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-700/40"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-linear-to-tr from-(--ig-orange) to-(--ig-red) text-white"><UsersRound size={19} /></span>
          <span className="min-w-0">
            <span className="block font-semibold text-slate-800 dark:text-slate-100">{de ? "Gruppenchat erstellen" : "Create a group chat"}</span>
            <span className="mt-0.5 block text-sm text-slate-500 dark:text-slate-400">{de ? "Mitglieder suchen und hinzufügen" : "Search and add members"}</span>
          </span>
        </span>
        <ChevronDown className={`shrink-0 text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {isExpanded ? <div className="border-t border-slate-200 p-5 dark:border-slate-700">
        {toastMessage ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {toastMessage}
          </div>
        ) : null}

      <form onSubmit={handleSubmit} className="grid gap-3">
        <label className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <span>{de ? "Gruppenname" : "Group name"}</span>
          <input
            name="name"
            required
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder={de ? "Meine Freundesgruppe" : "My friends group"}
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            {de ? "Mitglieder hinzufügen" : "Add members"}
          </span>

          <div className="flex flex-wrap gap-2">
            {selected.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleRemove(s.id)}
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm dark:bg-gray-700"
              >
                <span>{s.name || s.username}</span>
                <span className="text-xs text-slate-500">✕</span>
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={de ? "Nutzer nach Name oder Benutzername suchen" : "Search users by name or username"}
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />

          {loading ? (
            <div className="text-sm text-slate-500">{de ? "Suche…" : "Searching…"}</div>
          ) : null}

          {suggestions.length > 0 && (
            <ul className="mt-2 max-h-48 overflow-auto rounded-xl border border-slate-100 bg-white p-2 text-sm shadow-sm dark:border-slate-700 dark:bg-gray-800">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => handleAdd(s)}
                    className="w-full text-left px-2 py-2 hover:bg-slate-50 dark:hover:bg-gray-700"
                  >
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {s.name || s.username}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {s.username ? `@${s.username}` : ""}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <input
          type="hidden"
          name="participantUsernames"
          value={hiddenParticipantValue}
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            {de ? "Gruppe erstellen" : "Create Group"}
          </button>
        </div>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          <span>{de ? "Erste Nachricht (optional)" : "Initial message (optional)"}</span>
          <div className="mt-1 flex items-end gap-2">
            <EmojiPicker onSelect={insertInitialMessageEmoji} />
            <MentionTextarea
              ref={initialMessageRef}
              name="initialMessage"
              className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              placeholder={de ? "Sag der Gruppe etwas…" : "Say something to the group..."}
              rows={2}
            />
          </div>
        </div>
      </form>
      </div> : null}
    </section>
  );
}
