"use client";

import Link from "next/link";
import { captionParts } from "@/caption-links";

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
      {captionParts(text).map((part, index) => !part.href ? <span key={index}>{part.text}</span> : part.external ?
        <a key={index} href={part.href} target="_blank" rel="noopener noreferrer" className={linkClassName}>{part.text}</a> :
        <Link key={index} href={part.href} className={linkClassName}>{part.text}</Link>)}
    </span>
  );
}
