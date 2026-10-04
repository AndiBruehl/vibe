import GuestShell from "@/app/components/GuestShell";
import ConfirmLogin from "@/app/components/ConfirmLogin";
export const metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default function ConfirmPage() { return <GuestShell><ConfirmLogin/></GuestShell>; }
