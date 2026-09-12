"use client";

import { forwardRef, useEffect, useMemo, useRef, useState, type ChangeEvent, type TextareaHTMLAttributes } from "react";

type ProfileSuggestion = {
  id: string;
  username: string | null;
  name: string | null;
  avatar: string | null;
};

type MentionTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "defaultValue" | "onChange" | "value"> & {
  defaultValue?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  onValueChange?: (value: string) => void;
};

function activeMention(value: string, cursor: number) {
  const beforeCursor = value.slice(0, cursor);
  const match = beforeCursor.match(/(?:^|\s)@([^\s@/]*)$/u);
  if (!match || !match[1]) return null;

  return {
    query: match[1],
    start: beforeCursor.length - match[1].length - 1,
  };
}

const MentionTextarea = forwardRef<HTMLTextAreaElement, MentionTextareaProps>(function MentionTextarea({
  defaultValue = "",
  value: controlledValue,
  onChange,
  onValueChange,
  className,
  ...props
}, forwardedRef) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const [cursor, setCursor] = useState(defaultValue.length);
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const value = controlledValue ?? uncontrolledValue;
  const mention = useMemo(() => activeMention(value, cursor), [value, cursor]);

  useEffect(() => {
    const form = textareaRef.current?.form;
    if (!form || controlledValue !== undefined) return;
    const reset = () => {
      setUncontrolledValue(defaultValue);
      setCursor(defaultValue.length);
    };
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [controlledValue, defaultValue]);

  useEffect(() => {
    if (!mention) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/profiles/search?q=${encodeURIComponent(mention.query)}&prefix=1`, {
          cache: "no-store",
          signal: controller.signal,
        });
        setSuggestions(response.ok ? await response.json() as ProfileSuggestion[] : []);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [mention?.query]);

  function updateValue(nextValue: string, event?: ChangeEvent<HTMLTextAreaElement>) {
    if (controlledValue === undefined) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
    if (event) onChange?.(event);
  }

  function selectProfile(profile: ProfileSuggestion) {
    if (!mention || !profile.username) return;
    const replacement = `@${profile.username} `;
    const nextValue = `${value.slice(0, mention.start)}${replacement}${value.slice(cursor)}`;
    const nextCursor = mention.start + replacement.length;
    updateValue(nextValue);
    setSuggestions([]);
    setCursor(nextCursor);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(nextCursor, nextCursor);
    });
  }

  return (
    <div className="relative min-w-0 flex-1">
      <textarea
        {...props}
        ref={(node) => {
          textareaRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        value={value}
        className={className}
        onChange={(event) => {
          updateValue(event.target.value, event);
          setCursor(event.target.selectionStart ?? event.target.value.length);
        }}
        onClick={(event) => setCursor(event.currentTarget.selectionStart ?? value.length)}
        onKeyUp={(event) => setCursor(event.currentTarget.selectionStart ?? value.length)}
        onBlur={() => window.setTimeout(() => setSuggestions([]), 120)}
      />
      {mention && (loading || suggestions.length > 0) ? (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {suggestions.map((profile) => profile.username ? (
            <button
              key={profile.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectProfile(profile)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-orange-50 dark:hover:bg-slate-800"
            >
              <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-200 text-xs font-bold dark:bg-slate-700">
                {profile.avatar ? <img src={profile.avatar} alt="" className="h-full w-full object-cover" /> : (profile.name || profile.username).slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{profile.name || profile.username}</span><span className="block truncate text-xs text-slate-500 dark:text-slate-400">@{profile.username}</span></span>
            </button>
          ) : null)}
          {loading ? <p className="px-3 py-2 text-xs text-slate-500">Searching profiles…</p> : null}
        </div>
      ) : null}
    </div>
  );
});

export default MentionTextarea;
