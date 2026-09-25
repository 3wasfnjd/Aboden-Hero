// The state is deliberately independent of DOM, rendering and the host game.
export const SAVE_KEY = 'aboden:puzzle-box:v1';
export const SYMBOLS = ['شمس', 'ورقة', 'قمر', 'قطرة', 'نجمة', 'معيّن'];
export const SLIDE_ORDER = [3, 1, 2, 0];
export const SLIDE_TARGETS = [1, 1, -1, -1];
export const FRAGMENT_DIGITS = [4, 1, 7];
export const STAGES = [
  { name: 'الشمس والنبتة', part: 'الغطاء', label: 'حرّر الغطاء العلوي', description: 'راقب النبتة على الغطاء. ما الذي تتجه إليه؟ اضبط الحلقتين عند العلامة، ثم اضغط الختم.', hints: ['النقش على الغطاء يربط النبتة بمصدر الضوء.', 'الرمز الخارجي لما تحتاجه النبتة، والداخلي لما ينمو منها.', 'ضع الشمس في الحلقة الخارجية والورقة في الداخلية، ثم اضغط الختم.'] },
  { name: 'الحركة المترابطة', part: 'الواجهة', label: 'حرّر الواجهة الأمامية', description: 'اجعل الأسهم الثلاثة تتجه للأعلى. كل مقبض يحرّك المؤشرات الموصولة به؛ راقب الخطوط قبل التدوير.', hints: ['المقبض الأول يؤثر في الأول والثاني، والثاني في الثاني والثالث.', 'اضبط المؤشر الأول أولًا، ثم الأوسط، وأخيرًا الثالث.', 'من وضع البداية: الأول ربع دورة عكس الساعة، ثم الثاني ربع دورة عكس الساعة، ثم الثالث نصف دورة.'] },
  { name: 'الألواح المتشابكة', part: 'الجانب', label: 'اسحب دبوس التثبيت', description: 'ألسنة الألواح تحبس بعضها. تتبّع المجرى المكشوف، وحرّك اللوح الحر حتى تُخلي طريق الدبوس.', hints: ['ابدأ من اللوح السفلي؛ لسانه يحبس اللوح الثاني.', 'الترتيب من الأعلى بالأرقام: الرابع، ثم الثاني، ثم الثالث، ثم الأول.', 'السفلي يسارًا، الثاني يمينًا، الثالث يسارًا، العلوي يمينًا. ثم اسحب الدبوس.'] },
  { name: 'النقش المتفرق', part: 'القاعدة', label: 'افتح قفل القاعدة', description: 'اقلب القطع المفكوكة ووصل أطراف النقش من الدائرة إلى النجمة. اضغط قطعتين لتبديل موضعيهما، ثم اقرأ الأرقام باتجاه السهم.', hints: ['الأشكال على الأطراف يجب أن تتطابق بين القطع المتجاورة.', 'ابدأ بالدائرة وانتهِ بالنجمة. اقرأ من اليسار إلى اليمين باتجاه السهم.', 'ترتيب القطع: الغطاء، الواجهة، الجانب. الرمز: ٤ ثم ١ ثم ٧.'] },
  { name: 'التوازن الأخير', part: 'القلب', label: 'حرّر مزلاج الحجرة', description: 'استخدم الأثقال الأربعة التي جمعتها. اختر ثقلًا ثم ضعه في إحدى الكفتين؛ النقاط تدل على وزنه.', hints: ['يجب استخدام الأثقال الأربعة، ويجب أن تتساوى الكفتان.', 'مجموع الأوزان عشرة. تحتاج كل كفة إلى خمسة.', 'ضع ١ و٤ في كفة، و٢ و٣ في الكفة الأخرى. ثم حرّر المزلاج.'] }
];

export function initialState() {
  return { version: 1, stage: 0, rings: [2, 4], gears: [1, 2, 3], slides: [0, 0, 0, 0], fragments: [2, 0, 1], code: [0, 0, 0], weights: ['tray', 'tray', 'tray', 'tray'], hints: [0, 0, 0, 0, 0], moves: 0, extracted: false, muted: false };
}

const wrap = (n, length) => (n % length + length) % length;
const arrayOf = (value, length, check) => Array.isArray(value) && value.length === length && value.every(check);
const intIn = (min, max) => n => Number.isInteger(n) && n >= min && n <= max;

export function validSlides(slides) {
  if (!arrayOf(slides, 4, intIn(-1, 1))) return false;
  let stopped = false;
  for (const i of SLIDE_ORDER) {
    if (slides[i] === 0) stopped = true;
    else if (stopped || slides[i] !== SLIDE_TARGETS[i]) return false;
  }
  return true;
}

export function restoreState(raw) {
  const fresh = initialState();
  try {
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data || data.version !== 1 || !intIn(0, 5)(data.stage)) return fresh;
    if (!arrayOf(data.rings, 2, intIn(0, 5)) || !arrayOf(data.gears, 3, intIn(0, 3)) || !validSlides(data.slides)) return fresh;
    if (!arrayOf(data.fragments, 3, intIn(0, 2)) || new Set(data.fragments).size !== 3 || !arrayOf(data.code, 3, intIn(0, 9))) return fresh;
    if (!arrayOf(data.weights, 4, x => ['tray', 'left', 'right'].includes(x))) return fresh;
    const state = { ...fresh, stage: data.stage, rings: [...data.rings], gears: [...data.gears], slides: [...data.slides], fragments: [...data.fragments], code: [...data.code], weights: [...data.weights], extracted: data.stage === 5 && data.extracted === true, muted: data.muted === true };
    if (arrayOf(data.hints, 5, intIn(0, 3))) state.hints = [...data.hints];
    if (Number.isSafeInteger(data.moves) && data.moves >= 0) state.moves = data.moves;
    // A completed stage must contain a valid solution; damaged saves restart safely.
    for (let i = 0; i < state.stage; i++) if (!isSolved(state, i)) return fresh;
    return state;
  } catch { return fresh; }
}

export function balance(state) {
  return state.weights.reduce((totals, location, i) => {
    if (location !== 'tray') totals[location] += i + 1;
    return totals;
  }, { left: 0, right: 0 });
}

export function isSolved(state, stage = state.stage) {
  switch (stage) {
    case 0: return state.rings[0] === 0 && state.rings[1] === 1;
    case 1: return state.gears.every(n => n === 0);
    case 2: return state.slides.every((n, i) => n === SLIDE_TARGETS[i]);
    case 3: return state.fragments.every((n, i) => n === i) && state.code.every((n, i) => n === FRAGMENT_DIGITS[i]);
    case 4: { const totals = balance(state); return state.weights.every(x => x !== 'tray') && totals.left > 0 && totals.left === totals.right; }
    default: return false;
  }
}

// Every action is checked here, including scene taps, so hidden/locked parts cannot skip stages.
export function applyAction(state, action) {
  if (!state || !action) return false;
  const { type, index, direction = 1 } = action;
  const step = direction === -1 ? -1 : 1;
  if (type === 'ring' && state.stage === 0 && intIn(0, 1)(index)) state.rings[index] = wrap(state.rings[index] + step, 6);
  else if (type === 'gear' && state.stage === 1 && intIn(0, 2)(index)) {
    state.gears[index] = wrap(state.gears[index] + step, 4);
    if (index < 2) state.gears[index + 1] = wrap(state.gears[index + 1] + step, 4);
  } else if (type === 'slide' && state.stage === 2 && intIn(0, 3)(index)) {
    const next = [...state.slides];
    next[index] += step;
    if (!validSlides(next)) return false;
    state.slides = next;
  } else if (type === 'swap' && state.stage === 3 && intIn(0, 2)(index) && intIn(0, 2)(action.other) && index !== action.other) {
    [state.fragments[index], state.fragments[action.other]] = [state.fragments[action.other], state.fragments[index]];
  } else if (type === 'digit' && state.stage === 3 && intIn(0, 2)(index)) state.code[index] = wrap(state.code[index] + step, 10);
  else if (type === 'weight' && state.stage === 4 && intIn(0, 3)(index) && ['tray', 'left', 'right'].includes(action.location)) state.weights[index] = action.location;
  else if (type === 'unlock' && state.stage < 5 && isSolved(state)) state.stage++;
  else if (type === 'extract' && state.stage === 5 && !state.extracted) state.extracted = true;
  else if (type === 'hint' && state.stage < 5 && state.hints[state.stage] < 3) { state.hints[state.stage]++; return true; }
  else if (type === 'reset-current' && state.stage < 5) {
    const fields = [['rings'], ['gears'], ['slides'], ['fragments', 'code'], ['weights']][state.stage];
    const fresh = initialState();
    fields.forEach(field => { state[field] = [...fresh[field]]; });
  } else return false;
  state.moves++;
  return true;
}
