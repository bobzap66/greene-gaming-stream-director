# Greene Gaming Stream Director

Independent spectator camera for Foundry VTT v14. Designed for a dedicated non-GM observer captured in OBS. System-agnostic; Monk's Common Display is optional.

## Install

Manifest: https://github.com/bobzap66/greene-gaming-stream-director/releases/latest/download/module.json

Enable the module in your world, select your observer account, disable Monk's Screen, Party Screen and Vision tracking, then enable the spectator camera and reload clients. Give the observer Observer access to individual party actors and the Party actor where applicable. No actor permissions are modified by this module.

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
