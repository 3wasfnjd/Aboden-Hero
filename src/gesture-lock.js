const ZOOM_KEYS=new Set(['+','-','=','0']);
const ZOOM_CODES=new Set(['Equal','Minus','Digit0','NumpadAdd','NumpadSubtract','Numpad0']);

export function isZoomShortcut(event={}){
  return !!(event.metaKey||event.ctrlKey)
    && (ZOOM_KEYS.has(event.key)||ZOOM_CODES.has(event.code));
}

export function lockSafariZoom({root=globalThis.document,viewport=globalThis.window}={}){
  if(!root||!viewport)return ()=>{};

  const prevent=event=>event.preventDefault();
  const preventMultiTouch=event=>{
    if(event.touches?.length>1)event.preventDefault();
  };
  const preventZoomWheel=event=>{
    if(event.ctrlKey||event.metaKey)event.preventDefault();
  };
  const preventZoomKey=event=>{
    if(isZoomShortcut(event))event.preventDefault();
  };

  const options={passive:false};
  root.addEventListener('gesturestart',prevent,options);
  root.addEventListener('gesturechange',prevent,options);
  root.addEventListener('gestureend',prevent,options);
  root.addEventListener('touchmove',preventMultiTouch,options);
  root.addEventListener('dblclick',prevent,options);
  viewport.addEventListener('wheel',preventZoomWheel,options);
  viewport.addEventListener('keydown',preventZoomKey,true);

  return ()=>{
    root.removeEventListener('gesturestart',prevent,options);
    root.removeEventListener('gesturechange',prevent,options);
    root.removeEventListener('gestureend',prevent,options);
    root.removeEventListener('touchmove',preventMultiTouch,options);
    root.removeEventListener('dblclick',prevent,options);
    viewport.removeEventListener('wheel',preventZoomWheel,options);
    viewport.removeEventListener('keydown',preventZoomKey,true);
  };
}
