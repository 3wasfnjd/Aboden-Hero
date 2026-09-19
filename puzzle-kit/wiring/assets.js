export const wiringAssets=Object.freeze({
  // board.png is the intended base board asset. It is left disabled until
  // the uploaded file is a valid PNG image.
  base:null,

  // Optional final solved-state artwork, if supplied later.
  solved:null,

  // Original source sheet containing the transparent pipe pieces.
  sourceSheet:'./assets/original/pipe-pieces.png',

  // Individual transparent pieces will be referenced here once uploaded.
  pieces:Object.freeze([])
});
