export type ReleaseNote = {
  version: string;
  date: string;
  changes: string[];
};

// Keep newest releases first. This is the single source for the Home changelog.
export const webReleaseNotes: ReleaseNote[] = [
  {
    version: "0.1.75",
    date: "2026-09-23",
    changes: [
      "Added curated profile badges that administrators can award or remove.",
      "Added member controls to show or hide each awarded badge publicly.",
      "Added badge display alongside existing Admin and Verified statuses across profile, post, comment, and directory views.",
      "Added safe fallbacks for older profile data and unsuccessful badge updates.",
    ],
  },
  {
    version: "0.1.74",
    date: "2026-09-23",
    changes: [
      "Added profile section visibility controls with an instant visitor preview.",
      "Added safe fallbacks so existing profiles keep every section visible until a member changes it.",
      "Applied visibility choices to links, shoutouts, pinned posts, highlights, topics, and archive navigation.",
    ],
  },
  {
    version: "0.1.73",
    date: "2026-09-23",
    changes: [
      "Added the Home changelog between Stories and the feed controls.",
      "Moved profile pin controls directly onto posts and pinned tiles.",
      "Improved the local development fallback for temporary Prisma connection failures.",
    ],
  },
  {
    version: "0.1.72",
    date: "2026-09-23",
    changes: [
      "Added pinned profile posts with direct pin, unpin, and ordering controls.",
      "Added a safe recovery state for temporary Prisma and Atlas connection failures.",
      "Published matching 0.1.72 Android and Windows update artifacts.",
    ],
  },
  {
    version: "0.1.71",
    date: "2026-09-23",
    changes: [
      "Added account post drafts with persistent media, topics, and profile tags.",
      "Added draft previews, editing, deletion, and safe recovery for unavailable draft data.",
      "Added the web release date to the version label.",
    ],
  },
  {
    version: "0.1.70.1",
    date: "2026-09-18",
    changes: [
      "Added video support for stories, topics, and shared messages.",
      "Added muted autoplay, sound controls, and press-to-pause for video stories.",
      "Improved video sharing fallbacks and media rendering consistency.",
    ],
  },
];
