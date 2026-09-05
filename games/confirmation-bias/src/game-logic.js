(function(){
  var toFa = FCDraw.toFa;
  var css = getComputedStyle(document.documentElement);
  var WARM=css.getPropertyValue('--warm').trim(), WARM2=css.getPropertyValue('--warm-2').trim(),
      COOL=css.getPropertyValue('--cool').trim();

  /* ---------- state ---------- */
  var confidence = 50;
  var truthValue = 60; // وضعیت واقعی شرکت، مستقل از انتخاب کاربر
  var negativesSkipped = 0;
  var roundPicks = { 1:[], 2:[], 3:[] };

  function updateMeter(){
    var v = Math.max(5, Math.min(95, confidence));
    document.getElementById('meterFill').style.width = v+'%';
    document.getElementById('meterTag').textContent = 'اطمینان تو: ' + toFa(Math.round(v)) + '٪';
  }

  /* ---------- Headline rounds ---------- */
  var headlineData = {
    1: [
      { text:'تحلیلگر معروف: سهم می‌تونه دوبرابر بشه', sentiment:'positive' },
      { text:"مدیرعامل: «بهترین فصل تاریخ شرکت پیش رومونه»", sentiment:'positive' },
      { text:'گزارش داخلی: تأخیر در پرداخت به تأمین‌کننده‌ها', sentiment:'negative' },
      { text:'دو مدیر ارشد این هفته استعفا دادن', sentiment:'negative' }
    ],
    2: [
      { text:'قرارداد جدید با یه شرکت بزرگ بسته شد (جزئیات مبهم)', sentiment:'positive' },
      { text:'کاربرها تو شبکه‌های اجتماعی خیلی هیجان‌زده‌ن', sentiment:'positive' },
      { text:'حسابرس مستقل: صورت‌های مالی نیاز به بازبینی دارن', sentiment:'negative' },
      { text:'رقیب اصلی قیمتش رو ۳۰٪ کاهش داد', sentiment:'negative' }
    ],
    3: [
      { text:'شایعه: ممکنه توسط یه شرکت بزرگ خریداری بشه', sentiment:'positive' },
      { text:'قیمت سهم امروز ۵٪ رشد کرد', sentiment:'positive' },
      { text:'شرکت اعلام کرد نمی‌تونه پیش‌بینی سود سه‌ماهه بده', sentiment:'negative' },
      { text:'بانک اصلی، خط اعتباری شرکت رو قطع کرد', sentiment:'negative' }
    ]
  };
  var hiddenTruthDelta = { 1:-12, 2:-16, 3:-20 };

  function initRound(n){
    var container = document.getElementById('headlines-'+n);
    container.innerHTML = '';
    roundPicks[n] = [];
    headlineData[n].forEach(function(h, idx){
      var el = document.createElement('div');
      el.className = 'headline';
      el.textContent = h.text;
      el.addEventListener('click', function(){
        if (el.classList.contains('locked')) return;
        var pos = roundPicks[n].indexOf(idx);
        if (pos >= 0){
          roundPicks[n].splice(pos,1);
          el.classList.remove('picked','positive','negative');
        } else {
          if (roundPicks[n].length >= 2) return;
          roundPicks[n].push(idx);
          el.classList.add('picked', h.sentiment);
        }
        document.getElementById('pickCounter-'+n).textContent = toFa(roundPicks[n].length) + ' از ۲ خبر انتخاب شد';
        document.getElementById('confirmRound-'+n).disabled = roundPicks[n].length !== 2;
      });
      container.appendChild(el);
    });
  }

  function confirmRound(n){
    var picks = roundPicks[n], data = headlineData[n];
    picks.forEach(function(idx){
      confidence += data[idx].sentiment==='positive' ? 10 : -10;
    });
    data.forEach(function(h, idx){
      if (h.sentiment==='negative' && picks.indexOf(idx)===-1) negativesSkipped++;
    });
    truthValue = Math.max(5, truthValue + hiddenTruthDelta[n]);
    updateMeter();
    Array.from(document.getElementById('headlines-'+n).children).forEach(function(el){ el.classList.add('locked'); });
    engine.goto(engine.current()+1);
  }
  [1,2,3].forEach(function(n){
    document.getElementById('confirmRound-'+n).addEventListener('click', function(){ confirmRound(n); });
  });

  /* ---------- reveal ---------- */
  function renderReveal(){
    var c = Math.max(5, Math.min(95, confidence)), t = Math.max(5, Math.min(95, truthValue));
    document.getElementById('fillConfidence').style.height = c+'%';
    document.getElementById('fillTruth').style.height = t+'%';
    document.getElementById('valConfidence').textContent = toFa(Math.round(c)) + '٪';
    document.getElementById('valTruth').textContent = toFa(Math.round(t)) + '٪';
    var gap = Math.round(c - t), note;
    if (gap > 15) note = 'تو ' + toFa(negativesSkipped) + ' خبر منفی رو از عمد نخوندی. اطمینانت ' + toFa(Math.abs(gap)) + ' واحد بیشتر از واقعیت بود — این دقیقاً همون سوگیری تاییدیه.';
    else if (gap < -15) note = 'جالبه — این‌بار حتی از واقعیت هم بدبین‌تر بودی. سوگیری همیشه به سمت خوش‌بینی نیست.';
    else note = 'تعادل خوبی داشتی — اطمینانت تقریباً با واقعیت هم‌خونی داشت.';
    document.getElementById('gapNote').textContent = note;
  }

  /* ---------- cycle ---------- */
  var cycleDetails = [
    'یه باور اولیه داری — مثلاً «این سهم خوبه» یا «این آدم قابل‌اعتماده».',
    'مغزت، اغلب بدون اینکه بفهمی، دنبال خبر یا نشونه‌ای می‌گرده که همون باور رو تایید کنه.',
    'وقتی به خبر مخالف برمی‌خوری، راحت‌تر ازش رد می‌شی یا کم‌اهمیتش می‌دونی.',
    'چون فقط شواهدِ هم‌راستا دیدی، باورت قوی‌تر می‌شه.',
    'حالا با اطمینان بیشتر، باز هم دنبال تاییدِ بیشتر می‌گردی.',
    'فاصله‌ی بین چیزی که فکر می‌کنی و چیزی که واقعاً هست، بیشتر و بیشتر می‌شه.'
  ];
  var cycleReady = false;
  function setupCycle(){
    if (cycleReady) return;
    cycleReady = true;
    FCDraw.layoutCycleNodes(Array.from(document.querySelectorAll('.cycle-node')));
    Array.from(document.querySelectorAll('.cycle-node')).forEach(function(el,i){
      el.addEventListener('click', function(){
        document.getElementById('cycleDetail').textContent = cycleDetails[i];
        el.classList.add('seen');
      });
    });
  }

  /* ---------- prior slider ---------- */
  var priorSlider = document.getElementById('priorSlider');
  function renderPrior(){
    var v = parseInt(priorSlider.value,10);
    document.getElementById('priorLabel').textContent = toFa(v) + '٪ باور اولیه';
    document.getElementById('priorFill').style.width = v + '%';
    var cap;
    if (v < 30) cap = 'باور کمی داشتی — به‌احتمال زیاد به خبر منفی هم توجه می‌کردی.';
    else if (v < 70) cap = 'باور متوسطی داشتی — فیلترِ ذهنی داره کم‌کم شکل می‌گیره.';
    else cap = 'خیلی به این باور داشتی — فیلترِ ذهنی داشت خودکار کار می‌کرد، حتی بدون اینکه بفهمی.';
    document.getElementById('priorCaption').textContent = cap;
  }
  priorSlider.addEventListener('input', renderPrior);

  /* ---------- mirror + real-life ---------- */
  Array.from(document.querySelectorAll('.mirror-choices .btn')).forEach(function(btn){
    btn.addEventListener('click', function(){
      var fb = document.getElementById('mirrorFeedback');
      fb.textContent = btn.dataset.choice === 'excuse'
        ? 'شاید حق با تو باشه — ولی همین جمله دقیقاً همون فیلتریه که تو دور اول دیدیم. آیا واقعاً شواهد رو سنجیدی، یا فقط باور اولیه‌ت رو محکم‌تر کردی؟'
        : 'این سؤال، دقیقاً کاریه که سوگیری تاییدی رو خنثی می‌کنه — پرسیدن «شاید تصور اولم اشتباه بوده؟»';
    });
  });
  document.getElementById('realBtn').addEventListener('click', function(){
    var v = document.getElementById('realBelief').value.trim();
    var box = document.getElementById('realSuggestion');
    if (!v){ box.textContent = 'اول یه باور بنویس :)'; box.classList.add('show'); return; }
    box.textContent = 'درباره‌ی «' + v + '»: یه سؤال از خودت بپرس که واقعاً می‌تونه نظرتو عوض کنه — نه سؤالی که از قبل می‌دونی جوابش چیه.';
    box.classList.add('show');
  });

  /* ---------- summary ---------- */
  function drawSummary(){
    var svg = document.getElementById('svgSummary'); svg.innerHTML='';
    var gap = confidence - truthValue;
    if (Math.abs(gap) <= 15) FCDraw.drawFace(svg, 100, 100, 0.8, '#CFE0D4', 'happy');
    else FCDraw.drawFace(svg, 100, 100, 0.8, '#E7C7BE', gap>0 ? 'sly' : 'sad');
  }
  function showResult(){
    var gap = Math.round(confidence - truthValue), msg;
    if (gap > 15) msg = 'اطمینانت ' + toFa(gap) + ' واحد بیشتر از واقعیت بود، و ' + toFa(negativesSkipped) + ' خبر منفی رو ندیده گرفتی — نمونه‌ی کلاسیک سوگیری تاییدی.';
    else if (gap < -15) msg = 'این‌بار از واقعیت هم بدبین‌تر بودی — یادت باشه سوگیری فقط به سمت خوش‌بینی نیست.';
    else msg = 'اطمینانت (' + toFa(Math.round(confidence)) + '٪) تقریباً با واقعیت (' + toFa(Math.round(truthValue)) + '٪) هم‌خونی داشت — تعادل خوبی نشون دادی.';
    document.getElementById('resultTag').textContent = msg;
  }

  /* ---------- wiring ---------- */
  FCDraw.drawFace(document.getElementById('cIntro'), 100, 100, 1, '#DDD3C4', 'neutral');
  (function(){
    var svg = document.getElementById('mechSvg');
    FCDraw.drawMagnifier(svg, 70, 70, 1, COOL);
    FCDraw.drawEyePatch(svg, 145, 140, 1, WARM2);
    var g = FCDraw.rc(svg);
    svg.appendChild(g.line(20,150,60,150,{stroke:COOL,strokeWidth:2,roughness:1.5}));
    svg.appendChild(g.line(150,40,185,40,{stroke:WARM,strokeWidth:2,roughness:1.5}));
  })();

  var engine = FCScene.init({
    sceneSelector: '.scene',
    dotsSelector: '#dots',
    prevBtnId: 'prevBtn',
    nextBtnId: 'nextBtn',
    finishLabel: 'دوباره از اول',
    onFinish: function(){ location.reload(); },
    onEnter: function(i, name){
      if (name === 'round-1') initRound(1);
      if (name === 'round-2') initRound(2);
      if (name === 'round-3') initRound(3);
      if (name === 'reveal') renderReveal();
      if (name === 'cycle') { setupCycle(); FCDraw.drawCycleArrows(document.getElementById('cycleSvg'), 6, WARM); }
      if (name === 'prior') renderPrior();
      if (name === 'summary'){ drawSummary(); showResult(); }
    }
  });

  document.getElementById('introNext').addEventListener('click', function(){ engine.goto(engine.current()+1); });
  updateMeter();
})();
