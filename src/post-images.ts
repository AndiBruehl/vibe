export const MAX_POST_IMAGES = 4;
export const IMAGE_MEDIA_TYPE = "image";
export const VIDEO_MEDIA_TYPE = "video";

export function getPostMediaTypes(post: { images?: string[] | null; mediaTypes?: string[] | null }) {
  const count = post.images?.length || 1;
  return Array.from({ length: count }, (_, index) => post.mediaTypes?.[index] === VIDEO_MEDIA_TYPE ? VIDEO_MEDIA_TYPE : IMAGE_MEDIA_TYPE);
}

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

export function parsePostMediaTypes(values: unknown[], mediaCount: number): string[] {
  if (values.length !== mediaCount) throw new Error("Every media item needs a type.");
  return values.map((value) => value === VIDEO_MEDIA_TYPE ? VIDEO_MEDIA_TYPE : value === IMAGE_MEDIA_TYPE ? IMAGE_MEDIA_TYPE : (() => { throw new Error("Invalid media type."); })());
}
