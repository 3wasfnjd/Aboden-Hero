# Aboden Hero — وادي العجائب

Original side-scrolling cartoon platformer. Play: https://3wasfnjd.github.io/Aboden-Hero/

## Chapter 01
A 6,600-unit forest trail with ink-outlined trees, mushroom cottages, paper grain,
parallax hills, collectible stars, patrolling guards, three checkpoints, health
pickups, gaps, hazards and an exit gate. The warm vintage-cartoon art direction
is inspired by the supplied references; scenery and placeholder hero are drawn
from original Canvas paths. No reference screenshots or licensed character art
are shipped.

## Controls
- Move: arrows or A / D.
- Jump: Up or K. Tap for a short jump; hold for a higher jump.
- Shoot: J or Space; holding repeats fire.
- Pause/resume: Escape or the pause button.
- Touch: independent pointer controls support move + jump + shoot together.
- Sound: optional synthesized effects, enabled with the music-note button.
- Landscape is recommended on phones; portrait remains usable.

Movement uses acceleration, braking, 120 ms coyote time, a 140 ms jump buffer,
and a fixed 120 Hz simulation. Falling or losing five hearts returns you to the
latest checkpoint. Checkpoints and collected stars persist during that run,
not across page reloads. Completing the stage shows results and a replay button.
Switching apps or losing focus pauses and clears held input.

## Run / deploy
Serve the repository root over HTTP, e.g. `python3 -m http.server 8000`.
There is no build step, CDN dependency, package install or external art download.
GitHub Pages serves `index.html` and relative `src/` files from the main branch.
The existing Pages deployment setup is retained; `.nojekyll` allows static serving.

## Files
- `src/world.js`: level geometry and pure movement/collision functions.
- `src/art.js`: original scenery and placeholder character rendering.
- `src/main.js`: game loop, state transitions, controls, effects and audio.
- `src/style.css`: Arabic responsive menu, HUD and controls.

## Replace the hero
Replace `hero(p, time)` in `src/art.js` with your spritesheet drawing. Coordinates
are anchored at `(p.x + p.w / 2, p.y + p.h)` (feet); the default collision box is
30 × 44 world units. Keep this hitbox independent of the visual sprite size.
Suggested animations: idle, run, jump, fall, shoot, hurt. The current hero is
intentionally temporary; no final character design is implied.

## Validation
`npm test` runs dependency-free Node tests for acceleration, braking, variable
jump height, coyote time, buffered jumps, no double jump, one-way platforms and
all mandatory gaps. Browser smoke checklist: start, move/jump/shoot, pause,
resume, checkpoint respawn, goal/replay, pointer cancellation, phone rotation.
