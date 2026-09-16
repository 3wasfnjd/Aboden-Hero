# Aboden Hero — عملية منتصف الليل

Play: https://3wasfnjd.github.io/Aboden-Hero/

A side-scrolling action platformer set in a comic-book night city. The user-supplied
poster appears on the title screen and defines the red jacket, copper highlights,
steel-blue shadows and dark outlines. The playable hero is an original procedural
approximation; the poster is not presented as an animated spritesheet.

## Mission 01
- A 6,600-unit route through industrial streets, rooftops and warehouses.
- Armed patrols with a visible aim warning before each projectile.
- Automatic fire while holding the shoot button; unlimited ammunition.
- Short invulnerable dash (0.17 seconds), with a 1.35-second cooldown.
- Four checkpoints, health pickups, collectible energy stars and forgiving jumps.
- A gatekeeper with 24 health, three-projectile volleys and faster attacks below
  half health. Defeating it unlocks the extraction gate and mission results.
- Checkpoints restore health. A failed boss attempt resets its health and clears
  hostile projectiles. Progress lasts for the current run, not a page reload.

## Controls
- Move: arrows or A / D.
- Jump: Up or K; tap for a short jump, hold for a high jump.
- Shoot: J or Space; hold for repeated fire.
- Dash: L or either Shift key; tap again after the cooldown.
- Pause/resume: Escape or the pause button.
- Touch: independent movement, jump, fire and dash pointer buttons.
- Sound: optional synthesized effects; enable with the music-note button.
- Landscape is recommended on phones; portrait remains usable.

## Run / deploy
Serve the repository root over HTTP: `python3 -m http.server 8000`.
No package installation, bundler or CDN is required. GitHub Pages serves the main
branch root through its existing deployment. Versioned module and CSS URLs avoid
mixing cached files between releases.

## Source
- `src/world.js`: level geometry, fixed-step movement, collision, dash timing.
- `src/combat.js`: guard warnings, aiming and hostile projectile simulation.
- `src/art.js`: code-drawn city, temporary red-jacket hero, guards and gatekeeper.
- `src/main.js`: game loop, UI state, input, player bullets, pickups, audio.
- `src/style.css`: responsive Arabic interface.
- `assets/aboden-poster.jpeg`: user-supplied poster, copied without modification.

## Replace the player art
Replace `hero(p, time)` in `src/art.js` with a spritesheet renderer. Feet are
anchored at `(p.x + p.w / 2, p.y + p.h)`; keep the 30 × 44 collision box independent
of artwork. Recommended frames: idle, run, jump, fall, fire, dash and hurt.

## Validation
`npm test` runs 14 Node tests for movement, jump timing, gaps, dash cooldown,
telegraphed fire, boss projectiles, simultaneous input, collection, pause, respawn,
boss defeat, locked exit and replay. Integration tests use a minimal DOM adapter,
not a real mobile device. Browser checks cover the live menu, poster, launch,
movement and pause/resume; physical iPhone testing remains separate.
