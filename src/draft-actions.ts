"use server";

import { auth } from "@/auth";
import { prisma } from "@/db";
import { isObjectId } from "@/object-id";
import { parsePostImages, parsePostMediaTypes } from "@/post-images";
import { revalidatePath } from "next/cache";

export async function savePostDraft(data: FormData) {
  const email = (await auth())?.user?.email;
  if (!email) return { error: "session" };
  const id = String(data.get("draftId") || "");
  if (id && !isObjectId(id)) return { error: "missing" };
  try {
    const rawImages = data.getAll("images");
    const images = rawImages.length ? parsePostImages(rawImages) : [];
    const mediaTypes = parsePostMediaTypes(data.getAll("mediaType"), images.length);
    const description = String(data.get("description") || "").trim().slice(0, 10000);
    const topics = [...new Set(String(data.get("topics") || "").split(",").map(t => t.trim()).filter(Boolean))].slice(0, 5);
    const profileTags = [...new Set(data.getAll("profileTags").filter((value): value is string => typeof value === "string" && isObjectId(value)))].slice(0, 10);
    if (!images.length && !description && !topics.length && !profileTags.length) return { error: "empty" };
    const values = { description, images, mediaTypes, topics, profileTags };
    if (id) {
      const result = await prisma.postDraft.updateMany({ where: { id, authorEmail: email }, data: values });
      if (!result.count) return { error: "missing" };
    } else {
      const draft = await prisma.postDraft.create({ data: { authorEmail: email, ...values } });
      revalidatePath("/create");
      return { id: draft.id };
    }
    revalidatePath("/create");
    return { id };
  } catch {
    return { error: "save" };
  }
}

export async function deletePostDraft(id: string) {
  const email = (await auth())?.user?.email;
  if (!email || !isObjectId(id)) return { ok: false };
  try {
    const result = await prisma.postDraft.deleteMany({ where: { id, authorEmail: email } });
    revalidatePath("/create");
    return { ok: result.count > 0 };
  } catch {
    return { ok: false };
  }
}
