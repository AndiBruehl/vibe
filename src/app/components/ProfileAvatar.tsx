import Image from "next/image";
import { avatarFrameStyle } from "@/profile-personalization";

type ProfileAvatarProps = {
  avatar?: string | null;
  name?: string | null;
  username?: string | null;
  avatarAccent?: string | null;
  avatarAccentEnd?: string | null;
  avatarAccentDirection?: string | null;
  alt?: string;
  sizeClass: string;
  className?: string;
};

/** Shared avatar treatment so a profile's saved frame is visible throughout VIBE. */
export default function ProfileAvatar({
  avatar,
  name,
  username,
  avatarAccent,
  avatarAccentEnd,
  avatarAccentDirection,
  alt = "",
  sizeClass,
  className = "",
}: ProfileAvatarProps) {
  const fallback = (name || username || "?").slice(0, 1).toUpperCase();

  return (
    <span
      className={`relative grid shrink-0 place-items-center rounded-full p-0.5 ${sizeClass} ${className}`}
      style={avatarFrameStyle(avatarAccent, avatarAccentEnd, avatarAccentDirection)}
    >
      <span className="relative block size-full overflow-hidden rounded-full bg-slate-200 text-center text-xs leading-none text-slate-600 dark:bg-slate-700 dark:text-slate-200">
        {avatar ? <Image src={avatar} alt={alt} fill sizes="96px" className="object-cover" unoptimized /> : <span className="grid size-full place-items-center">{fallback}</span>}
      </span>
    </span>
  );
}
