import { sha256 } from "@noble/hashes/sha2.js";

export type AndroidUpdateRelease = {
  version: string;
  downloadUrl: string;
  sha256: string;
  sizeBytes: number;
};

const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:\.\d+)?$/;
const SHA256_PATTERN = /^[a-f\d]{64}$/i;
const ANDROID_RELEASE_PATH = /^\/AndiBruehl\/vibe\/main\/android-app\/dist\/Vibe-BETA-[\d.]+\.apk$/;

export class UpdateIntegrityError extends Error {
  constructor(message = "APK integrity check failed.") {
    super(message);
    this.name = "UpdateIntegrityError";
  }
}

export function isSha256(value: unknown): value is string {
  return typeof value === "string" && SHA256_PATTERN.test(value);
}

export function isValidAndroidUpdateRelease(value: unknown): value is AndroidUpdateRelease {
  if (!value || typeof value !== "object") return false;
  const release = value as Partial<AndroidUpdateRelease>;
  if (typeof release.version !== "string" || !VERSION_PATTERN.test(release.version) ||
    typeof release.downloadUrl !== "string" || !isSha256(release.sha256) ||
    !Number.isSafeInteger(release.sizeBytes) || (release.sizeBytes ?? 0) <= 0) return false;

  try {
    const url = new URL(release.downloadUrl);
    return url.protocol === "https:" && url.hostname === "raw.githubusercontent.com" &&
      url.username === "" && url.password === "" && url.port === "" && url.search === "" && url.hash === "" &&
      url.pathname === `/AndiBruehl/vibe/main/android-app/dist/Vibe-BETA-${release.version}.apk` &&
      ANDROID_RELEASE_PATH.test(url.pathname);
  } catch {
    return false;
  }
}

export async function hashSha256Chunks(
  readChunk: () => Uint8Array,
  yieldToUi: () => Promise<void> = () => new Promise((resolve) => setTimeout(resolve, 0)),
): Promise<{ sha256: string; sizeBytes: number }> {
  const hash = sha256.create();
  let sizeBytes = 0;
  while (true) {
    const chunk = readChunk();
    if (chunk.length === 0) break;
    hash.update(chunk);
    sizeBytes += chunk.length;
    await yieldToUi();
  }
  const digest = hash.digest();
  return {
    sha256: Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join(""),
    sizeBytes,
  };
}

export async function assertApkIntegrity(
  readChunk: () => Uint8Array,
  expected: { sha256?: string; sizeBytes?: number },
): Promise<{ sha256: string; sizeBytes: number }> {
  if (!isSha256(expected.sha256) || !Number.isSafeInteger(expected.sizeBytes) || (expected.sizeBytes ?? 0) <= 0) {
    throw new UpdateIntegrityError("APK release metadata is incomplete.");
  }
  const actual = await hashSha256Chunks(readChunk);
  if (actual.sizeBytes !== expected.sizeBytes || actual.sha256.toLowerCase() !== expected.sha256.toLowerCase()) {
    throw new UpdateIntegrityError();
  }
  return actual;
}

export function shouldFallbackToBrowser(cause: unknown): boolean {
  return !(cause instanceof UpdateIntegrityError);
}
