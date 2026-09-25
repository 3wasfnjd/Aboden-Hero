# ABODEN Puzzle Kit

Reusable standalone puzzle modules. Each puzzle can run on its own page or be mounted inside another game.

## Asset integrity rule

User-supplied artwork is treated as immutable source material.

- Do **not** resize, crop, recompress, re-encode, sharpen, recolor, or otherwise rewrite image files.
- Keep the original pixel dimensions and original file bytes.
- Puzzle artwork is displayed with ordinary DOM `<img>` elements, not regenerated with Canvas/CSS drawing.
- Responsive fitting uses CSS `transform: scale(...)` on the scene only. This changes on-screen presentation, **not** the source file.
- Hit areas use coordinates in the image's **original pixel coordinate system**, so interaction remains aligned regardless of display scale.
- Interactive pieces supplied as separate PNGs remain separate original assets.

## Modules

- `/puzzle-kit/box/` — standalone 3D puzzle box with five sequential mechanisms, touch controls, progressive hints and optional local save. Its procedural prototype is separate from the immutable supplied artwork used by the modules below. See `box/README.md`.
- `/puzzle-kit/wiring/`
- `/puzzle-kit/matching/`
- `/puzzle-kit/cubes/`

Each module exposes the same basic lifecycle:

```js
const puzzle = await createWiringPuzzle({ root });

puzzle.start();
puzzle.reset();
puzzle.close();

const unsubscribe = puzzle.onSolved(({ id }) => {
  // Unlock elevator, open a door, grant an item, etc.
});
```

Common events:

- `puzzle:ready`
- `puzzle:start`
- `puzzle:reset`
- `puzzle:solved`
- `puzzle:close`
- `puzzle:error`

## Asset folders

When final artwork is supplied, it should be committed unchanged under each puzzle:

```text
puzzle-kit/
  wiring/assets/original/
  matching/assets/original/
  cubes/assets/original/
```

The corresponding `assets.js` file only references those original files. It must not contain generated replacements.

## Integration contract

The host game owns game state. The puzzle module only reports its own lifecycle.

```js
const puzzle = await createMatchingPuzzle({
  root: document.querySelector('#puzzle-overlay')
});

puzzle.onSolved(() => {
  hostGame.unlockElevator();
});
```

This keeps puzzle logic portable between Aboden Hero and future games.
