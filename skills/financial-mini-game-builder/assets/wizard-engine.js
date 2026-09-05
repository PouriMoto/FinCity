/*
  FCWizard — موتور مشترک ویزارد داستان برای بازی‌های «شهر ابزار مالی»
  ------------------------------------------------------------------
  هر بازی فقط یک آبجکت schema (screens[] + onComplete) می‌ده؛
  این فایل مسئول ساختن DOM، ناوبری، گرفتن حدس، و پخش صدای اختیاریه.

  نحوه استفاده در هر بازی:
    <div id="wizardView"></div>
    <script src="../../shared/wizard-engine.js"></script>
    <script>
      FCWizard.init({
        containerSelector: '#wizardView',
        toolSelector: '#toolView',
        finishLabel: 'بیا شروع کنیم →',
        screens: [
          { image:'assets/images/scene-01.png', icon:'🧒', caption:'...', text:'...' },
          { image:'assets/images/scene-02.png', icon:'🤔', caption:'...', text:'...',
            guess:{ type:'number', unit:'سال', min:1, max:60 } },
          { image:'assets/images/scene-03.png', icon:'🤝', caption:'...', text:'...',
            guess:{ type:'choice', options:[{value:'a',label:'گزینه ۱'},{value:'b',label:'گزینه ۲'}] } }
        ],
        onComplete: function(guess){
          // guess = { type:'number'|'choice'|null, value: ... }
        }
      });
    </script>
*/
(function (global) {
  'use strict';

  const faDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  function toFa(input){ return String(input).replace(/[0-9]/g, d => faDigits[d]); }

  function init(config){
    const container = document.querySelector(config.containerSelector);
    const toolEl = config.toolSelector ? document.querySelector(config.toolSelector) : null;
    const screens = config.screens || [];
    if (!container || screens.length === 0) return;

    let idx = 0;
    let guessValue = null;
    let guessType = null;

    const screenWraps = [];

    screens.forEach(function (sc, i) {
      const wrap = document.createElement('div');
      wrap.className = 'wizard-screen' + (i === 0 ? ' active' : '');

      // --- تصویر / جای‌گزین ---
      const imgBox = document.createElement('div');
      imgBox.className = 'wizard-image';
      if (sc.image) {
        const img = document.createElement('img');
        img.src = sc.image;
        img.alt = sc.caption || '';
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder';
        placeholder.style.display = 'none';
        placeholder.innerHTML =
          '<span class="icon">' + (sc.icon || '🖼️') + '</span>' +
          '<span>' + (sc.caption || '') + '</span>' +
          '<code>' + sc.image + '</code>';
        img.addEventListener('error', function () {
          img.style.display = 'none';
          placeholder.style.display = 'flex';
        });
        imgBox.appendChild(img);
        imgBox.appendChild(placeholder);
      }
      wrap.appendChild(imgBox);

      // --- صدای اختیاری هر صحنه ---
      if (sc.audio) {
        const audioBtn = document.createElement('button');
        audioBtn.type = 'button';
        audioBtn.className = 'wizard-audio-btn';
        audioBtn.textContent = '🔊 پخش صدا';
        let audioEl = null;
        let playing = false;
        audioBtn.addEventListener('click', function () {
          if (!audioEl) audioEl = new Audio(sc.audio);
          if (playing) {
            audioEl.pause();
            audioBtn.textContent = '🔊 پخش صدا';
            playing = false;
          } else {
            audioEl.currentTime = 0;
            audioEl.play().catch(function(){ /* فایل صوتی هنوز موجود نیست */ });
            audioBtn.textContent = '⏸ توقف صدا';
            playing = true;
          }
        });
        wrap.appendChild(audioBtn);
      }

      // --- متن ---
      const textEl = document.createElement('p');
      textEl.className = 'wizard-text';
      textEl.innerHTML = sc.text || '';
      wrap.appendChild(textEl);

      // --- مرحله‌ی حدس (اختیاری) ---
      if (sc.guess) {
        const gWrap = document.createElement('div');
        gWrap.className = 'wizard-guess';
        if (sc.guess.type === 'choice') {
          (sc.guess.options || []).forEach(function (opt) {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'wizard-choice-btn';
            b.textContent = opt.label;
            b.addEventListener('click', function () {
              Array.from(gWrap.querySelectorAll('.wizard-choice-btn')).forEach(function (x) {
                x.classList.remove('selected');
              });
              b.classList.add('selected');
              guessValue = opt.value;
              guessType = 'choice';
            });
            gWrap.appendChild(b);
          });
        } else {
          const input = document.createElement('input');
          input.type = 'number';
          if (sc.guess.min != null) input.min = sc.guess.min;
          if (sc.guess.max != null) input.max = sc.guess.max;
          input.placeholder = '؟';
          input.addEventListener('input', function () {
            guessValue = parseFloat(input.value);
            guessType = 'number';
          });
          gWrap.appendChild(input);
          if (sc.guess.unit) {
            const unitSpan = document.createElement('span');
            unitSpan.textContent = sc.guess.unit;
            gWrap.appendChild(unitSpan);
          }
        }
        wrap.appendChild(gWrap);
      }

      container.appendChild(wrap);
      screenWraps.push(wrap);
    });

    // --- نوار ناوبری ---
    const nav = document.createElement('div');
    nav.className = 'wizard-nav';

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'wizard-btn ghost';
    prevBtn.textContent = '→ قبلی';
    prevBtn.disabled = true;

    const dotsWrap = document.createElement('div');
    dotsWrap.className = 'wizard-dots';
    screens.forEach(function (_, i) {
      const d = document.createElement('span');
      d.className = 'wizard-dot' + (i === 0 ? ' active' : '');
      dotsWrap.appendChild(d);
    });
    const dots = Array.from(dotsWrap.children);

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'wizard-btn';

    nav.appendChild(prevBtn);
    nav.appendChild(dotsWrap);
    nav.appendChild(nextBtn);
    container.appendChild(nav);

    function render() {
      screenWraps.forEach(function (s, i) { s.classList.toggle('active', i === idx); });
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
      prevBtn.disabled = idx === 0;
      nextBtn.textContent = idx === screens.length - 1
        ? (config.finishLabel || 'بیا شروع کنیم →')
        : 'بعدی ←';
    }

    function finish() {
      container.style.display = 'none';
      if (toolEl) toolEl.style.display = 'block';
      if (typeof config.onComplete === 'function') {
        config.onComplete({ type: guessType, value: guessValue });
      }
    }

    nextBtn.addEventListener('click', function () {
      if (idx === screens.length - 1) finish();
      else { idx++; render(); }
    });
    prevBtn.addEventListener('click', function () {
      if (idx > 0) { idx--; render(); }
    });

    render();
  }

  global.FCWizard = { init: init, toFa: toFa };
})(window);
