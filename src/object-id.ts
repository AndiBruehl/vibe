/** True when a value can safely be used as a MongoDB ObjectId. */
export function isObjectId(value: unknown): value is string {
  return typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
}
