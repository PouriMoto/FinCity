/*
  scene-engine.js — موتور عمومی ناوبری صحنه برای بازی‌های روایت‌محور
  ------------------------------------------------------------------
  این فایل هیچ چیز مخصوص یک بازی خاص (متر، شخصیت، امتیاز) را نمی‌داند —
  فقط مسئول ناوبری بین صحنه‌ها، نقطه‌های پیشرفت، و صدا زدن callback هر بازی است.
  منطق مخصوص هر بازی (رسم، محاسبه‌ی متر، ...) در game-logic.js خودِ همان بازی می‌ماند.

  نحوه‌ی استفاده:
    var engine = FCScene.init({
      sceneSelector: '.scene',
      dotsSelector: '#dots',
      prevBtnId: 'prevBtn',
      nextBtnId: 'nextBtn',
      onEnter: function(index, sceneName){ ... },   // هر بار وارد صحنه‌ی جدید می‌شویم
      onFinish: function(){ location.reload(); }     // وقتی از آخرین صحنه «بعدی» زده شود
    });
    engine.goto(3);          // پرش دستی به صحنه‌ی شماره‌ی ۴ (اندیس از صفر)
    engine.current();        // اندیس صحنه‌ی فعلی
*/
(function (global) {
  'use strict';

  function init(config){
    var scenes = Array.from(document.querySelectorAll(config.sceneSelector));
    var dotsEl = document.querySelector(config.dotsSelector);
    var prevBtn = document.getElementById(config.prevBtnId);
    var nextBtn = document.getElementById(config.nextBtnId);
    var current = 0;

    scenes.forEach(function(){
      var d = document.createElement('div');
      d.className = 'dot';
      dotsEl.appendChild(d);
    });
    var dots = Array.from(dotsEl.children);

    function updateDots(){
      dots.forEach(function(d, i){
        d.classList.toggle('active', i === current);
        d.classList.toggle('done', i < current);
      });
    }

    function sceneName(i){
      return scenes[i].dataset.scene || '';
    }

    function goto(i){
      if (i < 0 || i >= scenes.length) return;
      scenes[current].classList.remove('active');
      current = i;
      scenes[current].classList.add('active');
      if (prevBtn) prevBtn.disabled = (current === 0);
      if (nextBtn) nextBtn.textContent = (current === scenes.length - 1)
        ? (config.finishLabel || 'دوباره از اول')
        : (config.nextLabel || 'بعدی');
      updateDots();
      if (typeof config.onEnter === 'function') config.onEnter(current, sceneName(current));
    }

    if (prevBtn){
      prevBtn.addEventListener('click', function(){ goto(current - 1); });
    }
    if (nextBtn){
      nextBtn.addEventListener('click', function(){
        if (current === scenes.length - 1){
          if (typeof config.onFinish === 'function') config.onFinish();
          else location.reload();
          return;
        }
        goto(current + 1);
      });
    }

    // مقداردهی اولیه
    if (prevBtn) prevBtn.disabled = true;
    updateDots();
    if (typeof config.onEnter === 'function') config.onEnter(current, sceneName(current));

    return {
      goto: goto,
      current: function(){ return current; },
      sceneCount: function(){ return scenes.length; },
      advance: function(){
        if (nextBtn) nextBtn.click();
      }
    };
  }

  global.FCScene = { init: init };
})(window);
