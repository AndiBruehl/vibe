export const MAX_POST_IMAGES = 4;

export function getPostImages(post: {
  image: string;
  images?: string[] | null;
}) {
  return post.images?.length ? post.images : [post.image];
}

export function parsePostImages(values: unknown[]): string[] {
  if (values.length < 1 || values.length > MAX_POST_IMAGES) {
    throw new Error("Choose between 1 and 4 images.");
  }
  return values.map((value) => {
    if (typeof value !== "string" || !value.trim())
      throw new Error("An image is missing.");
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:")
      throw new Error("Invalid image URL.");
    return url.toString();
  });
}
