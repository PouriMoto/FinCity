# مرجع: جعبه‌ابزار رسم با rough.js

## چرا rough.js

یک کتابخانه‌ی سبک (CDN: `https://cdnjs.cloudflare.com/ajax/libs/rough.js/2.1.1/rough.umd.min.js`) که اشکال
SVG را با جلوه‌ی «دست‌نویس» رسم می‌کند. هیچ فایل تصویری لازم نیست؛ هر شخصیت/آیکون چند خط کد است. این دقیقاً
همان تکنیکی است که Nicky Case و پروژه‌ی رفرنس ما (`procrastination-game.html`) استفاده کرده‌اند.

## راه‌اندازی

```js
if (typeof rough === 'undefined') { /* پیام خطای مناسب نشان بده و متوقف شو */ }
function rc(svg){ return rough.svg(svg); }
```
هر شکل به یک `<svg viewBox="...">` خالی در HTML نیاز دارد؛ کد جاوااسکریپت با `svg.appendChild(g.circle(...))`
شکل را داخلش می‌کشد.

## پالت رنگ استاندارد (این متغیرها را در `:root` هر بازی تعریف کن)

```css
--paper:#F1ECDD; --paper-dim:#E7E0CC;   /* پس‌زمینه‌ی کاغذی */
--ink:#23273A; --ink-soft:#4B4A5C;      /* متن و خطوط اصلی */
--warm:#C1503D; --warm-2:#D9973B;       /* هشدار/کلاه‌برداری/منفی */
--cool:#3F7767; --cool-2:#5A8FA8;       /* اعتماد/صداقت/مثبت */
--pencil:#837C68;                        /* خطوط کم‌رنگ، مداد */
--gold:#B8813F;                          /* سکه/ارزش */
```
warm = هر چیز منفی/هشدار/کلاه‌بردار. cool = هر چیز مثبت/اعتماد/صادق. این تضاد رنگی باید در کل بازی ثابت بماند.

## توابع رسم پایه (کپی-پیست، فقط رنگ/اندازه را تغییر بده)

### صورتک (شخصیت‌ها)
```js
function drawFace(svg, cx, cy, scale, color, mood){
  // mood: 'happy' | 'neutral' | 'sad' | 'sly'
  scale = scale || 1;
  var g = rc(svg);
  svg.appendChild(g.circle(cx, cy, 70*scale, {fill:color, fillStyle:'hachure', hachureGap:4, stroke:INK, strokeWidth:2, roughness:1.9}));
  // چشم‌ها: دایره برای حالت عادی، خط برای 'sly'
  // دهان: مسیر خمیده رو به بالا (happy)، رو به پایین (sad)، کج (sly)، صاف (neutral)
  // — کد کامل در assets نمونه‌ی «میدان اعتماد» موجود است، از همان کپی کن.
}
```
با تغییر فقط `color` و `mood`، همین یک تابع برای همه‌ی شخصیت‌های یک بازی (کاربر، شریک صادق، شریک کلاه‌بردار،
شریک تکرارگر، …) کافی است — نیازی به طراحی جدا برای هرکدام نیست.

### سکه
```js
function drawCoin(svg, cx, cy, r, color){
  var g = rc(svg);
  svg.appendChild(g.circle(cx, cy, r*2, {fill:color, fillStyle:'hachure', hachureGap:2.5, stroke:INK, strokeWidth:1.8, roughness:1.7}));
  svg.appendChild(g.circle(cx, cy, r*1.1, {stroke:INK, strokeWidth:1.2, roughness:1.5, fill:'none'}));
}
```

### دست‌دادن (نتیجه‌ی مثبت/همکاری)
```js
function drawHandshake(svg, cx, cy, scale, color){
  var g = rc(svg);
  svg.appendChild(g.line(cx-30*scale, cy, cx-4*scale, cy-6*scale, {stroke:color, strokeWidth:5*scale, roughness:1.7}));
  svg.appendChild(g.line(cx+30*scale, cy, cx+4*scale, cy-6*scale, {stroke:color, strokeWidth:5*scale, roughness:1.7}));
  svg.appendChild(g.ellipse(cx, cy-6*scale, 14*scale, 9*scale, {fill:color, fillStyle:'solid', stroke:INK, strokeWidth:1.4, roughness:1.5}));
}
```

### فلش خمیده (برای نمودار چرخه‌ای)
```js
function curvedArrow(svg, x1,y1, x2,y2, color, opts){
  opts = opts || {}; var g = rc(svg);
  var mx=(x1+x2)/2+(opts.bend||0), my=(y1+y2)/2+(opts.bendY||0);
  svg.appendChild(g.path('M '+x1+' '+y1+' Q '+mx+' '+my+' '+x2+' '+y2, {stroke:color, strokeWidth:2.2, roughness:1.4, bowing:1}));
  // یک سرِفلش کوچک هم با دو خط کوتاه در انتها اضافه کن (arrowHead)
}
```

## کاربرد برای شخصیت‌های برند (مهدی‌یار / شهریار / نازی‌یار)

می‌توان با همین `drawFace` + چند خط اضافه (مثلاً یک مستطیل ساده برای روسری/کلاه) نسخه‌ی ساده‌شده‌ی هرکدام از
سه شخصیت برند کافینت‌یار را ساخت — بدون نیاز به فایل تصویری واقعی. این گزینه‌ی جدی برای یکدست‌کردن ظاهر ۴
بازی اول (که فعلاً منتظر عکس واقعی‌اند) با بازی‌های روایت‌محور جدید است.

## قوانین سبکی برای اینکه «دست‌نویس» حس شود، نه شلخته

- `roughness` را بین ۱.۴ تا ۲ نگه دار (بالاتر از این خیلی شلخته می‌شود، پایین‌تر خیلی دیجیتال).
- `fillStyle: 'hachure'` (خط‌خطی) برای سطوح پرشده به‌جای رنگ تخت — همان جلوه‌ی طرح‌اولیه.
- هیچ‌وقت گرادیان یا سایه‌ی CSS روی خودِ SVGها نگذار؛ تضاد با جلوه‌ی دست‌نویس دارد.
- پس‌زمینه‌ی کارت‌ها همیشه `--paper`/`--paper-dim` بماند، نه سفید خالص.
