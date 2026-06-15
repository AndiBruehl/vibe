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

  const username = ((formData.get("username") as string) || "").trim();

  if (/\s/.test(username)) {
    throw new Error("Invalid username: spaces are not allowed.");
  }

  const newUserInfo = {
    username,
    name: ((formData.get("name") as string) || "").trim(),
    subtitle: ((formData.get("subtitle") as string) || "").trim(),
    bio: ((formData.get("bio") as string) || "").trim(),
    avatar: ((formData.get("avatarUrl") as string) || "").trim(),
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

export async function editPost(formData: FormData): Promise<void> {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const postIdValue = formData.get("postId");
  const imageValue = formData.get("image");
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

  if (cleanedImage === undefined && cleanedDescription === undefined) {
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
      ...(cleanedImage !== undefined ? { image: cleanedImage } : {}),
      ...(cleanedDescription !== undefined
        ? { description: cleanedDescription }
        : {}),
    },
  });

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

  if (post.authorEmail !== session.user.email) {
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
    prisma.comment.deleteMany({ where: { postId: postIdValue } }),
    prisma.postLike.deleteMany({ where: { postId: postIdValue } }),
    prisma.postBookmark.deleteMany({ where: { postId: postIdValue } }),
    prisma.post.delete({ where: { id: postIdValue } }),
  ]);

  revalidatePath("/");
  revalidatePath("/profile");

  redirect("/");
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

  if (comment.authorEmail !== session.user.email) {
    throw new Error("You are not authorized to delete this comment.");
  }

  if (comment.postId !== postIdValue) {
    throw new Error("Comment does not belong to this post.");
  }

  await prisma.$transaction([
    prisma.commentLike.deleteMany({
      where: { commentId: commentIdValue },
    }),
    prisma.comment.deleteMany({
      where: { parentCommentId: commentIdValue },
    }),
    prisma.comment.delete({
      where: { id: commentIdValue },
    }),
  ]);

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
    await prisma.postBookmark.delete({
      where: {
        postId_authorEmail: {
          postId: postIdValue,
          authorEmail: session.user.email,
        },
      },
    });
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
    },
  });

  if (!targetProfile) {
    throw new Error("Target profile not found.");
  }

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUserProfile.id,
        followingId: targetProfile.id,
      },
    },
  });

  if (existingFollow) {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserProfile.id,
          followingId: targetProfile.id,
        },
      },
    });
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

function getDirectConversationKey(profileIdA: string, profileIdB: string) {
  return [profileIdA, profileIdB].sort().join(":");
}

function isObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

export async function startConversation(formData: FormData): Promise<void> {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    redirect("/");
  }

  const targetProfileIdValue = formData.get("targetProfileId");

  if (
    typeof targetProfileIdValue !== "string" ||
    !isObjectId(targetProfileIdValue)
  ) {
    throw new Error("Target profile ID is missing.");
  }

  const currentUserProfile = await prisma.profile.findUnique({
    where: {
      email: userEmail,
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
    },
  });

  if (!targetProfile) {
    throw new Error("Target profile not found.");
  }

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
      isGroup: false,
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

export async function createGroupConversation(
  formData: FormData,
): Promise<void> {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    redirect("/");
  }

  const nameValue = formData.get("name");
  const participantUsernamesValue = formData.get("participantUsernames");

  if (typeof nameValue !== "string" || !nameValue.trim()) {
    throw new Error("Group name is required.");
  }

  if (
    typeof participantUsernamesValue !== "string" ||
    !participantUsernamesValue.trim()
  ) {
    throw new Error("Participant usernames are required.");
  }

  const rawUsernames = participantUsernamesValue
    .split(",")
    .map((username) => username.trim())
    .filter(Boolean);

  const currentUserProfile = await prisma.profile.findUnique({
    where: {
      email: userEmail,
    },
    select: {
      id: true,
      username: true,
    },
  });

  if (!currentUserProfile) {
    throw new Error("Current user profile not found.");
  }

  const participantUsernames = Array.from(
    new Set(
      rawUsernames.filter(
        (username) =>
          username !== currentUserProfile.username && username !== userEmail,
      ),
    ),
  );

  if (participantUsernames.length < 2) {
    throw new Error(
      "Please add at least two other members, separated by commas.",
    );
  }

  const participants = await prisma.profile.findMany({
    where: {
      username: {
        in: participantUsernames,
      },
    },
    select: {
      id: true,
      username: true,
    },
  });

  if (participants.length !== participantUsernames.length) {
    throw new Error(
      "One or more usernames could not be found. Please verify the participant list.",
    );
  }

  const conversation = await prisma.conversation.create({
    data: {
      name: nameValue.trim(),
      isGroup: true,
      participants: {
        create: [
          {
            profileId: currentUserProfile.id,
          },
          ...participants.map((participant) => ({
            profileId: participant.id,
          })),
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
  const userEmail = session?.user?.email;

  if (!userEmail) {
    redirect("/");
  }

  const conversationIdValue = formData.get("conversationId");
  const bodyValue = formData.get("body");

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

  if (!body) {
    throw new Error("Message cannot be empty.");
  }

  const currentUserProfile = await prisma.profile.findUnique({
    where: {
      email: userEmail,
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
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  const now = new Date();

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: currentUserProfile.id,
        body,
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
