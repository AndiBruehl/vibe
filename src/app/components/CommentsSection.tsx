import { auth } from "@/auth";
import { prisma } from "@/db";
import CommentForm from "./CommentForm";
import CommentItem from "./CommentItem";

type CommentsSectionProps = {
  postId: string;
};

export default async function CommentsSection({
  postId,
}: CommentsSectionProps) {
  const session = await auth();
  const viewerEmail = session?.user?.email ?? null;

  const comments = await prisma.comment.findMany({
    where: {
      postId,
      parentCommentId: null,
    },
    include: {
      author: {
        select: {
          username: true,
          name: true,
          avatar: true,
        },
      },
      likes: {
        select: {
          authorEmail: true,
        },
      },
      replies: {
        include: {
          author: {
            select: {
              username: true,
              name: true,
              avatar: true,
            },
          },
          likes: {
            select: {
              authorEmail: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <section className="rounded-2xl bg-white p-5 shadow-md shadow-gray-200 dark:bg-gray-800 dark:shadow-gray-900">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Comments
      </h2>

      <CommentForm postId={postId} />

      <div className="mt-6 space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No comments yet.
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={{
                ...comment,
                isLikedByViewer: viewerEmail
                  ? comment.likes.some(
                      (like) => like.authorEmail === viewerEmail,
                    )
                  : false,
                likesCount: comment.likes.length,
                replies: comment.replies.map((reply) => ({
                  ...reply,
                  isLikedByViewer: viewerEmail
                    ? reply.likes.some(
                        (like) => like.authorEmail === viewerEmail,
                      )
                    : false,
                  likesCount: reply.likes.length,
                })),
              }}
              postId={postId}
              isReply={false}
            />
          ))
        )}
      </div>
    </section>
  );
}
