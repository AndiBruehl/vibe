"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { parsePostImages } from "@/post-images";
import { isProtectedAdmin, isSuperAdmin, isVibeAdmin } from "@/admin";
import { ensureVibeSupportProfile, ensureVibeTeamProfile, isVibeSupportEmail } from "@/system-profile";
import { assertNotRestricted } from "@/restrictions";
import { appendSupportTicketMessage, sendSupportAcknowledgement } from "@/support-ticket";
import { supportTemplateText, type SupportTemplateKey } from "@/support-templates";

import { isObjectId } from "@/object-id";
const MAX_STORY_SLIDES = 4;

async function usersAreBlocked(profileIdA: string, profileIdB: string) {
  return Boolean(await prisma.block.findFirst({ where: { OR: [{ blockerId: profileIdA, blockedId: profileIdB }, { blockerId: profileIdB, blockedId: profileIdA }] }, select: { id: true } }));
}

async function assertCanInteractWithPost(postId: string, viewerEmail: string) {
  const [post, viewer] = await Promise.all([
    prisma.post.findUnique({ where: { id: postId }, select: { id: true, authorEmail: true } }),
    prisma.profile.findUnique({ where: { email: viewerEmail }, select: { id: true } }),
  ]);
  if (!post) throw new Error("Post not found.");
  if (!viewer) throw new Error("Current user profile not found.");
  if (post.authorEmail === viewerEmail) return post;

  const author = await prisma.profile.findUnique({ where: { email: post.authorEmail }, select: { id: true, isPrivate: true } });
  if (!author) return post;
  if (await usersAreBlocked(viewer.id, author.id)) throw new Error("You cannot interact with this profile.");
  if (author.isPrivate) {
    const followsAuthor = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: viewer.id, followingId: author.id } }, select: { id: true } });
    if (!followsAuthor) throw new Error("You cannot interact with this private profile.");
  }
  return post;
}

// Helper: upsert topics and link them to a post
async function linkTopicsForPost(postId: string, topicsValue: unknown) {
  if (typeof topicsValue !== "string" || !topicsValue.trim()) return;

  const raw = topicsValue
    .split(",")
    .map((t) => (t || "").trim())
    .filter(Boolean);

  const uniqueTopics = new Map<string, string>();

  for (const t of raw) {
    const normalized = t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!normalized) continue;
    if (!uniqueTopics.has(normalized)) uniqueTopics.set(normalized, t);
  }

  for (const [normalized, t] of Array.from(uniqueTopics).slice(0, 5)) {
    const topic = await prisma.topic.upsert({
      where: { slug: normalized },
      update: {},
      create: { name: t, slug: normalized },
    });

    // create linking row; ignore duplicate errors
    try {
      await prisma.postTopic.create({ data: { postId, topicId: topic.id } });
    } catch {
      // The unique relation already exists.
    }
  }
}

async function linkProfilesForPost(postId: string, profileIds: FormDataEntryValue[]) {
  const ids = [...new Set(profileIds.filter(isObjectId))].slice(0, 10);
  if (!ids.length) return;
  const profiles = await prisma.profile.findMany({ where: { id: { in: ids } }, select: { id: true } });
  if (profiles.length) await prisma.postProfileTag.createMany({ data: profiles.map((profile) => ({ postId, profileId: profile.id })) });
}

function extractMentionedUsernames(text: string) {
  return [...new Set(
    Array.from(text.matchAll(/@([^\s@/]+)/gu))
      .map((match) => match[1].replace(/[.,!?;:)\]}]+$/u, "").trim())
      .filter(Boolean),
  )].slice(0, 10);
}

async function linkMentionsForComment(commentId: string, text: string, authorEmail: string) {
  const usernames = extractMentionedUsernames(text);
  if (!usernames.length) return;

  const profiles = await prisma.profile.findMany({
    where: {
      email: { not: authorEmail },
      OR: usernames.map((username) => ({ username: { equals: username, mode: "insensitive" } })),
    },
    select: { id: true },
  });

  if (profiles.length) {
    await prisma.commentMention.createMany({
      data: profiles.map((profile) => ({ commentId, profileId: profile.id })),
    });
  }
}
export async function upsertProfile(formData: FormData) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const username = ((formData.get("username") as string) || "").trim();

  if (!username || username.length > 80 || /[\\/\u0000-\u001F\u007F]/.test(username)) {
    throw new Error(
      "Invalid username. Use up to 80 characters without slashes or control characters.",
    );
  }

  const newUserInfo = {
    username,
    name: ((formData.get("name") as string) || "").trim(),
    subtitle: ((formData.get("subtitle") as string) || "").trim(),
    bio: ((formData.get("bio") as string) || "").trim(),
    avatar: ((formData.get("avatarUrl") as string) || "").trim(),
    isPrivate: formData.get("isPrivate") === "true",
  };

  const linkLabels = formData.getAll("linkLabel");
  const linkUrls = formData.getAll("linkUrl");
  const profileLinks: { label: string; url: string; position: number }[] = [];

  for (let index = 0; index < Math.min(linkLabels.length, linkUrls.length, 5); index++) {
    const labelValue = linkLabels[index];
    const urlValue = linkUrls[index];
    const label = typeof labelValue === "string" ? labelValue.trim().slice(0, 80) : "";
    const url = typeof urlValue === "string" ? urlValue.trim().slice(0, 2048) : "";
    if (!label && !url) continue;
    if (!label || !url) throw new Error("Each profile link needs a label and a URL.");
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Unsupported protocol");
    } catch {
      throw new Error("Profile links must use a valid http:// or https:// URL.");
    }
    profileLinks.push({ label, url, position: profileLinks.length });
  }

  const shoutoutLabels = formData.getAll("shoutoutLabel");
  const shoutoutProfileIds = formData.getAll("shoutoutProfileId");
  const shoutouts: { targetProfileId: string; label: string; position: number }[] = [];
  const selectedProfileIds = new Set<string>();
  for (let index = 0; index < Math.min(shoutoutLabels.length, shoutoutProfileIds.length, 5); index++) {
    const labelValue = shoutoutLabels[index];
    const targetValue = shoutoutProfileIds[index];
    const label = typeof labelValue === "string" ? labelValue.trim().slice(0, 80) : "";
    const targetProfileId = typeof targetValue === "string" ? targetValue : "";
    if (!label && !targetProfileId) continue;
    if (!label || !isObjectId(targetProfileId) || selectedProfileIds.has(targetProfileId)) throw new Error("Each shoutout needs a label and a profile.");
    selectedProfileIds.add(targetProfileId);
    shoutouts.push({ targetProfileId, label, position: shoutouts.length });
  }
  if (shoutouts.length) {
    const targets = await prisma.profile.findMany({ where: { id: { in: shoutouts.map((shoutout) => shoutout.targetProfileId) }, email: { not: session.user.email } }, select: { id: true } });
    if (targets.length !== shoutouts.length) throw new Error("A selected shoutout profile is not available.");
  }

  await prisma.profile.upsert({
    where: {
      email: session.user.email,
    },
    update: {
      ...newUserInfo,
      profileLinks: { deleteMany: {}, create: profileLinks },
      shoutouts: { deleteMany: {}, create: shoutouts },
    },
    create: {
      email: session.user.email,
      ...newUserInfo,
      profileLinks: { create: profileLinks },
      shoutouts: { create: shoutouts },
    },
  });

  redirect("/profile");
}

export async function postEntry(formData: FormData) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  await assertNotRestricted(session.user.email, "posts");

  const images = parsePostImages(formData.has("imagesSet") ? formData.getAll("images") : [formData.get("image")]);
  const description = formData.get("description");
  const topicsValue = formData.get("topics");
  const profileTags = formData.getAll("profileTags");

  const postDoc = await prisma.post.create({
    data: {
      authorEmail: session.user.email,
      image: images[0],
      images,
      description: typeof description === "string" ? description.trim() : "",
    },
  });
  // handle topics (upsert + link)
  try {
    await linkTopicsForPost(postDoc.id, topicsValue);
    await linkProfilesForPost(postDoc.id, profileTags);
  } catch (err) {
    console.error("postEntry: topic linking failed", err);
  }

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath(`/posts/${postDoc.id}`);

  redirect(`/posts/${postDoc.id}`);
}

export async function editPost(formData: FormData): Promise<void> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const postIdValue = formData.get("postId");
  const imageValue = formData.get("image");
  const gallery = formData.has("imagesSet") ? parsePostImages(formData.getAll("images")) : undefined;
  const descriptionValue = formData.get("description");

  if (typeof postIdValue !== "string" || !postIdValue) {
    throw new Error("Post ID is missing.");
  }

  if (imageValue !== null && typeof imageValue !== "string") {
    throw new Error("Invalid image value.");
  }

  if (descriptionValue !== null && typeof descriptionValue !== "string") {
    throw new Error("Invalid description value.");
  }

  const cleanedImage =
    typeof imageValue === "string" ? imageValue.trim() : undefined;
  const cleanedDescription =
    typeof descriptionValue === "string" ? descriptionValue.trim() : undefined;

  if (!gallery && cleanedImage === undefined && cleanedDescription === undefined && formData.get("profileTagsSet") !== "1") {
    throw new Error("Nothing to update.");
  }

  if (cleanedImage !== undefined && !cleanedImage) {
    throw new Error("Image cannot be empty.");
  }

  const post = await prisma.post.findUnique({
    where: { id: postIdValue },
    select: { id: true, authorEmail: true },
  });

  if (!post) {
    throw new Error("Post not found.");
  }

  if (post.authorEmail !== session.user.email) {
    throw new Error("You are not authorized to edit this post.");
  }

  await prisma.post.update({
    where: { id: postIdValue },
    data: {
      ...(gallery ? { image: gallery[0], images: gallery } : cleanedImage !== undefined ? { image: cleanedImage, images: parsePostImages([cleanedImage]) } : {}),
      ...(cleanedDescription !== undefined
        ? { description: cleanedDescription }
        : {}),
    },
  });

  const topicsSet = formData.get("topicsSet");
  const topicsValue = formData.get("topics");
  if (topicsSet === "1") {
    await prisma.postTopic.deleteMany({ where: { postId: postIdValue } });
    await linkTopicsForPost(postIdValue, topicsValue);
  }

  if (formData.get("profileTagsSet") === "1") {
    await prisma.postProfileTag.deleteMany({ where: { postId: postIdValue } });
    await linkProfilesForPost(postIdValue, formData.getAll("profileTags"));
  }

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath(`/posts/${postIdValue}`);

  redirect(`/posts/${postIdValue}`);
}

export async function deletePost(formData: FormData): Promise<void> {
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
    select: { id: true, authorEmail: true },
  });

  if (!post) {
    throw new Error("Post not found.");
  }

  const isModerationDeletion = post.authorEmail !== session.user.email;

  if (post.authorEmail !== session.user.email && !isSuperAdmin(session.user.email)) {
    throw new Error("You are not authorized to delete this post.");
  }

  const commentIds = await prisma.comment.findMany({
    where: { postId: postIdValue },
    select: { id: true },
  });

  await prisma.$transaction([
    prisma.commentLike.deleteMany({
      where: { commentId: { in: commentIds.map((comment) => comment.id) } },
    }),
    prisma.commentMention.deleteMany({
      where: { commentId: { in: commentIds.map((comment) => comment.id) } },
    }),
    prisma.comment.deleteMany({ where: { postId: postIdValue } }),
    prisma.postLike.deleteMany({ where: { postId: postIdValue } }),
    prisma.postBookmark.deleteMany({ where: { postId: postIdValue } }),
    prisma.bookmarkCollectionPost.deleteMany({ where: { postId: postIdValue } }),
    prisma.postProfileTag.deleteMany({ where: { postId: postIdValue } }),
    prisma.post.delete({ where: { id: postIdValue } }),
  ]);

  if (isModerationDeletion) await notifyAdmins(session.user.email, "post-delete", "A post was deleted by moderation");

  revalidatePath("/");
  revalidatePath("/profile");

  redirect("/");
}

export async function togglePostLike(formData: FormData): Promise<{ liked: boolean; likes: number }> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const postIdValue = formData.get("postId");

  if (typeof postIdValue !== "string" || !postIdValue) {
    throw new Error("Post ID is missing.");
  }

  await assertCanInteractWithPost(postIdValue, session.user.email);

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
  const updated = await prisma.post.findUniqueOrThrow({ where: { id: postIdValue }, select: { likesCount: true } });
  return { liked: !existingLike, likes: updated.likesCount };
}

export async function toggleBlock(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) redirect("/");
  const targetProfileId = formData.get("targetProfileId");
  const returnToValue = formData.get("returnTo");
  const returnTo = typeof returnToValue === "string" && returnToValue.startsWith("/") && !returnToValue.startsWith("//")
    ? returnToValue
    : "/settings/blocked";
  if (typeof targetProfileId !== "string") throw new Error("Profile is missing.");
  const viewer = await prisma.profile.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!viewer || viewer.id === targetProfileId) throw new Error("Profile not found.");
  const existing = await prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: viewer.id, blockedId: targetProfileId } } });
  if (existing) await prisma.block.delete({ where: { id: existing.id } });
  else await prisma.$transaction([
    prisma.block.create({ data: { blockerId: viewer.id, blockedId: targetProfileId } }),
    prisma.follow.deleteMany({ where: { OR: [{ followerId: viewer.id, followingId: targetProfileId }, { followerId: targetProfileId, followingId: viewer.id }] } }),
    prisma.followRequest.deleteMany({ where: { OR: [{ followerId: viewer.id, followingId: targetProfileId }, { followerId: targetProfileId, followingId: viewer.id }] } }),
  ]);
  revalidatePath("/"); revalidatePath("/home"); revalidatePath("/settings/blocked"); revalidatePath(returnTo);
  redirect(returnTo);
}

export async function unblockProfileInline(targetProfileId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Not signed in.");

  const viewer = await prisma.profile.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!viewer || viewer.id === targetProfileId) throw new Error("Profile not found.");

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: viewer.id, blockedId: targetProfileId } },
    select: { id: true },
  });
  if (!existing) throw new Error("Block not found.");

  await prisma.block.delete({ where: { id: existing.id } });
  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/settings/blocked");
}

export async function togglePostArchive(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const postId = formData.get("postId");
  const archive = formData.get("archive") === "true";
  if (typeof postId !== "string" || !postId) throw new Error("Post ID is missing.");

  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorEmail: true } });
  if (!post || post.authorEmail !== session.user.email) throw new Error("Post not found.");

  await prisma.post.update({ where: { id: postId }, data: { isArchived: archive } });
  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/profile");
  revalidatePath(`/posts/${postId}`);
  redirect(archive ? "/profile?tab=archive&archived=1" : "/profile?tab=posts&restored=1");
}

/** Adds a like without removing an existing one; used for the carousel double-tap gesture. */
export async function likePost(formData: FormData): Promise<{ liked: boolean; likes: number }> {
  const session = await auth();
  if (!session?.user?.email) redirect("/");
  const postId = formData.get("postId");
  if (typeof postId !== "string" || !postId) throw new Error("Post ID is missing.");

  const post = await assertCanInteractWithPost(postId, session.user.email);
  const postLikes = await prisma.post.findUniqueOrThrow({ where: { id: post.id }, select: { likesCount: true } });
  const existing = await prisma.postLike.findUnique({ where: { postId_authorEmail: { postId, authorEmail: session.user.email } } });
  if (existing) return { liked: true, likes: postLikes.likesCount };

  const [, updated] = await prisma.$transaction([
    prisma.postLike.create({ data: { postId, authorEmail: session.user.email } }),
    prisma.post.update({ where: { id: postId }, data: { likesCount: { increment: 1 } }, select: { likesCount: true } }),
  ]);
  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath(`/posts/${postId}`);
  return { liked: true, likes: updated.likesCount };
}

export async function createStory(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) redirect("/");
  await assertNotRestricted(session.user.email, "posts");

  const images = parsePostImages(formData.getAll("images")).slice(0, MAX_STORY_SLIDES);
  if (!images.length) throw new Error("Choose at least one image for your story.");

  await prisma.story.create({
    data: {
      authorEmail: session.user.email,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      slides: {
        create: images.map((imageUrl, position) => ({ imageUrl, position })),
      },
    },
  });

  revalidatePath("/home");
}

export async function sharePostToStory(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) redirect("/");
  await assertNotRestricted(session.user.email, "posts");
  const postId = formData.get("postId");
  if (typeof postId !== "string" || !isObjectId(postId)) throw new Error("Invalid post.");
  await assertCanInteractWithPost(postId, session.user.email);
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { image: true } });
  if (!post) throw new Error("Post not found.");
  await prisma.story.create({ data: { authorEmail: session.user.email, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), slides: { create: [{ imageUrl: post.image, sharedPostId: postId, position: 0 }] } } });
  revalidatePath("/home");
}

export async function sharePostToConversation(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) redirect("/");
  await assertNotRestricted(session.user.email, "messages");
  const postId = formData.get("postId");
  const conversationId = formData.get("conversationId");
  if (typeof postId !== "string" || !isObjectId(postId) || typeof conversationId !== "string" || !isObjectId(conversationId)) throw new Error("Invalid share.");
  await assertCanInteractWithPost(postId, session.user.email);
  const viewer = await prisma.profile.findUnique({ where: { email: session.user.email }, select: { id: true, language: true } });
  if (!viewer) throw new Error("Profile not found.");
  const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, participants: { some: { profileId: viewer.id } } }, include: { participants: { include: { profile: { select: { isSystem: true } } } } } });
  if (!conversation || conversation.participants.some((item) => item.profile.isSystem)) throw new Error("Conversation not available.");
  const recipientIds = conversation.participants.map((item) => item.profileId).filter((id) => id !== viewer.id);
  for (const recipientId of recipientIds) if (await usersAreBlocked(viewer.id, recipientId)) throw new Error("You cannot share with a blocked profile.");
  const now = new Date();
  await prisma.$transaction([
    prisma.message.create({ data: { conversationId, senderId: viewer.id, body: viewer.language === "de" ? "Hat einen Beitrag geteilt." : "Shared a post.", sharedPostId: postId } }),
    prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: now } }),
    prisma.conversationParticipant.update({ where: { conversationId_profileId: { conversationId, profileId: viewer.id } }, data: { lastReadAt: now } }),
  ]);
  revalidatePath("/messages");
  revalidatePath(`/messages/${conversationId}`);
}
export async function deleteStory(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) redirect("/");
  const storyId = formData.get("storyId");
  if (typeof storyId !== "string" || !storyId) throw new Error("Story ID is missing.");

  const story = await prisma.story.findFirst({
    where: { id: storyId, authorEmail: session.user.email },
    select: { id: true },
  });
  // The story can already have expired or been deleted in another tab. Treat
  // that as a completed delete instead of surfacing an application error.
  if (!story) {
    revalidatePath("/home");
    return;
  }

  await prisma.$transaction([
    prisma.storyView.deleteMany({ where: { storyId } }),
    prisma.storySlide.deleteMany({ where: { storyId } }),
    prisma.story.delete({ where: { id: storyId } }),
  ]);
  revalidatePath("/home");
}

export async function postComment(formData: FormData): Promise<void> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  await assertNotRestricted(session.user.email, "comments");

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

  await assertCanInteractWithPost(postIdValue, session.user.email);

  const comment = await prisma.comment.create({
    data: {
      authorEmail: session.user.email,
      postId: postIdValue,
      parentCommentId: null,
      text,
    },
  });
  await linkMentionsForComment(comment.id, text, session.user.email);

  revalidatePath(`/posts/${postIdValue}`);
  revalidatePath("/home");
}

export async function postReply(formData: FormData): Promise<void> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  await assertNotRestricted(session.user.email, "comments");

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

  await assertCanInteractWithPost(postIdValue, session.user.email);

  const reply = await prisma.comment.create({
    data: {
      authorEmail: session.user.email,
      postId: postIdValue,
      parentCommentId: parentCommentIdValue,
      text,
    },
  });
  await linkMentionsForComment(reply.id, text, session.user.email);

  revalidatePath(`/posts/${postIdValue}`);
}

export async function editComment(formData: FormData): Promise<void> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const commentIdValue = formData.get("commentId");
  const postIdValue = formData.get("postId");
  const textValue = formData.get("text");

  if (typeof commentIdValue !== "string" || !commentIdValue) {
    throw new Error("Comment ID is missing.");
  }

  if (typeof postIdValue !== "string" || !postIdValue) {
    throw new Error("Post ID is missing.");
  }

  if (typeof textValue !== "string") {
    throw new Error("Comment text is missing.");
  }

  const text = textValue.trim();

  if (!text) {
    throw new Error("Comment cannot be empty.");
  }

  const comment = await prisma.comment.findUnique({
    where: { id: commentIdValue },
    select: { id: true, authorEmail: true, postId: true },
  });

  if (!comment) {
    throw new Error("Comment not found.");
  }

  if (comment.authorEmail !== session.user.email) {
    throw new Error("You are not authorized to edit this comment.");
  }

  if (comment.postId !== postIdValue) {
    throw new Error("Comment does not belong to this post.");
  }

  await prisma.comment.update({
    where: { id: commentIdValue },
    data: { text },
  });
  await prisma.commentMention.deleteMany({ where: { commentId: commentIdValue } });
  await linkMentionsForComment(commentIdValue, text, session.user.email);

  revalidatePath(`/posts/${postIdValue}`);
  redirect(`/posts/${postIdValue}`);
}

export async function deleteComment(formData: FormData): Promise<void> {
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
    select: { id: true, authorEmail: true, postId: true },
  });

  if (!comment) {
    throw new Error("Comment not found.");
  }

  const isModerationDeletion = comment.authorEmail !== session.user.email;

  if (comment.authorEmail !== session.user.email && !isSuperAdmin(session.user.email)) {
    throw new Error("You are not authorized to delete this comment.");
  }

  if (comment.postId !== postIdValue) {
    throw new Error("Comment does not belong to this post.");
  }

  const replyIds = await prisma.comment.findMany({
    where: { parentCommentId: commentIdValue },
    select: { id: true },
  });
  const commentIds = [commentIdValue, ...replyIds.map((reply) => reply.id)];

  await prisma.$transaction([
    prisma.commentLike.deleteMany({ where: { commentId: { in: commentIds } } }),
    prisma.commentMention.deleteMany({ where: { commentId: { in: commentIds } } }),
    prisma.comment.deleteMany({
      where: { parentCommentId: commentIdValue },
    }),
    prisma.comment.delete({
      where: { id: commentIdValue },
    }),
  ]);

  if (isModerationDeletion) await notifyAdmins(session.user.email, "comment-delete", "A comment was deleted by moderation");

  revalidatePath(`/posts/${postIdValue}`);
  redirect(`/posts/${postIdValue}`);
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

  await assertCanInteractWithPost(postIdValue, session.user.email);

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

export async function togglePostBookmark(formData: FormData): Promise<void> {
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

  const existingBookmark = await prisma.postBookmark.findUnique({
    where: {
      postId_authorEmail: {
        postId: postIdValue,
        authorEmail: session.user.email,
      },
    },
  });

  if (existingBookmark) {
    await prisma.$transaction([
      prisma.postBookmark.delete({
        where: {
          postId_authorEmail: {
            postId: postIdValue,
            authorEmail: session.user.email,
          },
        },
      }),
      prisma.bookmarkCollectionPost.deleteMany({ where: { postId: postIdValue } }),
    ]);
  } else {
    await prisma.postBookmark.create({
      data: {
        postId: postIdValue,
        authorEmail: session.user.email,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/profile");
  revalidatePath(`/posts/${postIdValue}`);
}

export async function createBookmarkCollection(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const name = typeof formData.get("name") === "string" ? String(formData.get("name")).trim().slice(0, 50) : "";
  if (!name) throw new Error("A collection name is required.");

  const profile = await prisma.profile.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!profile) throw new Error("Profile not found.");

  await prisma.bookmarkCollection.create({ data: { profileId: profile.id, name } });
  revalidatePath("/profile");
}

export async function toggleBookmarkCollectionPost(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const collectionId = formData.get("collectionId");
  const postId = formData.get("postId");
  if (typeof collectionId !== "string" || typeof postId !== "string" || !collectionId || !postId) throw new Error("Collection and post are required.");

  const [profile, bookmark] = await Promise.all([
    prisma.profile.findUnique({ where: { email: session.user.email }, select: { id: true } }),
    prisma.postBookmark.findUnique({ where: { postId_authorEmail: { postId, authorEmail: session.user.email } }, select: { id: true } }),
  ]);
  if (!profile || !bookmark) throw new Error("Save the post before adding it to a collection.");

  const collection = await prisma.bookmarkCollection.findFirst({ where: { id: collectionId, profileId: profile.id }, select: { id: true } });
  if (!collection) throw new Error("Collection not found.");

  const existing = await prisma.bookmarkCollectionPost.findUnique({ where: { collectionId_postId: { collectionId, postId } }, select: { id: true } });
  if (existing) {
    await prisma.bookmarkCollectionPost.delete({ where: { id: existing.id } });
  } else {
    await prisma.bookmarkCollectionPost.create({ data: { collectionId, postId } });
  }
  revalidatePath("/profile");
}

export async function deleteBookmarkCollection(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) redirect("/");
  const collectionId = formData.get("collectionId");
  if (typeof collectionId !== "string" || !collectionId) throw new Error("Collection ID is required.");
  const profile = await prisma.profile.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const collection = profile ? await prisma.bookmarkCollection.findFirst({ where: { id: collectionId, profileId: profile.id }, select: { id: true } }) : null;
  if (!collection) throw new Error("Collection not found.");
  await prisma.$transaction([
    prisma.bookmarkCollectionPost.deleteMany({ where: { collectionId } }),
    prisma.bookmarkCollection.delete({ where: { id: collectionId } }),
  ]);
  revalidatePath("/profile");
}

export async function toggleFollow(formData: FormData): Promise<void> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const targetProfileIdValue = formData.get("targetProfileId");
  const targetUsernameValue = formData.get("targetUsername");

  if (
    typeof targetProfileIdValue !== "string" ||
    !targetProfileIdValue.trim()
  ) {
    throw new Error("Target profile ID is missing.");
  }

  if (typeof targetUsernameValue !== "string") {
    throw new Error("Target username is missing.");
  }

  const currentUserProfile = await prisma.profile.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
      username: true,
      isPrivate: true,
    },
  });

  if (!currentUserProfile) {
    throw new Error("Current user profile not found.");
  }

  if (currentUserProfile.id === targetProfileIdValue) {
    throw new Error("You cannot follow yourself.");
  }

  const targetProfile = await prisma.profile.findUnique({
    where: {
      id: targetProfileIdValue,
    },
    select: {
      id: true,
      username: true,
      isPrivate: true,
    },
  });

  if (!targetProfile) {
    throw new Error("Target profile not found.");
  }

  if (await usersAreBlocked(currentUserProfile.id, targetProfile.id)) {
    throw new Error("You cannot interact with this profile.");
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserProfile.id,
        followingId: targetProfile.id,
      },
    },
  });

  const existingRequest = await prisma.followRequest.findUnique({ where: { followerId_followingId: { followerId: currentUserProfile.id, followingId: targetProfile.id } } });

  if (existingFollow) {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserProfile.id,
          followingId: targetProfile.id,
        },
      },
    });
  } else if (existingRequest) {
    await prisma.followRequest.delete({ where: { id: existingRequest.id } });
  } else if (targetProfile.isPrivate) {
    await prisma.followRequest.create({ data: { followerId: currentUserProfile.id, followingId: targetProfile.id } });
  } else {
    await prisma.follow.create({
      data: {
        followerId: currentUserProfile.id,
        followingId: targetProfile.id,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/profile");

  if (targetUsernameValue.trim()) {
    revalidatePath(`/${targetUsernameValue.trim()}`);
    revalidatePath(`/profile/${targetUsernameValue.trim()}`);
    revalidatePath(`/u/${targetUsernameValue.trim()}`);
  }
}

export async function respondToFollowRequest(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) redirect("/");
  const requestId = formData.get("requestId");
  const decision = formData.get("decision");
  if (typeof requestId !== "string" || (decision !== "accept" && decision !== "decline")) throw new Error("Invalid follow request.");
  const owner = await prisma.profile.findUnique({ where: { email: session.user.email }, select: { id: true } });
  const request = owner ? await prisma.followRequest.findFirst({ where: { id: requestId, followingId: owner.id }, select: { id: true, followerId: true } }) : null;
  if (!owner || !request) throw new Error("Follow request not found.");
  if (decision === "accept") {
    await prisma.$transaction([
      prisma.follow.upsert({ where: { followerId_followingId: { followerId: request.followerId, followingId: owner.id } }, update: {}, create: { followerId: request.followerId, followingId: owner.id } }),
      prisma.followRequest.delete({ where: { id: request.id } }),
    ]);
  } else {
    await prisma.followRequest.delete({ where: { id: request.id } });
  }
  revalidatePath("/profile");
}

function getDirectConversationKey(profileIdA: string, profileIdB: string) {
  return [profileIdA, profileIdB].sort().join(":");
}

export async function startConversation(formData: FormData): Promise<void> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  await assertNotRestricted(session.user.email, "messages");

  const targetProfileIdValue = formData.get("targetProfileId");

  if (
    typeof targetProfileIdValue !== "string" ||
    !isObjectId(targetProfileIdValue)
  ) {
    throw new Error("Target profile ID is missing.");
  }

  const currentUserProfile = await prisma.profile.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
    },
  });

  if (!currentUserProfile) {
    throw new Error("Current user profile not found.");
  }

  if (currentUserProfile.id === targetProfileIdValue) {
    redirect("/messages");
  }

  const targetProfile = await prisma.profile.findUnique({
    where: {
      id: targetProfileIdValue,
    },
    select: {
      id: true,
      email: true,
      isSystem: true,
      systemKind: true,
    },
  });

  if (!targetProfile) {
    throw new Error("Target profile not found.");
  }
  if (targetProfile.systemKind === "support" || isVibeSupportEmail(targetProfile.email)) {
    redirect("/support");
  }
  if (targetProfile.isSystem) {
    throw new Error("This profile cannot receive messages.");
  }
  if (await usersAreBlocked(currentUserProfile.id, targetProfile.id)) throw new Error("You cannot message this profile.");

  const directKey = getDirectConversationKey(
    currentUserProfile.id,
    targetProfile.id,
  );

  const conversation = await prisma.conversation.upsert({
    where: {
      directKey,
    },
    update: {},
    create: {
      directKey,
      participants: {
        create: [
          {
            profileId: currentUserProfile.id,
          },
          {
            profileId: targetProfile.id,
          },
        ],
      },
    },
    select: {
      id: true,
    },
  });

  revalidatePath("/messages");
  redirect(`/messages/${conversation.id}`);
}

export async function sendMessage(formData: FormData): Promise<void> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  await assertNotRestricted(session.user.email, "messages");

  const conversationIdValue = formData.get("conversationId");
  const bodyValue = formData.get("body");
  const imageUrlValue = formData.get("imageUrl");

  if (
    typeof conversationIdValue !== "string" ||
    !isObjectId(conversationIdValue)
  ) {
    throw new Error("Conversation ID is missing.");
  }

  if (typeof bodyValue !== "string") {
    throw new Error("Message text is missing.");
  }

  const body = bodyValue.trim();
  const imageUrl = typeof imageUrlValue === "string" && imageUrlValue.trim()
    ? imageUrlValue.trim()
    : null;

  if (!body && !imageUrl) {
    throw new Error("A message needs text or an image.");
  }

  const currentUserProfile = await prisma.profile.findUnique({
    where: {
      email: session.user.email,
    },
    select: {
      id: true,
    },
  });

  if (!currentUserProfile) {
    throw new Error("Current user profile not found.");
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: conversationIdValue,
      participants: {
        some: {
          profileId: currentUserProfile.id,
        },
      },
    },
    select: {
      id: true,
      participants: { select: { profileId: true, profile: { select: { isSystem: true, systemKind: true } } } },
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  const isVibeTeamConversation = conversation.participants.some((participant) => participant.profile.isSystem && participant.profile.systemKind !== "support");
  const isSupportConversation = conversation.participants.some((participant) => participant.profile.systemKind === "support");
  if (isVibeTeamConversation) {
    throw new Error("VibeTeam messages are no-reply.");
  }

  const recipientIds = conversation.participants
    .map((participant) => participant.profileId)
    .filter((profileId) => profileId !== currentUserProfile.id);
  for (const recipientId of recipientIds) {
    if (await usersAreBlocked(currentUserProfile.id, recipientId)) {
      throw new Error("You cannot send messages in a conversation with a blocked profile.");
    }
  }

  const now = new Date();

  if (isSupportConversation) {
    const ticketResult = await appendSupportTicketMessage(session.user.email, body || "Image attachment");
    await sendSupportAcknowledgement(ticketResult.ticket.id, session.user.email);
  }

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: currentUserProfile.id,
        body,
        imageUrl,
      },
    }),
    prisma.conversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        updatedAt: now,
      },
    }),
    prisma.conversationParticipant.update({
      where: {
        conversationId_profileId: {
          conversationId: conversation.id,
          profileId: currentUserProfile.id,
        },
      },
      data: {
        lastReadAt: now,
      },
    }),
  ]);

  revalidatePath("/messages");
  revalidatePath(`/messages/${conversation.id}`);
}

export async function toggleMessageReaction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.email) redirect("/");

  const messageId = formData.get("messageId");
  const emojiValue = formData.get("emoji");
  if (!isObjectId(messageId) || typeof emojiValue !== "string" || !emojiValue.trim() || [...emojiValue].length > 16) {
    throw new Error("Invalid message reaction.");
  }

  const [viewer, message] = await Promise.all([
    prisma.profile.findUnique({ where: { email: session.user.email }, select: { id: true } }),
    prisma.message.findUnique({ where: { id: messageId }, select: { id: true, conversationId: true } }),
  ]);
  if (!viewer || !message) throw new Error("Message not found.");

  const member = await prisma.conversationParticipant.findUnique({
    where: { conversationId_profileId: { conversationId: message.conversationId, profileId: viewer.id } },
    select: { id: true },
  });
  if (!member) throw new Error("Conversation not found.");

  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId: message.conversationId, profileId: { not: viewer.id } },
    select: { profileId: true },
  });
  for (const participant of participants) {
    if (await usersAreBlocked(viewer.id, participant.profileId)) {
      throw new Error("You cannot react in a conversation with a blocked profile.");
    }
  }

  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_profileId_emoji: { messageId, profileId: viewer.id, emoji: emojiValue } },
    select: { id: true },
  });
  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.messageReaction.create({ data: { messageId, profileId: viewer.id, emoji: emojiValue } });
  }
  revalidatePath(`/messages/${message.conversationId}`);
}

async function requireAdminSession() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email || !(await isVibeAdmin(email))) throw new Error("Administrator access is required.");
  return email;
}

async function notifyAdmins(actorEmail: string, kind: string, detail: string) {
  await prisma.adminActivity.create({ data: { actorEmail, kind, detail: detail.slice(0, 300) } });
}

export async function createReport(formData: FormData): Promise<void> {
  const session = await auth();
  const reporterEmail = session?.user?.email;
  if (!reporterEmail) redirect("/");

  const targetType = formData.get("targetType");
  const targetId = formData.get("targetId");
  const targetUrl = formData.get("targetUrl");
  const category = formData.get("category");
  const description = typeof formData.get("description") === "string" ? String(formData.get("description")).trim().slice(0, 600) : "";
  const categories: Record<string, string> = {
    spam: "Spam or scam",
    harassment: "Harassment or bullying",
    hate: "Hate or discrimination",
    sexual: "Sexual or inappropriate content",
    other: "Something else",
  };
  if ((targetType !== "profile" && targetType !== "post" && targetType !== "comment") || typeof targetId !== "string" || !targetId || typeof category !== "string" || !categories[category]) {
    throw new Error("Invalid report.");
  }
  const reason = description ? `${categories[category]}: ${description}` : categories[category];

  let targetLabel: string | null = null;
  let targetOwnerEmail: string | null = null;
  if (targetType === "profile") {
    const target = await prisma.profile.findUnique({ where: { id: targetId }, select: { email: true, username: true, name: true } });
    if (!target || target.isSystem) throw new Error("Report target not found.");
    targetOwnerEmail = target.email;
    targetLabel = `@${target.username || target.name || target.email}`;
  } else if (targetType === "post") {
    const target = await prisma.post.findUnique({ where: { id: targetId }, select: { authorEmail: true, description: true } });
    if (!target) throw new Error("Report target not found.");
    targetOwnerEmail = target.authorEmail;
    const author = target.authorEmail ? await prisma.profile.findUnique({ where: { email: target.authorEmail }, select: { username: true, name: true } }) : null;
    targetLabel = `Post by @${author?.username || author?.name || target.authorEmail || "unknown"}`;
  } else {
    const target = await prisma.comment.findUnique({ where: { id: targetId }, select: { authorEmail: true, text: true } });
    if (!target) throw new Error("Report target not found.");
    targetOwnerEmail = target.authorEmail;
    const author = await prisma.profile.findUnique({ where: { email: target.authorEmail }, select: { username: true, name: true } });
    targetLabel = `Comment by @${author?.username || author?.name || target.authorEmail}`;
  }

  const duplicate = await prisma.report.findFirst({ where: { reporterEmail, targetType, targetId, status: "open" }, select: { id: true } });
  if (!duplicate) {
    await prisma.report.create({ data: { reporterEmail, targetType, targetId, targetUrl: typeof targetUrl === "string" && targetUrl.startsWith("/") ? targetUrl : null, targetLabel, targetOwnerEmail, reason } });
    await notifyAdmins(reporterEmail, "report", `New report: ${reason} · ${targetLabel || targetType}`);
  }
  revalidatePath("/admin");
}

async function deliverVibeTeamMessage(recipientEmail: string, body: string) {
  const recipient = await prisma.profile.findUnique({ where: { email: recipientEmail }, select: { id: true, isSystem: true } });
  if (!recipient || recipient.isSystem) return;
  const team = await ensureVibeTeamProfile();
  const directKey = getDirectConversationKey(team.id, recipient.id);
  const conversation = await prisma.conversation.upsert({
    where: { directKey },
    update: {},
    create: { directKey, participants: { create: [{ profileId: team.id }, { profileId: recipient.id }] } },
    select: { id: true },
  });
  const now = new Date();
  await prisma.$transaction([
    prisma.message.create({ data: { conversationId: conversation.id, senderId: team.id, body } }),
    prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: now } }),
    prisma.conversationParticipant.update({ where: { conversationId_profileId: { conversationId: conversation.id, profileId: team.id } }, data: { lastReadAt: now } }),
  ]);
}

async function deliverSupportReply(recipientEmail: string, body: string) {
  const recipient = await prisma.profile.findUnique({ where: { email: recipientEmail }, select: { id: true, isSystem: true } });
  if (!recipient || recipient.isSystem) return;
  const support = await ensureVibeSupportProfile();
  const directKey = getDirectConversationKey(support.id, recipient.id);
  const conversation = await prisma.conversation.upsert({
    where: { directKey },
    update: {},
    create: { directKey, participants: { create: [{ profileId: support.id }, { profileId: recipient.id }] } },
    select: { id: true },
  });
  const now = new Date();
  await prisma.$transaction([
    prisma.message.create({ data: { conversationId: conversation.id, senderId: support.id, body } }),
    prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: now } }),
    prisma.conversationParticipant.update({ where: { conversationId_profileId: { conversationId: conversation.id, profileId: support.id } }, data: { lastReadAt: now } }),
  ]);
}

async function sendVibeTeamModerationMessage(reporterEmail: string, action: string, targetLabel: string | null, note: string) {
  const reporter = await prisma.profile.findUnique({ where: { email: reporterEmail }, select: { id: true, language: true } });
  if (!reporter) return;
  const de = reporter.language === "de";
  const actionLabels: Record<string, [string, string]> = {
    "no-action": ["Keine Maßnahme erforderlich", "No action was necessary"],
    review: ["Wir prüfen den Fall weiter", "We are continuing to review the case"],
    "content-removed": ["Der gemeldete Inhalt wurde entfernt", "The reported content was removed"],
    other: ["Eine individuelle Maßnahme wurde durchgeführt", "A custom action was taken"],
  };
  const actionLabel = actionLabels[action] ?? actionLabels.other;
  const localizedTarget = de
    ? (targetLabel || "Inhalt").replace(/^Post by /, "Beitrag von ").replace(/^Comment by /, "Kommentar von ")
    : targetLabel || "Content";
  const body = de
    ? `Wir haben dein Anliegen geprüft.

Gemeldeter Inhalt: ${localizedTarget}
Maßnahme: ${actionLabel[0]}${note ? `
Hinweis: ${note}` : ""}

Vielen Dank für deine Meldung.

— VibeTeam`
    : `We reviewed your report.

Reported content: ${localizedTarget}
Action: ${actionLabel[1]}${note ? `
Note: ${note}` : ""}

Thank you for your report.

— VibeTeam`;
  await deliverVibeTeamMessage(reporterEmail, body);
}

async function removeReportedContent(targetType: string, targetId: string) {
  if (targetType === "post") {
    const commentIds = await prisma.comment.findMany({ where: { postId: targetId }, select: { id: true } });
    await prisma.$transaction([
      prisma.commentLike.deleteMany({ where: { commentId: { in: commentIds.map((comment) => comment.id) } } }),
      prisma.commentMention.deleteMany({ where: { commentId: { in: commentIds.map((comment) => comment.id) } } }),
      prisma.comment.deleteMany({ where: { postId: targetId } }),
      prisma.postLike.deleteMany({ where: { postId: targetId } }),
      prisma.postBookmark.deleteMany({ where: { postId: targetId } }),
      prisma.bookmarkCollectionPost.deleteMany({ where: { postId: targetId } }),
      prisma.postProfileTag.deleteMany({ where: { postId: targetId } }),
      prisma.post.delete({ where: { id: targetId } }),
    ]);
  } else if (targetType === "comment") {
    const replyIds = await prisma.comment.findMany({ where: { parentCommentId: targetId }, select: { id: true } });
    const commentIds = [targetId, ...replyIds.map((reply) => reply.id)];
    await prisma.$transaction([
      prisma.commentLike.deleteMany({ where: { commentId: { in: commentIds } } }),
      prisma.commentMention.deleteMany({ where: { commentId: { in: commentIds } } }),
      prisma.comment.deleteMany({ where: { parentCommentId: targetId } }),
      prisma.comment.delete({ where: { id: targetId } }),
    ]);
  } else {
    throw new Error("A profile cannot be removed through a content report.");
  }
}

export async function moderateReport(formData: FormData): Promise<void> {
  const actorEmail = await requireAdminSession();
  const reportId = formData.get("reportId");
  const action = formData.get("action");
  const moderationNote = typeof formData.get("moderationNote") === "string" ? String(formData.get("moderationNote")).trim().slice(0, 600) : "";
  if (typeof reportId !== "string" || !reportId || typeof action !== "string" || !["no-action", "review", "content-removed", "other"].includes(action)) throw new Error("Invalid moderation action.");
  if (action === "other" && !moderationNote) throw new Error("Please describe the action taken.");
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("Report not found.");
  if (action === "content-removed") {
    if (!isSuperAdmin(actorEmail)) throw new Error("Only Violett can remove reported content.");
    await removeReportedContent(report.targetType, report.targetId);
  }
  const status = action === "review" ? "open" : action === "no-action" ? "dismissed" : "resolved";
  await prisma.report.update({ where: { id: report.id }, data: { status, moderationAction: action, moderationNote: moderationNote || null, moderatedByEmail: actorEmail, moderatedAt: new Date() } });
  const actionDetail = `${action} · ${report.reason} · ${report.targetLabel || report.targetType}`;
  await notifyAdmins(actorEmail, "report-status", actionDetail);
  await sendVibeTeamModerationMessage(report.reporterEmail, action, report.targetLabel, moderationNote);
  revalidatePath("/admin");
  revalidatePath("/messages");
}

function getVibeTeamTemplate(template: string, de: boolean) {
  const templates: Record<string, [string, string]> = {
    welcome: ["Willkommen bei VIBE! Schön, dass du hier bist. Wir wünschen dir viel Freude beim Entdecken, Teilen und Vernetzen.", "Welcome to VIBE! We are happy you are here and hope you enjoy discovering, sharing, and connecting."],
    "report-received": ["Danke, dass du dir die Zeit für eine Meldung genommen hast. Wir haben sie erhalten und schauen uns den Sachverhalt sorgfältig an.", "Thank you for taking the time to send a report. We received it and will review the situation carefully."],
    "report-update": ["Danke für deine Geduld. Es gibt ein Update zu deiner Meldung: Unser Team hat den Vorgang erneut geprüft.", "Thank you for your patience. There is an update regarding your report: our team reviewed the case again."],
    "content-removed": ["Danke für deinen Hinweis. Nach unserer Prüfung wurde der betreffende Inhalt entfernt.", "Thank you for bringing this to our attention. Following our review, the relevant content was removed."],
    "account-warning": ["Wir möchten dich persönlich auf einen möglichen Verstoß gegen unsere Community-Regeln hinweisen. Bitte wirf einen Blick auf die folgenden Informationen.", "We want to personally let you know about a possible violation of our community rules. Please review the information below."],
    "account-restriction": ["Nach einer sorgfältigen Prüfung wurde für dein Konto eine Einschränkung vorgenommen. Wenn etwas unklar ist, kannst du den Support kontaktieren.", "After a careful review, a restriction was applied to your account. If anything is unclear, you can contact support."],
    support: ["Danke für deine Nachricht. Wir haben dein Anliegen erhalten und helfen dir gerne weiter. Ein Mitglied unseres Teams meldet sich so bald wie möglich.", "Thank you for your message. We received your request and are happy to help. A member of our team will get back to you as soon as possible."],
    "technical-help": ["Danke für die genaue Beschreibung. Wir prüfen das technische Problem und geben dir Bescheid, sobald wir mehr wissen.", "Thank you for the detailed description. We are looking into the technical issue and will let you know as soon as we have more information."],
    "friendly-follow-up": ["Wir wollten kurz nachfragen, ob unser letzter Hinweis dir weiterhelfen konnte. Gib uns gerne Bescheid, falls du noch Unterstützung brauchst.", "We wanted to check whether our previous note helped. Please let us know if you still need support."],
    "case-closed": ["Dein Anliegen wurde von uns abgeschlossen. Danke für deine Geduld und dafür, dass du VIBE mitgestaltest.", "We have closed your request. Thank you for your patience and for helping shape VIBE."],
    custom: ["", ""],
  };
  const entry = templates[template];
  return entry ? (de ? entry[0] : entry[1]) : null;
}

export async function sendVibeTeamMessageAsAdmin(formData: FormData): Promise<void> {
  const actorEmail = await requireAdminSession();
  const profileId = formData.get("profileId");
  const template = formData.get("template");
  const additionalMessage = typeof formData.get("additionalMessage") === "string" ? String(formData.get("additionalMessage")).trim().slice(0, 2000) : "";
  if (typeof profileId !== "string" || !isObjectId(profileId) || typeof template !== "string") throw new Error("Invalid VibeTeam message.");
  const target = await prisma.profile.findUnique({ where: { id: profileId }, select: { email: true, username: true, isSystem: true, language: true } });
  if (!target || target.isSystem) throw new Error("Profile not found.");
  const de = target.language === "de";
  const baseMessage = getVibeTeamTemplate(template, de);
  if (baseMessage === null || (template === "custom" && !additionalMessage)) throw new Error("Invalid VibeTeam message template.");
  const body = template === "custom"
    ? additionalMessage
    : `${baseMessage}${additionalMessage ? `\n\n${de ? "Zusätzliche Informationen:" : "Additional information:"}\n${additionalMessage}` : ""}`;
  await deliverVibeTeamMessage(target.email, body);
  await notifyAdmins(actorEmail, "team-message", `VibeTeam ${template} message sent to @${target.username || target.email}`);
  revalidatePath("/admin");
  revalidatePath("/messages");
}

export async function createSupportTicket(formData: FormData): Promise<void> {
  const session = await auth();
  const requesterEmail = session?.user?.email;
  if (!requesterEmail) redirect("/");
  const body = typeof formData.get("body") === "string" ? String(formData.get("body")).trim().slice(0, 2000) : "";
  if (!body) throw new Error("Support message is required.");
  const result = await appendSupportTicketMessage(requesterEmail, body);
  await sendSupportAcknowledgement(result.ticket.id, requesterEmail);
  revalidatePath("/support");
  revalidatePath("/admin");
}

export async function claimSupportTicket(formData: FormData): Promise<boolean> {
  const actorEmail = await requireAdminSession();
  const ticketId = formData.get("ticketId");
  if (typeof ticketId !== "string" || !isObjectId(ticketId)) throw new Error("Invalid support ticket.");
  const result = await prisma.supportTicket.updateMany({ where: { id: ticketId, status: { not: "closed" }, OR: [{ assignedAdminEmail: null }, { assignedAdminEmail: { isSet: false } }, { assignedAdminEmail: actorEmail }] }, data: { assignedAdminEmail: actorEmail, assignedAt: new Date(), status: "in-progress" } });
  // MongoDB can report a zero modified-count even when the guarded update has
  // reached this exact admin. Read the persisted owner instead of treating that
  // driver detail as a failed claim.
  const persisted = await prisma.supportTicket.findUnique({ where: { id: ticketId }, select: { assignedAdminEmail: true, status: true } });
  const claimedByActor = persisted?.assignedAdminEmail === actorEmail && persisted.status !== "closed";
  if (!claimedByActor) {
    revalidatePath("/admin");
    return false;
  }
  if (result.count === 1) await notifyAdmins(actorEmail, "support-claim", "A support ticket was claimed");
  revalidatePath("/admin");
  return true;
}

export async function replyToSupportTicket(formData: FormData): Promise<void> {
  const actorEmail = await requireAdminSession();
  const ticketId = formData.get("ticketId");
  const templateValue = formData.get("template");
  const additionalMessage = typeof formData.get("additionalMessage") === "string" ? String(formData.get("additionalMessage")).trim().slice(0, 2000) : "";
  if (typeof ticketId !== "string" || !isObjectId(ticketId) || typeof templateValue !== "string" || !(templateValue in { "request-details": true, "under-review": true, "technical-update": true, "safety-guidance": true, custom: true })) throw new Error("Invalid support reply.");
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId }, select: { assignedAdminEmail: true, requesterEmail: true } });
  if (!ticket || ticket.assignedAdminEmail !== actorEmail) throw new Error("Claim this ticket before replying.");
  const recipient = await prisma.profile.findUnique({ where: { email: ticket.requesterEmail }, select: { language: true } });
  const baseMessage = supportTemplateText(templateValue as SupportTemplateKey, recipient?.language === "de");
  const body = templateValue === "custom" ? additionalMessage : `${baseMessage}${additionalMessage ? `\n\n${recipient?.language === "de" ? "Zusätzliche Informationen:" : "Additional information:"}\n${additionalMessage}` : ""}`;
  if (!body) throw new Error("A support reply is required.");
  await prisma.$transaction([
    prisma.supportTicketMessage.create({ data: { ticketId, senderType: "admin", senderAdminEmail: actorEmail, body } }),
    prisma.supportTicket.update({ where: { id: ticketId }, data: { status: "awaiting-user", updatedAt: new Date() } }),
  ]);
  await deliverSupportReply(ticket.requesterEmail, body);
  await notifyAdmins(actorEmail, "support-reply", "A Support@Vibe ticket was answered");
  revalidatePath("/admin");
  revalidatePath("/support");
  revalidatePath("/messages");
}

export async function releaseSupportTicket(formData: FormData): Promise<void> {
  const actorEmail = await requireAdminSession();
  const ticketId = formData.get("ticketId");
  if (typeof ticketId !== "string" || !isObjectId(ticketId)) throw new Error("Invalid support ticket.");
  const result = await prisma.supportTicket.updateMany({ where: { id: ticketId, assignedAdminEmail: actorEmail }, data: { assignedAdminEmail: null, assignedAt: null, status: "open" } });
  if (result.count !== 1) throw new Error("Only the assigned admin can release this ticket.");
  await notifyAdmins(actorEmail, "support-release", "A support ticket was released");
  revalidatePath("/admin");
}

export async function closeSupportTicket(formData: FormData): Promise<void> {
  const actorEmail = await requireAdminSession();
  const ticketId = formData.get("ticketId");
  if (typeof ticketId !== "string" || !isObjectId(ticketId)) throw new Error("Invalid support ticket.");
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId }, select: { requesterEmail: true, assignedAdminEmail: true } });
  if (!ticket || ticket.assignedAdminEmail !== actorEmail) throw new Error("Only the assigned admin can close this ticket.");
  const recipient = await prisma.profile.findUnique({ where: { email: ticket.requesterEmail }, select: { language: true } });
  const closingMessage = supportTemplateText("resolved", recipient?.language === "de");
  if (closingMessage) await deliverSupportReply(ticket.requesterEmail, closingMessage);
  await prisma.$transaction([
    prisma.supportTicketMessage.deleteMany({ where: { ticketId } }),
    prisma.supportTicket.delete({ where: { id: ticketId } }),
  ]);
  await notifyAdmins(actorEmail, "support-close", "A support ticket was closed and deleted for privacy");
  revalidatePath("/admin");
  revalidatePath("/support");
}

export async function deleteClosedSupportTicket(formData: FormData): Promise<void> {
  const actorEmail = await requireAdminSession();
  const ticketId = formData.get("ticketId");
  if (typeof ticketId !== "string" || !isObjectId(ticketId)) throw new Error("Invalid support ticket.");
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId }, select: { status: true } });
  if (!ticket || ticket.status !== "closed") throw new Error("Only closed support tickets can be deleted.");
  await prisma.$transaction([
    prisma.supportTicketMessage.deleteMany({ where: { ticketId } }),
    prisma.supportTicket.delete({ where: { id: ticketId } }),
  ]);
  await notifyAdmins(actorEmail, "support-delete", "A closed Support@Vibe ticket was deleted");
  revalidatePath("/admin");
  revalidatePath("/support");
}

export async function updateReportStatus(formData: FormData): Promise<void> {
  const actorEmail = await requireAdminSession();
  const reportId = formData.get("reportId");
  const status = formData.get("status");
  if (typeof reportId !== "string" || !reportId || (status !== "resolved" && status !== "dismissed" && status !== "open")) throw new Error("Invalid report status.");
  await prisma.report.update({ where: { id: reportId }, data: { status } });
  await notifyAdmins(actorEmail, "report-status", `A report was marked ${status}`);
  revalidatePath("/admin");
}

export async function deleteReport(formData: FormData): Promise<void> {
  const actorEmail = await requireAdminSession();
  if (!isSuperAdmin(actorEmail)) throw new Error("Only Violett can delete reports.");
  const reportId = formData.get("reportId");
  if (typeof reportId !== "string" || !reportId) throw new Error("Invalid report.");

  const report = await prisma.report.findUnique({ where: { id: reportId }, select: { status: true } });
  if (!report) throw new Error("Report not found.");
  if (report.status === "open") throw new Error("Open reports cannot be deleted.");

  await prisma.report.delete({ where: { id: reportId } });
  await notifyAdmins(actorEmail, "report-delete", "A completed report was deleted");
  revalidatePath("/admin");
}

export async function createAdminNote(formData: FormData): Promise<void> {
  const authorEmail = await requireAdminSession();
  const body = typeof formData.get("body") === "string" ? String(formData.get("body")).trim().slice(0, 2000) : "";
  if (!body) throw new Error("Note text is required.");
  await prisma.adminNote.create({ data: { authorEmail, body } });
  await notifyAdmins(authorEmail, "note", "New admin note");
  revalidatePath("/admin");
}

export async function updateAdminNote(formData: FormData): Promise<void> {
  const actorEmail = await requireAdminSession();
  const noteId = formData.get("noteId");
  const body = typeof formData.get("body") === "string" ? String(formData.get("body")).trim().slice(0, 2000) : "";
  if (typeof noteId !== "string" || !noteId || !body) throw new Error("Invalid note.");
  await prisma.adminNote.update({ where: { id: noteId }, data: { body } });
  await notifyAdmins(actorEmail, "note-update", "An admin note was updated");
  revalidatePath("/admin");
}

export async function deleteAdminNote(formData: FormData): Promise<void> {
  const actorEmail = await requireAdminSession();
  if (!isSuperAdmin(actorEmail)) throw new Error("Only Violett can delete admin notes.");
  const noteId = formData.get("noteId");
  if (typeof noteId !== "string" || !noteId) throw new Error("Invalid note.");
  await prisma.$transaction([
    prisma.adminNoteComment.deleteMany({ where: { noteId } }),
    prisma.adminNoteVote.deleteMany({ where: { noteId } }),
    prisma.adminNote.delete({ where: { id: noteId } }),
  ]);
  await notifyAdmins(actorEmail, "note-delete", "An admin note was deleted");
  revalidatePath("/admin");
}

export async function addAdminNoteComment(formData: FormData): Promise<void> {
  const authorEmail = await requireAdminSession();
  const noteId = formData.get("noteId");
  const body = typeof formData.get("body") === "string" ? String(formData.get("body")).trim().slice(0, 1000) : "";
  if (typeof noteId !== "string" || !noteId || !body) throw new Error("Invalid note comment.");
  await prisma.adminNoteComment.create({ data: { noteId, authorEmail, body } });
  await notifyAdmins(authorEmail, "note-comment", "New comment on an admin note");
  revalidatePath("/admin");
}

export async function toggleAdminNoteVote(formData: FormData): Promise<void> {
  const voterEmail = await requireAdminSession();
  const noteId = formData.get("noteId");
  if (typeof noteId !== "string" || !noteId) throw new Error("Invalid note.");
  const current = await prisma.adminNoteVote.findUnique({ where: { noteId_voterEmail: { noteId, voterEmail } }, select: { id: true } });
  if (current) await prisma.adminNoteVote.delete({ where: { id: current.id } });
  else await prisma.adminNoteVote.create({ data: { noteId, voterEmail } });
  await notifyAdmins(voterEmail, "note-vote", "An admin note was voted on");
  revalidatePath("/admin");
}

export async function applyProfileRestriction(formData: FormData): Promise<void> {
  const actorEmail = await requireAdminSession();
  const profileId = formData.get("profileId");
  const scope = formData.get("scope");
  const scopes: Record<string, { messages: boolean; comments: boolean; posts: boolean }> = {
    messages: { messages: true, comments: false, posts: false },
    comments: { messages: false, comments: true, posts: false },
    "messages-comments": { messages: true, comments: true, posts: false },
    posts: { messages: false, comments: false, posts: true },
    full: { messages: true, comments: true, posts: true },
  };
  if (typeof profileId !== "string" || !isObjectId(profileId) || typeof scope !== "string" || !scopes[scope]) throw new Error("Invalid restriction.");
  const target = await prisma.profile.findUnique({ where: { id: profileId }, select: { id: true, email: true, username: true, language: true, isAdmin: true, isSystem: true, restrictedUntil: true, restrictionMessages: true, restrictionComments: true, restrictionPosts: true } });
  if (!target || target.isSystem || target.isAdmin || isProtectedAdmin(target.email)) throw new Error("This profile cannot be restricted.");
  const selected = scopes[scope];
  const currentlyActive = Boolean(target.restrictedUntil && target.restrictedUntil.getTime() > Date.now());
  const combined = {
    messages: selected.messages || (currentlyActive && target.restrictionMessages),
    comments: selected.comments || (currentlyActive && target.restrictionComments),
    posts: selected.posts || (currentlyActive && target.restrictionPosts),
  };
  const endsAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const previous = await prisma.restriction.findMany({ where: { profileId }, select: { blocksMessages: true, blocksComments: true, blocksPosts: true } });
  const warningCapabilities = [
    selected.messages && previous.filter((item) => item.blocksMessages).length + 1 === 3 ? "messages" : null,
    selected.comments && previous.filter((item) => item.blocksComments).length + 1 === 3 ? "comments" : null,
    selected.posts && previous.filter((item) => item.blocksPosts).length + 1 === 3 ? "posts" : null,
  ].filter((value): value is string => Boolean(value));
  await prisma.$transaction([
    prisma.profile.update({ where: { id: profileId }, data: { restrictedUntil: endsAt, restrictionMessages: combined.messages, restrictionComments: combined.comments, restrictionPosts: combined.posts } }),
    prisma.restriction.create({ data: { profileId, imposedByEmail: actorEmail, blocksMessages: selected.messages, blocksComments: selected.comments, blocksPosts: selected.posts, endsAt } }),
  ]);
  const de = target.language === "de";
  const labels = [combined.messages && (de ? "Nachrichten" : "messages"), combined.comments && (de ? "Kommentare" : "comments"), combined.posts && (de ? "Beiträge" : "posts")].filter(Boolean).join(", ");
  const warning = warningCapabilities.length ? (de ? `

Wichtiger Hinweis: Bei einer vierten gleichartigen Restriktion wird dein Profil gesondert geprüft und kann gegebenenfalls entfernt werden.` : `

Important notice: a fourth restriction of the same kind will trigger a separate review of your profile and may lead to its removal.`) : "";
  await deliverVibeTeamMessage(target.email, de ? `Wir möchten dich informieren, dass für dein Profil vorübergehend eine Restriktion aktiv ist.

Betroffen: ${labels}
Die Restriktion endet in drei Tagen.

Bitte beachte unsere Community-Regeln. Bei Fragen kannst du dich an Support@Vibe wenden.${warning}

— VibeTeam` : `We want to let you know that a temporary restriction is active for your profile.

Affected: ${labels}
The restriction ends in three days.

Please keep our community rules in mind. If you have questions, you can contact Support@Vibe.${warning}

— VibeTeam`);
  await notifyAdmins(actorEmail, "restriction", `Temporary ${scope} restriction applied to @${target.username || target.email}`);
  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/profile");
}

export async function setProfileAdmin(formData: FormData): Promise<void> {
  const actorEmail = await requireAdminSession();
  const profileId = formData.get("profileId");
  const isAdmin = formData.get("isAdmin") === "true";
  if (typeof profileId !== "string" || !profileId) throw new Error("Invalid profile.");
  const target = await prisma.profile.findUnique({ where: { id: profileId }, select: { email: true } });
  if (!target) throw new Error("Profile not found.");
  if (!isAdmin && isProtectedAdmin(target.email)) throw new Error("Protected administrators cannot be removed.");
  await prisma.profile.update({ where: { id: profileId }, data: { isAdmin } });
  await notifyAdmins(actorEmail, "admin-role", `An administrator role was ${isAdmin ? "granted" : "removed"}`);
  revalidatePath("/admin");
  revalidatePath("/profiles");
}

export async function deleteProfileAsSuperAdmin(formData: FormData): Promise<void> {
  const session = await auth();
  const actorEmail = session?.user?.email;
  if (!actorEmail || !isSuperAdmin(actorEmail)) throw new Error("Only protected administrators can delete accounts.");

  const profileId = formData.get("profileId");
  const returnToValue = formData.get("returnTo");
  const returnTo = typeof returnToValue === "string" && returnToValue.startsWith("/") && !returnToValue.startsWith("//") ? returnToValue : "/profiles";
  if (typeof profileId !== "string" || !profileId) throw new Error("Invalid profile.");
  const target = await prisma.profile.findUnique({ where: { id: profileId }, select: { id: true, email: true } });
  if (!target) throw new Error("Profile not found.");
  if (isProtectedAdmin(target.email)) throw new Error("Protected administrators cannot be deleted.");

  const [posts, comments, stories, collections, conversations] = await Promise.all([
    prisma.post.findMany({ where: { authorEmail: target.email }, select: { id: true } }),
    prisma.comment.findMany({ where: { authorEmail: target.email }, select: { id: true } }),
    prisma.story.findMany({ where: { authorEmail: target.email }, select: { id: true } }),
    prisma.bookmarkCollection.findMany({ where: { profileId: target.id }, select: { id: true } }),
    prisma.conversationParticipant.findMany({ where: { profileId: target.id }, select: { conversationId: true } }),
  ]);
  const postIds = posts.map((post) => post.id);
  const commentIds = comments.map((comment) => comment.id);
  const storyIds = stories.map((story) => story.id);
  const collectionIds = collections.map((collection) => collection.id);
  const conversationIds = conversations.map((conversation) => conversation.conversationId);
  const postCommentIds = postIds.length
    ? (await prisma.comment.findMany({ where: { postId: { in: postIds } }, select: { id: true } })).map((comment) => comment.id)
    : [];
  const removableCommentIds = [...new Set([...commentIds, ...postCommentIds])];

  await prisma.$transaction([
    ...(removableCommentIds.length ? [
      prisma.comment.updateMany({ where: { parentCommentId: { in: removableCommentIds } }, data: { parentCommentId: null } }),
      prisma.commentMention.deleteMany({ where: { commentId: { in: removableCommentIds } } }),
      prisma.commentLike.deleteMany({ where: { commentId: { in: removableCommentIds } } }),
      prisma.comment.deleteMany({ where: { id: { in: removableCommentIds } } }),
    ] : []),
    ...(postIds.length ? [
      prisma.postLike.deleteMany({ where: { postId: { in: postIds } } }),
      prisma.postBookmark.deleteMany({ where: { postId: { in: postIds } } }),
      prisma.bookmarkCollectionPost.deleteMany({ where: { postId: { in: postIds } } }),
      prisma.postTopic.deleteMany({ where: { postId: { in: postIds } } }),
      prisma.postProfileTag.deleteMany({ where: { postId: { in: postIds } } }),
      prisma.post.deleteMany({ where: { id: { in: postIds } } }),
    ] : []),
    ...(storyIds.length ? [
      prisma.storyView.deleteMany({ where: { storyId: { in: storyIds } } }),
      prisma.storySlide.deleteMany({ where: { storyId: { in: storyIds } } }),
      prisma.story.deleteMany({ where: { id: { in: storyIds } } }),
    ] : []),
    ...(collectionIds.length ? [
      prisma.bookmarkCollectionPost.deleteMany({ where: { collectionId: { in: collectionIds } } }),
      prisma.bookmarkCollection.deleteMany({ where: { id: { in: collectionIds } } }),
    ] : []),
    prisma.postLike.deleteMany({ where: { authorEmail: target.email } }),
    prisma.postBookmark.deleteMany({ where: { authorEmail: target.email } }),
    prisma.commentLike.deleteMany({ where: { authorEmail: target.email } }),
    prisma.commentMention.deleteMany({ where: { profileId: target.id } }),
    prisma.postProfileTag.deleteMany({ where: { profileId: target.id } }),
    prisma.profileLink.deleteMany({ where: { profileId: target.id } }),
    prisma.topicFollow.deleteMany({ where: { profileId: target.id } }),
    prisma.follow.deleteMany({ where: { OR: [{ followerId: target.id }, { followingId: target.id }] } }),
    prisma.followRequest.deleteMany({ where: { OR: [{ followerId: target.id }, { followingId: target.id }] } }),
    prisma.block.deleteMany({ where: { OR: [{ blockerId: target.id }, { blockedId: target.id }] } }),
    prisma.storyView.deleteMany({ where: { viewerEmail: target.email } }),
    prisma.message.deleteMany({ where: { senderId: target.id } }),
    ...(conversationIds.length ? [prisma.conversationParticipant.deleteMany({ where: { conversationId: { in: conversationIds }, profileId: target.id } })] : []),
    prisma.adminNoteComment.deleteMany({ where: { authorEmail: target.email } }),
    prisma.adminNoteVote.deleteMany({ where: { voterEmail: target.email } }),
    prisma.adminActivity.deleteMany({ where: { actorEmail: target.email } }),
    prisma.report.deleteMany({ where: { reporterEmail: target.email } }),
    prisma.profile.delete({ where: { id: target.id } }),
  ]);

  await notifyAdmins(actorEmail, "user-delete", "A user account was deleted");
  revalidatePath("/");
  revalidatePath("/home");
  revalidatePath("/profiles");
  revalidatePath("/admin");
  redirect(returnTo);
}
