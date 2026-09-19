export const wiringAssets=Object.freeze({
  // Original board artwork. Stored and served unchanged.
  base:'./assets/original/board.png',

  // Optional final solved-state artwork, if supplied later.
  solved:null,

  // Original transparent source sheet containing the pipe pieces.
  sourceSheet:'./assets/original/pipe-pieces.png',

  // Individual transparent pieces can be added later without changing the source sheet.
  pieces:Object.freeze([])
});
