import GuestShell from "@/app/components/GuestShell";
export const dynamic = "force-dynamic";
export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return <GuestShell>{children}</GuestShell>;
}
