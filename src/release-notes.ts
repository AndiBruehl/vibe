export type ReleaseNote = {
  version: string;
  date: string;
  changes: string[];
};

// Keep newest releases first. This is the single source for the Home changelog.
export const webReleaseNotes: ReleaseNote[] = [
  { version: "0.1.81", date: "2026-09-24", changes: ["Reworked Admin user management into permanently visible, single-column expandable member cards.", "Added localized guidance for opening a member card and safe empty states for user searches."] },
  { version: "0.1.80.3", date: "2026-09-24", changes: ["Fixed custom badge clicks so they show the same label tooltip as system badges."] },
  { version: "0.1.80.2", date: "2026-09-24", changes: ["Fixed custom profile badge symbols so they remain perfectly circular despite global button sizing."] },
  { version: "0.1.80.1", date: "2026-09-24", changes: ["Fixed custom badges in Admin user management, including safe duplicate prevention and removal controls.", "Replaced the long global comment spinner with a compact local sending state."] },
  { version: "0.1.80", date: "2026-09-24", changes: ["Added admin-awarded custom profile badges with an emoji picker and a free badge label.", "Recipients receive a localized VibeTeam message naming the awarding admin and their new badge.", "Custom badge requests can be sent directly to Support@Vibe."] },
  { version: "0.1.79.5", date: "2026-09-24", changes: ["Fixed Custom frame guidance so it follows the active VIBE language.", "Placed profile badges below the member name so they wrap cleanly on narrow screens."] },
  {
    version: "0.1.79.4",
    date: "2026-09-24",
    changes: [
      "Refined custom video frame uploads with a full-area drag-and-drop target.",
      "Made the selected-frame action more prominent and increased app-wide reading size.",
    ],
  },
  {
    version: "0.1.79.3",
    date: "2026-09-24",
    changes: [
      "Added a VIBE-styled delete confirmation with Cancel and Delete controls.",
    ],
  },
  {
    version: "0.1.79.2",
    date: "2026-09-24",
    changes: [
      "Let a single selected image or video use the full available composer width.",
      "Keep media in a compact grid when a post has two to four items.",
    ],
  },
  {
    version: "0.1.79.1",
    date: "2026-09-24",
    changes: [
      "Added a short step-by-step explanation beside the video preview-frame slider.",
    ],
  },
  {
    version: "0.1.79",
    date: "2026-09-24",
    changes: [
      "Added optional custom posters and a time-slider frame editor for uploaded videos.",
      "Added a safe automatic preview frame at three seconds, with a short-video fallback.",
      "Added a consistent play marker to video previews across feeds, topics, browse, search, post detail, and shared messages.",
    ],
  },
  {
    version: "0.1.78.2",
    date: "2026-09-24",
    changes: [
      "Aligned profile actions, links, shoutouts, and milestones with Standard, Compact, and Spotlight layouts.",
      "Fixed Spotlight actions so they remain centered on desktop screens.",
    ],
  },
  {
    version: "0.1.78.1",
    date: "2026-09-24",
    changes: [
      "Added JSON import and export for saved profile looks, with safe field validation and clear import errors.",
      "Kept Settings sections in the URL without reloading the page when tabs change.",
      "Refined the Blocked users back control and animated the Home changelog at post-feed width.",
    ],
  },
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
