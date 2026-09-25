const root = document.querySelector('#box-game');
try {
  const { createBoxPuzzle } = await import('./box.js');
  const puzzle = await createBoxPuzzle({ root, autoSave: true });
  puzzle.start();
} catch (error) {
  root.innerHTML = '<div class="loading"><h1>تعذّر تجهيز الصندوق</h1><p>أعد تحميل الصفحة. إذا استمر الخطأ، تأكد من اكتمال تحميل ملفات اللعبة.</p><a href="./">إعادة المحاولة</a><a href="../">مجموعة الألغاز</a></div>';
  console.error('Puzzle Box failed to load:', error);
}
