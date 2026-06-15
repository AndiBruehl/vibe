"use client";

import { FormEvent, useEffect, useState } from "react";

type GroupChatFormProps = {
  action: (formData: FormData) => Promise<void>;
};

export default function GroupChatForm({ action }: GroupChatFormProps) {
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = setTimeout(() => {
      setToastMessage("");
    }, 3000);

    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    const groupName = (form.elements.namedItem("name") as HTMLInputElement | null)
      ?.value.trim();
    const participantUsernames = (
      form.elements.namedItem("participantUsernames") as HTMLInputElement | null
    )?.value
      .split(",")
      .map((username) => username.trim())
      .filter(Boolean) ?? [];

    if (!groupName) {
      event.preventDefault();
      setToastMessage("Group name is required.");
      return;
    }

    if (participantUsernames.length < 2) {
      event.preventDefault();
      setToastMessage(
        "Please add at least two other members, separated by commas.",
      );
      return;
    }
  };

  return (
    <section className="mt-6 overflow-hidden rounded-2xl bg-white p-6 shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
        Create a group chat
      </h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Add at least two usernames separated by commas to start a new group.
      </p>

      {toastMessage ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {toastMessage}
        </div>
      ) : null}

      <form action={action} onSubmit={handleSubmit} className="mt-4 grid gap-3">
        <label className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <span>Group name</span>
          <input
            name="name"
            required
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="My friends group"
          />
        </label>

        <label className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <span>Participant usernames</span>
          <input
            name="participantUsernames"
            required
            className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            placeholder="alice, bob, charlie"
          />
        </label>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 dark:bg-white dark:text-black dark:hover:bg-slate-200"
        >
          Create Group
        </button>
      </form>
    </section>
  );
}
