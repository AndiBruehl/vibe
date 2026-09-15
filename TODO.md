# VIBE TODO

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

## BETA 0.1.70

- Video-Upload ermöglichen.
- Nativen Video-Player für die Wiedergabe integrieren.

## VIBE 2.0.0.0.0 — Vollversion 2.0

- Plan and implement an **Impressum**: decide its placement and provide a consistent entry point in the web, Android, and desktop apps.
- Add post sharing only after public post URLs or an explicit sharing/visibility model exists; protected-only posts should not be shared externally.
- Add text-to-speech with an individual voice per user, either through an ElevenLabs connection or an uploaded voice sample.

## BETA 0.1.69.3 (in progress)

- Replace full-page language reloads with a unified translation-key system so every label switches instantly and consistently. ✅ Shared client language state updates immediately; one background server refresh synchronizes server-rendered copy without a browser reload.
- Consolidate mobile headers: shared safe-area spacing and collision-free placement for back, profile settings, and quick-settings controls. ✅
- Add automatic local drafts for message, comment, and support text inputs, with a clear restore/discard experience. ✅

## Planned BETA 0.1.69.x

- **0.1.69.4:** Group activity notifications, add read controls, and improve empty states. ✅
- **0.1.69.5:** Add focused search filters for profiles, posts, tags, and admins. ✅
- **0.1.69.6:** Improve image loading, skeleton states, and layout stability.
- **0.1.69.7:** Accessibility pass for keyboard navigation, contrast, screen-reader labels, and touch targets.
- **0.1.69.8:** Improve quality-of-life feedback, including drafts and recently-seen indicators.
- **0.1.69.9:** Add more profile personalization: an individual color picker for the profile-picture frame, plus carefully scoped visual profile options that remain readable in light and dark themes.
- **0.1.69.10:** Add curated profile-frame presets (solid, gradient, subtle glow) alongside the custom color picker; keep a reset-to-default control and ensure every preset meets contrast rules.
- **0.1.69.11:** Add a profile accent color that can style only personal UI details such as profile links, shoutouts, and section dividers—without changing VIBE’s global safety and action colors.
- **0.1.69.12:** Add optional profile header layouts with a small set of responsive presets, so profiles can feel individual without hiding avatar, name, bio, counts, links, or actions.
- **0.1.69.13:** Add profile background accents using restrained patterns or gradients, with automatic readable text overlays and a reduced-motion-friendly option.
- **0.1.69.14:** Add saved personalization presets: users can name, preview, apply, and reset a complete profile look; include a compact public-profile preview before saving.

### Persistent personalization principles

- Store every visual preference on the Profile record (or a related personalization record), never only in browser storage, so web, Android, and desktop show the same profile.
- Apply safe defaults and a single reset action; validate color contrast and restrict decorative options to vetted presets where free-form styling could hurt readability.

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
