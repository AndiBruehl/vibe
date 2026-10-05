# VIBE Documentation

### Version 0.3 preparation

Version 0.3 starts with restricted guest access as a product boundary. Logged-out visitors may view public profiles and public posts only. All member actions, private routes and write APIs must remain server-protected even when a UI control is hidden. Guest UI should stay small: public browsing, theme and language only, plus a clear account creation or sign-in path from Profile.

Google and Discord remain the active linked providers for this step. Microsoft, Apple and email/password stay planned until the restricted access behavior is stable and covered by regression tests.

### Production verification (0.2.4.2)

The read-only production login deployment check passed on 2026-10-05 for `https://vibe-social-network.vercel.app`: Google and Discord provider callback origins matched the deployed origin, and the anonymous Auth.js session response returned no user. This check does not perform provider consent, create accounts, link/unlink identities or write to MongoDB. Those real OAuth flows still require disposable test accounts.

### Account linking and removal (0.2.4.1)

Linked providers appear together with green confirmation checks and connection dates. Already-linked action buttons are hidden. The last available provider has no Remove button. Cancelling an OAuth linking attempt returns to Sign-in methods; normal sign-in behavior is unchanged. Failed or timed-out removal requests show recovery feedback rather than claiming success.

Settings → Sign-in methods shows provider status and the date it was linked. Google and Discord can be removed explicitly after confirmation. `/api/auth/account` checks the signed-in owner, request origin, rate limit and remaining usable methods. The last configured login method cannot be removed. A shared transactional lock record serializes concurrent removals; transaction conflicts fail closed and can be retried. Linked identities, password checks and pending link proofs use the canonical profile email case-insensitively so cleanup does not depend on provider email casing. Pending link proofs for a removed provider are deleted in the same transaction. Existing sessions remain valid until their normal expiry or profile deletion.

Provider conflicts lead to `/settings/login/conflict`, with bilingual recovery steps and a support link. Failure to load linked methods hides mutation controls. Deletion receipts are saved as `user-delete` admin activity in the deletion transaction, including a random receipt ID and no deleted-user identifiers or credentials.

Run `node scripts/check-login-deployment.cjs https://vibe-social-network.vercel.app` for read-only provider callback-origin and anonymous-session checks. This does not perform OAuth consent or prove database write behavior. Web version is 0.2.4.1; native packages keep their actual artifact version until rebuilt (currently 0.2.0). The UI separately displays the web version and the running native wrapper version.

### Additional sign-in methods

Google and Discord are configuration-driven login methods. Microsoft Entra ID, Apple and email/password remain deferred. The login UI hides unavailable methods. Email/password preparation requires Resend configuration and an HTTPS auth origin; missing delivery configuration returns a safe unavailable state.

Password credentials use scrypt-derived hashes, a minimum length of 12 characters, one-time proofs with a 20-minute expiry, rate limits, origin checks and credential-version invalidation. OAuth identities are separate records. Matching email addresses never auto-link a new provider. Linking starts only from an authenticated Settings page and rejects conflicts or expired proofs. Provider claims must be verified, and Microsoft fallback verification uses a one-time confirmation email.

Preparation errors are localized and intentionally neutral for unknown accounts. Confirmation tokens are sent in URL fragments, removed from browser history before submission and never written to logs. Email delivery timeouts remove pending proofs. Provider callbacks, real email delivery, account linking and native sign-in still need completion. This release contains no provider secrets.

### Read-only guest access (0.2.2)

Anonymous `/home`, `/posts/[id]` and `/profile/[username]` requests are rewritten by the proxy to dedicated read-only guest pages. The authenticated layout stays unchanged. Guest navigation only exposes Home and Profile; Profile opens `/join`. Google registration/sign-in uses Auth.js CSRF validation, while additional providers remain planned for 0.2.3.

Guest queries select public display fields only and require explicit public-profile and non-archived flags. Unknown visibility, private profiles and orphan posts fail closed. Guests have a theme/language-only settings orb and no comment form, likes, follows, bookmarks, message UI or other member controls. Member-only pages redirect to `/join`; anonymous mutations and member APIs return 401, including expired web sessions. Valid mobile bearer sessions and authenticated cron jobs retain their existing authorization paths. Guest responses use private/no-store caching, and storage outages have localized read-only recovery feedback. The guest header uses the VIBE logo. Browser storage failures do not prevent theme or language changes during the current visit.

### Optional location sharing and VIBE map (0.2.1)

Release date: 2026-09-29. Home displays both version and date beside Changelog. Native packages have internal version 0.2.0 (Android versionCode 91).

Autosave is driven by user edits rather than server responses, ignores outdated responses and serializes requests. A failed search or storage request leaves the existing saved location intact. All sources follow the precision setting: precise uses five decimals; approximate uses one decimal and removes the street label. Existing approximate records are also rounded when displayed on the member map. Address searches and tile loading contact OpenStreetMap; this is disclosed in the settings UI. Member and post map views are read-only; only the settings picker offers point selection.

Members can choose a custom position by entering any place name or address, tapping the integrated OpenStreetMap, or entering latitude/longitude. An explicit search returns up to five candidates without publishing. Selecting a result autosaves after a short pause; if geocoding cannot find an address, the message appears directly above the address field and map selection remains available. Temporary geocoder outages also leave map and coordinate fallback available. This works without GPS permission. Coordinate validation and precision fallbacks apply to manual and automatic locations. Leaflet is loaded in the browser; failed map tiles leave coordinate entry available. Profiles at the same position share one marker listing their names.

Location sharing is off by default. Members explicitly choose approximate or more precise sharing in Settings, and the browser requests their location only when they press the sharing action. Approximate positions are rounded before storage; members can stop sharing at any time, which immediately clears their coordinates. The internal `/map` route lists only opted-in, non-system profiles. Existing posts can be edited with an optional post-specific location marker through the "Where am I?" control; the post marker is stored separately from the member's live map visibility. Post location pills link to `/posts/[id]/map`, which renders an OpenStreetMap view when coordinates are available and falls back to an OpenStreetMap search link for text-only locations. The Home changelog header shows the latest release version beginning with this release.

Location drafts are recovered from profile-scoped session storage after navigation without silently publishing them. Maps display the last update in UTC and a non-live label. Owners can remove a post location from its map; the server checks ownership and clears only location fields. Web release 0.2.1 has not changed the published 0.2.0 native artifacts.

## Overview

### Conversation message search (0.1.84)

Each direct or group conversation has a search button in its header. It searches the text of messages already loaded for that conversation without navigating away or reloading the chat. The result control shows the current match number, supports previous/next navigation, and smoothly scrolls the selected message into view with a temporary VIBE highlight.

Empty searches and queries with no matches have separate localized guidance in English and German. Messages without text, including shared-post messages, are safely excluded from matching.

### Saved messages (0.1.85)

Members can privately save any message in a conversation and remove it again from the same control. `MessageBookmark` stores one unique entry for each profile-and-message pair; server actions verify active conversation membership before changing it. The Saved messages page groups entries by conversation, searches message text, sender, and conversation name locally, and links back to the original message.

Deleting a message removes its saved entries first. The conversation-deletion and account-deletion paths apply the same cleanup, so stale saved-message records cannot remain behind. The page has a localized empty state, no-results state, and recovery message with a retry action if saved entries cannot be loaded. A temporary `MessageBookmark` collection failure is isolated from the normal conversation query, so messages remain readable. Failed save or remove actions restore the prior button state and explain the recoverable problem in the member's language.

### Pinned messages (0.1.86)

Every participant can pin up to three messages in a direct or group conversation. The compact, theme-aware pin strip above the chat uses arrows to move through the pinned messages and jumps to the selected original message. Its small trash control removes only that pin; it never deletes the underlying message. When the strip is visible, the Quick settings orb dynamically moves beneath it so all pin controls remain reachable. `ConversationPin` enforces one pin per message in the same conversation, validates membership on every change, and is cleaned up when the message, conversation, or the pinning account is deleted. Pin storage is loaded independently, so a temporary unavailable or not-yet-deployed collection cannot prevent the conversation from opening.

### Message edit action (0.1.86.1)

The message edit control uses a compact pencil action that stays readable on outgoing message gradients without creating a competing reversed gradient. Saving uses a distinct confirmation button, while cancel remains the red X control with no hover background.

### Post and message editing (0.1.83)

When an author changes a post's text, VIBE stores the prior text as a `PostRevision` and marks the post as Edited. The post page presents prior versions in a localized, expandable history. Existing posts without revisions remain unchanged.

Message senders can edit their own text messages for ten minutes after they were sent. The server enforces ownership, conversation membership, the time limit, a non-empty maximum-length text value, and excludes shared-post messages. Successful corrections are marked Edited; the original send time remains intact, and edits do not change conversation activity counters. The local edit control keeps unsaved text visible and provides a retry message when a save fails. Reactions are unframed emoji controls, and direct-message Read/Unread status includes a local `YY-MM-DD HH:MM` timestamp.

Message senders can also delete their own messages after explicit VIBE confirmation. The server verifies ownership and conversation membership, removes message reactions before the message, and revalidates the conversation. Unread-message badges query the remaining messages, so a deleted unread message no longer produces a notification for the other participant.

### Message replies (0.1.83)

Members can reply to a specific message from its reply control. The composer shows the selected sender and preview before sending. Replies store a small preview and source ID, then link back to the original message in the conversation. The server accepts a reply only when its source belongs to the same conversation. If the source is later deleted, dependent replies preserve their preview state and show a localized Deleted message fallback instead of a broken reference.

### Reply composer cleanup (0.1.83.1)

The reply composer clears its selected quote immediately after the message has been saved. A failed send deliberately retains that quote and the entered message so the member can retry without rebuilding the context.

### Pinned profile posts (0.1.73)

Profile owners pin or unpin up to three active posts directly on their post tiles or in the post detail view. Pins are stored in `ProfilePinnedPost`, which joins the profile and post IDs with an explicit display position. Pins render before the ordinary profile grid for users permitted to view that profile. Desktop uses three equal tiles; mobile keeps the first two side-by-side and gives a third tile the full row.

Only the owner sees pin controls, directly on each eligible post. There is no separate post-selection or management list. The pinned tiles themselves provide up/down controls for ordering. Server validation confirms an authenticated account, valid unique IDs, the three-item limit, active non-archived posts, and ownership. Direct pin/unpin operations validate the same conditions and close position gaps after removal. Missing or stale posts are excluded at render time, and deleting a post removes its pin records. Pin data failures are isolated from the regular feed so a temporary database issue does not turn the full profile into an error page.

Native update checks read `public/releases/latest.json`. Every platform build must include its versioned artifact in the tracked `android-app/dist/` or `electron-app/dist/` path, and the corresponding manifest entry must point at that exact artifact. This keeps the Web download cards and installed Android/Desktop update checks in agreement.

### Settings and Android update fixes (0.1.81.1)

The three Settings section buttons use short, localized mobile labels and their full labels on wider layouts, so no navigation text is clipped on narrow screens. In the Android app, the WebView identifies itself as Vibe Android and the download card therefore shows only the APK. APK update handling validates the downloaded file and opens Android's package installer; if the installer cannot start, the same APK opens in the browser as a recovery path. The release manifest points both platform entries at matching 0.1.85 artifact names. The Windows EXE and Android APK are rebuilt and verified for each matching native release.

The protected layout treats transient Prisma connection failures as recoverable. Message and activity navigation counters fall back to zero, and a failure while loading or creating the signed-in profile renders a VIBE recovery screen. This avoids exposing an internal connector error while Atlas/DNS connectivity returns. Local development can opt into direct Atlas replica-set hosts with `VIBE_DEV_ATLAS_DIRECT=1` when SRV DNS is unreliable; this changes only the local connection path and never production's managed SRV URL.

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

Custom badge management also lists each assigned custom badge in the corresponding Admin → User management card and allows protected administrators to remove it. Awarding rejects duplicate emoji-and-label pairs for the same member, imposes a safe profile badge limit, and preserves custom entries when a curated badge is changed. Malformed legacy badge values are ignored instead of interrupting badge management.

Custom badge symbols use a dedicated fixed-square control style, so the app-wide minimum button height cannot stretch them into pills on any profile layout.

Custom badge symbols also use the same click-to-reveal label tooltip as curated system badges, with independent state per badge.

### Admin user management cards (0.1.81)

User management is permanently visible in the Admin area. Members are rendered in one single-column list at every viewport width; each member is a native expandable card, so the identity and protected statuses remain visible while moderation and badge controls stay out of the way until that card is opened. The guidance and empty-search state are localized, and existing dark/light theme classes continue to apply to every card surface and control.

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
