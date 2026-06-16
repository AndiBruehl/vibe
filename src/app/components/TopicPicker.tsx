"use client";

import { useEffect, useRef, useState } from "react";

type Topic = { id: string; name: string; slug: string };

export default function TopicPicker({ initial = [] }: { initial?: string[] }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<string[]>(initial);
  const timer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const keepSuggestionsRef = useRef(false);

  useEffect(() => {
    if (!query) {
      if (keepSuggestionsRef.current) {
        // keep existing suggestions this one time after an add
        keepSuggestionsRef.current = false;
      } else {
        setSuggestions([]);
        return;
      }
    }

    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/topics/search?q=${encodeURIComponent(query)}`,
          { cache: "no-store" },
        );
        if (!res.ok) return setSuggestions([]);
        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data.slice(0, 10) : []);
      } catch (err) {
        setSuggestions([]);
      }
    }, 200);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [query]);

  function add(topicName: string) {
    const normalized = topicName.trim();
    if (!normalized) return;
    if (selected.includes(normalized)) return;
    setSelected((s) => {
      const next = [...s, normalized];
      // filter suggestions against new selection
      setSuggestions((prev) => prev.filter((x) => !next.includes(x.name)));
      return next;
    });

    // keep suggestions visible one more cycle and clear input, then refocus
    keepSuggestionsRef.current = true;
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function remove(idx: number) {
    setSelected((s) => s.filter((_, i) => i !== idx));
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map((t, i) => (
          <span
            key={t}
            className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 text-sm"
          >
            <span className="truncate max-w-[10rem]">{t}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs text-slate-500"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (query.trim()) add(query.trim());
            }
          }}
          placeholder="Add topics (type and press Enter or pick suggestion)"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />

        {suggestions.length > 0 && (
          <ul className="absolute z-40 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white shadow ring-1 ring-black/5">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => add(s.name)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                >
                  {s.name}{" "}
                  <span className="text-xs text-slate-400">#{s.slug}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <input type="hidden" name="topics" value={selected.join(",")} />
    </div>
  );
}
