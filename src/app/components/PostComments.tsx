import { auth } from "@/auth";
import { prisma } from "@/db";
import CommentItem from "./CommentItem";

type PostCommentsProps = {
  postId: string;
};

export default async function PostComments({ postId }: PostCommentsProps) {
  const session = await auth();
  const currentUserEmail = session?.user?.email ?? null;

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
    <div className="space-y-4">
      {comments.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No comments yet.
        </p>
      ) : (
        comments.map((comment) => (
          <CommentItem
            key={comment.id}
            postId={postId}
            comment={{
              id: comment.id,
              text: comment.text,
              createdAt: comment.createdAt,
              author: {
                username: comment.author.username,
                name: comment.author.name,
                avatar: comment.author.avatar,
              },
              likesCount: comment.likes.length,
              isLikedByViewer: currentUserEmail
                ? comment.likes.some(
                    (like) => like.authorEmail === currentUserEmail,
                  )
                : false,
              replies: comment.replies.map((reply) => ({
                id: reply.id,
                text: reply.text,
                createdAt: reply.createdAt,
                author: {
                  username: reply.author.username,
                  name: reply.author.name,
                  avatar: reply.author.avatar,
                },
                likesCount: reply.likes.length,
                isLikedByViewer: currentUserEmail
                  ? reply.likes.some(
                      (like) => like.authorEmail === currentUserEmail,
                    )
                  : false,
              })),
            }}
          />
        ))
      )}
    </div>
  );
}
