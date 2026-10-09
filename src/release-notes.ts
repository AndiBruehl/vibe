export type ReleaseNote = {
  version: string;
  date: string;
  changes: string[];
};

// Keep newest releases first. This is the single source for the Home changelog.
export const webReleaseNotes: ReleaseNote[] = [
  { version: "0.4.10.4", date: "2026-10-09", changes: ["Quick Settings now plays a reverse exit animation before the panel is removed.", "Auto-close, action-close and outside-click close all use the same animated close path.", "Added regression coverage for the exit animation class and matching reverse motion."] },
  { version: "0.4.10.3", date: "2026-10-09", changes: ["Opening Quick Settings now starts the three-second auto-close timer immediately.", "Manual close clears the pending auto-close timer.", "Added regression coverage for the open-without-selection auto-close path."] },
  { version: "0.4.10.2", date: "2026-10-09", changes: ["Guarded Quick Settings timers and async save callbacks so they cannot update state after navigation or unmount.", "Cleared pending feedback and auto-close timers when Quick Settings unmounts.", "Kept the 0.4.10.1 auto-close behavior while removing the React state-update warning."] },
  { version: "0.4.10.1", date: "2026-10-09", changes: ["Quick Settings now closes after theme or language actions complete, with a three-second fallback timer.", "Opening Settings or Support closes the orb before navigation so returning to the previous page keeps it closed.", "Route changes clear any pending Quick Settings auto-close timer and reset the panel to closed."] },
  { version: "0.4.11", date: "2026-10-09", changes: ["Added a production signing decision record for Android and Windows native artifacts.", "Defined the beta/debug signing boundary and release gates before any production-signed native release.", "Added regression coverage so the signing decision keeps private-key, GitGuardian and device-migration evidence requirements visible."] },
  { version: "0.4.10", date: "2026-10-09", changes: ["Added an installed APK/EXE update-path acceptance checklist.", "The checklist covers update discovery, checksum and size evidence, integrity mismatch recovery, retry behavior and browser fallback.", "Added regression coverage so the acceptance checklist keeps the required Android and Windows scenarios visible."] },
  { version: "0.4.9", date: "2026-10-09", changes: ["Prepared Android and Windows native package metadata for the next rebuilt beta artifacts.", "Android app.json and Gradle now target 0.4.9 with versionCode 95.", "Desktop package metadata now targets 0.4.9 while published release downloads remain pinned to accepted 0.4.1 artifacts until rebuilt."] },
  { version: "0.4.8", date: "2026-10-09", changes: ["The release endpoint now exposes the detached signature envelope beside the native update metadata.", "Android update discovery now requires SHA-256 and byte-size metadata before offering an APK update.", "Desktop update checks reject malformed SHA-256 or byte-size metadata before showing an update prompt."] },
  { version: "0.4.7", date: "2026-10-09", changes: ["Added a detached release-signature envelope format for native update metadata.", "Added Ed25519 signature creation and verification helpers without storing a private signing key in the repository.", "Added regression coverage for valid signatures, tampered manifests and missing signature fields."] },
  { version: "0.4.6", date: "2026-10-09", changes: ["Added a deterministic release-manifest signing payload for APK/EXE metadata.", "The signing payload includes platform, version, URL, SHA-256 and byte size so future detached signatures can cover the exact published artifact metadata.", "Added regression coverage that rejects incomplete release metadata before a signing payload can be produced."] },
  { version: "0.4.5", date: "2026-10-09", changes: ["Clarified Web sign-in and linking notices so cancellation, expiry and conflicts explain that the current account remains unchanged.", "Android login and linking recovery now tells members when to retry, when a session is preserved and when a fresh sign-in attempt is needed.", "Desktop recovery dialogs now state that startup or recovery failures do not change the server-side VIBE account."] },
  { version: "0.4.4", date: "2026-10-09", changes: ["Added SHA-256 and size metadata to the APK/EXE release manifest.", "Release discovery now ignores unknown newer artifacts until matching integrity metadata is committed.", "Android update downloads validate the expected APK size before installation and keep a clear browser-download recovery path."] },
  { version: "0.4.3.1", date: "2026-10-09", changes: ["Added the manual Android and Windows device-authentication acceptance checklist for installed APK/EXE testing.", "Verified production Google and Discord callback origins with the read-only deployment check.", "Native installers remain at 0.4.1; real-device evidence is still required before marking those artifacts accepted."] },
  { version: "0.4.3", date: "2026-10-09", changes: ["Added a device-authentication acceptance matrix for Android and desktop Google/Discord flows.", "Verified automated coverage for callback restore, cancellation, linking return, expired attempts, different provider emails and desktop OAuth recovery.", "Native installers remain at 0.4.1; real device consent, app-restart and network acceptance remain manual release checks."] },
  { version: "0.4.2", date: "2026-10-09", changes: ["Removed the tracked Android debug keystore and hardcoded debug password from the current tree.", "Current APK/EXE artifacts remain debug/beta artifacts; Android tooling generates the local debug key outside the repository.", "Native installers remain at 0.4.1; production signing, migration and device acceptance remain deployment steps."] },
  { version: "0.4.1.1", date: "2026-10-09", changes: ["Post captions render HTTP/HTTPS and www links as clickable links, alongside profile mentions.", "Selecting a mention suggestion now inserts the username into the controlled caption and draft without tagging the profile.", "Mention search handles timeouts, invalid responses and stale requests while preserving the entered text."] },
  { version: "0.4.1", date: "2026-10-08", changes: ["Android supports Google and Discord through the system browser, with explicit account-linking guidance.", "Mobile cancellation and linking results return to the app without replacing the existing account; callbacks validate the pending attempt and the new session.", "Deleted profiles are no longer recreated by the mobile callback. Desktop offline recovery returns to the last VIBE page."] },
  { version: "0.4.0", date: "2026-10-08", changes: ["Rebuilt guest-to-account onboarding from the 0.3.10 protected-flow baseline.", "The Join page explains Google/Discord account creation, linking later in Settings, and the duplicate-account risk before sign-in buttons are enabled.", "Guests can sort public posts by newest, oldest or most liked while protected member routing remains unchanged.", "Fixed Discord callback issuer validation and route login errors back to Join; the root page opens Home.", "Activity lists skip follow records belonging to deleted profiles."] },
  { version: "0.3.10", date: "2026-10-07", changes: ["Completed the 0.3 guest-access audit with regression coverage for detail-page navigation and read-only conversion surfaces.", "Verified public guest routes keep loading without unavailable fallbacks while member-only actions remain blocked.", "Updated documentation and release notes for the finished restricted guest access pass."] },
  { version: "0.3.9", date: "2026-10-07", changes: ["Polished public post and profile detail pages with VIBE-style back links.", "Public text-only posts now get a clearer media fallback on detail pages.", "Public profile details now show the same public-profile context used by the directory and clearer count fallback text."] },
  { version: "0.3.8", date: "2026-10-07", changes: ["Polished the public profile directory cards with clearer public labels, bio fallbacks and stronger Open profile affordances.", "Public profile search now has a clearer search field and result status without exposing private profile data.", "Guest profile directory cards remain read-only and still avoid follow, message, settings or moderation controls."] },
  { version: "0.3.7", date: "2026-10-06", changes: ["Polished public guest feed cards with safe author badges, dates, like counts and optional location links.", "Text-only public posts now have a dedicated fallback tile instead of relying on missing media.", "Public empty-feed feedback now matches the guest browsing card style without exposing member actions."] },
  { version: "0.3.6", date: "2026-10-06", changes: ["Added a shared guest join prompt across public posts, public profiles, profile pages and post details.", "Guest calls-to-action now use one consistent account-entry path without adding member-only controls.", "Guest conversion copy now explains which actions require an account while public reading remains available."] },
  { version: "0.3.5", date: "2026-10-06", changes: ["Added read-only public comments and replies for logged-out visitors on public post detail pages.", "Guest comments use public author fields only and never expose like, reply, report, edit or delete actions.", "Comment loading now fails softly so the public post remains readable if comments are temporarily unavailable."] },
  { version: "0.3.4", date: "2026-10-06", changes: ["Expanded public-access audit tests for guest routes, anonymous write blocking and public data selection.", "Added metadata fail-closed coverage so private, archived or missing public resources return noindex previews.", "Kept public profile and post preview metadata on the same public-only filters as the rendered pages."] },
  { version: "0.3.3", date: "2026-10-06", changes: ["Added public SEO and share previews for guest profile and post pages.", "Public profile previews use safe display names, summaries and avatar images while private profiles remain noindex.", "Public post previews use safe descriptions and first media images while archived or private-author posts remain noindex."] },
  { version: "0.3.2", date: "2026-10-06", changes: ["Polished public post detail pages for logged-out visitors with a stronger author panel, metadata and read-only guidance.", "Public post details now expose safe likes, date and optional location links without member actions.", "Added media and text fallbacks so public post details remain readable when optional content is missing."] },
  { version: "0.3.1", date: "2026-10-06", changes: ["Polished public profile pages for logged-out visitors with safe links, shoutouts, milestones and profile counts.", "Public guest profiles keep personalization while remaining read-only and filtering private shoutout targets.", "Added a clear Join to interact entry point beside public posts without exposing member actions.", "Added count and optional-section fallbacks so public profile headers stay usable during partial data issues."] },
  { version: "0.3.0", date: "2026-10-06", changes: ["Restricted logged-out access to public posts and public profiles only.", "Added a public read-only Profiles directory for guests, filtered to public profile data.", "Guest public profiles now preserve safe profile customization such as layout, header background, colors and avatar frame.", "Admin and Verified status labels are spelled out only on profile headers; feeds, comments, post pages and directories use compact symbols.", "Guest navigation now separates public Profiles from the Profile account-entry path.", "Guests keep a small theme/language orb while member-only settings, posting, commenting, liking, following, messaging and write APIs stay blocked.", "Expanded guest-access regression tests for public directory routing, private-profile filtering and anonymous write protection."] },
  { version: "0.2.4.1", date: "2026-10-05", changes: ["Fixed cancelled Google and Discord linking so it reliably returns to Sign-in methods with the correct cancelled state.", "Made login-method removal use the canonical profile email case-insensitively, so linked-provider cleanup does not silently miss records with different email casing.", "Expanded account-linking regression coverage for cancellation redirects and provider removal."] },
  { version: "0.2.4", date: "2026-10-05", changes: ["Combined linked sign-in methods into one overview with green confirmation checks and connection dates.", "Google and Discord can be unlinked with confirmation; the last available login method has no Remove action and remains protected on the server.", "Cancelling provider linking returns to Sign-in methods.", "Added a dedicated account-linking conflict page and clearer bilingual recovery messages for failed requests.", "Admin account deletion now records a receipt in the same database transaction, without retaining the deleted user's login data."] },
  { version: "0.2.3.1", date: "2026-10-05", changes: ["Fixed complete account deletion cleanup for Google, Discord and password login data.", "Added safer recovery for expired or orphaned provider links.", "Hidden admin notification settings from regular profiles and removed duplicate guest actions.", "Added session revocation after admin deletion."] },
  { version: "0.2.3", date: "2026-10-04", changes: ["Prepared configuration-safe provider hooks for Microsoft, Apple and Discord; these login methods are not active yet.", "Prepared the email/password registration, reset-link and credential security foundation; email login is not active yet.", "Added localized preparation states, expired-link handling and rate-limit utilities for the future login rollout."] },
  { version: "0.2.2", date: "2026-10-04", changes: ["Added read-only guest access to public posts and profiles.", "Guests can choose theme and language in the settings orb but cannot access member tools, private areas or write actions.", "The guest Profile entry now invites visitors to create an account or sign in.", "Added localized guest feedback and fail-closed visibility checks."] },
  { version: "0.2.1", date: "2026-09-29", changes: ["Place searches now offer explicit result selection before automatically saving the chosen location.", "Approximate sharing now rounds every location source and does not retain street addresses.", "Added owner-only post location removal and location update timestamps with a non-live status.", "Location drafts recover after navigation, preserve input on failure, and ignore outdated save responses.", "Added timeout recovery for stalled responses and safe fallbacks for invalid location data."] },
  { version: "0.2", date: "2026-09-29", changes: ["Added safe location autosave, preserved inputs on failure, and separate lookup and storage error messages.", "Added optional location sharing with approximate and more precise privacy choices.", "Added manual location selection by map or coordinates when automatic location is unavailable.", "Integrated interactive OpenStreetMap maps for members and post locations.", "Added the internal VIBE member map for people who explicitly choose to appear.", "Existing posts can now receive an optional Where am I location marker when edited.", "Post locations are clickable and open an OpenStreetMap view.", "Home now shows the current version and release date beside Changelog."] },
  { version: "0.1.86.1", date: "2026-09-28", changes: ["Refined the message edit action with a clearer VIBE button and pencil icon.", "Removed the reversed gradient and made save and cancel actions easier to distinguish."] },
  { version: "0.1.86", date: "2026-09-28", changes: ["Added shared pinned messages to direct and group conversations.", "Pin up to three messages, browse them with arrows, and jump back to the original message.", "Remove one pin at a time without deleting its original message, with safe recovery during temporary storage interruptions.", "Quick settings now move below visible pinned messages so their controls always remain reachable."] },
  { version: "0.1.85", date: "2026-09-28", changes: ["Added private saved messages for direct and group conversations.", "Browse saved messages by conversation, search them, and jump back to the original message.", "Saved entries now clean up safely when a message, conversation, or account is deleted.", "Added resilient saved-message fallbacks, retry feedback, and safe recovery during temporary storage interruptions."] },
  { version: "0.1.84", date: "2026-09-26", changes: ["Added in-chat message search for direct and group conversations without a page reload.", "Navigate between matches and jump to the selected message with a clear VIBE highlight.", "Added localized empty-search and no-result feedback."] },
  { version: "0.1.83.1", date: "2026-09-26", changes: ["Fixed message replies so the quoted-message composer preview clears immediately after a successful send.", "Keeps the reply preview intact if sending fails, so the intended context is not lost."] },
  { version: "0.1.83", date: "2026-09-26", changes: ["Added replies to individual messages with a quoted preview and a jump back to the original message.", "Replies safely show a Deleted message fallback when their original has been removed.", "Added edit history for post text and message correction or deletion controls with resilient feedback."] },
  { version: "0.1.81.1", date: "2026-09-26", changes: ["Fixed Settings navigation on narrow screens: all three tabs now remain fully readable.", "Android now shows only the Android download, and APK updates use a safer install flow with a browser fallback.", "Updated the Windows EXE to the newest release version and published matching Android and Windows download artifacts."] },
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
