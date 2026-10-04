# VIBE TODO

## BETA 0.2.3 — Google + Discord account linking (local)

- Keep Google as the active login and add Discord as the only additional provider in this rollout. ⏳
- Let a signed-in member explicitly link Discord to the existing Google-created VIBE account from Settings.
- After linking, Google and Discord must resolve to the same VIBE profile, posts, messages and settings; never create a second profile.
- Never merge accounts automatically based only on a matching email address. Reject conflicts and require an authenticated linking flow.
- Handle revoked access, expired link proofs, provider errors and already-linked Discord identities with localized recovery feedback.
- Verify first-login creation, explicit linking, both login paths, duplicate prevention, unlink policy and expired-session behavior.
- Defer Microsoft, Apple and email/password until a later release.
- Production provider credentials and native sign-in integration remain deployment steps.

## BETA 0.2.2 — Read-only guest access

- Allow logged-out visitors to view public profiles and public posts only; preserve privacy and archived-content restrictions.
- Show the existing settings orb for guests with only local theme and language selection; no Help or Settings links. Deny access to Settings and all other member-only areas, including direct URL and API access.
- Guests cannot post, comment, like, follow, send messages, save content, or change any data. Enforce authentication on the server, not only by hiding controls.
- Clicking Profile while logged out opens a localized invitation to create an account and join VIBE, with an option to sign in to an existing account.
- Support English/German, every existing theme and mobile/desktop layouts; provide clear login-required feedback when a session expires.
- Verify guest profile/post viewing, member-only route/API protection, restricted guest controls, and the Profile registration entry point.

Implemented and covered by access regression tests. Native packages remain unchanged for this web release.

## Planned 0.2.3 — Additional sign-in methods

- Keep Google sign-in and add Microsoft, Apple and Discord sign-in.
- Add email/password registration and sign-in, including email verification, secure password storage and password reset.
- Preserve existing accounts and implement explicit, secure account linking; verify web, APK and EXE sign-in flows.

## BETA 0.2.1 — Location reliability

- Choose an explicit place search result, then autosave the selection. ✅
- Apply approximate privacy to addresses, coordinates and GPS consistently. ✅
- Remove post locations without changing post content; stop profile sharing and clear stored location. ✅
- Show last-updated timestamps and clarify that locations are not live. ✅
- Test rapid edits, empty coordinates, delayed responses, offline recovery and draft restoration. ✅
- Web release 0.2.1; published native installers remain 0.2.0.

## BETA 0.1.86.1 — Message edit action polish

- Replace the reversed message-edit gradient with a clearer VIBE edit action. ✅
- Keep save and cancel actions visually distinct and readable on outgoing messages. ✅

## BETA 0.1.86 — Pinned messages

- Let conversation members pin up to three shared messages. ✅
- Show pinned messages in a compact, scrollable chat header with navigation arrows. ✅
- Let members remove one pin at a time without deleting the original message. ✅
- Keep chats usable while pin storage is temporarily unavailable. ✅
- Move the Quick settings orb below visible pinned messages so it never covers pin controls. ✅

## BETA 0.1.85 — Saved messages

- Save a private copy of any accessible message and remove it again from the conversation. ✅
- Show saved messages in a searchable overview grouped by conversation. ✅
- Remove saved records automatically when their original message is deleted. ✅
- Keep chats usable during saved-message storage errors, restore failed save actions, and provide localized retry feedback. ✅

## BETA 0.1.84 — Conversation message search

- Search text messages inside an individual conversation without reloading the page. ✅
- Move through matches and scroll to the selected message with a visible focus state. ✅
- Provide localized empty-search and no-result fallbacks. ✅

## BETA 0.1.83.1 — Reply composer cleanup

- Clear the reply preview after a successful send while retaining it after a send failure. ✅

## BETA 0.1.83 — Message replies

- Reply to a specific message with a quoted preview and jump back to the original. ✅
- Keep replies readable when the original message has been deleted. ✅

## BETA 0.1.83 — Post and message editing

- Keep the previous text version whenever a post is edited, and show it in an expandable edit history. ✅
- Mark edited posts and messages clearly in English and German. ✅
- Let senders edit their own text messages for up to 10 minutes after sending without changing conversation activity. ✅
- Let senders delete their own messages and clear the recipient's derived unread notification. ✅

## Versioning rule

- Never publish a VIBE release whose final version component is `.88`, regardless of its major or minor version (for example `0.1.88`, `0.88`, `1.0.88`, or `2.4.88`).

## BETA 0.1.81.1 — Settings and Android update fixes

- Keep all Settings tabs fully readable on narrow screens. ✅
- Show Android users only the Android download. ✅
- Make APK installation recover safely by opening the browser download if Android cannot launch the installer. ✅
- Publish matching APK and Windows installer artifact names in the release manifest. ✅

## BETA 0.1.81 — Admin user management cards

- Keep User management permanently visible. ✅
- Show every member as a single-column expandable card on mobile and desktop. ✅
- Add localized editing guidance and safe empty search states. ✅

## BETA 0.1.80.3 — Custom badge label tooltip

- Show a custom badge label when its symbol is clicked, matching system badges. ✅

## BETA 0.1.80.2 — Circular custom badge fix

- Keep custom badge symbols perfectly circular on every profile layout. ✅

## BETA 0.1.80.1 — Custom badge and comment feedback fixes

- Keep custom badges visible and manageable in Admin → User management. ✅
- Prevent duplicate custom badges and preserve them during curated-badge updates. ✅
- Replace the long comment spinner with a compact local sending state. ✅

## BETA 0.1.80 — Admin custom badges

- Let protected admins award a custom emoji badge and label to any member. ✅
- Notify recipients through VibeTeam in their chosen language. ✅
- Let members submit custom badge wishes to Support@Vibe. ✅

## BETA 0.3 — Community forums in Messages

- Let members create public forums from Messages.
- Give each forum a topic, member list, and shared real-time conversation.
- Add moderation, reporting, and ownership controls for forum creators and admins.

## BETA 0.1.79.5 — Multilingual custom frame fix

- Keep Custom frame guidance and spacing consistent in German and English. ✅

## BETA 0.1.79.4 — Custom frame upload polish

- Match the custom frame drop target to the standard media upload interaction. ✅
- Improve frame-selection guidance and action prominence. ✅
- Increase the global reading size without changing component layout rules. ✅

## BETA 0.1.79.3 — Delete confirmation and video frame editor polish

- Confirm destructive delete actions in a themed, multilingual VIBE dialog. ✅
- Improve the custom video frame upload and frame-selection controls. ✅

## BETA 0.2 — Optional location sharing

- Manual location fallback and integrated interactive OpenStreetMap for members and post coordinates. ✅

- Let members voluntarily share an approximate or more precise location with VIBE. ✅
- Add an internal map that shows members who have explicitly enabled visibility. ✅
- Provide privacy controls for visibility, precision, and turning location sharing off at any time. ✅
- Let existing posts be updated with an optional “Where am I?” location marker. ✅
- Make post locations clickable and open a map view. ✅
- Show the current release version beside “Changelog” on Home from version 0.2 onwards. ✅

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
