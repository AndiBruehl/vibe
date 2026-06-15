"use client";

import { useEffect, useMemo, useState } from "react";

type Profile = { id: string; name: string | null; username: string | null; avatar: string | null };

type Props = {
  conversationId: string;
  initialName: string | null;
  participants: Profile[];
  currentUserId: string;
};

export default function GroupSettings({ conversationId, initialName, participants: initialParticipants, currentUserId }: Props) {
  const [name, setName] = useState(initialName ?? "");
  const [editingName, setEditingName] = useState(false);
  const [members, setMembers] = useState<Profile[]>(initialParticipants);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!query) return setSuggestions([]);
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/profiles/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          const filtered = (data as Profile[]).filter((p) => !members.some((m) => m.id === p.id));
          setSuggestions(filtered);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, members]);

  const hiddenUsernames = useMemo(() => members.map((m) => m.username).filter(Boolean).join(","), [members]);

  const saveName = async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/name`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) {
        const err = await res.text();
        setMessage(err || "Could not update name");
        return;
      }
      setEditingName(false);
      setMessage("Name updated");
    } catch (e) {
      setMessage("Network error");
    }
  };

  const addMember = async (username: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ usernames: [username] }),
      });
      if (!res.ok) {
        setMessage(await res.text());
        return;
      }
      const added = await res.json();
      setMembers((m) => [...m, ...added]);
      setSuggestions((s) => s.filter((x) => x.username !== username));
      setQuery("");
      setMessage("Member added");
    } catch (e) {
      setMessage("Network error");
    }
  };

  const removeMember = async (profileId: string) => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/members`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profileId }),
      });
      if (!res.ok) {
        setMessage(await res.text());
        return;
      }
      setMembers((m) => m.filter((x) => x.id !== profileId));
      setMessage("Member removed");
    } catch (e) {
      setMessage("Network error");
    }
  };

  const deleteGroup = async () => {
    if (!confirm("Delete this group? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, { method: "DELETE" });
      if (!res.ok) {
        setMessage(await res.text());
        return;
      }
      // redirect to messages
      window.location.href = "/messages";
    } catch (e) {
      setMessage("Network error");
    }
  };

  return (
    <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
      {message ? <div className="mb-3 text-sm text-red-600 dark:text-red-400">{message}</div> : null}

      <div className="mb-3">
        <label className="text-xs text-slate-500 dark:text-slate-400">Group name</label>
        {!editingName ? (
          <div className="flex items-center justify-between">
            <div className="truncate font-semibold">{name}</div>
            <button type="button" onClick={() => setEditingName(true)} className="text-sm text-slate-500">Edit</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input className="flex-1 rounded-xl border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
            <button type="button" onClick={saveName} className="rounded-xl bg-black px-3 py-2 text-white">Save</button>
            <button type="button" onClick={() => { setEditingName(false); setName(initialName ?? ""); }} className="rounded-xl border px-3 py-2">Cancel</button>
          </div>
        )}
      </div>

      <div className="mb-3">
        <label className="text-xs text-slate-500 dark:text-slate-400">Members</label>
        <ul className="mt-2 space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between">
              <div className="truncate">{m.name || m.username}</div>
              {m.id !== currentUserId ? (
                <button className="text-sm text-red-600" onClick={() => removeMember(m.id)}>Remove</button>
              ) : (
                <span className="text-xs text-slate-400">You</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-3">
        <label className="text-xs text-slate-500 dark:text-slate-400">Add member</label>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or username" className="w-full rounded-2xl border px-3 py-2" />
        {loading ? <div className="text-sm text-slate-500 mt-2">Searching…</div> : null}
        {suggestions.length > 0 && (
          <ul className="mt-2 max-h-40 overflow-auto rounded border bg-white p-2 text-sm">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => addMember(s.username || '')} className="w-full text-left px-2 py-2 hover:bg-slate-50">{s.name || s.username}</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-between">
        <button onClick={deleteGroup} className="text-sm text-red-600">Delete Group</button>
      </div>
    </section>
  );
}
