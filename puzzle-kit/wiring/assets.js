const here=import.meta.url;
const asset=name=>new URL(`./assets/original/${name}`,here).href;

export const wiringAssets=Object.freeze({
  base:asset('board.png'),
  solved:null,
  sourceSheet:asset('pipe-pieces.png'),
  pieces:Object.freeze({
    straight:asset('pipe-straight.png'),
    elbow:asset('pipe-elbow.png'),
    cross:asset('pipe-cross.png'),
    tee:asset('pipe-tee.png')
  })
});
