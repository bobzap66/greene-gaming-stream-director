# Greene Gaming Stream Director

Independent spectator camera for Foundry VTT v14. Designed for a dedicated non-GM observer captured in OBS. System-agnostic and standalone; no other modules are required.

## Install

Manifest: https://github.com/bobzap66/greene-gaming-stream-director/releases/latest/download/module.json

Enable the module in your world, select your observer account, then enable the spectator camera and reload clients. Give the observer Observer access to individual party actors and the Party actor where applicable. No actor permissions are modified by this module.

Compatibility: avoid simultaneously using multiple modules to control the same observer camera or interface. Other modules can remain enabled for unrelated features.

## Keyboard shortcuts

All shortcuts below are defaults and can be customized in Foundry's Configure Controls (keybindings) menu.

### GM controls

| Shortcut | Action |
| --- | --- |
| `Alt+Shift+D` | Open or bring forward the Stream Director panel. |
| `Alt+Shift+1` | Auto — resume automatic camera direction. |
| `Alt+Shift+2` | Hold — suspend automatic camera movement. |
| `Alt+Shift+3` | Wide Shot — frame explored and currently visible areas. |
| `Alt+Shift+4` | Follow Token — select one token first; observer visibility is required. |
| `Alt+Shift+5` | Focus Point — then click a location on the canvas. |
| `Alt+Shift+6` | Mirror GM — follow the GM's camera position and zoom. |
| `Alt+Shift+7` | Full Scene — frame the entire map. |
| `Alt+Shift+S` | Share focused artwork or a single visible journal page with the configured recipients. |
| `Alt+Shift+A` | Share selected token actor artwork. |
| `Alt+Shift+X` | Close artwork and journal windows on the designated observer only. |
| `Alt+Shift+V` | Toggle the draggable tabletop viewport outline on the GM canvas. |
| `Escape` | Cancel a pending Focus Point selection (fixed, not a configurable keybinding). |

### Observer controls

| Shortcut | Action |
| --- | --- |
| `Alt+Shift+C` | Open tabletop ruler calibration on the designated observer (Tabletop mode, camera enabled). |
| `Alt+Shift+U` | Toggle maintenance mode: temporarily restore the normal Foundry interface and sidebar, then press again to restore broadcast presentation and layout. |

The maintenance shortcut works on the designated observer when presentation or layout is enabled. Camera direction continues running, world settings are unchanged, and refreshing the observer exits maintenance mode. Use it to access Game Settings without asking the GM to disable broadcast presentation.

**Hotbar alternative:** Click **Create director hotbar macro** in the GM Director panel, then drag **Open Stream Director** from the Macros directory to your preferred hotbar slot.

## v0.5.0 — Setup and portable presets

Open **Setup & portable presets** in Stream Director module settings. Choose a dedicated non-GM observer and enable the spectator camera separately. Built-in Tactical, Cinematic, Hybrid and Physical Tabletop presets change only their listed preferences; existing geometry and other tuning remain intact. Review every proposed change before applying. Save current settings as a named world-local preset, export current or selected preferences to JSON, or import a JSON preset in another world and review before applying.

Portable files contain camera, presentation, percentage layout regions and tabletop grid preferences, not observer IDs, actor approvals, integration opt-ins, sharing destination, live camera commands, scene bookmarks, physical screen width or client display calibration/positions. Import validates format, values and allowlisted keys before writes; unsupported files are rejected. Failed writes attempt rollback and report any rollback failures. Export current settings before large changes if you want a portable backup. Reload clients when indicated. Diagnostics reflect GM-visible settings and connection state, not observer-local display calibration or the actual OBS output.

## v0.4.9.1 — Presentation and integration settings polish

Broadcast and Tabletop presentation each have an independent **Automatically dismiss Player Configuration** option, enabled by default when the corresponding presentation is enabled. Only the designated observer's native UserConfig window is closed; no character assignment or user settings are changed. Alt+Shift+U maintenance mode temporarily permits opening this window normally.

Integration settings group GM, observer and shared preferences separately. The approved character roster displays portrait rows, selection counts, Select all, Clear all and Select active party when the game system exposes compatible active-party members. Observer permission warnings appear only when the observer API is enabled and restricted to the roster. Existing approvals, API contracts and Reactive Portraits pairing are unchanged.

## v0.4.9 — Approved portrait roster

Integration settings optionally restrict the API to an explicitly selected world-actor roster. Select characters, enable roster mode, and grant the designated observer Observer permission. Approved off-scene or unseen characters retain health data; their token ID is null and hidden/off-scene combatants never receive turn indicators. The original visible-token mode remains the default. Camera visibility rules are unchanged.

Reactive Portraits connects to the separate opt-in GM API using its optional Chrome extension and local server. Enable GM portrait integration API and select the roster; the GM API always requires explicit roster approval, regardless of the observer roster-mode switch. The OBS observer can remain exclusively in OBS. The GM API exports world actor HP and non-hidden linked-token PC combat participation from the active encounter, with no scene or token identifiers. Observer permissions are not required for the GM API. See its repository for pairing and setup. No network transport is added to Stream Director itself.

## v0.4.8 — Observer integration API (v1)

Optional read-only, browser-local API for other Foundry modules and future overlay bridges. Enable it under Integration settings; health is independently opt-in. Only the designated non-GM observer exposes snapshots. No external network endpoint, WebSocket server, OBS integration or reactive portrait client is included. No actor permissions are modified.

See [Integration API](docs/integration-api.md) for schema, subscriptions, privacy rules and examples. Existing GM openDirector API remains intact. Ordinary players have no integration timers or snapshot scanning; the observer computes changes on demand or when subscribed, with event coalescing and duplicate suppression. Live PF2e/SF2e validation is required.

## v0.4.7 — Display profiles and tabletop viewport (experimental)

Alt+Shift+C opens observer ruler calibration with named saved profiles, optional Detect monitors (requires a supported browser and permission), and profile selection/deletion. Previously granted monitor permission is reused at login. Profile matching checks CSS screen width, height and device pixel ratio, plus available monitor label; labels are not unique hardware IDs. Without labels, select a matching profile manually if display identity is uncertain. Browser/device-local storage; not guaranteed to transfer between worlds or browsers. Existing single calibration remains a fallback until profiles are saved. No physical size is inferred by the API. Confirm the ruler against the actual display before placing miniatures.

Alt+Shift+V or the GM director button toggles an outline of the connected tabletop observer's viewport on the GM canvas. Drag its label to move, release to send a one-time fixed-scale focus command. Whole-square movement snaps relative to the initial position by default (square grids only); no intermediate movement commands. The outline is advisory, not a video preview. Observer snapshots contain only scene ID, user ID, canvas center, scale and viewport dimensions and travel over the Foundry module socket; ordinary players do not run recurring tasks. The GM must deliberately drag to issue a camera command; the observer still accepts only the existing GM-written world setting. Socket telemetry is not authenticated and must not be trusted for authorization.

Remember tabletop scene positions stores the actual center after deliberate moves locally on the observer and restores it when revisiting scenes. It is enabled by default, independent of Broadcast bookmarks, and does not store scale. Browser storage and current observer account must be retained. Disable the option to stop restoring saved positions. All display and physical-position behavior requires live verification.

Includes standalone wording cleanup from PR #18; no Monk-specific setup requirements.

## v0.4.6.1 — Standalone setup wording

Remove outdated module-specific setup warnings from settings and documentation. Stream Director requires no external modules. General compatibility guidance remains in the README. No runtime behavior changes.

## v0.4.6 — Independent mode settings and sharing

Main settings retain observer, mode and camera enable switches. GM-only category menus organize camera, combat, Broadcast presentation, Broadcast layout, Tabletop physical/layout, Tabletop presentation, bookmarks and sharing. Existing Broadcast values and regions remain unchanged; tabletop presentation copies previously saved Broadcast presentation values once on GM login, preserving existing tabletop chat/combat toggles. Tabletop layout is off by default; enable it and optionally position art/journals, chat and tracker using its separate editor. The tabletop map does not use layout regions for framing. Calibration remains local and unchanged.

Sharing shortcuts use native Foundry v14 APIs. Sharing defaults to the designated connected observer; select All connected players in Sharing settings to broaden recipients. Focus a journal page or an image popout. The currently viewed page is used; if ambiguous, sharing is refused. Explicit sharing displays the selected page even without normal observer permission, without editing ownership. Alt+Shift+X closes matching windows only on the designated observer, including locally opened windows, regardless of automatic dismissal preferences. It does not close windows on regular players. No recurring player-side work added. Live testing required.

## v0.4.5.3 — Native form element hotfix

Foundry v14 journal windows are native HTML forms whose numeric index zero can refer to an internal button. The observer confirmed FORM versus BUTTON in the browser. Preserve native elements before unwrapping legacy jQuery containers in registry discovery, dismissal scheduling, dismissal execution and combat tracker processing. Add a regression test for indexed forms. No changes to role-based performance optimizations, camera or layout settings.

## v0.4.5.2 — Journal registry discovery and client performance

The native Foundry v14 application registry is checked during presentation reconciliation (including the existing one-second heartbeat). Connected parent journal windows receive one dismissal timer regardless of the render-hook timing or rendered flag; embedded pages remain excluded. Native close is used, with an in-flight guard against overlapping close requests. Artwork still uses its render-hook path. Automatic journal dismissal can also catch locally opened journals, not just GM-shared ones. Maintenance cancels pending timers; on resuming, open journals receive a fresh timer. No changes to calibration, layouts, settings categories or camera behavior. Live validation required.

### Client performance

Camera and presentation heartbeats now start only when their observer functionality is active and stop when disabled or reassigned. Layout DOM monitoring is attached only on the active observer with layout enabled, and disconnected during maintenance or when reassigned. Ordinary players retain module registration and lightweight guarded hooks but no recurring Stream Director timers, layout DOM monitoring, or scheduled rendering work. GM director runtime hooks are registered only for the GM. Observer changes are handled through settings updates (reload when Foundry requests it). No formal CPU/RAM benchmarks have been performed.

## v0.4.5.1 — Journal dismissal hotfix

Automatic journal dismissal now targets the parent journal application rather than embedded journal page sheets. Individual page render hooks cannot schedule separate dismissal timers, and the existing application-keyed timer prevents duplicate timers on the parent. The timer revalidates the window before closing it through Foundry's native lifecycle. Artwork dismissal and camera behavior remain unchanged. Applies to Broadcast and Tabletop. Live validation is required with Show to Players on a multi-page journal. Settings categories and separate mode layouts are deferred to a subsequent update.

## v0.4.5 — Tabletop foundation (experimental)

In main module settings select Tabletop observer mode, select your dedicated observer, enable spectator camera and optionally enable broadcast presentation. Reload both clients. On the television, press Alt+Shift+C and adjust the reference square against a ruler until it measures one inch. Save calibration locally in that browser. Alternatively enter the measured horizontal visible screen width (not diagonal) in world settings. The desired physical grid size defaults to one inch. Ruler calibration overrides screen width when display metrics match; changes to resolution or device pixel ratio require recalibration. Gridless scenes retain the current scale. Physical sizing is intended for square grids; other grid geometries are not validated.

Tabletop mode intercepts normal pan and animatePan calls and disables broadcast auto-framing, including combat rolls. GM Focus Point and bookmarks move the display at fixed scale; Follow Token and Mirror GM center once, not continuously. Wide and Full center the map without fitting it. Auto and Hold leave the map stationary. Bookmarks do not automatically return in Tabletop mode. Deliberate moves are immediate cuts. Maintenance mode restores interface access without disabling camera locks. Chat and combat tracker are off by default in Tabletop when presentation is enabled. Broadcast mode retains existing behavior.

The wrapper uses libWrapper when available, otherwise a narrow prototype wrapper. Native Foundry drag, wheel, ping, resize, scene initialization, animation and other module compatibility must be verified on the actual television before placing miniatures. Do not assume all possible direct stage mutations are intercepted. The GM viewbox, whole-grid movement and persisted scene positions are planned for the next release.

## v0.4.4.1 — Observer maintenance and PF2e HUD

Broadcast presentation now hides the PF2e HUD persistent controls by default using its specific DOM root, preserving independent hotbar visibility. No PF2e HUD preferences are modified. Press Alt+Shift+U on the designated observer browser to temporarily suspend presentation and layout styling, allowing ordinary access to Foundry settings. Press it again to restore configured presentation. Camera direction and camera safe-area framing continue unchanged. Maintenance is local and resets on reload; it does not modify world settings or other users. Dismissal timers are canceled during maintenance. Existing windows are not automatically re-timed unless rendered again. Live testing is required.

## v0.4.4 — Standalone broadcast presentation

Enable Broadcast Presentation in module settings. The feature is off by default and runs only for the designated non-GM observer. Separate switches hide navigation, canvas controls, hotbar, players, pause indicator and chat input. The native chat tab is activated and its navigation controls hidden; existing layout settings still position it. The native combat tracker is popped out for active same-scene combat and limited to three already-rendered combatants by default (1–20); module-opened tracker closes when combat ends. Artwork and journal windows on the observer auto-close after ten seconds by default (2–60), with independent switches. Dismissal applies to matching windows opened locally as well as GM-shared ones; it does not close GM windows or modify permissions. Native chat privacy and combat visibility are retained. No director panel controls were added.

Foundry v14 DOM selectors, native popout rendering, journal/image render hooks and integration with layout require live PF2e/SF2e testing. Disable presentation if needed to recover the normal interface. 

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

Responsive safe-area framing reconciles the actual camera position, prioritizes fitting over the legacy minimum zoom, and uses a configurable proportional margin in layout mode. During exploration, moving a visible Party actor token selects it; moving a member of the largest individual cluster selects individual framing. On a fresh scene, individual characters take precedence if present. Active combat always takes precedence.

The layout editor adds encounter tracker and reserved OBS reference regions, numerical controls, and per-element positioning settings. Reserved regions are visual guides only: configure the camera and other regions to avoid them. Existing regions are retained. Chat positioning compensates for interface scale; artwork preserves aspect ratio; journals and encounter tracker use persistent CSS. Live Foundry/OBS regression testing of the integrated release is required.

## v0.2.0

Configurable camera grouping, padding, zoom and transition duration. Experimental optional layout editor with local overlay preview, camera safe area, chat and popout positioning. See [layout setup](docs/broadcast-layout.md). Layout is off by default. Foundry runtime testing is pending for these additions.

## Recovery

For temporary observer UI access, press Alt+Shift+U. For a full rollback, disable presentation, camera and layout settings and reload, or disable the module. The v0.1.2 release remains available as a tested camera-only fallback.

## Development

Run `npm test` for pure geometry tests. Foundry integration requires a live test world.
