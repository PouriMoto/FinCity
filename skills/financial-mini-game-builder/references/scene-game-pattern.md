# مرجع: الگوی بازی روایت‌محور کامل (Archetype B)

بر اساس ساخت واقعی «میدان اعتماد» و «سوگیری تاییدی» (`games/trust-square/` و `games/confirmation-bias/`).
برای هر بازی جدید از این نوع، همین فایل را به‌عنوان چک‌لیست اسکلت استفاده کن — پوشه‌ی `src/` هرکدام از این دو
بازی را هم به‌عنوان نمونه‌ی کامل کارکرده کنار بگذار و از آن کپی کن.

## گردش‌کار نویسندگی: src/ + bundle.py (نه یک فایل دستی)

هر بازی روایت‌محور در سه فایل ماژولار نوشته می‌شود، نه یک HTML یکپارچه:

```
games/<slug>/src/
├── scenes.html      ← فقط بدنه‌ی <div class="app" data-title="...">...</div>
├── game-logic.js    ← فقط منطق مخصوص همین بازی (state، محاسبات، رویدادها)
└── game-style.css   ← فقط کلاس‌های CSS مخصوص همین بازی
```

کدهای مشترک بین همه‌ی بازی‌های روایت‌محور (که هرگز نباید per-game کپی شوند) در سطح پروژه یک‌بار وجود دارند:

```
shared-src/
├── draw-helpers.js   ← window.FCDraw — همه‌ی توابع رسم rough.js
├── scene-engine.js   ← window.FCScene — ناوبری صحنه/متر/dots
└── paper-theme.css   ← کلاس‌های CSS مشترک (متر، صحنه، دکمه، چرخه، اسلایدر، ...)
tools/bundle.py        ← اسکریپت پایتونی که src/ + shared-src/ را به یک index.html خودکفا تبدیل می‌کند
```

بعد از هر تغییر در `src/`، اجرا کن: `python3 tools/bundle.py <slug>` — و همیشه `index.html` تولیدشده را
تحویل بده، نه فایل‌های `src/` را جدا جدا (چون preview فقط با یک فایل خودکفا کار می‌کند).

**در `game-logic.js` هرگز این‌ها را دوباره ننویس** — از نسخه‌ی مشترک استفاده کن:
`FCDraw.drawFace/drawCoin/drawHandshake/drawMirror/curvedArrow/layoutCycleNodes/drawCycleArrows/toFa`،
و `FCScene.init({ sceneSelector, dotsSelector, prevBtnId, nextBtnId, onEnter, onFinish })` که آبجکت
`{ goto(i), current() }` برمی‌گرداند.



## چک‌لیست صحنه‌ها (۸ تا ۱۰ صحنه، برای بازی ۵–۱۰ دقیقه‌ای)

1. **معرفی/شخصیت‌ها** — کی‌ها در این ماجرا هستند؟ (۲-۴ کارت شخصیت با `drawFace`)
2. **قانون/مکانیزم** — قبل از بازی، قانون را با نمایش بصری (نه فقط متن) توضیح بده.
3–N. **صحنه‌های تعاملی اصلی** — معمولاً ۲-۳ صحنه، هرکدام یک حالت/سناریوی متفاوت از همان مکانیزم.
   می‌تواند «راند-محور» باشد (چند دور تصمیم‌گیری، مثل میدان اعتماد) یا «اسلایدر-محور».
N+1. **نمودار چرخه‌ای کلیک‌پذیر** — یک الگوی تکرارشونده (مثبت یا منفی) را با ۵-۶ گره نشان بده؛ کاربر روی هر
   گره کلیک می‌کند و توضیح می‌بیند.
N+2. **اسلایدر «چه می‌شد اگر»** — یک متغیر کلیدی که با تغییرش، منطق تصمیم عوض می‌شود (مثل «سایه‌ی آینده»).
N+3. **کاربرد در زندگی واقعی** — یک ورودی متنی از کاربر + یک پیشنهاد الگو-محور (نه AI-generated، یک template
   ساده‌ی رشته‌ای کافی است).
N+4. **جمع‌بندی شخصی‌سازی‌شده** — بر اساس مقدار نهایی متر، پیام را در ۳ سطح (پایین/متوسط/بالا) تغییر بده.

## الگوی state سطح‌بالا

```js
// در game-logic.js — ناوبری صحنه را FCScene انجام می‌دهد، اینجا فقط state مخصوص بازی می‌ماند:
var meterValue = 50;   // مثلاً «اعتماد بازار»، از ۰ تا ۱۰۰، شروع از وسط
var scoreValue = 0;    // یک عدد ثانویه (سکه، امتیاز) — تنش بین کوتاه‌مدت/بلندمدت را نشان می‌دهد

function setMeter(delta){
  meterValue = Math.max(5, Math.min(95, meterValue+delta));
  document.getElementById('meterFill').style.width = meterValue+'%';
  document.getElementById('meterTag').textContent = 'برچسب متر: ' + FCDraw.toFa(Math.round(meterValue)) + '٪';
}

var engine = FCScene.init({
  sceneSelector: '.scene', dotsSelector: '#dots', prevBtnId: 'prevBtn', nextBtnId: 'nextBtn',
  finishLabel: 'دوباره از اول',
  onFinish: function(){ location.reload(); },
  onEnter: function(i, sceneName){
    // اینجا هر صحنه رسم/مقداردهی اولیه‌ی خودش را انجام می‌دهد (switch روی sceneName)
  }
});
// برای پرش دستی (مثلاً از دکمه‌ی «شروع» صحنه‌ی اول): engine.goto(engine.current()+1)
```

نکته‌ی کلیدی: متر باید **در بالای صفحه، همیشه دیده شود** (نه فقط در پایان)، تا کاربر همان لحظه اثر تصمیمش را
ببیند. این چیزی است که تجربه را «بازی» می‌کند نه «اسلایدشوی متن».

## الگوی موتور راند-محور (وقتی مکانیزم = تصمیم تکرارشونده)

اگر بازی شامل چند «شریک/حریف» با رفتار متفاوت است (مثل میدان اعتماد: صادق همیشگی / کلاه‌بردار همیشگی /
تکرارگر)، منطق هر شریک را در یک آبجکت پیکربندی جدا کن، نه در کد تکراری:

```js
var partnerConfigs = {
  honest: { rounds:3, moveFn: function(history){ return 'honest'; } },
  cheat:  { rounds:3, moveFn: function(history){ return 'cheat'; } },
  copy:   { rounds:5, moveFn: function(history){
      return history.length===0 ? 'honest' : history[history.length-1].user;
    } }
};
```
یک تابع عمومی `playRound(partnerKey, userMove)` برای همه‌ی شریک‌ها استفاده می‌شود؛ فقط `moveFn` فرق می‌کند.
این یعنی اضافه‌کردن یک شریک/سناریوی جدید = فقط یک ورودی جدید در این آبجکت، نه کد جدید.

## الگوی نمودار چرخه‌ای

```html
<div class="cycle-wrap">
  <svg class="arrows" id="cycleSvg" viewBox="0 0 100 100"></svg>
  <div class="cycle-node" data-i="0"><div class="pt"></div><p>متن گره ۱</p></div>
  <!-- ۵-۶ گره، با top/left درصدی برای چیدمان دایره‌ای -->
</div>
<div class="cycle-detail" id="cycleDetail">برای دیدنِ توضیح، روی یکی از مرحله‌ها بزن.</div>
```
```js
var cycleDetails = ['توضیح گره ۱', 'توضیح گره ۲', /* ... */];
var cycleReady = false;
function setupCycle(){
  if (cycleReady) return;
  cycleReady = true;
  FCDraw.layoutCycleNodes(Array.from(document.querySelectorAll('.cycle-node'))); // چیدمان دایره‌ای خودکار
  Array.from(document.querySelectorAll('.cycle-node')).forEach(function(el,i){
    el.addEventListener('click', function(){
      document.getElementById('cycleDetail').textContent = cycleDetails[i];
      el.classList.add('seen');
    });
  });
}
// در onEnter صحنه‌ی cycle:
// setupCycle();
// FCDraw.drawCycleArrows(document.getElementById('cycleSvg'), 6, WARM);
```
فلش‌ها و چیدمان گره‌ها هردو از `FCDraw` می‌آیند — دوباره ننویس‌شان.

## الگوی جمع‌بندی سه‌سطحی

```js
function showResult(){
  var msg;
  if (meterValue < 40)      msg = '...پیام برای حالت پایین...';
  else if (meterValue < 70) msg = '...پیام برای حالت متوسط...';
  else                       msg = '...پیام برای حالت بالا...';
  document.getElementById('resultTag').textContent = msg;
}
```
هر سه پیام باید عدد واقعی کاربر را در خودشان بیاورند (نه پیام ژنریک)، وگرنه حس شخصی‌سازی از بین می‌رود.

## چک‌لیست اعتبارسنجی قبل از تحویل

- [ ] `python3 tools/bundle.py <slug>` بدون خطا اجرا شد و `index.html` را تولید کرد.
- [ ] اعتبارسنجی روی **`index.html` تولیدشده** انجام شده، نه فقط فایل‌های `src/` جدا:
  - [ ] هر `getElementById` با یک id واقعی در HTML مطابقت دارد (باگ رایج: id روی عنصر اشتباه، مثل زمانی که
        `meterTag` را روی خودِ span گذاشتیم ولی کد دنبال `firstElementChild`ش می‌گشت).
  - [ ] تعداد `<div>`/`</div>` و `<section>`/`</section>` برابرند.
  - [ ] `node --check` روی محتوای هر `<script>` بدون خطا رد می‌شود.
- [ ] هیچ فایل `src/` از ۳۵۰ خط بیشتر نشده.
- [ ] هیچ تابع/کلاس CSSای که در `shared-src/` هست، دوباره در `src/` بازنویسی نشده (چک با grep اسم تابع).
- [ ] اگر صحنه‌ای تایمر خودکار دارد، تا قبل از رسیدن کاربر به آن صحنه استارت نمی‌شود.
- [ ] بازی در `dashboard.html` لینک شده.
- [ ] `index.html` تولیدشده (نه پوشه‌ی `src/`) برای پیش‌نمایش ارائه شده.
