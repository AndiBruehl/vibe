"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type GroupChatFormProps = {
  action: (formData: FormData) => Promise<void>;
};

type ProfileSuggestion = {
  id: string;
  username: string | null;
  name: string | null;
  avatar: string | null;
};

export default function GroupChatForm({ action }: GroupChatFormProps) {
  const [toastMessage, setToastMessage] = useState("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [selected, setSelected] = useState<ProfileSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

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
      setToastMessage("Please add at least two other members.");
      return;
    }

    const form = event.currentTarget;
    // ensure hidden input is up to date
    const hidden = form.elements.namedItem(
      "participantUsernames",
    ) as HTMLInputElement | null;
    if (hidden) hidden.value = hiddenParticipantValue;

    try {
      await action(new FormData(form));
    } catch (err) {
      setToastMessage(
        err instanceof Error ? err.message : "Something went wrong",
      );
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-2xl bg-white p-6 shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        Create a group chat
      </h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Search and add members to the group.
      </p>

      {toastMessage ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {toastMessage}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3">
        <label className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <span>Group name</span>
          <input
            name="name"
            required
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="My friends group"
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Add members
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
                <span className="text-xs text-gray-500">✕</span>
              </button>
            ))}
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users by name or username"
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />

          {loading ? (
            <div className="text-sm text-slate-500">Searching…</div>
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
            className="inline-flex items-center justify-center rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 dark:bg-white dark:text-black dark:hover:bg-slate-200"
          >
            Create Group
          </button>
        </div>
      </form>
    </section>
  );
}
