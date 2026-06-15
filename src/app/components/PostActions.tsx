"use client";

import { useState } from "react";

export default function PostActions({
  postId,
  isAuthor,
  initialDescription,
  initialImage,
}: {
  postId: string;
  isAuthor: boolean;
  initialDescription: string | null;
  initialImage: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(initialDescription || "");
  const [image, setImage] = useState(initialImage || "");

  if (!isAuthor) return null;

  return (
    <div className="flex gap-2">
      {!isEditing ? (
        <>
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium text-gray-600"
          >
            Edit
          </button>
          <button
            onClick={async () => {
              if (!confirm("Delete this post?")) return;
              await fetch(`/api/mobile/posts/${postId}`, { method: "DELETE" });
              window.location.href = "/profile";
            }}
            className="text-sm font-medium text-red-600"
          >
            Delete
          </button>
        </>
      ) : (
        <div className="flex items-center gap-2">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="rounded-md border px-2 py-1 text-sm"
          />
          <button
            onClick={async () => {
              await fetch(`/api/mobile/posts/${postId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description, image }),
              });
              setIsEditing(false);
              window.location.reload();
            }}
            className="text-sm font-medium text-gray-600"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="text-sm font-medium text-gray-600"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
