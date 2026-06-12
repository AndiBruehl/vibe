import { startConversation } from "@/actions";
import { MessageCircle } from "lucide-react";

type MessageButtonProps = {
  targetProfileId: string;
};

export default function MessageButton({ targetProfileId }: MessageButtonProps) {
  return (
    <form action={startConversation}>
      <input type="hidden" name="targetProfileId" value={targetProfileId} />
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-gray-900 dark:text-slate-100 dark:hover:bg-gray-700"
      >
        <MessageCircle size={16} />
        Message
      </button>
    </form>
  );
}
