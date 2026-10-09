import { NextResponse } from "next/server";
import releaseManifest from "../../../../../public/releases/latest.json";
import releaseSignature from "../../../../../public/releases/latest.sig.example.json";

type GitHubFile = {
  name: string;
  type: "file" | "dir";
  download_url: string | null;
};

type Release = {
  version: string;
  downloadUrl: string;
  sha256: string;
  sizeBytes: number;
};

type ReleaseSignature = {
  algorithm: string;
  keyId: string;
  payloadSha256: string;
  schema: string;
  signature: string;
};

const REPOSITORY = "AndiBruehl/vibe";

function compareVersions(left: string, right: string) {
  const leftParts = left.split(".").map(Number);
  const rightParts = right.split(".").map(Number);
  const length = Math.max(leftParts.length, rightParts.length);

  for (let index = 0; index < length; index += 1) {
    const difference = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
    if (difference !== 0) return difference;
  }

  return 0;
}

async function getLatestRelease(
  directory: string,
  filePattern: RegExp,
  knownRelease: Release,
): Promise<Release | null> {
  const response = await fetch(
    `https://api.github.com/repos/${REPOSITORY}/contents/${directory}?ref=main`,
    {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    },
  );

  if (!response.ok) return null;

  const files = (await response.json()) as GitHubFile[];
  const releases = files.flatMap((file) => {
    const match = file.type === "file" ? file.name.match(filePattern) : null;
    return match && file.download_url && match[1] === knownRelease.version
      ? [{ ...knownRelease, downloadUrl: file.download_url }]
      : [];
  });

  return releases.sort((left, right) =>
    compareVersions(right.version, left.version),
  )[0] ?? null;
}

export async function GET() {
  const [windows, android] = await Promise.all([
    getLatestRelease(
      "electron-app/dist",
      /^Vibe-Setup-(?:BETA-)?(\d+(?:\.\d+){2,4})-x64\.exe$/,
      releaseManifest.windows,
    ).catch(() => null),
    getLatestRelease(
      "android-app/dist",
      /^Vibe-(?:BETA-)?(\d+(?:\.\d+){2,4})\.apk$/,
      releaseManifest.android,
    ).catch(() => null),
  ]);

  return NextResponse.json(
    {
      windows: windows ?? releaseManifest.windows,
      android: android ?? releaseManifest.android,
      signature: releaseSignature as ReleaseSignature,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
