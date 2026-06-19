"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Topic = { id: string; name: string; slug: string };
const MAX_TOPICS = 5;
const TOPIC_LIMIT_MESSAGE =
  "Du kannst bis zu 5 Topics pro Beitrag verwenden. Entferne erst eines, wenn du ein anderes hinzufügen möchtest.";

export default function TopicPicker({ initial = [] }: { initial?: string[] }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Topic[]>([]);
  const [selected, setSelected] = useState<string[]>(() =>
    Array.from(new Set(initial.map((topic) => topic.trim()).filter(Boolean))).slice(
      0,
      MAX_TOPICS,
    ),
  );
  const [limitMessage, setLimitMessage] = useState("");
  const timer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const keepSuggestionsRef = useRef(false);
  const [changed, setChanged] = useState(false);
  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const topicsSetRef = useRef<HTMLInputElement | null>(null);

  const pendingTopics = useMemo(() => {
    const pendingQuery = query.trim();
    const canAppendPending =
      pendingQuery &&
      !selected.includes(pendingQuery) &&
      selected.length < MAX_TOPICS;

    return [...selected, ...(canAppendPending ? [pendingQuery] : [])];
  }, [query, selected]);

  const hasPendingTopicChange =
    query.trim() !== "" &&
    !selected.includes(query.trim()) &&
    selected.length < MAX_TOPICS;

  useEffect(() => {
    if (!query) {
      if (keepSuggestionsRef.current) {
        // keep existing suggestions this one time after an add
        keepSuggestionsRef.current = false;
      } else {
        // avoid calling setState synchronously inside an effect
        // schedule it asynchronously so we don't trigger cascading renders
        Promise.resolve().then(() => setSuggestions([]));
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
      } catch {
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
    if (selected.length >= MAX_TOPICS) {
      setLimitMessage(TOPIC_LIMIT_MESSAGE);
      return;
    }

    setSelected((s) => {
      const next = [...s, normalized];
      // filter suggestions against new selection
      setSuggestions((prev) => prev.filter((x) => !next.includes(x.name)));
      setChanged(true);
      return next;
    });

    // keep suggestions visible one more cycle and clear input, then refocus
    keepSuggestionsRef.current = true;
    setLimitMessage("");
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function remove(idx: number) {
    setSelected((s) => {
      setChanged(true);
      setLimitMessage("");
      return s.filter((_, i) => i !== idx);
    });
  }

  // keep hidden inputs in sync with React state before browser paint/submit
  // hidden inputs are now controlled via React `value` props below;
  // keep refs for the debug submit listener only.

  // debug: log selected/hidden values and full FormData right before form submit
  useEffect(() => {
    // try to find the enclosing form; fall back to closest() or document.querySelector
    let form = inputRef.current?.form as HTMLFormElement | undefined;
    if (!form && inputRef.current) {
      // closest may not be on the input element typing, use any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      form = (inputRef.current as any)?.closest?.("form");
    }
    if (!form) form = document.querySelector("form") ?? undefined;
    if (!form) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onSubmit = (e: Event) => {
      try {
        // ensure hidden inputs reflect latest React state just before serialization
        if (hiddenRef.current) hiddenRef.current.value = pendingTopics.join(",");
        if (topicsSetRef.current)
          topicsSetRef.current.value = changed || hasPendingTopicChange ? "1" : "";

        // fallback: if React state is empty but DOM shows chips (possible race),
        // read chips first from the component container, then from the form.
        if (
          (!selected || selected.length === 0) &&
          hiddenRef.current &&
          hiddenRef.current.value === ""
        ) {
          try {
            const names: string[] = [];
            const fromContainer =
              containerRef.current?.querySelectorAll?.("[data-topic]");
            const chipEls =
              fromContainer && fromContainer.length > 0
                ? fromContainer
                : form?.querySelectorAll?.("[data-topic]");

            if (chipEls && chipEls.length > 0) {
              chipEls.forEach((el) =>
                names.push((el as HTMLElement).dataset.topic || ""),
              );
              const filtered = names.filter(Boolean).slice(0, MAX_TOPICS);
              hiddenRef.current.value = filtered.join(",");
              if (topicsSetRef.current)
                topicsSetRef.current.value = filtered.length > 0 ? "1" : "";
            }
          } catch {
            // ignore fallback errors
          }
        }

        console.log(
          "TopicPicker: before submit - selected:",
          selected,
          "changed:",
          changed,
        );
        const fd = new FormData(form);
        for (const [k, v] of fd.entries()) {
          console.log("TopicPicker form:", k, v);
        }
      } catch (err) {
        console.error("TopicPicker submit log failed", err);
      }
    };

    form.addEventListener("submit", onSubmit, true);
    return () => form.removeEventListener("submit", onSubmit, true);
  }, [selected, changed, pendingTopics, hasPendingTopicChange]);

  // debug: log hidden input value whenever selection changes
  useEffect(() => {
    try {
      console.debug(
        "TopicPicker: selected changed",
        selected,
        "hidden.value:",
        hiddenRef.current?.value,
        "topicsSet:",
        topicsSetRef.current?.value,
      );
    } catch {
      // ignore
    }
  }, [selected, changed]);

  return (
    <div ref={containerRef} className="w-full">
      <div className="flex flex-wrap gap-2">
        {selected.map((t, i) => (
          <span
            key={t}
            data-topic={t}
            className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 text-sm"
          >
            <span className="truncate max-w-40">{t}</span>
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
          onChange={(e) => {
            const nextQuery = e.target.value;
            setQuery(nextQuery);
            if (
              selected.length >= MAX_TOPICS &&
              nextQuery.trim() &&
              !selected.includes(nextQuery.trim())
            ) {
              setLimitMessage(TOPIC_LIMIT_MESSAGE);
            } else {
              setLimitMessage("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (query.trim()) add(query.trim());
            }
          }}
          placeholder="Add topics (type and press Enter or pick suggestion)"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />

        {limitMessage ? (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            {limitMessage}
          </p>
        ) : null}

        {suggestions.length > 0 && (
          <ul className="absolute z-40 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white shadow ring-1 ring-black/5">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    // use onMouseDown so selection happens before blur/submit
                    e.preventDefault();
                    add(s.name);
                  }}
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

      <input
        ref={hiddenRef}
        type="hidden"
        name="topics"
        value={pendingTopics.join(",")}
        readOnly
      />
      <input
        ref={topicsSetRef}
        type="hidden"
        name="topicsSet"
        value={changed || hasPendingTopicChange ? "1" : ""}
        readOnly
      />
    </div>
  );
}
