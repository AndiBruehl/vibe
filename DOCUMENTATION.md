# VIBE Documentation

## Overview

### Pinned profile posts (0.1.73)

Profile owners pin or unpin up to three active posts directly on their post tiles or in the post detail view. Pins are stored in `ProfilePinnedPost`, which joins the profile and post IDs with an explicit display position. Pins render before the ordinary profile grid for users permitted to view that profile. Desktop uses three equal tiles; mobile keeps the first two side-by-side and gives a third tile the full row.

Only the owner sees pin controls, directly on each eligible post. There is no separate post-selection or management list. The pinned tiles themselves provide up/down controls for ordering. Server validation confirms an authenticated account, valid unique IDs, the three-item limit, active non-archived posts, and ownership. Direct pin/unpin operations validate the same conditions and close position gaps after removal. Missing or stale posts are excluded at render time, and deleting a post removes its pin records. Pin data failures are isolated from the regular feed so a temporary database issue does not turn the full profile into an error page.

Native update checks read `public/releases/latest.json`. Every native release must include the versioned APK and Windows installer in their tracked `android-app/dist/` and `electron-app/dist/` paths, then point this manifest at exactly those artifacts. This keeps the Web download cards and installed Android/Desktop update checks in agreement.

The protected layout treats transient Prisma connection failures as recoverable. Message and activity navigation counters fall back to zero, and a failure while loading or creating the signed-in profile renders a VIBE recovery screen. This avoids exposing an internal connector error while Atlas/DNS connectivity returns.

### Profile section visibility (0.1.74)

Members control links, shoutouts, pinned posts, highlights, topics, and archive navigation from the Profile visibility card in Settings. Each switch saves immediately and the visitor preview updates at once. These fields live on `Profile` as `showProfileLinks`, `showProfileShoutouts`, `showPinnedPosts`, `showProfileHighlights`, `showProfileTopics`, and `showProfileArchive`.

The setting only affects rendering. It never deletes links, shoutouts, pins, posts, or archive data. An omitted field on a legacy MongoDB document is interpreted as visible, so shipping the feature does not unexpectedly hide profile content. The public username route enforces links, shoutouts, and pins; the owner's profile route also applies the optional profile tabs.

### Curated profile badges (0.1.75)

Curated badges are defined in `src/profile-badges.ts`, not created by members. The initial catalog is Early Member, Community Star, and Creator. Admins assign or remove them in User management. A profile stores all awards in `profileBadges` and personal public-display choices in `hiddenProfileBadges`.

`AdminBadge` renders the protected Admin and Verified statuses together with every assigned, non-hidden curated badge. The same component is used in profile headers, directory results, posts, comments, and feed cards. Badge changes are audited as `profile-badge` activity. A member may hide a badge but cannot create, alter, or award one.

Badge readers treat missing or malformed legacy arrays as empty. The Settings visibility control restores the prior local state and shows a localized retry message if its server action fails.

### Admin custom badges (0.1.80)

Only the protected administrators Anna and Violett can award custom profile badges in Admin → User management. The admin chooses an emoji with the shared VIBE emoji picker and supplies a short badge label. The server validates the actor, target, emoji, label, and legacy badge array before adding a uniquely identified custom badge without modifying curated awards.

Recipients receive a VibeTeam direct message in their profile language. It names the awarding admin and includes the badge emoji and label. Delivery runs after the award is saved so the admin interface stays responsive; a failed first delivery is retried once and does not roll back the badge. Members can send a badge wish to Support@Vibe from the Support page, where the request enters the normal support-ticket workflow.

### Profile milestones (0.1.76)

Milestones are stored on each `Profile` in `milestoneBadges`, with optional member visibility choices in `hiddenMilestoneBadges`. The earned catalog currently includes First post, First story, 100 likes, and One year on VIBE. `src/profile-milestones.ts` derives progress from posts, stories, likes, and the profile age, and merges achievements without removing previously earned milestones.

Both the signed-in profile route and the public username route refresh milestone progress. Public-profile refreshes are guarded so a temporary Prisma or MongoDB failure cannot make the profile page fail; the last stored milestone snapshot remains usable. Missing or malformed legacy arrays are treated as empty by the display component. The `ProfileMilestones` component receives the profile layout and aligns its heading and badges consistently: Compact is left aligned, Spotlight is centered, and Standard follows the header's text alignment.

### Profile look JSON interchange (0.1.77)

Saved profile looks can be exported as an open JSON document using `format: "vibe-profile-look"` and `version: 1`. Each document contains only a preset name and appearance fields: avatar-frame colors and direction, profile accent, header layout, header background settings, and header text color. The Settings import control accepts `.json` files up to 100 KB, validates the envelope locally, and creates the imported preset through the existing authenticated appearance-preset endpoint.

The server remains the authority for every imported field. It normalizes colors, layouts, frame directions, background modes, and image URLs and ignores arbitrary extra keys. The preset limit, ownership, and duplicate-name handling are the same as when a member creates a look normally. Exports never include profile identity, contact links, biography text, roles, badges, or other private account data.

The import UI reports the actual recoverable cause in the member's language: malformed JSON, incompatible VIBE file envelope, empty or oversized file, saved-look limit, or a temporary import failure. This avoids presenting an import problem as a generic settings-save error.

### Persistent Settings routes (0.1.78)

Settings state is represented by query parameters rather than temporary client-only tabs. `/settings?tab=profile`, `/settings?tab=account`, `/settings?tab=appearance&section=general`, `/settings?tab=appearance&section=background`, `/settings?tab=appearance&section=layout`, and `/settings?tab=appearance&section=avatar` open their corresponding areas after a refresh or direct navigation. Tab changes use the browser History API, so the address changes without triggering a route navigation or full Settings reload.

Appearance apply, reset, and restore actions retain their local state after successful server updates rather than refreshing the full Settings route. This prevents users from being returned to the default Profile tab after an action while preserving the server as the source of truth.

The Blocked users screen keeps its back control at the left page edge and uses the shared minimal back-arrow treatment without a hover background or border. On Home, the changelog uses the same maximum width as the post feed and expands through a client-side height and opacity transition.

### Profile layout alignment (0.1.78.2)

Profile header actions and optional sections follow one layout contract on both the owner and public-profile routes. Compact is left aligned. Spotlight centers actions, support and admin controls, links, shoutouts, and milestones at every breakpoint. Standard public profiles use centered mobile content and left-aligned desktop content; when Standard uses a header background, content stays left aligned at every breakpoint. The milestone component supports this same responsive alignment behavior.

### Video posters (0.1.79)

Posts store an optional `videoPosters` array aligned with `images` and `mediaTypes`. The composer lets members upload an image poster or select a frame with a time slider for each video, validates it with the existing image rules, and keeps poster values aligned when media are moved or removed. Frame export creates a JPEG from the loaded video and uses the normal authenticated upload path. If browser or source restrictions prevent exporting a frame, the composer preserves the video and directs the member to choose a custom poster image instead. The post action validates every optional poster URL server-side, while legacy posts receive empty poster entries without breaking rendering.

Paused video previews use a small play marker in their upper-left corner. Admin user management keeps Admin and Verified status beside the member name; curated profile badges have their own Award/Remove control list and are shown only on the member's profile.

The video frame editor includes an inline, plain-language explanation: move the slider to choose what people see before playback, then save that exact frame with the confirmation button.

The post composer uses its full media width for a single selected image or video. Two to four selected media items use the compact grid so their ordering controls remain practical.

Delete controls are intercepted by a shared client-side VIBE confirmation dialog. The dialog follows the active language and theme and requires an explicit destructive confirmation before the original form submission or client-side deletion continues.

Video preview images are described as custom frames in member-facing UI. The composer provides a large drag-and-drop target for a custom frame and keeps the source-frame action below the slider, including when all four post media slots are already in use.

The custom-frame target follows the main media-upload interaction and keeps its hover and drag target full-width. VIBE uses an 18px global base type size while retaining component-relative text sizes.

`VideoMedia` is the shared preview renderer. It prefers an uploaded poster. Without one, it seeks to second three after metadata loads for videos at least five seconds long, or the midpoint of a shorter video. Playback begins from the start when the viewer presses play. Feed, detail, topic, browse, search, carousel, and shared-message video previews use this component and show a play marker while paused.

Curated badges are profile-only. `AdminBadge` renders them only when an actual profile header explicitly requests `showCurated`; comments, posts, search, directories, and admin user rows continue to show only protected Admin and Verified statuses.

### Settings and Home polish (0.1.78.1)

The shared `BackNavigationLink` intentionally has no hover surface or outline; only its text color and label opacity respond to interaction. The Blocked users page separates this left-edge navigation control from its centered content column. `HomeChangelog` is a client component so its expanded state can animate smoothly while staying limited to the same `max-w-5xl` width as `HomePosts`.

### Home changelog

The Home page places a collapsed, English-language Changelog between stories and the feed controls. `src/release-notes.ts` is its single source of truth. New web releases must be added at the top with version, `YYYY-MM-DD` date, and concise English change bullets so the newest changes always appear first.

### Account post drafts (0.1.71)

The Create page provides New post and Drafts tabs in English and German. Drafts are stored in MongoDB's PostDraft collection, scoped to the authenticated account email. They preserve up to four media URLs and their types, description, five topics, and ten tagged profile IDs. Incomplete drafts can be saved without media. The list shows a cover preview and modification time; users can reopen, update, or delete their drafts across devices. Publishing creates the post and removes its draft in the same transaction. Failed saves keep editor contents. Switching tabs keeps the editor mounted.

Explicit account draft saving replaces local browser autosaving on the Create page. Unsaved editor changes must be saved before leaving or opening another draft. Generate the Prisma client after changing the schema; no existing documents need migration.

If the draft collection or tagged-profile lookup is temporarily unavailable, Create remains usable and shows a localized retry notice instead of failing the full page. Draft deletion verifies that the requested account-owned record was actually removed. Invalid legacy arrays and dates fall back to empty media/topic data and an unknown modification time.

VIBE is a multilingual social network built around profiles, media posts, stories, direct messages, topics, and community moderation. The web application is the primary product. It also exposes mobile API routes for the Android client and is wrapped by an Electron desktop application.

The web application uses Next.js App Router, React, TypeScript, Prisma, and MongoDB. Authentication is handled by NextAuth with Google sign-in and a credentials provider for the native mobile session flow.

The Web version label includes its release date in `YYYY-MM-DD` format. Desktop and Android version labels remain version-only so installed builds retain their native release identity.

## Repository layout

| Path | Purpose |
| --- | --- |
| `src/app/` | Next.js pages, layouts, route handlers, client components, and global styling. |
| `src/actions.ts` | Authenticated server actions for social, moderation, poll, and settings mutations. |
| `src/auth.ts` | NextAuth configuration and first-profile creation. |
| `src/db.ts` | Shared Prisma client lifecycle. |
| `src/admin.ts` | Admin and super-admin checks. |
| `src/messages.ts` | Conversation and unread-message helpers. |
| `src/profile-personalization.ts` | Profile header and appearance validation and defaults. |
| `prisma/schema.prisma` | MongoDB data model. |
| `public/` | Public assets, release metadata, and the secret cursor asset. |
| `electron-app/` | Electron desktop wrapper and packaging checks. |
| `android-app/` | Expo/React Native Android application. |
| `scripts/` | Maintenance and data-inspection scripts. |
| `docs/releases/` | English notes for each released version. |

## Web application

### Routes

Protected product routes live under `src/app/(protected)/(routes)/`. They cover Home, Activity, Browse, Create, Messages, Profiles, Profile, Search, Settings, Support, Topics, Games, and the Admin area. The protected layout supplies shared navigation and status information.

The root application also contains the localized `not-found` page, global error handling, public API routes, and the profile-personalization endpoints. The `/games` route is a placeholder for the future JavaScript mini-game collection and is reached through a hidden discovery interaction.

### Profiles and appearance

Each profile stores its own appearance preference in MongoDB so the same look is rendered on web, Android, and desktop. The profile header supports standard, compact, and spotlight layouts. Its background can be disabled, set to an uploaded image, or set to a solid color/gradient. Profile image frames, link accents, saved frame presets, and text color are independently configurable. A member can also save up to six named complete profile looks and later preview, apply, replace, delete, or reset them.

`ProfileAvatar`, `AdminBadge`, profile links, shoutouts, post grids, connection lists, and profile action controls are shared components used by profile and feed surfaces.

### Localization and themes

The product supports German and English. Client language state is maintained by the language runtime and shared language hooks; server-rendered content is refreshed in the background after a language change. Theme preference is persisted on the profile and applied by the theme runtime.

### Activity notification preferences

Profiles store individual activity-notification preferences for likes, comments and replies, mentions, follow requests, and admin updates. The Activity counter and in-app activity notification polling use these preferences before calculating their totals and latest activity timestamp. For existing MongoDB profiles that predate these fields, a missing value is treated as enabled until the member changes it. Opening the Activity page marks the current activity inbox as read and immediately clears its navigation badge.

### Social features

Members can create posts with images and videos, edit or archive their own posts, add comments and replies, react with likes, bookmark posts into collections, mention profiles, follow profiles, manage follow requests for private accounts, block accounts, and use topic feeds. Video playback uses the browser's native, accessible player. Stories expire automatically and record viewers. Video posts shared into stories retain their media type, autoplay muted, provide a mute/unmute control, and pause while the pointer is held. Topic feeds use the same media-type metadata and native player, so video posts remain playable there as well.

Messaging supports direct and group conversations, reactions, unread status, media and shared-post messages. VIBE Team is represented by a system profile for product-originated messages such as welcome and verification notices.

### Uploads

Upload route handlers create signed upload URLs through the configured Pinata integration. Profile and post uploads normalise filenames to a safe maximum length before storage. Profile settings support drag-and-drop, click, and keyboard avatar selection. Post uploads accept JPG, PNG, WebP, GIF, AVIF, MP4, WebM, and MOV files, with a maximum of four media items per post. Images are capped at 25 MB and videos at 100 MB. Client-facing routes must validate the signed-in user before accepting profile or post media changes.

## Administration and moderation

Administrative routes require `isVibeAdmin`. The root administrator is identified by `isSuperAdmin`. Server actions enforce these checks before applying moderation or account changes.

The Admin area includes:

- User management, including deletion, admin status, verification status, and account restrictions.
- Content reports and moderation controls.
- Support-ticket assignment, replies, closure, and cleanup.
- Internal admin notes and votes.
- Poll creation, activation, deactivation, deletion, and result review.
- Admin preview and profile filters.

Verification is presentation status only; it does not provide admin capabilities. `AdminBadge` is intentionally composable so Admin, Verified, and future statuses can appear together.

## Polls

`Poll`, `PollOption`, and `PollVote` are Prisma models. An administrator creates a draft poll with one question and two to six unique options. Activating a poll deactivates any other live poll and starts a 72-hour window. A member has one vote per poll and may change it while the poll remains live.

Home queries the active, unexpired poll and renders it directly above the feed. When there is no active poll, nothing is rendered in that location. Expired and offline polls remain visible in the Admin area for results and auditability.
Poll selection uses optimistic client feedback so the selected answer and percentages update immediately while the authenticated server action persists the vote; failed requests restore the previous state.

## Data model

Prisma targets MongoDB. The core models are:

- `Profile`, `ProfileAppearancePreset`, and `ProfilePinnedPost`: identity, public profile data, language/theme, current appearance settings, saved complete profile looks, ordered profile pins, privacy, roles, verification, restrictions, and social relations.
- `Post`, `Comment`, `PostLike`, `CommentLike`, and `PostBookmark`: published content and interactions. A Post stores parallel `images` and `mediaTypes` arrays so each uploaded URL is rendered as an image or video without relying on its URL extension.
- `Story`, `StorySlide`, and `StoryView`: temporary story content and viewer tracking.
- `Conversation`, `ConversationParticipant`, `Message`, and `MessageReaction`: direct and group messaging.
- `Follow`, `FollowRequest`, and `Block`: relationship state and privacy controls.
- `Topic`, `PostTopic`, and `TopicFollow`: discoverability and topic feeds.
- `Report`, `SupportTicket`, `AdminNote`, and `Restriction`: moderation and support workflows.
- `Poll`, `PollOption`, and `PollVote`: timed community polls.

Object IDs are stored as MongoDB ObjectIds in relations. Unique compound indexes protect one-to-one interaction constraints such as one poll vote per profile or one follow relationship per pair.

## Authentication and API surface

Google OAuth creates a profile on first sign-in and ensures older profiles receive a username. The mobile client uses a short-lived signed mobile token through the credentials provider and dedicated `/api/mobile/*` routes.

The API includes mobile data endpoints, conversation operations, profile customization updates, topics, stories, release metadata, uploads, unread-message status, and scheduled story cleanup. Keep route authorization close to each handler; server actions should never trust a client-supplied email or role.

The shared version display keeps release flair scoped to the Web version. Desktop and Android version labels remain neutral so platform versions are easy to scan.

## Native applications

### Desktop

`electron-app/` contains the Electron shell, runtime behavior, connection-error page, packaging configuration, and Windows package verification scripts. Its native version is managed separately from the web version.

### Android

`android-app/` is an Expo/React Native client. It uses the mobile API, secure session storage, Google authentication, adaptive layouts, and native screens for Home, activity, profiles, messages, create, search, and account editing. Its version and generated APK are managed separately from the web release.

`public/releases/latest.json` is the web-served update manifest for native download links. Change it only after matching native binaries have been built and are available.

## Local development

### Prerequisites

- Node.js and npm
- A MongoDB database reachable through `DATABASE_URL`
- Google OAuth credentials for browser authentication
- Pinata credentials when testing uploads

### Configuration

Copy `.env.example` to `.env.local` and populate the required values. Never commit secrets. The current environment keys are:

```text
AUTH_SECRET
DATABASE_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_ANDROID_CLIENT_ID
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
NEXT_PUBLIC_GATEWAY_URL
PINATA_JWT
```

### Commands

```bash
npm install
npm run dev
./node_modules/.bin/prisma generate
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint src
```

Use `localhost:3000` for browser development. A local address such as `0.0.0.0` is a binding target, not a browser destination or a NextAuth callback URL.

For schema changes, generate the Prisma client and apply the approved MongoDB schema update before testing the affected route. Do not manually edit generated Prisma client files.

## Quality and reliability

- Use server-side authorization for every mutation and protected query.
- Preserve profile-level appearance preferences in the database rather than browser-only storage.
- Validate untrusted form input for length, enum values, ownership, and relational integrity.
- Prefer graceful empty states and error states for remote data in the native app.
- Keep changes responsive for desktop and mobile breakpoints.
- Run focused TypeScript and ESLint checks for the files changed, then broaden checks when the change warrants it.

## Release process

1. Update the web version in `package.json`, `package-lock.json`, and `src/app/components/AppVersion.tsx`.
2. Create `docs/releases/<version>.md` in English with the user-visible functionality, behavior changes, and validation.
3. Update this document when architecture, operations, routes, or development workflow change.
4. Run the relevant checks.
5. Commit the release documentation and code locally.
6. Push only after explicit approval from the project owner.

Native releases additionally require version updates in their own projects, successful artifact builds, verification, and an update to `public/releases/latest.json`.
