const here=import.meta.url;
const asset=name=>new URL(`./assets/original/${name}`,here).href;

export const matchingAssets=Object.freeze({
  base:asset('board.png'),
  solved:asset('solution.png'),
  cables:Object.freeze({
    blue:asset('cable-blue.png'),
    orange:asset('cable-orange.png'),
    purple:asset('cable-purple.png')
  })
});
