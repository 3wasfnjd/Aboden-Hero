import { PuzzleCore, PUZZLE_EVENTS } from '../core/puzzle-core.js';
import { PuzzleAudio } from '../core/puzzle-audio.js';
import { BoxScene } from './box-scene.js';
import { SAVE_KEY, STAGES, SYMBOLS, SLIDE_TARGETS, FRAGMENT_DIGITS, initialState, restoreState, applyAction, balance } from './box-logic.js';

const arabic = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const names = ['الغطاء', 'الواجهة', 'الجانب', 'القاعدة'];
const svg = body => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const icons = {
  home: svg('<path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-8h6v8"/>'),
  sound: svg('<path d="M4 9h4l5-4v14l-5-4H4Z"/><path d="M16 8q5 4 0 8M18 5q8 7 0 14"/>'),
  mute: svg('<path d="M4 9h4l5-4v14l-5-4H4Z"/><path d="m17 9 5 6m0-6-5 6"/>'),
  help: svg('<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01"/>'),
  reset: svg('<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>')
};
const glyphs = [
  svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>'),
  svg('<path d="M5 19C0 8 12 3 21 3c0 12-6 19-16 16Zm0 0L17 7"/>'),
  svg('<path d="M18 3A9 9 0 1 0 21 18 9 9 0 0 1 18 3Z"/>'),
  svg('<path d="M12 2C8 8 5 11 5 15a7 7 0 0 0 14 0c0-4-3-7-7-13Z"/>'),
  svg('<path d="m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1Z"/>'),
  svg('<path d="m12 2 7 10-7 10-7-10Z"/>')
];

function fragmentSVG(id) {
  const endpoints = [
    '<circle cx="9" cy="42" r="4"/>',
    '<path d="m9 37 5 5-5 5-5-5Z"/>',
    '<path d="m9 36 5 10H4Z"/>',
    '<path d="m9 36 2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1Z"/>'
  ];
  return `<svg viewBox="0 0 100 90" aria-hidden="true"><g fill="none" stroke="#dac194" stroke-width="1.6">${endpoints[id]}<g transform="translate(82 0)">${endpoints[id + 1]}</g><path d="M15 42C30 16 32 65 50 42S70 22 85 42"/><path d="m37 43-7-9m29 8 8 10"/></g><text x="50" y="78" fill="#e3cc9f" font-size="21" font-family="Georgia,serif" text-anchor="middle">${FRAGMENT_DIGITS[id]}</text></svg>`;
}

export class BoxPuzzle extends PuzzleCore {
  constructor({ root, autoSave = false, storage = null, state = null } = {}) {
    super({ id: 'puzzle-box', root });
    this.abort = new AbortController(); this.autoSave = autoSave; this.storage = storage;
    this.saveAvailable = true; this.selectedFragment = -1; this.selectedWeight = -1;
    if (autoSave && !storage) { try { this.storage = window.localStorage; } catch { this.saveAvailable = false; } }
    let saved = state;
    if (!saved && autoSave && this.storage) { try { saved = this.storage.getItem(SAVE_KEY); } catch { this.saveAvailable = false; } }
    this.state = restoreState(saved); this.solved = this.state.extracted;
    this.audio = new PuzzleAudio({ masterVolume: .6, musicVolume: 0, sfxVolume: .22 }); this.audio.setMuted(this.state.muted);
    this.renderShell();
    try {
      this.scene = new BoxScene(this.root.querySelector('.viewport'), { onAction: action => this.sceneAction(action), onError: message => this.renderSceneError(message) });
      this.scene.setState(this.state, -1, true);
      if (this.state.stage > 0) this.scene.focusStage();
    } catch (error) {
      this.renderSceneError('تعذّر تشغيل العرض ثلاثي الأبعاد. جرّب تحديث المتصفح أو فتح الصفحة في Safari أو Chrome. تستطيع تجربة الألغاز من اللوحة.');
      this.emit(PUZZLE_EVENTS.ERROR, { message: error.message });
    }
    this.root.addEventListener('click', event => this.handleClick(event), { signal: this.abort.signal });
    this.root.querySelector('dialog').addEventListener('click', event => { if (event.target === event.currentTarget) event.currentTarget.close(); }, { signal: this.abort.signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { this.save(); this.audio.stopAmbient(); if (this.audio.context?.state === 'running') this.audio.context.suspend().catch(() => {}); } }, { signal: this.abort.signal });
    window.addEventListener('pagehide', () => this.save(), { signal: this.abort.signal });
    this.render(); this.emit(PUZZLE_EVENTS.READY);
  }

  renderShell() {
    this.root.classList.add('box-game');
    this.root.innerHTML = `
      <header class="topbar">
        <div class="brand"><div class="brand-mark" aria-hidden="true"><span>◇</span></div><div><h1>الصندوق</h1><small>ABODEN GAMES</small></div></div>
        <nav class="toolbar" aria-label="خيارات اللعبة"><span class="version">التجربة الأولى</span><button class="tool" data-action="sound" aria-label="كتم الصوت">${icons.sound}</button><button class="tool" data-action="help" aria-label="طريقة اللعب">${icons.help}</button><button class="tool" data-action="restart" aria-label="بدء لعبة جديدة">${icons.reset}</button><a class="home-link" href="../" aria-label="العودة إلى مجموعة الألغاز">${icons.home}</a></nav>
      </header>
      <div class="game-layout">
        <section class="scene-area" aria-label="الصندوق ثلاثي الأبعاد">
          <div class="scene-caption"><div class="eyebrow">خشب، نحاس، وسرّ في القلب</div><h2>كل قطعة… تقرّبك.</h2><p>خمسة ألغاز. صندوق واحد.</p></div>
          <div class="viewport" tabindex="0" role="group" aria-label="اسحب لتدوير الصندوق، أو استخدم مفاتيح الأسهم. جميع الألغاز متاحة أيضًا في لوحة التحكم."></div>
          <div class="scene-help">اسحب لتدوير الصندوق · قرّب بإصبعين · المس الآليات للتفاعل</div>
          <div class="scene-tools" aria-label="عرض الصندوق"><button data-action="focus">إظهار اللغز</button><button data-action="overview">الصندوق كاملًا</button><button data-action="zoom-in" aria-label="تقريب الصندوق">＋</button><button data-action="zoom-out" aria-label="إبعاد الصندوق">−</button></div>
          <div class="scene-badge"><i></i><span data-save-status>يحفظ تقدمك تلقائيًا</span></div>
        </section>
        <aside class="workbench" aria-label="لوحة اللغز">
          <div class="progress"><div class="progress-top"><span>رحلة التفكيك</span><strong data-progress-count dir="ltr">00 / 05</strong></div><div class="progress-track" role="progressbar" aria-label="الألغاز المحلولة" aria-valuemin="0" aria-valuemax="5" aria-valuenow="0">${STAGES.map(() => '<span></span>').join('')}</div></div>
          <div class="puzzle-heading"><div class="chapter-label"></div><h2 tabindex="-1"></h2><p></p></div>
          <div class="mechanism"></div>
          <div class="actions"><button class="primary" data-action="unlock"></button><div class="puzzle-actions"><button data-action="hint">تلميح</button><button data-action="reset-current">إعادة الآلية</button></div><div class="hint" hidden></div><p class="feedback" role="status" aria-live="polite"></p></div>
          <div class="inventory"><h3>القطع التي حرّرتها</h3><div class="inventory-parts"></div><div class="maker">CRAFTED BY ABODEN GAMES</div></div>
        </aside>
      </div><dialog class="box-dialog" aria-label="معلومات اللعبة"></dialog>`;
  }

  renderSceneError(message) {
    const area = this.root.querySelector('.scene-area'); let box = area.querySelector('.render-error'); if (!box) { box = document.createElement('p'); box.className = 'render-error'; area.append(box); } box.textContent = message;
  }

  save() {
    if (!this.autoSave || !this.storage) return;
    try { this.storage.setItem(SAVE_KEY, JSON.stringify(this.state)); this.saveAvailable = true; }
    catch { this.saveAvailable = false; }
    this.updateSaveStatus();
  }
  updateSaveStatus() { this.root.querySelector('[data-save-status]').textContent = !this.autoSave ? 'تجربة الصندوق' : this.saveAvailable && this.storage ? 'يحفظ تقدمك تلقائيًا' : 'جلسة بدون حفظ'; }
  feedback(message) { this.root.querySelector('.feedback').textContent = message; }

  render() {
    const { stage, extracted } = this.state;
    const focusId = this.root.contains(document.activeElement) ? document.activeElement?.id : '';
    const item = STAGES[stage];
    this.root.querySelector('[data-progress-count]').textContent = `${String(stage).padStart(2, '0')} / 05`;
    const track = this.root.querySelector('.progress-track'); track.setAttribute('aria-valuenow', stage); [...track.children].forEach((el, i) => { el.className = i < stage ? 'done' : i === stage ? 'active' : ''; });
    this.root.querySelector('.chapter-label').textContent = item ? `اللغز ${arabic(stage + 1)} من ٥` : extracted ? 'اكتملت الرحلة' : 'السرّ أصبح في متناولك';
    this.root.querySelector('.puzzle-heading h2').textContent = item?.name || (extracted ? 'وصلت إلى قلب الصندوق' : 'المفتاح ينتظرك');
    this.root.querySelector('.puzzle-heading p').textContent = item?.description || (extracted ? 'تفككت القطع، واتزنت الكفتان، وأصبح المفتاح لك.' : 'فتحت الألغاز الخمسة. المس المفتاح داخل الحجرة أو اضغط الزر لاستخراجه.');
    const primary = this.root.querySelector('.primary[data-action]'); primary.dataset.action = stage < 5 ? 'unlock' : extracted ? 'restart' : 'extract'; primary.textContent = item?.label || (extracted ? 'جرّب من البداية' : 'استخرج المفتاح');
    this.root.querySelector('.puzzle-actions').hidden = stage >= 5;
    const hintCount = this.state.hints[stage] || 0, hint = this.root.querySelector('.hint'); hint.hidden = !hintCount || stage >= 5; hint.textContent = item?.hints[hintCount - 1] || '';
    const hintButton = this.root.querySelector('[data-action="hint"]'); hintButton.textContent = hintCount ? `تلميح ${arabic(hintCount)} / ٣` : 'تلميح'; hintButton.disabled = hintCount >= 3;
    const sound = this.root.querySelector('[data-action="sound"]'); sound.innerHTML = this.state.muted ? icons.mute : icons.sound; sound.setAttribute('aria-label', this.state.muted ? 'تشغيل الصوت' : 'كتم الصوت'); sound.setAttribute('aria-pressed', String(this.state.muted));
    this.root.querySelector('.inventory-parts').innerHTML = stage ? names.slice(0, Math.min(stage, 4)).map((name, i) => `<button class="part-chip" data-action="part" data-index="${i}">${name} · ${'•'.repeat(i + 1)}</button>`).join('') : '<span class="empty-tray">ستجد هنا قطع الصندوق والأثقال التي تجمعها.</span>';
    this.renderMechanism(); this.updateSaveStatus(); this.scene?.setState(this.state, this.selectedWeight);
    if (focusId) this.root.querySelector(`#${focusId}`)?.focus({ preventScroll: true });
  }

  renderMechanism() {
    const s = this.state, container = this.root.querySelector('.mechanism');
    if (s.stage === 0) container.innerHTML = `<p class="mechanism-label">الرمز الظاهر عند العلامة النحاسية</p>${s.rings.map((value, i) => `<div class="control-row"><label>${i ? 'الحلقة الداخلية' : 'الحلقة الخارجية'}</label><div class="stepper"><button id="ring-${i}-prev" data-action="ring" data-index="${i}" data-direction="-1" aria-label="الرمز السابق في الحلقة ${i ? 'الداخلية' : 'الخارجية'}">‹</button><output aria-label="${SYMBOLS[value]}">${glyphs[value]}</output><button id="ring-${i}-next" data-action="ring" data-index="${i}" data-direction="1" aria-label="الرمز التالي في الحلقة ${i ? 'الداخلية' : 'الخارجية'}">›</button></div></div>`).join('')}<p class="mechanism-note">المس الغطاء لفحص نقش النبتة، أو دوّر الصندوق لرؤيته من الأعلى.</p>`;
    else if (s.stage === 1) container.innerHTML = `<p class="mechanism-label">اضبط الأسهم باتجاه ↑</p><div class="gear-controls">${s.gears.map((value, i) => `<div class="gear-control"><div class="gear-face"><span style="transform:rotate(${value * 90}deg)" aria-label="المؤشر ${arabic(i + 1)}: ${['أعلى','يمين','أسفل','يسار'][value]}">↑</span></div><small>${['١ + ٢','٢ + ٣','٣ فقط'][i]}</small><div class="stepper"><button id="gear-${i}-prev" data-action="gear" data-index="${i}" data-direction="-1" aria-label="المقبض ${arabic(i + 1)} عكس الساعة">↶</button><button id="gear-${i}-next" data-action="gear" data-index="${i}" data-direction="1" aria-label="المقبض ${arabic(i + 1)} مع الساعة">↷</button></div></div>`).join('')}</div><p class="mechanism-note">النقر على الترس في الصندوق يديره ربع دورة مع الساعة.</p>`;
    else if (s.stage === 2) container.innerHTML = `<p class="mechanism-label">الألواح مرتبة هنا من الأعلى إلى الأسفل</p>${s.slides.map((value, i) => `<div class="slide-row"><button id="slide-${i}-left" data-action="slide" data-index="${i}" data-direction="-1" aria-label="اللوح ${arabic(i + 1)} يسارًا">←</button><div class="slide-rail"><div class="slide-block ${value ? 'moved' : ''}" style="transform:translateX(${value * 21}px)">${arabic(i + 1)}</div></div><button id="slide-${i}-right" data-action="slide" data-index="${i}" data-direction="1" aria-label="اللوح ${arabic(i + 1)} يمينًا">→</button></div>`).join('')}<p class="pin-status">${s.slides.filter(Boolean).length === 4 ? 'الممر مفتوح. يمكنك سحب الدبوس.' : `تحررت ${arabic(s.slides.filter(Boolean).length)} من ٤ ألسنة`}</p>`;
    else if (s.stage === 3) container.innerHTML = `<p class="mechanism-label">ظهر القطع · طابق الأشكال عند الأطراف</p><div class="fragment-row">${s.fragments.map((id, i) => `<button id="fragment-${i}" class="fragment ${i === this.selectedFragment ? 'selected' : ''}" data-action="fragment" data-index="${i}" aria-pressed="${i === this.selectedFragment}" aria-label="قطعة ${names[id]} في الموضع ${arabic(i + 1)}">${fragmentSVG(id)}<small>${names[id]}</small></button>`).join('')}</div><div class="reading-arrow" aria-label="اقرأ من اليسار إلى اليمين">○ ─────────→ ☆</div>${s.fragments.every((id, i) => id === i) ? '<p class="connected-note">اكتمل النقش. أدخل أرقامه في القفل.</p>' : ''}<div class="code-controls">${s.code.map((digit, i) => `<div class="stepper"><button id="digit-${i}-up" data-action="digit" data-index="${i}" data-direction="1" aria-label="زيادة الرقم ${arabic(i + 1)}">＋</button><output aria-label="الرقم ${arabic(i + 1)}: ${digit}">${digit}</output><button id="digit-${i}-down" data-action="digit" data-index="${i}" data-direction="-1" aria-label="إنقاص الرقم ${arabic(i + 1)}">−</button></div>`).join('')}</div>`;
    else if (s.stage === 4) { const totals = balance(s); container.innerHTML = `<p class="mechanism-label">${this.selectedWeight >= 0 ? `الثقل ${arabic(this.selectedWeight + 1)} محدد؛ اختر مكانه` : 'اختر ثقلًا، ثم اختر الكفة'}</p><div class="weight-tray">${s.weights.map((loc, i) => `<button id="weight-${i}" class="weight" data-action="select-weight" data-index="${i}" aria-pressed="${this.selectedWeight === i}" aria-label="اختيار الثقل ${arabic(i + 1)}"><b>${'•'.repeat(i + 1)}</b><small>${{ tray:'على الطاولة',left:'اليسرى',right:'اليمنى' }[loc]}</small></button>`).join('')}</div><div class="pans"><button class="pan" data-action="pan" data-location="left" aria-label="وضع الثقل في الكفة اليسرى"><b>${totals.left}</b><small>الكفة اليسرى</small></button><button class="pan" data-action="pan" data-location="right" aria-label="وضع الثقل في الكفة اليمنى"><b>${totals.right}</b><small>الكفة اليمنى</small></button></div><button class="tray-return" data-action="pan" data-location="tray">إعادة الثقل إلى الطاولة</button><p class="balance-note">${s.weights.includes('tray') ? 'استخدم الأثقال الأربعة لفتح المزلاج.' : totals.left === totals.right ? 'اتزن الميزان. حرّر المزلاج.' : 'إحدى الكفتين أثقل. أعد توزيع الأثقال.'}</p>`; }
    else container.innerHTML = `<div class="success-key" aria-hidden="true">⚿</div>${s.extracted ? '<div class="finish-title">المفتاح بين يديك</div>' : ''}<div class="finish-stats">خمسة ألغاز محلولة<br>${arabic(s.moves)} حركة · ${arabic(s.hints.reduce((a,b) => a+b,0))} تلميحات</div>`;
  }

  async handleClick(event) {
    const button = event.target.closest('[data-action]'); if (!button || !this.root.contains(button) || button.disabled) return;
    await this.audio.unlock();
    const type = button.dataset.action, index = Number(button.dataset.index), direction = Number(button.dataset.direction || 1);
    if (type === 'focus') return this.scene?.focusStage();
    if (type === 'overview') return this.scene?.overview();
    if (type === 'zoom-in' || type === 'zoom-out') return this.scene?.zoom(type === 'zoom-in' ? -.6 : .6);
    if (type === 'sound') { this.state.muted = this.audio.toggleMuted(); this.save(); this.render(); return; }
    if (type === 'help') return this.showHelp();
    if (type === 'restart') return this.confirmReset();
    if (type === 'confirm-restart') { this.root.querySelector('dialog').close(); this.reset(); return; }
    if (type === 'close-dialog') return this.root.querySelector('dialog').close();
    if (type === 'part') return this.inspectPart(index);
    if (type === 'fragment') {
      if (this.selectedFragment < 0) { this.selectedFragment = index; this.render(); }
      else { const other = this.selectedFragment; this.selectedFragment = -1; if (other !== index) this.act({ type: 'swap', index, other }); else this.render(); }
      return;
    }
    if (type === 'select-weight') { this.selectedWeight = this.selectedWeight === index ? -1 : index; this.render(); return; }
    if (type === 'pan') return this.placeWeight(button.dataset.location);
    this.act({ type, index, direction });
  }

  placeWeight(location) {
    if (this.selectedWeight < 0) return this.feedback('اختر أحد الأثقال أولًا.');
    const index = this.selectedWeight; this.selectedWeight = -1;
    this.act({ type: 'weight', index, location });
  }

  sceneAction(action) {
    if (!this.started || this.destroyed) return;
    this.audio.unlock();
    if (action.type === 'part') return this.inspectPart(action.index);
    if (action.type === 'select-weight') { if (this.state.stage === 4) { this.selectedWeight = action.index; this.render(); } else this.feedback('احتفظ بالثقل؛ ستحتاجه في الحجرة الأخيرة.'); return; }
    if (action.type === 'pan') return this.state.stage === 4 ? this.placeWeight(action.location) : this.feedback('الميزان هو القفل الأخير.');
    if (action.type === 'slide-tap') return this.act({ type: 'slide', index: action.index, direction: this.state.slides[action.index] ? -SLIDE_TARGETS[action.index] : SLIDE_TARGETS[action.index] });
    this.act(action);
  }

  act(action) {
    if (!this.started || this.destroyed) return false;
    const previousStage = this.state.stage;
    if (!applyAction(this.state, action)) {
      this.feedback(action.type === 'slide' ? 'هذا الاتجاه محجوز بلسان آخر. تتبّع المجرى، أو تراجع عن آخر لوح حررته.' : action.type === 'unlock' ? 'الآلية لم تتحرر بعد. افحص الوضع الحالي أو اطلب تلميحًا.' : 'هذا الجزء غير متاح الآن. أكمل الآلية الحالية.');
      return false;
    }
    if (action.type === 'reset-current') { this.selectedFragment = -1; this.selectedWeight = -1; }
    this.save(); this.render();
    if (this.state.stage > previousStage) {
      this.audio.playSuccess(); this.selectedFragment = -1; this.selectedWeight = -1;
      this.feedback(previousStage < 4 ? `تحرّر ${STAGES[previousStage].part}. حصلت على ثقل ${arabic(previousStage + 1)}.` : 'انفتح القلب. استخرج المفتاح.');
      this.emit('box:stage', { stage: this.state.stage, part: STAGES[previousStage].part });
    } else if (action.type === 'extract') { this.audio.playSuccess(); this.feedback('اكتملت رحلة الصندوق.'); this.solve({ moves: this.state.moves, hints: this.state.hints.reduce((a,b) => a+b,0) }); }
    else { if (!['hint', 'reset-current'].includes(action.type)) this.audio.playRotate(); this.feedback(action.type === 'reset-current' ? 'عادت الآلية الحالية إلى بدايتها.' : ''); }
    this.emit('box:change', { state: this.getState() });
    return true;
  }

  showDialog(title, body, actions = '<button class="primary" data-action="close-dialog">متابعة</button>') {
    const dialog = this.root.querySelector('dialog');
    dialog.innerHTML = `<h2>${title}</h2>${body}<div class="dialog-actions">${actions}</div>`;
    if (!dialog.open) dialog.showModal();
  }
  showHelp() { this.showDialog('كيف تفتح الصندوق؟', '<p>اسحب بإصبع واحد لتدوير الصندوق، وبإصبعين للتقريب والإبعاد. المس الحلقات أو التروس لتحريكها، أو استخدم أزرار الآلية في اللوحة.</p><p>زر «إظهار اللغز» يوجه الكاميرا إلى الآلية الحالية. كل حل يحرّر قطعة وثقلًا؛ تستطيع فحص القطع من أسفل اللوحة. التلميحات ثلاث درجات، وآخرها يوضح الحل.</p><p>تقدمك يحفظ على هذا الجهاز عندما يسمح المتصفح بالتخزين. بالكيبورد: Tab لاختيار الأزرار وEnter لتفعيلها، والأسهم لتدوير المشهد عند التركيز عليه.</p>'); }
  confirmReset() { this.showDialog('تبدأ من جديد؟', '<p>سيعود الصندوق مغلقًا ويُمسح تقدم هذه التجربة على هذا الجهاز.</p>', '<button data-action="close-dialog">احتفظ بتقدمي</button><button class="primary" data-action="confirm-restart">ابدأ من جديد</button>'); }
  inspectPart(index) {
    if (!Number.isInteger(index) || index < 0 || index > 3) return;
    if (index === 0 && this.state.stage === 0) return this.showDialog('نقش الغطاء', `<div class="dialog-piece">${glyphs[0]}${glyphs[1]}</div><p>نبتة يمتد ساقها نحو الشمس. نقشان ينتظران أن يجتمعا عند العلامة.</p>`);
    if (this.state.stage <= index) return this.feedback('هذه القطعة ما زالت مثبتة. حل الآلية التي تحبسها أولًا.');
    const art = index < 3 ? fragmentSVG(index) : glyphs[5];
    this.showDialog(`ظهر ${names[index]}`, `<div class="dialog-piece">${art}</div><p>${index < 3 ? 'نقش ناقص على ظهر القطعة. احتفظ بها؛ ستتصل بنقوش القطع الأخرى عند قفل القاعدة.' : 'تحررت القاعدة وأصبح قلب الصندوق مكشوفًا.'}</p><p>جمعت معها ثقلًا عليه ${arabic(index + 1)} من النقاط.</p>`);
  }
  getState() { return JSON.parse(JSON.stringify(this.state)); }
  start() { if (!super.start()) return false; this.root.hidden = false; if (this.scene) this.scene.running = true; return true; }
  close() { if (!super.close()) return false; this.save(); this.root.hidden = true; if (this.scene) this.scene.running = false; this.audio.stopAmbient(); return true; }
  reset() { if (!super.reset()) return false; const muted = this.state.muted; this.state = initialState(); this.state.muted = muted; this.selectedWeight = -1; this.selectedFragment = -1; this.save(); this.render(); this.scene?.overview(); this.feedback('الصندوق جاهز لرحلة جديدة.'); this.start(); return true; }
  destroy() { if (this.destroyed) return; this.save(); this.abort.abort(); this.audio.destroy(); this.scene?.destroy(); super.destroy(); }
}

export async function createBoxPuzzle(options) { return new BoxPuzzle(options); }
