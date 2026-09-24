# VIBE TODO

## BETA 0.1.79.4 — Custom frame upload polish

- Match the custom frame drop target to the standard media upload interaction. ✅
- Improve frame-selection guidance and action prominence. ✅
- Increase the global reading size without changing component layout rules. ✅

## BETA 0.1.79.3 — Delete confirmation and video frame editor polish

- Confirm destructive delete actions in a themed, multilingual VIBE dialog. ✅
- Improve the custom video frame upload and frame-selection controls. ✅

## BETA 0.2 — Optional location sharing

- Let members voluntarily share an approximate location with VIBE.
- Add an internal map that shows members who have explicitly enabled visibility.
- Provide privacy controls for visibility, precision, and turning location sharing off at any time.

## BETA 0.1.79 — Video posters

- Add optional custom video posters and a three-second automatic preview frame fallback. ✅
- Mark video previews with a clear play icon across VIBE. ✅

## BETA 0.1.79.1 — Frame editor guidance

- Explain the frame-selection workflow directly beside each video preview slider. ✅

## BETA 0.1.79.2 — Composer media layout

- Let one selected image or video use the complete available composer width. ✅
- Keep the two-column layout when two to four media items are selected. ✅

## BETA 0.1.78 — Persistent Settings routes

- Keep the active Settings tab and profile-look section in the URL so refreshes and bookmarks restore the same location. ✅
- Avoid resetting Settings navigation after profile-look actions. ✅

## BETA 0.1.78.1 — Settings and Home polish

- Polish the Blocked users back control and Home changelog width and motion. ✅

## BETA 0.1.78.2 — Profile layout alignment

- Align profile actions and optional profile sections with each header layout on desktop and mobile. ✅

## BETA 0.1.65

- Add reports for profiles, posts, and comments, plus a moderation inbox on the admin page.

## BETA 0.1.64

- Add the ability to block users.
- Add a Settings link to a page listing every blocked user, including an unblock action.

## BETA 0.1.62.5

- Add a list of users who liked each post.

## BETA 0.1.62.4

- Add post drafts with automatic saving in the composer.

## BETA 0.1.62.3

- Add a story viewer list for the story owner.

## BETA 0.1.62.2

- Add private profiles with follow requests.

## BETA 0.1.69.15

  - Enable video uploads and render uploaded videos with the browser's native player. ✅

## BETA 0.1.70

- Publish coordinated Web, Electron, and Android release builds for the video upload and playback work.

## BETA 0.1.69.13.1 — VIBE Games

- Die `/games`-Startseite für eine spätere Sammlung von JavaScript-Minispielen bereitstellen. ✅
- Einen versteckten, ausschließlich auf Desktop verfügbaren Einstieg zu `/games` ergänzen: ohne sichtbaren Button, Hover-Effekt oder Umrandung; nur der Cursor wechselt über der Fläche zu einem X.
- Auf `/games` eine kleine Sammlung von JavaScript-Minispielen als Zeitvertreib einbauen. Die konkreten Spiele werden später festgelegt.

## VIBE 1.0 — Release

- Plan and implement an **Impressum**: decide its placement and provide a consistent entry point in the web, Android, and desktop apps.

## BETA 0.1.77 — Profile look export and import

- Let members export a saved profile look as a shareable link or file and import a compatible look into their own saved looks.
- Define the sharing and validation model first so imported data contains only safe appearance fields and never profile identity, roles, links, or private data.

## BETA 0.1.69.14.6 — Activity notification preferences

- Let members choose whether likes, comments and replies, mentions, follow requests, and admin updates contribute to the activity counter and in-app activity notifications. ✅
- Store the preferences on the profile and filter the web activity status accordingly. ✅
- Extend the Android and desktop clients with the same controls and apply message-notification preferences in a follow-up patch.

## BETA 0.1.69.15 — Pinned profile posts

- Let members choose and order up to three of their own posts as pinned profile posts.
- Render the pins above the regular profile feed: three equal tiles on desktop; on mobile, two tiles in the first row and the third tile at full width below them.
- Keep pin management private to the profile owner and preserve a clear responsive layout for every profile header style.

## BETA 0.1.69.16 — Profile sections and visibility

- Let members choose which optional profile areas are visible: links, shoutouts, topics, highlights, archive, and pinned posts. ✅
- Add a compact Settings preview that shows the resulting public profile structure before saving. ✅
- Keep all existing underlying data intact when a section is hidden so it can be re-enabled later. ✅

## BETA 0.1.69.17 — Profile badges and achievements

- Add an optional, curated profile-badge area for community and achievement badges. ✅
- Keep Admin and Verified as protected system statuses while allowing future badges to be independently awarded, time-limited, or opt-in. ✅
- Give members clear visibility controls for optional badges without allowing custom CSS or arbitrary user-supplied badge markup. ✅

## BETA 0.1.69.18 — Profile milestones

- Award subtle, optional achievement badges for milestones such as a first post, one year on VIBE, a first 100 likes, or story creation.
- Build on the badge model from .17 and let members control whether earned milestones are visible on their profile.
- Keep milestone rules transparent, non-competitive, and independent of protected Admin and Verified statuses.

## VIBE 2.0.0.0.0 — Vollversion 2.0

- Add post sharing only after public post URLs or an explicit sharing/visibility model exists; protected-only posts should not be shared externally.
- Add text-to-speech with an individual voice per user, either through an ElevenLabs connection or an uploaded voice sample.

## BETA 0.1.69.3 (in progress)

- Replace full-page language reloads with a unified translation-key system so every label switches instantly and consistently. ✅ Shared client language state updates immediately; one background server refresh synchronizes server-rendered copy without a browser reload.
- Consolidate mobile headers: shared safe-area spacing and collision-free placement for back, profile settings, and quick-settings controls. ✅
- Add automatic local drafts for message, comment, and support text inputs, with a clear restore/discard experience. ✅

## Planned BETA 0.1.69.x

- **0.1.69.4:** Group activity notifications, add read controls, and improve empty states. ✅
- **0.1.69.5:** Add focused search filters for profiles, posts, tags, and admins. ✅
- **0.1.69.6:** Improve image loading, skeleton states, and layout stability. ✅
- **0.1.69.7:** Accessibility pass for keyboard navigation, contrast, screen-reader labels, and touch targets. ✅
- **0.1.69.8:** Improve quality-of-life feedback, including drafts and recently-seen indicators. ✅
- **0.1.69.9:** Add more profile personalization: an individual color picker for the profile-picture frame, plus carefully scoped visual profile options that remain readable in light and dark themes. ✅
- **0.1.69.10:** Add curated profile-frame presets (solid, gradient, subtle glow) alongside the custom color picker; keep a reset-to-default control and ensure every preset meets contrast rules. ✅
- **0.1.69.11:** Add a profile accent color that can style only personal UI details such as profile links, shoutouts, and section dividers—without changing VIBE’s global safety and action colors. ✅
- **0.1.69.12:** Add optional profile header layouts with a small set of responsive presets, so profiles can feel individual without hiding avatar, name, bio, counts, links, or actions. ✅
- **0.1.69.13:** Add profile header backgrounds: optional responsive image, color, or gradient stored on the profile and applied consistently across devices. ✅
- **0.1.69.14:** Add saved personalization presets: users can name, preview, apply, and reset a complete profile look; include a compact public-profile preview before saving. ✅

### Persistent personalization principles

- Store every visual preference on the Profile record (or a related personalization record), never only in browser storage, so web, Android, and desktop show the same profile.
- Apply safe defaults and a single reset action; validate color contrast and restrict decorative options to vetted presets where free-form styling could hurt readability.

### Interaction and motion principles

- Prefer short, purposeful animations for feedback, opening layers, state changes, and route transitions where they improve orientation or confirm an action.
- Keep motion subtle and consistent across web, Android, and desktop; never use decorative loops behind loaded content.
- Always respect `prefers-reduced-motion`, with immediate non-animated fallbacks for every interaction.

### Further persistent personalization ideas

- **Profile identity:** pronouns, a short status line, and a selectable profile badge style (separate from protected Admin/VIBE Team badges).
- **Avatar presentation:** frame width, frame style, optional halo/glow strength, and an accessible fallback border for high-contrast displays.
- **Profile accent system:** accent color plus a controlled gradient pair; use it for the header, link chips, shoutouts, and profile-specific highlights only.
- **Header atmosphere:** approved background gradient, subtle texture, and a compact/standard header density preference.
- **Content presentation:** a preferred default post-grid density and a profile-specific pinned-post treatment, while keeping viewers in control of their feed settings.
- **Link presentation:** choose compact chips, icon chips, or a simple list for profile links; retain the same URL and accessible label in all styles.
- **Visibility choices:** show or hide individual optional profile areas such as shoutouts, links, topics, and archive tabs without changing the underlying data.
- **Seasonal or achievement decorations:** opt-in, expiry-aware decorations from a curated catalog rather than user-supplied CSS or images.
- **Profile preview:** show a live, device-neutral preview in Settings before saving; persist only confirmed selections and sync them to all clients.

## BETA 0.1.69.3.1

- For story slides that share a post, open a small dismissible pill on a short tap with a clear "View post / Beitrag ansehen" link and an X close control. Keep press-and-hold exclusively for pausing the story. ✅
