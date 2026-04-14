// ── 工具函数 ──────────────────────────────────────────
const $ = id => document.getElementById(id);
const seededRand = (seed, max) => {
  let x = Math.sin(seed) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
};
const todaySeed = () => {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
};
const pick = (arr, seed) => arr[seededRand(seed, arr.length)];
const stars = n => '★'.repeat(n) + '☆'.repeat(5-n);

// ── 星空背景 ──────────────────────────────────────────
function initStars() {
  const canvas = $('starCanvas');
  const ctx = canvas.getContext('2d');
  let W = window.innerWidth, H = window.innerHeight;
  canvas.width = W; canvas.height = H;

  const pts = Array.from({length:180}, () => ({
    x: Math.random()*W, y: Math.random()*H,
    r: Math.random()*2+0.3,
    a: Math.random(),
    spd: Math.random()*0.008+0.003,
  }));

  function draw() {
    ctx.clearRect(0,0,W,H);
    pts.forEach(p => {
      p.a += p.spd;
      const alpha = (Math.sin(p.a)+1)/2 * 0.7 + 0.1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(200,180,255,${alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();

  window.addEventListener('resize', () => {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    pts.forEach(p => { p.x = Math.random()*W; p.y = Math.random()*H; });
  });
}

// ── 头部日期 ──────────────────────────────────────────
function initHeader() {
  const now = new Date();
  const days = ['日','一','二','三','四','五','六'];
  $('headerDate').textContent =
    `${now.getMonth()+1}月${now.getDate()}日 · 星期${days[now.getDay()]}`;
}

// ── Tab切换 ──────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      $('tab-'+btn.dataset.tab).classList.add('active');
    });
  });
}

// ══════════════════════════════
// 每日运势
// ══════════════════════════════
function initFortune() {
  let selectedZodiac = null;

  document.querySelectorAll('.zodiac-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.zodiac-item').forEach(z => z.classList.remove('active'));
      item.classList.add('active');
      selectedZodiac = item.dataset.zodiac;
      showFortune(selectedZodiac, item.dataset.symbol);
    });
  });

  // 恢复上次选择
  const saved = localStorage.getItem('zodiac');
  if (saved) {
    const item = document.querySelector(`.zodiac-item[data-zodiac="${saved}"]`);
    if (item) item.click();
  }
}

function showFortune(zodiac, symbol) {
  localStorage.setItem('zodiac', zodiac);
  const seed = todaySeed();
  const zd = ZODIAC_DATA[zodiac];

  // 计算运势分数
  const score = 60 + seededRand(seed + zodiac.charCodeAt(0), 36);
  $('orbScore').textContent = score;
  $('orbSymbol').textContent = symbol;
  $('zodiacTag').textContent = zodiac;

  // 各项评分
  const ms = 2 + seededRand(seed+1+zodiac.charCodeAt(0), 4);
  const ls = 2 + seededRand(seed+2+zodiac.charCodeAt(0), 4);
  const cs = 2 + seededRand(seed+3+zodiac.charCodeAt(0), 4);
  const hs = 2 + seededRand(seed+4+zodiac.charCodeAt(0), 4);

  $('starMoney').textContent = stars(ms);
  $('starLove').textContent  = stars(ls);
  $('starCareer').textContent= stars(cs);
  $('starHealth').textContent= stars(hs);

  $('descMoney').textContent  = pick(MONEY_DESC,  seed+zodiac.charCodeAt(0)+1);
  $('descLove').textContent   = pick(LOVE_DESC,   seed+zodiac.charCodeAt(0)+2);
  $('descCareer').textContent = pick(CAREER_DESC, seed+zodiac.charCodeAt(0)+3);
  $('descHealth').textContent = pick(HEALTH_DESC, seed+zodiac.charCodeAt(0)+4);
  $('summaryText').textContent= pick(SUMMARIES,   seed+zodiac.charCodeAt(0));

  $('luckyColor').textContent = zd.lucky[0];
  $('luckyNum').textContent   = zd.lucky[1];
  $('luckyDo').textContent    = zd.lucky[2];
  $('luckyDont').textContent  = zd.lucky[3];

  $('fortuneDetail').style.display = 'block';
  $('fortuneDetail').style.animation = 'none';
  requestAnimationFrame(() => {
    $('fortuneDetail').style.animation = 'fadeUp 0.5s cubic-bezier(0.16,1,0.3,1)';
  });

  // 显示本周走势图
  const wrap = $('weekChartWrap');
  if (wrap) {
    wrap.style.display = 'block';
    // 等待 DOM 渲染完成后再绘制，确保 canvas 有宽度
    requestAnimationFrame(() => drawWeekChart(zodiac));
  }
}

// ══════════════════════════════
// 塔罗占卜
// ══════════════════════════════
function initTarot() {
  let flipped = false;

  function resetDeck() {
    flipped = false;
    $('tarotResult').style.display = 'none';
    $('tarotDeck').style.display = 'block';
    document.querySelectorAll('.deck-card').forEach(c => {
      c.style.transform = '';
      c.textContent = '🔮';
    });
  }

  document.querySelectorAll('.deck-card').forEach(card => {
    card.addEventListener('click', () => {
      if (flipped) return;
      flipped = true;

      card.style.transform = 'rotateY(180deg) scale(1.1)';
      card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1)';

      const q = $('tarotQuestion').value;
      const seed = Date.now() + parseInt(card.dataset.idx);
      const picked = TAROT_CARDS[seededRand(seed, TAROT_CARDS.length)];

      setTimeout(() => {
        card.textContent = picked.emoji;
        setTimeout(() => {
          $('tarotDeck').style.display = 'none';
          $('resultEmoji').textContent = picked.emoji;
          $('resultName').textContent  = picked.name;
          $('resultType').textContent  = picked.type;
          $('resultMeaning').textContent = picked.meaning;
          $('resultAdvice').textContent  = picked.advice;
          $('resultAffirmation').textContent = picked.affirmation;
          $('tarotResult').style.display = 'block';
        }, 400);
      }, 300);
    });
  });

  $('tarotRetry').addEventListener('click', resetDeck);
}

// ══════════════════════════════
// 开运壁纸
// ══════════════════════════════
function drawWallpaperToCanvas(canvas, theme, w, h) {
  const ctx = canvas.getContext('2d');
  canvas.width = w; canvas.height = h;

  // 渐变背景
  const grad = ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0, theme.colors[0]);
  grad.addColorStop(1, theme.colors[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,w,h);

  const cx = w/2, cy = h/2;
  const ac = theme.accent, gc = theme.glow;

  // 星星
  const rng = (s,mx) => { let x=Math.sin(s)*10000; return ((x-Math.floor(x))*mx)|0; };
  for(let i=0;i<80;i++){
    const x=rng(i*7+1,w), y=rng(i*13+2,h);
    const r=rng(i*3,2)+0.5, a=(rng(i*5,80)+40)/255;
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle=`rgba(255,240,200,${a})`; ctx.fill();
  }

  // 中心光晕
  const hg = ctx.createRadialGradient(cx,cy,0,cx,cy,h*0.35);
  hg.addColorStop(0, ac+'33'); hg.addColorStop(1,'transparent');
  ctx.fillStyle = hg; ctx.fillRect(0,0,w,h);

  // 魔法圆
  const R = w*0.35;
  ctx.strokeStyle = ac+'90'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.stroke();
  ctx.strokeStyle = ac+'50'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx,cy,R*0.7,0,Math.PI*2); ctx.stroke();

  // 五芒星
  ctx.strokeStyle = gc+'80'; ctx.lineWidth = 1;
  const pts5 = Array.from({length:5},(_,i)=>{
    const a=Math.PI*2*i/5 - Math.PI/2;
    return [cx+R*0.7*Math.cos(a), cy+R*0.7*Math.sin(a)];
  });
  for(let i=0;i<5;i++){
    ctx.beginPath();
    ctx.moveTo(...pts5[i]); ctx.lineTo(...pts5[(i+2)%5]);
    ctx.stroke();
  }

  // 圆周点
  for(let i=0;i<12;i++){
    const a=Math.PI*2*i/12-Math.PI/2;
    const dx=cx+R*Math.cos(a), dy=cy+R*Math.sin(a);
    const dr=i%3===0?4:2;
    ctx.beginPath(); ctx.arc(dx,dy,dr,0,Math.PI*2);
    ctx.fillStyle=i%3===0?ac+'DD':ac+'88'; ctx.fill();
  }

  // 中心大字
  const fs = w*0.42;
  ctx.font = `${fs}px serif`;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  // 发光
  ctx.shadowColor=gc; ctx.shadowBlur=30;
  ctx.fillStyle=ac+'BB'; ctx.fillText(theme.char, cx, cy);
  ctx.shadowBlur=0;

  // 标题
  ctx.font = `bold ${w*0.09}px serif`;
  ctx.fillStyle='rgba(255,255,255,0.95)';
  ctx.shadowColor=ac; ctx.shadowBlur=15;
  ctx.fillText(theme.name, cx, cy+R+w*0.12);
  ctx.shadowBlur=0;

  // 副文字
  ctx.font = `${w*0.055}px sans-serif`;
  ctx.fillStyle='rgba(255,255,255,0.55)';
  ctx.fillText(theme.desc, cx, cy+R+w*0.2);

  // 水印
  ctx.font = `${w*0.04}px sans-serif`;
  ctx.fillStyle='rgba(255,255,255,0.3)';
  ctx.fillText('@坏事上早八', cx, h-w*0.05);
}

function initWallpaper() {
  const grid = $('wallpaperGrid');
  grid.innerHTML = '';

  WALLPAPER_THEMES.forEach((theme, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'wallpaper-thumb';
    const cv = document.createElement('canvas');
    const label = document.createElement('div');
    label.className = 'wallpaper-thumb-label';
    label.textContent = theme.name;
    wrap.append(cv, label);
    grid.appendChild(wrap);

    // 缩略图尺寸
    drawWallpaperToCanvas(cv, theme, 180, 320);

    wrap.addEventListener('click', () => showWallpaperPreview(theme));
  });

  $('btnClosePreview').addEventListener('click', () => {
    $('wallpaperPreview').style.display = 'none';
  });
  $('previewBackdrop').addEventListener('click', () => {
    $('wallpaperPreview').style.display = 'none';
  });

  $('btnDownload').addEventListener('click', () => {
    const cvBig = document.createElement('canvas');
    const currentTheme = $('previewName').__theme;
    if (!currentTheme) return;
    drawWallpaperToCanvas(cvBig, currentTheme, 1080, 1920);
    const a = document.createElement('a');
    a.download = `${currentTheme.name}_开运壁纸_坏事上早八.png`;
    a.href = cvBig.toDataURL('image/png');
    a.click();
  });
}

function showWallpaperPreview(theme) {
  const cv = $('wallpaperCanvas');
  drawWallpaperToCanvas(cv, theme, 270, 480);
  $('previewName').textContent = theme.name;
  $('previewName').__theme = theme;
  $('previewDesc').textContent = theme.desc;
  $('wallpaperPreview').style.display = 'flex';
}

// ══════════════════════════════
// 许愿墙
// ══════════════════════════════
function initWish() {
  const input = $('wishInput');
  const wall  = $('wishWall');
  let wishes  = JSON.parse(localStorage.getItem('wishes')||'[]');

  input.addEventListener('input', () => {
    $('wishCount').textContent = input.value.length;
  });

  function renderWishes() {
    wall.innerHTML = '';
    wishes.slice(-30).reverse().forEach(w => {
      const div = document.createElement('div');
      div.className = 'wish-bubble';
      div.innerHTML = `${w.text}<div class="wish-time">${w.time}</div>`;
      wall.appendChild(div);
    });
  }
  renderWishes();

  $('btnWish').addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;
    const now = new Date();
    const time = `${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
    wishes.push({text, time});
    localStorage.setItem('wishes', JSON.stringify(wishes));
    input.value = '';
    $('wishCount').textContent = 0;
    renderWishes();

    // 烟花效果
    $('btnWish').textContent = '🎇 心愿已送达宇宙！';
    setTimeout(() => { $('btnWish').textContent = '✨ 许愿'; }, 2000);
  });
}

// ══════════════════════════════
// 玄学日历
// ══════════════════════════════
function initCalendar() {
  let now = new Date();
  let year = now.getFullYear(), month = now.getMonth();
  let selectedDay = now.getDate();

  function renderCalendar() {
    const months = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
    $('calMonth').textContent = `${year}年 ${months[month]}`;

    const first = new Date(year,month,1).getDay();
    const days  = new Date(year,month+1,0).getDate();
    const today = new Date();

    const container = $('calDays');
    container.innerHTML = '';

    // 上月补位
    for(let i=0;i<first;i++){
      const d=document.createElement('div');
      d.className='cal-day empty other-month';
      container.appendChild(d);
    }

    // 当月日期
    const emojis=['🌟','✨','🔮','🌙','⭐','💫','🌸','🍀','🎋','🌺'];
    for(let d=1;d<=days;d++){
      const div=document.createElement('div');
      div.className='cal-day';
      const seed=year*10000+month*100+d;
      const emoji=emojis[seededRand(seed,emojis.length)];
      const isToday=d===today.getDate()&&month===today.getMonth()&&year===today.getFullYear();
      if(isToday) div.classList.add('today');
      if(d===selectedDay&&month===now.getMonth()&&year===now.getFullYear()) div.classList.add('selected');
      div.innerHTML=`<span class="day-num">${d}</span><span class="day-emoji">${emoji}</span>`;
      div.addEventListener('click',()=>{
        document.querySelectorAll('.cal-day').forEach(x=>x.classList.remove('selected'));
        div.classList.add('selected');
        selectedDay=d;
        showDayDetail(year,month,d);
      });
      container.appendChild(div);
    }

    showDayDetail(year,month,selectedDay);
  }

  function showDayDetail(y,m,d) {
    const months=['一','二','三','四','五','六','七','八','九','十','十一','十二'];
    $('detailDate').textContent=`${y}年${months[m]}月${d}日 · 玄学日历`;
    const seed=y*10000+m*100+d;
    const yi1=pick(YI_LIST, seed);
    const yi2=pick(YI_LIST, seed+7);
    const ji1=pick(JI_LIST,  seed+3);
    $('detailYi').textContent=`${yi1}、${yi2}`;
    $('detailJi').textContent=ji1;
    $('detailGod').textContent=pick(GODS, seed+5);
    $('detailSign').textContent=pick(SIGNS, seed+11);
    $('detailAffirmation').textContent=pick(DAY_AFFIRMATIONS, seed+13);
  }

  $('calPrev').addEventListener('click',()=>{
    month--; if(month<0){month=11;year--;}
    renderCalendar();
  });
  $('calNext').addEventListener('click',()=>{
    month++; if(month>11){month=0;year++;}
    renderCalendar();
  });

  renderCalendar();
}

// ── 启动 ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded',()=>{
  initStars();
  initHeader();
  initTabs();
  initFortune();
  initTarot();
  initWallpaper();
  initWish();
  initCalendar();
  initMusicControl();
  initShareImage();
  initWeekChart();
});

/* ══════════════════════════════════════════════════
   功能2：背景氛围音乐（Web Audio API 纯合成）
══════════════════════════════════════════════════ */
function initMusicControl() {
  const btn = $('musicBtn');
  let audioCtx = null;
  let masterGain = null;
  let oscillators = [];
  let playing = false;
  let userInteracted = false;

  // 标记用户已交互（浏览器限制）
  document.addEventListener('click', () => { userInteracted = true; }, { once: true });

  function createAmbientSound() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 2.5);
    masterGain.connect(audioCtx.destination);

    // 432Hz 基础嗡鸣
    const addOsc = (freq, gainVal, type) => {
      const osc = audioCtx.createOscillator();
      const g   = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      g.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      osc.connect(g);
      g.connect(masterGain);
      osc.start();
      oscillators.push(osc);
    };

    addOsc(432, 0.6);          // 主音
    addOsc(432 * 1.5, 0.2);   // 五度泛音
    addOsc(432 * 0.5, 0.3);   // 低频次谐波
    addOsc(174, 0.15);         // 174Hz 地基共鸣

    // 慢速颤音 LFO（~0.08Hz）
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.setValueAtTime(0.08, audioCtx.currentTime);
    lfoGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);
    lfo.start();
    oscillators.push(lfo);
  }

  function stopAmbientSound() {
    if (!masterGain) return;
    const t = audioCtx.currentTime;
    masterGain.gain.linearRampToValueAtTime(0, t + 1.5);
    setTimeout(() => {
      oscillators.forEach(o => { try { o.stop(); } catch(e){} });
      oscillators = [];
      masterGain = null;
    }, 1600);
  }

  btn.addEventListener('click', () => {
    if (!userInteracted) userInteracted = true;
    if (playing) {
      stopAmbientSound();
      playing = false;
      btn.textContent = '🎵';
      btn.classList.remove('playing');
    } else {
      createAmbientSound();
      playing = true;
      btn.textContent = '🔊';
      btn.classList.add('playing');
    }
  });
}

/* ══════════════════════════════════════════════════
   功能3：本周运势走势图
══════════════════════════════════════════════════ */
// 基于星座+日期的 seeded 随机分数（60~95）
function getWeekScore(zodiac, dayOffset) {
  const base = new Date();
  base.setDate(base.getDate() + dayOffset);
  const y = base.getFullYear(), m = base.getMonth()+1, d = base.getDate();
  const seed = y * 10000 + m * 100 + d + zodiac.charCodeAt(0) * 97;
  let x = Math.sin(seed) * 99991;
  return 60 + Math.floor((x - Math.floor(x)) * 36);
}

function drawWeekChart(zodiac) {
  const canvas = $('weekChartCanvas');
  if (!canvas) return;

  // 适配真实像素
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const W = rect.width  || 320;
  const H = rect.height || 160;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const pad = { top:16, right:16, bottom:28, left:32 };
  const cw = W - pad.left - pad.right;
  const ch = H - pad.top  - pad.bottom;

  // 清空
  ctx.clearRect(0, 0, W, H);

  // 背景
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, 0, 0, W, H, 10);
  ctx.fill();

  // 今天是周几（0=周日）
  const today = new Date();
  const todayDow = today.getDay(); // 0=Sun
  // 周一为起点，计算本周一到周日的 offset
  // offset = dayIdx - (todayDow==0 ? 6 : todayDow-1)
  const mondayOffset = todayDow === 0 ? -6 : -(todayDow - 1);
  const dayLabels = ['一','二','三','四','五','六','日'];

  const series = [
    { key:'money',  color:'#FFB800', offsets:[] },
    { key:'love',   color:'#F472B6', offsets:[] },
    { key:'career', color:'#22D3EE', offsets:[] },
    { key:'health', color:'#4ADE80', offsets:[] },
  ];

  // 生成每条线7天数据
  series.forEach((s, si) => {
    for (let i = 0; i < 7; i++) {
      const rawOffset = mondayOffset + i;
      const baseSeed = zodiac.charCodeAt(0) * 97 + si * 31;
      const base = new Date();
      base.setDate(base.getDate() + rawOffset);
      const y = base.getFullYear(), m = base.getMonth()+1, d = base.getDate();
      const seed = y * 10000 + m * 100 + d + baseSeed;
      let x = Math.sin(seed) * 99991;
      s.offsets.push(60 + Math.floor((x - Math.floor(x)) * 36));
    }
  });

  const allScores = series.flatMap(s => s.offsets);
  const minS = Math.min(...allScores) - 4;
  const maxS = Math.max(...allScores) + 4;

  const xPos = i => pad.left + (i / 6) * cw;
  const yPos = v => pad.top + ch - ((v - minS) / (maxS - minS)) * ch;

  // 网格线
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (i / 4) * ch;
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y); ctx.stroke();
  }

  // X轴标签（周一~周日）
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = `${10 * Math.min(1, W/320)}px sans-serif`;
  ctx.textAlign = 'center';
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = (mondayOffset + i === 0) ? 'rgba(255,184,0,0.9)' : 'rgba(255,255,255,0.4)';
    ctx.fillText(dayLabels[i], xPos(i), H - 6);
  }

  // 画4条折线
  series.forEach(s => {
    // 渐变填充
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + ch);
    grad.addColorStop(0, s.color + '22');
    grad.addColorStop(1, s.color + '00');

    ctx.beginPath();
    s.offsets.forEach((v, i) => {
      const x = xPos(i), y = yPos(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    // 填充区域
    ctx.lineTo(xPos(6), pad.top + ch);
    ctx.lineTo(xPos(0), pad.top + ch);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 折线本体
    ctx.beginPath();
    s.offsets.forEach((v, i) => {
      const x = xPos(i), y = yPos(v);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 1.8;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 数据点
    s.offsets.forEach((v, i) => {
      const x = xPos(i), y = yPos(v);
      const isToday = (mondayOffset + i === 0);
      ctx.beginPath();
      ctx.arc(x, y, isToday ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isToday ? '#fff' : s.color;
      ctx.fill();
      if (isToday) {
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });
  });

  // Y轴最高/最低标注
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.textAlign = 'right';
  ctx.font = '9px sans-serif';
  ctx.fillText(maxS, pad.left - 3, pad.top + 4);
  ctx.fillText(minS, pad.left - 3, pad.top + ch);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function initWeekChart() {
  // 初始隐藏，选择星座后显示
  const wrap = $('weekChartWrap');
  if (wrap) wrap.style.display = 'none';
}

/* ══════════════════════════════════════════════════
   功能1：运势分享图生成（Canvas 1080x1080）
══════════════════════════════════════════════════ */
function initShareImage() {
  const btnShare   = $('btnShareImg');
  const preview    = $('sharePreview');
  const backdrop   = $('shareBackdrop');
  const btnDl      = $('btnShareDownload');
  const btnClose   = $('btnShareClose');

  if (!btnShare) return;

  btnShare.addEventListener('click', () => {
    const zodiac  = localStorage.getItem('zodiac');
    if (!zodiac) {
      alert('请先选择你的星座～');
      return;
    }
    generateShareImage(zodiac);
    preview.style.display = 'flex';
  });

  backdrop.addEventListener('click', () => { preview.style.display = 'none'; });
  btnClose.addEventListener('click',  () => { preview.style.display = 'none'; });

  btnDl.addEventListener('click', () => {
    const zodiac = localStorage.getItem('zodiac') || '星座';
    // 生成高清 1080x1080
    const bigCanvas = document.createElement('canvas');
    const zodiacItem = document.querySelector(`.zodiac-item[data-zodiac="${zodiac}"]`);
    const symbol = zodiacItem ? zodiacItem.dataset.symbol : '✨';
    renderShareCanvas(bigCanvas, zodiac, symbol, 1080);
    const a = document.createElement('a');
    a.download = `${zodiac}_开运分享图_坏事上早八.png`;
    a.href = bigCanvas.toDataURL('image/png');
    a.click();
  });
}

function generateShareImage(zodiac) {
  const canvas = $('shareCanvas');
  const zodiacItem = document.querySelector(`.zodiac-item[data-zodiac="${zodiac}"]`);
  const symbol = zodiacItem ? zodiacItem.dataset.symbol : '✨';
  renderShareCanvas(canvas, zodiac, symbol, 360);
}

function renderShareCanvas(canvas, zodiac, symbol, size) {
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const S = size;
  const cx = S / 2, cy = S / 2;

  // ── 深空渐变背景 ──
  const bg = ctx.createRadialGradient(cx, cy*0.7, 0, cx, cy, S*0.75);
  bg.addColorStop(0, '#1a073a');
  bg.addColorStop(0.55, '#0a0520');
  bg.addColorStop(1, '#050110');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);

  // ── 随机星点 ──
  for (let i = 0; i < 120; i++) {
    const sx = seededRand(i * 13 + 7, S);
    const sy = seededRand(i * 19 + 3, S);
    const sr = (seededRand(i * 5 + 1, 10) + 3) / 10;
    const sa = (seededRand(i * 7 + 2, 70) + 30) / 100;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,200,255,${sa})`;
    ctx.fill();
  }

  // ── 中心光晕 ──
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.42);
  glow.addColorStop(0, 'rgba(192,132,252,0.22)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  // ── 装饰圆环 ──
  ctx.strokeStyle = 'rgba(192,132,252,0.2)';
  ctx.lineWidth = S * 0.003;
  ctx.beginPath(); ctx.arc(cx, cy, S * 0.42, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,184,0,0.12)';
  ctx.beginPath(); ctx.arc(cx, cy, S * 0.46, 0, Math.PI * 2); ctx.stroke();

  const seed = todaySeed();
  const zc = zodiac.charCodeAt(0);
  const score = 60 + seededRand(seed + zc, 36);
  const ms = 2 + seededRand(seed+1+zc, 4);
  const ls = 2 + seededRand(seed+2+zc, 4);
  const cs = 2 + seededRand(seed+3+zc, 4);
  const hs = 2 + seededRand(seed+4+zc, 4);
  const summaryText = pick(SUMMARIES, seed + zc);

  const fs = n => Math.round(S * n);

  // ── 顶部星座符号 ──
  ctx.font = `${fs(0.11)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#C084FC';
  ctx.shadowBlur = S * 0.04;
  ctx.fillStyle = 'rgba(220,180,255,0.9)';
  ctx.fillText(symbol, cx, cy * 0.38);
  ctx.shadowBlur = 0;

  // ── 星座名称 ──
  ctx.font = `600 ${fs(0.055)}px serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(zodiac, cx, cy * 0.38 + fs(0.075));

  // ── 今日运势大分 ──
  ctx.font = `700 ${fs(0.18)}px serif`;
  const scoreGrad = ctx.createLinearGradient(cx - fs(0.1), 0, cx + fs(0.1), 0);
  scoreGrad.addColorStop(0, '#FFB800');
  scoreGrad.addColorStop(1, '#C084FC');
  ctx.fillStyle = scoreGrad;
  ctx.shadowColor = '#FFB800';
  ctx.shadowBlur = S * 0.05;
  ctx.fillText(score, cx, cy);
  ctx.shadowBlur = 0;

  ctx.font = `${fs(0.035)}px serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('今日综合运势', cx, cy + fs(0.115));

  // ── 四格星级 ──
  const boxes = [
    { label:'💰财运', s: ms, color:'#FFB800' },
    { label:'💕爱情', s: ls, color:'#F472B6' },
    { label:'💼事业', s: cs, color:'#22D3EE' },
    { label:'🌿健康', s: hs, color:'#4ADE80' },
  ];
  const bw = S * 0.2, bh = S * 0.1, gap = S * 0.025;
  const totalW = bw * 4 + gap * 3;
  const bStartX = cx - totalW / 2;
  const bY = cy + fs(0.165);

  boxes.forEach((b, i) => {
    const bx = bStartX + i * (bw + gap);
    // 背景
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    roundRect(ctx, bx, bY, bw, bh, S * 0.012);
    ctx.fill();
    ctx.strokeStyle = b.color + '55';
    ctx.lineWidth = 1;
    ctx.stroke();
    // 标签
    ctx.font = `${fs(0.028)}px sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.textAlign = 'center';
    ctx.fillText(b.label, bx + bw/2, bY + bh * 0.34);
    // 星级
    ctx.font = `${fs(0.026)}px sans-serif`;
    ctx.fillStyle = b.color;
    ctx.fillText('★'.repeat(b.s) + '☆'.repeat(5-b.s), bx + bw/2, bY + bh * 0.72);
  });

  // ── 今日玄言 ──
  const qY = bY + bh + fs(0.055);
  ctx.strokeStyle = 'rgba(192,132,252,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx - S*0.3, qY - fs(0.02)); ctx.lineTo(cx + S*0.3, qY - fs(0.02)); ctx.stroke();

  ctx.font = `${fs(0.033)}px serif`;
  ctx.fillStyle = 'rgba(192,132,252,0.9)';
  ctx.textAlign = 'center';
  // 截短玄言，最多展示 24 字
  const shortSummary = summaryText.length > 24 ? summaryText.slice(0, 24) + '…' : summaryText;
  ctx.fillText(shortSummary, cx, qY + fs(0.005));

  // ── 水印 ──
  ctx.font = `${fs(0.03)}px sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.textAlign = 'center';
  ctx.fillText('@坏事上早八', cx, S - fs(0.04));
}
