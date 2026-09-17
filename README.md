# Aboden Hero — حصار المدينة

Play: https://3wasfnjd.github.io/Aboden-Hero/

A side-scrolling action platformer set in a comic-book night city. Hero, guards,
boss, bullets, pickups, checkpoints and the exit gate are all rendered from
sprite/image assets under `assets/`.

## Mission
- ~6,600-unit route through industrial streets, rooftops and warehouses.
- Armed patrols (three guard types) with a visible aim warning before each shot.
- Automatic fire while holding shoot; a short invulnerable dash; unlimited ammo.
- Four checkpoints (full heal + respawn point), health/energy pickups, forgiving jumps.
- A gatekeeper boss with rocket volleys and a locked/unlocked exit gate that only
  opens once it's defeated.
- Background music and SFX start automatically once the mission begins.

## Controls
- Move: arrows or A/D. Jump: Up or K. Shoot: J or Space. Dash: L or Shift.
- Pause/resume: Escape or the pause button.
- Touch: on-screen buttons for movement, jump, fire and dash.
- Portrait is the primary orientation (720×1280 canvas); landscape on short
  viewports shows a rotate-back prompt instead of gameplay.

## Run / deploy
Serve the repo root over HTTP: `npm run serve` (or `python3 -m http.server 8000`).
No build step — GitHub Pages serves the `main` branch root directly. Cache-busted
module/CSS query strings avoid mixing files between releases.

## Source
- `src/world.js` — level geometry, fixed-step movement, collision, dash.
- `src/combat.js`, `enemy-weapon.js`, `hero-weapon.js` — aim, projectiles, muzzle poses.
- `src/art-base.js`, `art.js`, `art-bg.js` — layered rendering: base primitives,
  character/projectile/pickup sprites, then world/background images.
- `src/music.js` — background score and mute control.
- `src/main.js` — game loop, UI state, input, HUD, audio.
- `src/style.css`, `controls.css` — responsive Arabic interface and touch dock.
- `assets/` — sprite sheets, backgrounds and UI art.

## Validation
`npm test` runs 29 Node tests covering movement, jumps, dash, combat, checkpoints,
pickups, pause/respawn, boss defeat and the locked/unlocked exit. Integration tests
use a minimal DOM adapter, not a real device; manual browser/mobile checks are separate.
