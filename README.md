# Greene Gaming Stream Director

Independent spectator camera for Foundry VTT v14. Designed for a dedicated non-GM observer captured in OBS. System-agnostic; Monk's Common Display is optional.

## Install

Manifest: https://github.com/bobzap66/greene-gaming-stream-director/releases/latest/download/module.json

Enable the module in your world, select your observer account, disable Monk's Screen, Party Screen and Vision tracking, then enable the spectator camera and reload clients. Give the observer Observer access to individual party actors and the Party actor where applicable. No actor permissions are modified by this module.

## v0.2.1

Responsive safe-area framing reconciles the actual camera position, prioritizes fitting over the legacy minimum zoom, and uses a configurable proportional margin in layout mode. During exploration, moving a visible Party actor token selects it; moving a member of the largest individual cluster selects individual framing. On a fresh scene, individual characters take precedence if present. Active combat always takes precedence. Monk's Party Screen must be disabled.

The layout editor adds encounter tracker and reserved OBS reference regions, numerical controls, and per-element positioning settings. Reserved regions are visual guides only: configure the camera and other regions to avoid them. Existing regions are retained. Chat positioning compensates for interface scale; artwork preserves aspect ratio; journals and encounter tracker use persistent CSS. Live Foundry/OBS regression testing of the integrated release is required.

## v0.2.0

Configurable camera grouping, padding, zoom and transition duration. Experimental optional layout editor with local overlay preview, camera safe area, chat and popout positioning. See [layout setup](docs/broadcast-layout.md). Layout is off by default. Foundry runtime testing is pending for these additions.

## Recovery

Disable the camera and layout settings and reload, or disable the module. Restore Monk's Party tracking if desired. The v0.1.2 release remains available as a tested camera-only fallback. Expanded vision and cinematic controls are not implemented yet.

## Development

Run `npm test` for pure geometry tests. Foundry integration requires a live test world.
