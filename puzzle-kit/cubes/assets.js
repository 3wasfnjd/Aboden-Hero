const here=import.meta.url;
const asset=name=>new URL(`./assets/original/${name}`,here).href;

export const cubeAssets=Object.freeze({
  base:asset('board.png'),
  solved:asset('solution.png'),
  pieces:Object.freeze({
    start:asset('start.png'),
    right:asset('right.png'),
    down:asset('down.png'),
    straight:asset('straight.png'),
    junction:asset('junction.png'),
    lock:asset('lock.png'),
    goal:asset('goal.png')
  })
});
