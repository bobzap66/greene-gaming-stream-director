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
