import { toggleBlock } from "@/actions";

export default function BlockButton({ targetProfileId, blocked=false, language="en", returnTo }: { targetProfileId: string; blocked?: boolean; language?: "en"|"de"; returnTo?: string }) {
  return <form action={toggleBlock}>
    <input type="hidden" name="targetProfileId" value={targetProfileId}/>
    {returnTo && <input type="hidden" name="returnTo" value={returnTo}/>}
    <button className="rounded-2xl border border-red-300 px-4 py-2 text-sm font-semibold text-red-600">{blocked ? (language === "de" ? "Entblocken" : "Unblock") : (language === "de" ? "Blockieren" : "Block")}</button>
  </form>;
}
