# VIBE Documentation

## Overview

VIBE is a multilingual social network built around profiles, media posts, stories, direct messages, topics, and community moderation. The web application is the primary product. It also exposes mobile API routes for the Android client and is wrapped by an Electron desktop application.

The web application uses Next.js App Router, React, TypeScript, Prisma, and MongoDB. Authentication is handled by NextAuth with Google sign-in and a credentials provider for the native mobile session flow.

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

Members can create posts with images and videos, edit or archive their own posts, add comments and replies, react with likes, bookmark posts into collections, mention profiles, follow profiles, manage follow requests for private accounts, block accounts, and use topic feeds. Video playback uses the browser's native, accessible player. Stories expire automatically and record viewers.

Messaging supports direct and group conversations, reactions, unread status, media and shared-post messages. VIBE Team is represented by a system profile for product-originated messages such as welcome and verification notices.

### Uploads

Upload route handlers create signed upload URLs through the configured Pinata integration. Profile and post uploads normalise filenames to a safe maximum length before storage. Post uploads accept JPG, PNG, WebP, GIF, AVIF, MP4, WebM, and MOV files, with a maximum of four media items per post. Images are capped at 25 MB and videos at 100 MB. Client-facing routes must validate the signed-in user before accepting profile or post media changes.

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

## Data model

Prisma targets MongoDB. The core models are:

- `Profile` and `ProfileAppearancePreset`: identity, public profile data, language/theme, current appearance settings, saved complete profile looks, privacy, roles, verification, restrictions, and social relations.
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
