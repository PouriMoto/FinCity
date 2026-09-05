(function(){
  var toFa = FCDraw.toFa;
  var css = getComputedStyle(document.documentElement);
  var WARM=css.getPropertyValue('--warm').trim(), WARM2=css.getPropertyValue('--warm-2').trim(),
      COOL=css.getPropertyValue('--cool').trim(), COOL2=css.getPropertyValue('--cool-2').trim(),
      GOLD=css.getPropertyValue('--gold').trim();

  /* ---------- state ---------- */
  var trust = 50;   // اعتماد بازار 0-100
  var coins = 0;    // سکه‌های تجمعی کاربر

  function updateMeter(){
    document.getElementById('meterFill').style.width = trust+'%';
    document.getElementById('meterTag').textContent = 'اعتماد بازار: ' + toFa(Math.round(trust)) + '٪';
    document.getElementById('coinChip').textContent = '🪙 ' + toFa(coins);
  }
  function setTrust(delta){ trust = Math.max(5, Math.min(95, trust+delta)); updateMeter(); }
  function addCoins(n){ coins += n; updateMeter(); }

  /* خط دست‌نویس داخل متر */
  (function(){
    var svg = document.getElementById('meterSvg');
    svg.setAttribute('viewBox','0 0 300 20'); svg.setAttribute('preserveAspectRatio','none');
    var g = FCDraw.rc(svg);
    svg.appendChild(g.line(2,10,298,10,{stroke:'rgba(35,39,58,0.2)',strokeWidth:1.5,roughness:1.2}));
  })();

  /* ---------- Scene: intro ---------- */
  FCDraw.drawFace(document.getElementById('cCooperate'), 100, 90, 0.85, '#CFE0D4', 'happy');
  FCDraw.drawFace(document.getElementById('cCheat'), 100, 90, 0.85, '#E7C7BE', 'sly');
  FCDraw.drawFace(document.getElementById('cCopy'), 100, 90, 0.85, '#C9DCE6', 'neutral');
  FCDraw.drawMirror(document.getElementById('cCopy'), 100, 150, 0.55, COOL2);

  /* ---------- Scene: payoff rules ---------- */
  (function(){
    var grid = document.getElementById('payoffGrid');
    var cells = [
      { title:'هردو صادق', sub:'هردو ۳ سکه می‌برید', a:3, b:3 },
      { title:'تو صادق، اون کلاه‌بردار', sub:'تو ۰ سکه، اون ۵ سکه', a:0, b:5 },
      { title:'تو کلاه‌بردار، اون صادق', sub:'تو ۵ سکه، اون ۰ سکه', a:5, b:0 },
      { title:'هردو کلاه‌بردار', sub:'هردو فقط ۱ سکه می‌برید', a:1, b:1 }
    ];
    cells.forEach(function(c){
      var div = document.createElement('div');
      div.className = 'payoff-cell';
      var svgId = 'pf-' + Math.random().toString(36).slice(2);
      div.innerHTML = '<svg id="'+svgId+'" viewBox="0 0 60 30"></svg><div class="pt">'+c.title+'</div><div class="ps">'+c.sub+'</div>';
      grid.appendChild(div);
      var svg = document.getElementById(svgId);
      FCDraw.drawCoin(svg, 20, 15, 9, GOLD);
      if (c.a !== c.b) FCDraw.drawCoin(svg, 42, 15, 9 * (c.b>0? Math.min(1.3, 0.7+c.b/10):0.4), c.b>c.a?WARM2:COOL2);
      else FCDraw.drawCoin(svg, 42, 15, 9, GOLD);
    });
  })();

  /* ---------- Round scenes engine ---------- */
  var PAYOFF = {
    'honest-honest': {user:3, partner:3, trust:+8},
    'honest-cheat':  {user:0, partner:5, trust:-10},
    'cheat-honest':  {user:5, partner:0, trust:-10},
    'cheat-cheat':   {user:1, partner:1, trust:-2}
  };
  var partnerConfigs = {
    honest: { rounds:3, label:'صادق همیشگی', moveFn: function(){ return 'honest'; } },
    cheat:  { rounds:3, label:'کلاه‌بردار همیشگی', moveFn: function(){ return 'cheat'; } },
    copy:   { rounds:5, label:'تکرارگر', moveFn: function(history){
        return history.length===0 ? 'honest' : history[history.length-1].user;
      } }
  };
  var roundState = {};

  function initRoundScene(key){
    var cfg = partnerConfigs[key];
    roundState[key] = { round:0, history:[], done:false };
    var dotsWrap = document.getElementById('roundDots-'+key);
    dotsWrap.innerHTML = '';
    for (var i=0;i<cfg.rounds;i++){
      var d = document.createElement('div'); d.className='round-dot'; dotsWrap.appendChild(d);
    }
    document.getElementById('roundResult-'+key).textContent = 'تصمیمت رو بزن.';
    document.getElementById('roundTally-'+key).textContent = '';
    var partnerColor = key==='honest' ? '#CFE0D4' : key==='cheat' ? '#E7C7BE' : '#C9DCE6';
    FCDraw.drawFace(document.getElementById('roundYouSvg-'+key), 50, 45, 0.55, '#DDD3C4', 'neutral');
    FCDraw.drawFace(document.getElementById('roundPartnerSvg-'+key), 50, 45, 0.55, partnerColor, 'neutral');
    var section = document.querySelector('[data-scene="round-'+key+'"]');
    Array.from(section.querySelectorAll('.round-choice-row .btn')).forEach(function(btn){ btn.disabled = false; });
  }

  function playRound(key, userMove){
    var st = roundState[key];
    if (!st || st.done) return;
    var cfg = partnerConfigs[key];
    var partnerMove = cfg.moveFn(st.history);
    var outcome = PAYOFF[userMove+'-'+partnerMove];

    addCoins(outcome.user);
    setTrust(outcome.trust);
    st.history.push({ user:userMove, partner:partnerMove });
    st.round++;

    var dotsWrap = document.getElementById('roundDots-'+key);
    var dot = dotsWrap.children[st.round-1];
    if (dot) dot.classList.add(userMove==='cheat' ? 'cheat' : 'cooperate');

    var partnerColor = key==='honest' ? '#CFE0D4' : key==='cheat' ? '#E7C7BE' : '#C9DCE6';
    FCDraw.drawFace(document.getElementById('roundYouSvg-'+key), 50, 45, 0.55, '#DDD3C4', userMove==='cheat'?'sly':'happy');
    FCDraw.drawFace(document.getElementById('roundPartnerSvg-'+key), 50, 45, 0.55, partnerColor, partnerMove==='cheat'?'sly':'happy');

    var resultEl = document.getElementById('roundResult-'+key), partnerLabel = cfg.label;
    if (userMove==='honest' && partnerMove==='honest') resultEl.textContent = '🤝 هردو صادق موندید — ۳ سکه گرفتی، اعتماد بازار بالا رفت.';
    else if (userMove==='honest' && partnerMove==='cheat') resultEl.textContent = '😬 صادق موندی ولی ' + partnerLabel + ' کلاهت گذاشت — ۰ سکه گرفتی، اعتماد افت کرد.';
    else if (userMove==='cheat' && partnerMove==='honest') resultEl.textContent = '🃏 کلاه زدی به ' + partnerLabel + ' که صادق بود — ۵ سکه گرفتی، ولی اعتماد بازار شکست.';
    else resultEl.textContent = '⚔️ هردو کلاه زدید — فقط ۱ سکه گرفتی، اعتماد کمی افت کرد.';

    document.getElementById('roundTally-'+key).textContent =
      'دور ' + toFa(st.round) + ' از ' + toFa(cfg.rounds) + ' — سکه‌های این شریک تا الان: ' +
      toFa(st.history.reduce(function(s,h){ return s + PAYOFF[h.user+'-'+h.partner].user; },0));

    if (st.round >= cfg.rounds){
      st.done = true;
      var section = document.querySelector('[data-scene="round-'+key+'"]');
      Array.from(section.querySelectorAll('.round-choice-row .btn')).forEach(function(btn){ btn.disabled = true; });
      resultEl.textContent += ' — این شریک تموم شد، «بعدی» رو بزن.';
    }
  }

  ['honest','cheat','copy'].forEach(function(key){
    var section = document.querySelector('[data-scene="round-'+key+'"]');
    Array.from(section.querySelectorAll('.round-choice-row .btn')).forEach(function(btn){
      btn.addEventListener('click', function(){ playRound(key, btn.dataset.move); });
    });
  });

  /* ---------- Scene: cycle ---------- */
  var cycleDetails = [
    'یه طرف، تو یه معامله، به‌جای صداقت، کلاه می‌زنه.',
    'طرف مقابل دیر یا زود می‌فهمه که ضرر کرده.',
    'اون حسِ اعتمادی که بین دوطرف بود، می‌شکنه.',
    'دفعه‌ی بعد که معامله می‌کنن، طرف مقابل هم تلافی می‌کنه.',
    'چون هیچ‌کدوم دیگه مطمئن نیستن، از همکاریِ واقعی فرار می‌کنن.',
    'کل بازار محتاط‌تر و کم‌سودتر می‌مونه — تا یکی دوباره ریسک صداقت رو بپذیره.'
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

  /* ---------- Scene: shadow of the future ---------- */
  var futureSlider = document.getElementById('futureSlider');
  function renderFuture(){
    var v = parseInt(futureSlider.value,10);
    document.getElementById('futureLabel').textContent = toFa(v) + '٪ احتمالِ دیدارِ دوباره';
    document.getElementById('futureFill').style.width = v + '%';
    var cap;
    if (v < 30) cap = 'معامله‌ی تقریباً یک‌باره — وسوسه‌ی کلاه‌زدن بیشترین حالتشه.';
    else if (v < 70) cap = 'شاید دوباره همو ببینید — ریسکِ کلاه‌زدن داره بالا میاد.';
    else cap = 'تقریباً مطمئنی دوباره می‌بینیش — صداقت مطمئن‌ترین راهه.';
    document.getElementById('futureCaption').textContent = cap;
  }
  futureSlider.addEventListener('input', renderFuture);

  /* ---------- Scene: apply to real life ---------- */
  document.getElementById('realBtn').addEventListener('click', function(){
    var v = document.getElementById('realPartner').value.trim();
    var box = document.getElementById('realSuggestion');
    if (!v){ box.textContent = 'اول یه اسم بنویس :)'; box.classList.add('show'); return; }
    box.textContent = '«' + v + '» رو در نظر بگیر: دفعه‌ی اول با صداقت کامل شروع کن، رفتارش رو تلافی کن (نه بیشتر، نه کمتر)، و اگه یک‌بار اشتباه کرد قبل از قطع همکاری یک‌بار ببخش.';
    box.classList.add('show');
  });

  /* ---------- Scene: summary ---------- */
  function drawSummary(){
    var svg = document.getElementById('svgSummary'); svg.innerHTML='';
    if (trust >= 60) FCDraw.drawHandshake(svg, 100, 100, 1.3, COOL);
    else if (trust >= 40) FCDraw.drawFace(svg, 100, 100, 0.8, '#DDD3C4', 'neutral');
    else FCDraw.drawFace(svg, 100, 100, 0.8, '#E7C7BE', 'sad');
  }
  function showResult(){
    var msg;
    if (trust < 40) msg = 'اعتماد بازار بهت پایینه (' + toFa(Math.round(trust)) + '٪) — تو کوتاه‌مدت شاید ' + toFa(coins) + ' سکه جمع کرده باشی، ولی شهرتت تو بازار خراب شده.';
    else if (trust < 70) msg = 'اعتماد بازار: ' + toFa(Math.round(trust)) + '٪ — تعادل خوبی بین سود و اعتبار داشتی. سکه‌های تو: ' + toFa(coins) + '.';
    else msg = 'شریک قابل‌اعتماد بازار شدی! اعتماد: ' + toFa(Math.round(trust)) + '٪، سکه‌ها: ' + toFa(coins) + ' — این شهرت بلندمدت، از هر کلاه‌برداری کوتاه‌مدت باارزش‌تره.';
    document.getElementById('resultTag').textContent = msg;
  }

  /* ---------- wiring ---------- */
  var engine = FCScene.init({
    sceneSelector: '.scene',
    dotsSelector: '#dots',
    prevBtnId: 'prevBtn',
    nextBtnId: 'nextBtn',
    finishLabel: 'دوباره از اول',
    onFinish: function(){ location.reload(); },
    onEnter: function(i, name){
      if (name === 'round-honest') initRoundScene('honest');
      if (name === 'round-cheat') initRoundScene('cheat');
      if (name === 'round-copy') initRoundScene('copy');
      if (name === 'cycle') { setupCycle(); FCDraw.drawCycleArrows(document.getElementById('cycleSvg'), 6, WARM); }
      if (name === 'shadow') renderFuture();
      if (name === 'summary'){ drawSummary(); showResult(); }
    }
  });
  document.getElementById('introNext').addEventListener('click', function(){ engine.goto(engine.current()+1); });
  document.getElementById('replayBtn').addEventListener('click', function(){ location.reload(); });

  updateMeter();
})();
