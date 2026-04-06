"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

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

  const cleanedImage = image.trim();

  if (!cleanedImage) {
    throw new Error("Image cannot be empty.");
  }

  const postDoc = await prisma.post.create({
    data: {
      authorEmail: session.user.email,
      image: cleanedImage,
      description: typeof description === "string" ? description.trim() : "",
    },
  });

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath(`/posts/${postDoc.id}`);

  redirect(`/posts/${postDoc.id}`);
}

export async function togglePostLike(formData: FormData): Promise<void> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const postIdValue = formData.get("postId");

  if (typeof postIdValue !== "string" || !postIdValue) {
    throw new Error("Post ID is missing.");
  }

  const post = await prisma.post.findUnique({
    where: { id: postIdValue },
    select: { id: true },
  });

  if (!post) {
    throw new Error("Post not found.");
  }

  const existingLike = await prisma.postLike.findUnique({
    where: {
      postId_authorEmail: {
        postId: postIdValue,
        authorEmail: session.user.email,
      },
    },
  });

  if (existingLike) {
    await prisma.$transaction([
      prisma.postLike.delete({
        where: {
          postId_authorEmail: {
            postId: postIdValue,
            authorEmail: session.user.email,
          },
        },
      }),
      prisma.post.update({
        where: { id: postIdValue },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.postLike.create({
        data: {
          postId: postIdValue,
          authorEmail: session.user.email,
        },
      }),
      prisma.post.update({
        where: { id: postIdValue },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      }),
    ]);
  }

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath(`/posts/${postIdValue}`);
}

export async function postComment(formData: FormData): Promise<void> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const textValue = formData.get("text");
  const postIdValue = formData.get("postId");

  if (typeof textValue !== "string") {
    throw new Error("Comment text is missing.");
  }

  if (typeof postIdValue !== "string" || !postIdValue) {
    throw new Error("Post ID is missing.");
  }

  const text = textValue.trim();

  if (!text) {
    throw new Error("Comment cannot be empty.");
  }

  const post = await prisma.post.findUnique({
    where: { id: postIdValue },
    select: { id: true },
  });

  if (!post) {
    throw new Error("Post not found.");
  }

  await prisma.comment.create({
    data: {
      authorEmail: session.user.email,
      postId: postIdValue,
      parentCommentId: null,
      text,
    },
  });

  revalidatePath(`/posts/${postIdValue}`);
}

export async function postReply(formData: FormData): Promise<void> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const textValue = formData.get("text");
  const postIdValue = formData.get("postId");
  const parentCommentIdValue = formData.get("parentCommentId");

  if (typeof textValue !== "string") {
    throw new Error("Reply text is missing.");
  }

  if (typeof postIdValue !== "string" || !postIdValue) {
    throw new Error("Post ID is missing.");
  }

  if (typeof parentCommentIdValue !== "string" || !parentCommentIdValue) {
    throw new Error("Parent comment ID is missing.");
  }

  const text = textValue.trim();

  if (!text) {
    throw new Error("Reply cannot be empty.");
  }

  const parentComment = await prisma.comment.findUnique({
    where: { id: parentCommentIdValue },
    select: { id: true, postId: true },
  });

  if (!parentComment) {
    throw new Error("Parent comment not found.");
  }

  if (parentComment.postId !== postIdValue) {
    throw new Error("Reply does not belong to this post.");
  }

  await prisma.comment.create({
    data: {
      authorEmail: session.user.email,
      postId: postIdValue,
      parentCommentId: parentCommentIdValue,
      text,
    },
  });

  revalidatePath(`/posts/${postIdValue}`);
}

export async function likeComment(formData: FormData): Promise<void> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const commentIdValue = formData.get("commentId");
  const postIdValue = formData.get("postId");

  if (typeof commentIdValue !== "string" || !commentIdValue) {
    throw new Error("Comment ID is missing.");
  }

  if (typeof postIdValue !== "string" || !postIdValue) {
    throw new Error("Post ID is missing.");
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentIdValue },
    select: { id: true },
  });

  if (!comment) {
    throw new Error("Comment not found.");
  }

  const existingLike = await prisma.commentLike.findUnique({
    where: {
      commentId_authorEmail: {
        commentId: commentIdValue,
        authorEmail: session.user.email,
      },
    },
  });

  if (existingLike) {
    await prisma.commentLike.delete({
      where: {
        commentId_authorEmail: {
          commentId: commentIdValue,
          authorEmail: session.user.email,
        },
      },
    });
  } else {
    await prisma.commentLike.create({
      data: {
        commentId: commentIdValue,
        authorEmail: session.user.email,
      },
    });
  }

  revalidatePath(`/posts/${postIdValue}`);
}
