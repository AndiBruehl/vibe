import Link from "next/link";
import { prisma } from "@/db";
import DesktopNav from "@/app/components/DesktopNav";
import MobileNav from "@/app/components/MobileNav";

/* Topics index temporarily disabled */
export default async function TopicsIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">Topics UI disabled temporarily</h1>
    </div>
  );
}

/*
Original implementation preserved above in comments if needed.
*/
