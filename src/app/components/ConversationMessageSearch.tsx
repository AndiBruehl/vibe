"use client";

import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { FormEvent, useMemo, useRef, useState } from "react";

type SearchableMessage = {
  id: string;
  body: string;
};

type ConversationMessageSearchProps = {
  messages: SearchableMessage[];
  de: boolean;
};

/** Searches the messages already rendered in the current conversation without a navigation or reload. */
export default function ConversationMessageSearch({ messages, de }: ConversationMessageSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = useMemo(
    () => normalizedQuery ? messages.filter((message) => message.body.toLocaleLowerCase().includes(normalizedQuery)) : [],
    [messages, normalizedQuery],
  );

  const selectedIndex = matches.length ? Math.min(activeIndex, matches.length - 1) : 0;

  function reveal(index: number) {
    const message = matches[index];
    if (!message) return;

    const target = document.getElementById(`message-${message.id}`);
    if (!target) return;

    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.style.transition = "box-shadow 160ms ease";
    target.style.boxShadow = "0 0 0 3px rgba(251, 146, 60, .95), 0 0 22px rgba(244, 63, 94, .45)";
    window.setTimeout(() => { target.style.boxShadow = ""; }, 1800);
  }

  function move(direction: -1 | 1) {
    if (!matches.length) return;
    const nextIndex = (selectedIndex + direction + matches.length) % matches.length;
    setActiveIndex(nextIndex);
    reveal(nextIndex);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    reveal(selectedIndex);
  }

  function close() {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          window.setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="grid size-10 place-items-center rounded-full text-slate-600 transition hover:scale-105 hover:text-orange-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 dark:text-slate-300 dark:hover:text-orange-300"
        aria-label={de ? "Unterhaltung durchsuchen" : "Search conversation"}
        aria-expanded={open}
      >
        <Search size={20} />
      </button>

      {open ? (
        <form onSubmit={submit} className="absolute left-0 top-12 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-orange-300/50 bg-white p-3 shadow-xl shadow-slate-950/20 dark:border-orange-400/30 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <Search size={18} className="shrink-0 text-orange-500" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }}
              type="search"
              maxLength={4000}
              placeholder={de ? "Nachrichten durchsuchen" : "Search messages"}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
              aria-label={de ? "Nachrichten durchsuchen" : "Search messages"}
            />
            <button type="button" onClick={close} className="grid size-8 place-items-center rounded-full text-slate-500 transition hover:text-red-500 focus-visible:outline-2 focus-visible:outline-red-400" aria-label={de ? "Suche schließen" : "Close search"}><X size={18} /></button>
          </div>

          {normalizedQuery ? (
            matches.length ? (
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                <p className="min-w-0 truncate text-xs font-bold text-slate-600 dark:text-slate-300">{de ? `${selectedIndex + 1} von ${matches.length} Treffern` : `${selectedIndex + 1} of ${matches.length} matches`}</p>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => move(-1)} className="grid size-9 place-items-center rounded-full text-orange-500 transition hover:bg-orange-500/10" aria-label={de ? "Vorheriger Treffer" : "Previous match"}><ChevronUp size={19} /></button>
                  <button type="button" onClick={() => move(1)} className="grid size-9 place-items-center rounded-full text-orange-500 transition hover:bg-orange-500/10" aria-label={de ? "Nächster Treffer" : "Next match"}><ChevronDown size={19} /></button>
                </div>
              </div>
            ) : <p className="mt-3 border-t border-slate-200 pt-3 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">{de ? "Keine Nachrichten gefunden." : "No messages found."}</p>
          ) : <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">{de ? "Durchsuche die Nachrichten in dieser Unterhaltung." : "Search the messages in this conversation."}</p>}
        </form>
      ) : null}
    </div>
  );
}
