# Broadcast layout (development branch)

Keep v0.1.2 as a fallback. This feature is experimental and not yet released.

1. Select the dedicated Stream Observer account in module settings.
2. Keep Monk's Screen and Vision tracking off.
3. Open Broadcast layout editor from the GM settings.
4. Choose the same 16:9 overlay image used in OBS. The reference is local to the editor and not saved or uploaded.
5. Select Camera, Artwork and journals, or Chat, then drag and resize its rectangle. Adjust reference opacity as desired.
6. Save layout, enable broadcast layout, and refresh the observer. The layout is stored per world as normalized percentages.
7. Test the camera, shared portrait and landscape artwork, journal scrolling, chat messages, and ten-second auto-close.
8. Confirm the GM and another regular player retain their usual UI.
9. Disable broadcast layout and refresh to recover normal observer positioning.

Known limitations: The editor assumes the observer viewport corresponds to the full 16:9 OBS reference. Cropped or transformed sources require a matching reference image. Popout and chat selectors, ApplicationV2 menu registration, and camera offset behavior require Foundry v14 runtime validation. Monk's own layout overrides may compete with these rules. The editor does not currently persist the reference image, manage initiative or dice regions, or change vision.
