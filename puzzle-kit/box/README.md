# الصندوق — ABODEN GAMES

أساس مستقل للعبة صندوق ثلاثي الأبعاد يعمل من المتصفح على الجوال والكمبيوتر. افتح `puzzle-kit/box/` عبر خادم HTTP أو GitHub Pages.

## ما يعمل

- صندوق خشبي ونحاسي مرسوم برمجيًا؛ تدوير، تقريب ولمس الآليات، مع أزرار مكافئة للكيبورد والجوال.
- خمسة ألغاز متتابعة: الحلقات، المؤشرات المترابطة، الألواح، النقش والرمز، والميزان. حل كل مرحلة يفك أجزاء الصندوق. بعد القفل الخامس يجب استخراج المفتاح.
- تلميحات تدريجية، فحص القطع المفكوكة، مؤثرات صوتية، وإعادة الآلية الحالية أو اللعبة.
- حفظ مستقل في `aboden:puzzle-box:v1`. فشل التخزين لا يمنع اللعب. لا تستخدم اللعبة مفاتيح حفظ Aboden Hero.
- الحركات آليات محددة المسارات وليست محاكاة تصادم فيزيائية. النموذج البرمجي هو الأساس البصري الأول، ويمكن استبدال مظهره لاحقًا.

## الملفات والتشغيل

- `box-logic.js`: قواعد اللعب والحفظ والتحقق من التسلسل، مستقلة عن الرسم.
- `box-scene.js`: مشهد Three.js وأجزاء الصندوق والكاميرا.
- `box.js`: وحدة متوافقة مع `PuzzleCore` والواجهة العربية.
- `demo.js`: تشغيل الصفحة المستقلة مع الحفظ التلقائي.

من جذر المستودع: `npm run serve` ثم `/puzzle-kit/box/`.

```js
import { createBoxPuzzle } from './puzzle-kit/box/box.js';
// Include box.css in the host document. The host can provide state and manage persistence.
const puzzle = await createBoxPuzzle({ root, state: savedState });
puzzle.on('box:change', event => saveState(event.detail.state));
puzzle.onSolved(() => unlockNextChapter());
puzzle.start();
// puzzle.getState(), reset(), close(), start(), destroy()
```

`puzzle:solved` يُطلق عند استخراج المفتاح. `box:stage` يُطلق عند تحرير كل قفل. الحفظ التلقائي معطل افتراضيًا للوحدة المدمجة، ومفعّل في الصفحة المستقلة فقط.

## الاعتماد

Three.js **0.183.2**، نسخة محلية مصغرة تتضمن `RoomEnvironment` و`RoundedBoxGeometry`؛ الترخيص محفوظ في `vendor/THREE-LICENSE.txt`. لا توجد اتصالات بخدمات خارجية أثناء اللعب، ولا نموذج أو خط يحتاج تحميلًا من CDN. الرسوم الأصلية للألغاز الأخرى لم تتغير.

## الاختبار

`node --test tests/box-puzzle.test.js`

تختبر الحالات الحل الكامل، منع تجاوز المراحل، قابلية حل المؤشرات، تراجع الألواح، شرط استخدام كل الأثقال، واستعادة الحفظ التالف أو الصحيح.
