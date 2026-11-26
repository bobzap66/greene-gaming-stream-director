# Greene Gaming Stream Director

Independent spectator camera for Foundry VTT v14. Designed for a dedicated non-GM observer captured in OBS. System-agnostic; Monk's Common Display is optional.

## Install

Manifest: https://github.com/bobzap66/greene-gaming-stream-director/releases/latest/download/module.json

Enable the module in your world, select your observer account, disable Monk's Screen, Party Screen and Vision tracking, then enable the spectator camera and reload clients. Give the observer Observer access to individual party actors and the Party actor where applicable. No actor permissions are modified by this module.

## v0.4.4 — Standalone broadcast presentation

Enable Broadcast Presentation in module settings after disabling Monk's Common Display interface management. The feature is off by default and runs only for the designated non-GM observer. Separate switches hide navigation, canvas controls, hotbar, players, pause indicator and chat input. The native chat tab is activated and its navigation controls hidden; existing layout settings still position it. The native combat tracker is popped out for active same-scene combat and limited to three already-rendered combatants by default (1–20); module-opened tracker closes when combat ends. Artwork and journal windows on the observer auto-close after ten seconds by default (2–60), with independent switches. Dismissal applies to matching windows opened locally as well as GM-shared ones; it does not close GM windows or modify permissions. Native chat privacy and combat visibility are retained. No director panel controls were added.

Foundry v14 DOM selectors, native popout rendering, journal/image render hooks and integration with layout require live PF2e/SF2e testing. Disable presentation if needed to recover the normal interface. This is not a replacement for Monk's non-broadcast features.

## v0.4.3.1 — Temporary bookmark recall

Bookmarks now restore the preceding camera mode by default after a ten-second hold plus the configured transition duration. Configure 2–60 seconds or enable Hold bookmarks indefinitely. Recalling another bookmark restarts the hold while retaining the original return mode. Manual commands and scene changes cancel pending returns. Mirror resumes live tracking; unavailable followed tokens fall back to Auto. Timing is managed by the recalling GM client and is approximate, not an observer animation acknowledgment. Settings apply on subsequent recalls.

## v0.4.3 — Scene camera bookmarks and action timing

Open the GM director, compose a shot in the GM canvas, enter a name and click Save GM view. Each scene stores its own persistent bookmarks in scene flags. Click a saved name to recall it on the configured observer, using its saved transition. The GM camera itself is unchanged. Update replaces a bookmark's position and zoom with the current GM view; the transition selector edits its saved speed; delete removes the saved shot after confirmation. Bookmarks are manual camera overrides and scene changes restore Auto. The observer centers the saved world position in its broadcast safe area and applies the configured maximum zoom; GM and observer viewport dimensions may produce different crops. Fog and ownership are unchanged. Scene flags are not secret storage.

Combat action hold now defaults to six seconds for new settings and supports 1–15 seconds. Continuous same-actor action limit defaults to 30 seconds and offers 10–120 seconds in five-second increments or Unlimited. A finite limit never truncates the initial configured hold. Existing saved action hold values remain unchanged. Unlimited still expires after the normal hold with no new roll. These settings apply to Cinematic and Hybrid. Live validation is required.

## v0.4.2 — Hybrid combat and director macro

Select Hybrid in the GM Camera Director combat style menu. Auto holds the tactical encounter-wide composition during initiative changes, movement and targeting. An eligible public roll switches to cinematic action framing for the configured action hold, then returns to tactical. Follow-up rolls and reactions use the existing bounded action director. Target selection alone does not zoom in; turn-local targeting continues behind the scenes to provide fallback targets for public rolls. Establishing shots, hidden active combatants, manual overrides and observer visibility checks retain priority. Disabling action awareness makes Hybrid behave tactically.

The existing Tactical and Cinematic styles remain available and the default is unchanged. Action hold and cinematic context settings are shared with Cinematic. Live testing is required; remote targeting remains an outstanding test.

The GM panel includes a Create director hotbar macro button. It creates (or reuses) a world script macro named Open Stream Director; drag it from the Macros directory onto the hotbar. This avoids packaging a binary compendium and does not overwrite existing hotbar slots. The public GM-only module API is `game.modules.get("greene-gaming-stream-director")?.api?.openDirector()`. It opens the same panel or brings it forward if already rendered.

## v0.4.1 — Action-aware cinematic combat

Cinematic Auto now optionally retains the visible speaker and structured visible targets of a new public combat roll for 3.2 seconds (adjustable 1–6 seconds). A follow-up roll from the same actor renews the hold, capped at ten seconds from the start of the action. A public roll from another visible combatant can redirect the shot, including an out-of-turn reaction or saving throw. Initiative and targeting continue updating behind the hold. On expiry the normal cinematic shot resumes. Hidden active combatants and the initial establishing shot retain tactical precedence.

Only newly created, public, observer-readable roll messages with an explicit same-scene visible combatant speaker are eligible. Private, blind, whispered, off-scene and hidden-speaker rolls are ignored. Structured PF2e/SF2e token UUID targets are used when available, otherwise the existing same-actor cinematic composition is retained; no HTML parsing, roll outcomes, private data, or inferred target locations are used. A generic public roll with an explicit combatant speaker can also trigger a hold. Non-roll spell/action cards and actual dice/animation completion are not detected in this release.

Action-aware cinematic combat can be disabled independently in module settings. Tactical and manual modes are unaffected; scene changes and combat ending clear the hold. Live testing of message metadata and target resolution in both systems is required. Remote player targeting from v0.4.0 remains untested.

## v0.4.0 — Cinematic combat

In the GM Camera Director (Alt+Shift+D), choose Combat style: Cinematic. Tactical remains the default and preserves the existing encounter-wide framing. Cinematic applies only in Auto mode and only to an active encounter on the observer's scene.

- Start with an approximately two-second tactical establishing shot, then follow the active visible combatant as initiative advances and the combatant moves.
- Newly selected targets from connected owners of the acting actor (or the GM when no connected owner is present) widen the frame. Existing target selections at turn entry are deliberately ignored until retargeted. Target changes settle for at least 400 ms and are paced at least 1.2 seconds apart; polling and ongoing transitions may add delay.
- Target and acting token visibility is checked on the observer. Hidden/unavailable active combatants fall back to the tactical shot. Invisible targets are dropped from shot selection immediately on the next camera update.
- Cinematic combat context setting adds 2.5 grid squares of space per side by default (adjustable from 1 to 6). Existing safe-area fit and zoom limits apply.
- Manual camera modes retain priority. Return to Auto to resume combat direction. Ending combat returns to exploration.

This is initiative- and targeting-driven, not attack-result or animation-aware. It does not change target selections, fog, combat documents or ownership. Live tests must verify remote player and GM target replication in PF2e and SF2e; if targets are unavailable, active-combatant tracking still works. Combat styles are world-specific.

## v0.3.1 — Explored-area Wide Shot

Wide Shot (Alt+Shift+3) now frames the observer's explored fog and current visibility, with a configurable 10% total size margin. Up to 2,000 map samples are cached for at least one second while Wide Shot is active; visible party token bounds are included when sampling yields a usable rectangle. No fog or permissions are changed. The view expands as exploration grows. Sampling is approximate; narrow corridors and irregular shapes may leave dark space in the shot.

Full Scene (Alt+Shift+7) retains the original whole-map establishing shot. Wide Shot uses the whole map when token vision is disabled and falls back to automatic framing when no usable bounds are found (or holds if no automatic targets exist). Existing shortcuts and layouts remain unchanged. Scene transitions still reset to Auto.

The fog sampling and manual framing proof of concept was validated on Rusty Dragon Inn; the integrated feature and current-visibility sampling require live Foundry/OBS validation.

## v0.3.0 — GM Camera Director

Open Game Settings → Stream Director → GM Camera Director, or press Alt+Shift+D. The floating panel directs only the configured observer when the spectator camera is enabled.

- Auto: return to automatic party/combat framing.
- Hold: suspend automatic movement at the observer's current composition.
- Wide shot: fit the scene within the camera region.
- Follow token: select one visible token in the GM view, then follow it. Observer-side visibility is always checked; hidden or unavailable targets suspend movement until visible.
- Focus point: click a canvas location (Escape cancels). Uses the GM's current zoom, capped by the observer's maximum zoom.
- Mirror GM: track the GM camera center and zoom within the observer's camera region, with updates sampled every 400 ms.
- Cut, Smooth and Cinematic select manual transition duration. Auto retains its configured duration.

Alt+Shift+1 through 6 activate the respective modes. Keybindings are editable. Manual commands are GM-written world settings scoped to the designated observer and scene. Scene changes reset to Auto. No vision or ownership permissions are modified. The panel shows observer connection status, not a remote video preview or confirmation of command execution.

Live Foundry testing is required before treating v0.3.0 as stable. v0.2.2 was validated in Pathfinder and Starfinder OBS workflows.

## v0.2.2

Reliability hotfix: combat framing is restricted to eligible combatants on the viewed scene, including scene-less encounters. Encounters elsewhere no longer suppress exploration or Party token switching. Scene teardown and canvas readiness reset camera state; an animation watchdog releases interrupted transitions. Existing layouts and framing mathematics are unchanged. Live cross-scene and OBS validation is required.

## v0.2.1

Responsive safe-area framing reconciles the actual camera position, prioritizes fitting over the legacy minimum zoom, and uses a configurable proportional margin in layout mode. During exploration, moving a visible Party actor token selects it; moving a member of the largest individual cluster selects individual framing. On a fresh scene, individual characters take precedence if present. Active combat always takes precedence. Monk's Party Screen must be disabled.

The layout editor adds encounter tracker and reserved OBS reference regions, numerical controls, and per-element positioning settings. Reserved regions are visual guides only: configure the camera and other regions to avoid them. Existing regions are retained. Chat positioning compensates for interface scale; artwork preserves aspect ratio; journals and encounter tracker use persistent CSS. Live Foundry/OBS regression testing of the integrated release is required.

## v0.2.0

Configurable camera grouping, padding, zoom and transition duration. Experimental optional layout editor with local overlay preview, camera safe area, chat and popout positioning. See [layout setup](docs/broadcast-layout.md). Layout is off by default. Foundry runtime testing is pending for these additions.

## Recovery

Disable the camera and layout settings and reload, or disable the module. Restore Monk's Party tracking if desired. The v0.1.2 release remains available as a tested camera-only fallback. Expanded vision and cinematic controls are not implemented yet.

## Development

Run `npm test` for pure geometry tests. Foundry integration requires a live test world.
