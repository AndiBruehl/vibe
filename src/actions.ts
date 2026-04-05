"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/db";
import { auth } from "@/auth";

export async function upsertProfile(formData: FormData) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const newUserInfo = {
    username: (formData.get("username") as string) || "",
    name: (formData.get("name") as string) || "",
    subtitle: (formData.get("subtitle") as string) || "",
    bio: (formData.get("bio") as string) || "",
    avatar: (formData.get("avatarUrl") as string) || "",
  };

  await prisma.profile.upsert({
    where: {
      email: session.user.email,
    },
    update: {
      ...newUserInfo,
    },
    create: {
      email: session.user.email,
      ...newUserInfo,
    },
  });

  redirect("/profile");
}

export async function postEntry(formData: FormData) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const image = formData.get("image");
  const description = formData.get("description");

  if (!image || typeof image !== "string") {
    throw new Error("Image is missing.");
  }

  const postDoc = await prisma.post.create({
    data: {
      author: session.user.email,
      image,
      description: typeof description === "string" ? description : "",
    },
  });

  return postDoc.id;
}
