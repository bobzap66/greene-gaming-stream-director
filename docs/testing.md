# Prototype test plan

This is untested in Foundry v14. No release or install manifest URL yet.
1. Install source locally in a development world. Enable module.
2. Set Observer user ID to the dedicated non-GM account ID (GM console: game.users.map(u => ({name:u.name,id:u.id}))).
3. Disable Monk's Screen and Vision tracking, retain its UI and sharing features.
4. Enable spectator camera and refresh observer.
5. Test grouped party, isolated scout, evenly split party, combat start/end, movement, hidden tokens, scene changes, and ordinary player/GM camera independence.
6. Verify no camera movement on other clients and no changes to actor permissions.
7. Disable module camera and restore Monk's Party tracking if problems occur.

Known limitations: relies on native token visibility; enemies outside current vision are excluded. No expanded vision, safe area offsets, manual override, or release packaging yet. Clustering uses connected components, so a chain of nearby tokens can span a large area. Camera API, visibility timing and scene association require runtime validation.
