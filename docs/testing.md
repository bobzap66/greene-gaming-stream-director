# Prototype test plan

This is untested in Foundry v14. No release or install manifest URL yet.
1. Install source locally in a development world. Enable module.
2. Set Observer user ID to the dedicated non-GM account ID (GM console: game.users.map(u => ({name:u.name,id:u.id}))).
3. Ensure no other module is simultaneously directing the designated observer camera.
4. Enable spectator camera and refresh observer.
5. Test grouped party, isolated scout, evenly split party, combat start/end, movement, hidden tokens, scene changes, and ordinary player/GM camera independence.
6. Verify no camera movement on other clients and no changes to actor permissions.
7. Disable the Stream Director camera if problems occur.

Known limitations: relies on native token visibility; enemies outside current vision are excluded. No expanded vision, safe area offsets, manual override, or release packaging yet. Clustering uses connected components, so a chain of nearby tokens can span a large area. Camera API, visibility timing and scene association require runtime validation.


## v0.4.9.1 quality-of-life regression checks

- Enable Broadcast presentation and automatic Player Configuration dismissal; reload the designated observer with no assigned character. The native Player Configuration window should close automatically.
- Repeat in Tabletop presentation, with its independently enabled dismissal setting.
- Disable dismissal and reload: native behavior should remain unchanged. With presentation disabled, no dismissal should occur.
- In observer maintenance mode (Alt+Shift+U), manually open Player Configuration and confirm it remains open. Exit maintenance and verify automatic dismissal resumes.
- Confirm GM and ordinary player configuration windows remain unaffected.
- Open Integration settings: verify separate GM, observer and shared sections, portrait rows, selection count, Select all and Clear all, and Select active party where available. Bulk changes must not persist until Save settings.
- Confirm existing approvals survive opening and saving. Observer permission warnings appear only when observer integration and observer roster restriction are enabled.
- Run the existing GM and observer snapshot tests and check that Reactive Portraits still receives live HP and initiative without re-pairing the extension.

## v0.5.0 portable settings

- Open Setup & portable presets in GM settings; verify observer setup and diagnostics, without writing any setting on open.
- Export current settings, select Hybrid and review changes without applying. Verify cancel/close preserves current settings.
- Apply Hybrid, then import the exported backup and apply. Confirm layout regions, presentation and camera preferences restore.
- Save a named custom preset, reopen the panel, select it, export it and delete it. Import its JSON in another world and verify observer assignment, actor approvals, integration opt-ins, physical width and client calibration remain unchanged.
- Reject invalid JSON, unknown keys, unsupported versions, invalid numeric values and out-of-bounds regions without writes.
- Apply Physical Tabletop only off-stream; verify camera lock and existing calibration are not overwritten. Use the observer's ruler before placing miniatures.
- Verify Reactive Portraits pairing and combat indicators still work after a preset change and reload.

## v0.5.0.1 configuration panel layout

- Select a matching preset: the preview should show a readable no-change message and Apply should be disabled.
- Select a different camera style: the preview should show Setting, Current and Proposed in readable columns.
- Import a substantially different portable backup: verify long previews scroll internally without shrinking, and region values wrap correctly.
- Resize the settings window vertically and horizontally; verify the outer panel scrolls, controls remain accessible and compact section headings remain readable.
- Verify custom preset save/delete, export and import controls, diagnostic refresh and applying a reviewed change still function.

## v0.5.0.2 preview regression

- Switch repeatedly between Tactical, Cinematic, Hybrid and Tabletop without applying. Verify exactly one comparison grid (or matching-preset message), with rows only for the current selection and scroll position reset.
- Import a different preset, then select a built-in preset. Verify no imported comparison rows remain.
- Apply a preset and verify the preview updates to the matching-preset message.

## v0.6.0 OBS production checks (off-stream first)

- Enable authenticated OBS WebSocket, configure local connection and scene mappings for each campaign; verify passwords are never returned by configuration API.
- Enable GM OBS toolbar; verify current program scene, streaming and recording indicators and no toolbar on observer/player clients.
- Change scenes directly in OBS and verify status updates; manually select each mapped role from Foundry, cancel a confirmation, and confirm no automatic transition occurs.
- Verify controls disabled for an inactive campaign, disconnected OBS, missing mapping and stale bridge. Restart OBS and verify recovery.
- Start combat on mapped intro/break scene and verify a warning without a scene change. Verify opt-in recording warning.
- Check existing HP, initiative, Discord portraits, camera, intro/outro automation and Tabletop mode remain unchanged.

## v0.6.0.1 production polish

- Map Standby and Technical Difficulties separately; verify old scene mappings persist and unmapped roles are hidden.
- Change mappings while GM toolbar is open; verify buttons update without reload. Disconnect OBS and bridge; verify cached mapped controls remain disabled.
- Verify combat warnings and gameplay confirmation from Standby and Technical Difficulties, including collapsed toolbar.
- Drag toolbar, collapse and reload; verify position and collapsed state persist; resize window and verify access. Disable/enable toolbar without browser refresh.
- Assign optional production shortcuts through Configure Controls; verify confirmation, GM-only and inactive-campaign guards.
- In local OBS setup verify status refreshes, incorrect password is diagnosed and unsaved mapping choices survive polling.
