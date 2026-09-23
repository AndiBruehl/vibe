import { auth } from "@/auth";
import { prisma } from "@/db";
import { redirect } from "next/navigation";
import CreateWorkspace from "@/app/components/CreateWorkspace";
export default async function CreatePage() {
  const email = (await auth())?.user?.email;
  if (!email) redirect("/");
  let draftLoadFailed = false;
  let drafts: Awaited<ReturnType<typeof prisma.postDraft.findMany>> = [];
  try {
    drafts = await prisma.postDraft.findMany({ where: { authorEmail: email }, orderBy: { updatedAt: "desc" } });
  } catch {
    draftLoadFailed = true;
  }
  const ids = [...new Set(drafts.flatMap(draft => Array.isArray(draft.profileTags) ? draft.profileTags : []))];
  let profiles: { id: string; username: string | null; name: string | null; avatar: string | null }[] = [];
  if (ids.length) {
    try {
      profiles = await prisma.profile.findMany({ where: { id: { in: ids } }, select: { id: true, username: true, name: true, avatar: true } });
    } catch {
      // The draft itself is still usable even when an old tagged profile cannot be loaded.
    }
  }
  return <CreateWorkspace draftLoadFailed={draftLoadFailed} drafts={drafts.map(draft => ({
    id: draft.id, description: typeof draft.description === "string" ? draft.description : "",
    images: Array.isArray(draft.images) ? draft.images : [], mediaTypes: Array.isArray(draft.mediaTypes) ? draft.mediaTypes : [],
    topics: Array.isArray(draft.topics) ? draft.topics : [], updatedAt: draft.updatedAt.toISOString(),
    taggedProfiles: profiles.filter(profile => (draft.profileTags || []).includes(profile.id)),
  }))} />;
}
