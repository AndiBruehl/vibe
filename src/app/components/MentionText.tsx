"use client";

import Link from "next/link";

type MentionTextProps = {
  text: string;
  className?: string;
  linkClassName?: string;
};

export default function MentionText({
  text,
  className,
  linkClassName = "font-semibold text-orange-600 hover:underline dark:text-orange-300",
}: MentionTextProps) {
  return (
    <span className={className}>
      {text.split(/(@[^\s@/]+)/u).map((part, index) => {
        if (!part.startsWith("@")) return <span key={index}>{part}</span>;

        const match = part.match(/^@(.+?)([.,!?;:)\]}]*)$/u);
        const handle = match?.[1];
        if (!handle) return <span key={index}>{part}</span>;

        return (
          <span key={index}>
            <Link href={`/profile/${encodeURIComponent(handle)}`} className={linkClassName}>
              @{handle}
            </Link>
            {match?.[2]}
          </span>
        );
      })}
    </span>
  );
}
