// ============================================================
//  ✨ MAFIA // PROTOCOL — SKILL EFFECTS v2.0
//  skill-effects.js
//  전체화면 이펙트 + 사운드 완전 통합
//  카드 이펙트 제거 → 화면 전체 몰입 연출
// ============================================================

const SkillFX = (() => {

  // ── CSS 키프레임 1회 주입 ──────────────────────────────────
  function injectStyles() {
    if (document.getElementById('sfx-keyframes')) return;
    const s = document.createElement('style');
    s.id = 'sfx-keyframes';
    s.textContent = `
      @keyframes sfxBgIn     { to { opacity: 1; } }
      @keyframes sfxRingOut  { to { transform: translate(-50%,-50%) scale(5); opacity: 0; } }
      @keyframes sfxIconIn   { from { opacity:0; transform:translate(-50%,-55%) scale(0.15) rotate(-15deg); } to { opacity:1; transform:translate(-50%,-55%) scale(1) rotate(0); } }
      @keyframes sfxIconFloat{ 0%,100%{transform:translate(-50%,-55%) scale(1)} 50%{transform:translate(-50%,-58%) scale(1.04)} }
      @keyframes sfxGlow     { from { filter:drop-shadow(0 0 8px var(--sfx-c,#00c8ff)); } to { filter:drop-shadow(0 0 36px var(--sfx-c,#00c8ff)); } }
      @keyframes sfxLabelIn  { from { opacity:0; letter-spacing:0.6em; } to { opacity:1; letter-spacing:0.18em; } }
      @keyframes sfxSubIn    { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
      @keyframes sfxCorner   { to { opacity:1; } }
      @keyframes sfxScanline { 0%{top:-4px} 100%{top:calc(100% + 4px)} }
      @keyframes sfxGrid     { 0%{opacity:0.3} 100%{opacity:0} }
      @keyframes sfxFlash    { 0%{opacity:0} 15%{opacity:1} 100%{opacity:0} }
      @keyframes sfxOut      { to { opacity:0; transform:scale(1.06); } }

      /* 포섭 전용 */
      @keyframes recruitBg   { 0%{opacity:0} 20%{opacity:1} 100%{opacity:0.85} }
      @keyframes recruitCrack{ from{stroke-dashoffset:var(--len)} to{stroke-dashoffset:0} }
      @keyframes recruitText { 0%{opacity:0;letter-spacing:0.5em} 30%{opacity:1;letter-spacing:0.08em} 100%{opacity:1} }
      @keyframes recruitGlitch{ 0%,90%,100%{clip-path:none;transform:none} 91%{clip-path:polygon(0 30%,100% 30%,100% 50%,0 50%);transform:translateX(-5px)} 95%{clip-path:none;transform:none} }

      /* 포섭당함 전용 */
      @keyframes recBlood    { 0%{opacity:0;transform:scaleY(0)} 100%{opacity:1;transform:scaleY(1)} }
      @keyframes recHeart    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }

      /* 사망 공지 */
      @keyframes deathFlash  { 0%{opacity:0} 10%{opacity:1} 100%{opacity:0} }
    `;
    document.head.appendChild(s);
  }

  // ── 오버레이 생성 헬퍼 ────────────────────────────────────
  function makeOverlay(zIndex = 9800) {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;inset:0;z-index:${zIndex};pointer-events:none;overflow:hidden`;
    document.body.appendChild(el);
    return el;
  }

  // ── 직업별 설정 ───────────────────────────────────────────
  const CFG = {
    POLICE:    { color:'rgba(0,200,255,0.22)',  text:'#00c8ff', icon:'🔎', label:'경찰 조사',    sub:'SCANNING...',      rings:3, sound:'scan'    },
    DETECTIVE: { color:'rgba(255,34,68,0.18)',  text:'#ff6688', icon:'🕵️', label:'관계 분석',    sub:'ANALYZING...',     rings:4, sound:'analyze' },
    WATCHMAN:  { color:'rgba(0,200,255,0.18)',  text:'#00c8ff', icon:'📡', label:'정밀 감시',    sub:'MONITORING...',    rings:3, sound:'cctv'    },
    SHAMAN:    { color:'rgba(167,139,250,0.22)',text:'#a78bfa', icon:'🔮', label:'혼령 교신',    sub:'COMMUNING...',     rings:2, sound:'shaman'  },
    ARCHIVIST: { color:'rgba(180,200,220,0.15)',text:'#b8ddf0', icon:'📁', label:'기록 열람',    sub:'RETRIEVING...',    rings:2, sound:'rewind'  },
    DOCTOR:    { color:'rgba(0,255,136,0.2)',   text:'#00ff88', icon:'💊', label:'응급 처치',    sub:'STABILIZING...',   rings:3, sound:'heal'    },
    SOLDIER:   { color:'rgba(0,200,255,0.18)',  text:'#00c8ff', icon:'🛡️', label:'초소 경계',    sub:'GUARDING...',      rings:2, sound:'shield'  },
    BOSS_recruit:{ color:'rgba(120,0,30,0.35)', text:'#ff4466', icon:'👁️', label:'포섭 시도',    sub:'INFILTRATING...',  rings:5, sound:'recruit' },
    BOSS_kill: { color:'rgba(180,0,0,0.3)',     text:'#ff2244', icon:'💀', label:'살해 지시',    sub:'TARGETING...',     rings:4, sound:'kill'    },
    KILLER:    { color:'rgba(180,0,0,0.3)',     text:'#ff2244', icon:'🔫', label:'살해',          sub:'ELIMINATING...',   rings:4, sound:'kill'    },
    HACKER:    { color:'rgba(0,255,65,0.18)',   text:'#00ff41', icon:'💻', label:'정보 해킹',    sub:'HACKING...',       rings:5, sound:'hack'    },
    LAWYER:    { color:'rgba(255,183,0,0.18)',  text:'#ffb700', icon:'⚖️', label:'비밀 유지',    sub:'PROTECTING...',    rings:2, sound:'protect' },
    GAMBLER:   { color:'rgba(255,183,0,0.22)',  text:'#ffb700', icon:'🎰', label:'예측 베팅',    sub:'CALCULATING...',   rings:3, sound:'gamble'  },
    POLITICIAN:{ color:'rgba(255,183,0,0.18)',  text:'#ffb700', icon:'🏛️', label:'투표 행사',    sub:'VOTING...',        rings:2, sound:'gavel'   },
  };

  // ── 메인 전체화면 이펙트 ──────────────────────────────────
  function showFullFX(cfgKey, targetNick, duration = 2000) {
    injectStyles();
    const cfg = CFG[cfgKey];
    if (!cfg) return;

    const ov = makeOverlay(9800);
    ov.style.setProperty('--sfx-c', cfg.text);

    // 배경 글로우
    const bg = document.createElement('div');
    bg.style.cssText = `position:absolute;inset:0;background:radial-gradient(ellipse 75% 70% at 50% 50%,${cfg.color},transparent 72%);opacity:0;animation:sfxBgIn 0.4s ease forwards`;
    ov.appendChild(bg);

    // 스캔라인 (위에서 아래로)
    const scanLine = document.createElement('div');
    scanLine.style.cssText = `position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,${cfg.text},transparent);box-shadow:0 0 8px ${cfg.text};animation:sfxScanline 1.8s ease-in-out;top:-4px;opacity:0.6`;
    ov.appendChild(scanLine);

    // 격자 오버레이
    const grid = document.createElement('div');
    grid.style.cssText = `position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 40px,${cfg.text}08 40px,${cfg.text}08 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,${cfg.text}08 40px,${cfg.text}08 41px);animation:sfxGrid 1.8s ease forwards`;
    ov.appendChild(grid);

    // 코너 데코
    [['top:20px;left:20px;border-width:2px 0 0 2px','tl'],
     ['top:20px;right:20px;border-width:2px 2px 0 0','tr'],
     ['bottom:20px;left:20px;border-width:0 0 2px 2px','bl'],
     ['bottom:20px;right:20px;border-width:0 2px 2px 0','br']
    ].forEach(([pos]) => {
      const c = document.createElement('div');
      c.style.cssText = `position:absolute;${pos};width:48px;height:48px;border-style:solid;border-color:${cfg.text}60;opacity:0;animation:sfxCorner 0.3s 0.05s ease forwards`;
      ov.appendChild(c);
    });

    // 링 파동들
    for (let i = 0; i < cfg.rings; i++) {
      const size = 60 + i * 110;
      const ring = document.createElement('div');
      ring.style.cssText = `position:absolute;left:50%;top:50%;width:${size}px;height:${size}px;border-radius:50%;border:1.5px solid ${cfg.text}70;transform:translate(-50%,-50%) scale(0);animation:sfxRingOut ${0.65+i*0.14}s ${i*0.09}s ease-out forwards`;
      ov.appendChild(ring);
    }

    // 중앙 아이콘
    const iconWrap = document.createElement('div');
    iconWrap.style.cssText = `position:absolute;left:50%;top:50%;transform:translate(-50%,-55%);display:flex;flex-direction:column;align-items:center;gap:16px;opacity:0;animation:sfxIconIn 0.5s 0.06s cubic-bezier(0.34,1.56,0.64,1) forwards`;

    const iconEl = document.createElement('div');
    iconEl.style.cssText = `font-size:clamp(70px,16vw,115px);filter:drop-shadow(0 0 20px ${cfg.text});animation:sfxGlow 0.5s 0.3s ease-in-out infinite alternate`;
    iconEl.textContent = cfg.icon;

    const labelEl = document.createElement('div');
    labelEl.style.cssText = `font-family:'Orbitron',monospace;font-size:clamp(15px,3.5vw,25px);font-weight:900;letter-spacing:0.18em;color:${cfg.text};text-shadow:0 0 20px ${cfg.text};animation:sfxLabelIn 0.5s 0.25s ease forwards;opacity:0`;
    labelEl.textContent = cfg.label;

    const subEl = document.createElement('div');
    subEl.style.cssText = `font-family:'Share Tech Mono',monospace;font-size:clamp(10px,2vw,13px);color:rgba(200,220,240,0.55);letter-spacing:0.3em;animation:sfxSubIn 0.4s 0.45s ease forwards;opacity:0`;
    subEl.textContent = cfg.sub;

    if (targetNick) {
      const tEl = document.createElement('div');
      tEl.style.cssText = `font-family:'Share Tech Mono',monospace;font-size:clamp(12px,2.5vw,17px);color:rgba(255,255,255,0.55);letter-spacing:0.12em;animation:sfxSubIn 0.4s 0.55s ease forwards;opacity:0`;
      tEl.textContent = '▶ TARGET: ' + targetNick.toUpperCase();
      iconWrap.appendChild(iconEl);
      iconWrap.appendChild(labelEl);
      iconWrap.appendChild(tEl);
      iconWrap.appendChild(subEl);
    } else {
      iconWrap.appendChild(iconEl);
      iconWrap.appendChild(labelEl);
      iconWrap.appendChild(subEl);
    }
    ov.appendChild(iconWrap);

    // 사운드
    if (window.SoundFX) SoundFX.play(cfg.sound);

    // 자동 소멸
    clearTimeout(ov._t);
    ov._t = setTimeout(() => {
      ov.style.animation = 'sfxOut 0.4s ease forwards';
      setTimeout(() => ov.remove(), 420);
    }, duration);

    return ov;
  }

  // ── 포섭 전용 이펙트 (더 드라마틱하게) ───────────────────
  function showRecruitFX(targetNick) {
    injectStyles();
    const ov = makeOverlay(9800);

    // 붉은 핏빛 배경
    const bg = document.createElement('div');
    bg.style.cssText = 'position:absolute;inset:0;background:radial-gradient(ellipse 80% 80% at 50% 50%,rgba(120,0,20,0.5),rgba(5,0,0,0.7));opacity:0;animation:sfxBgIn 0.5s ease forwards';
    ov.appendChild(bg);

    // 균열 SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    const W = window.innerWidth, H = window.innerHeight;
    const cx = W/2, cy = H/2;
    for (let i = 0; i < 12; i++) {
      const angle = (i/12)*Math.PI*2;
      const len   = 120 + Math.random()*220;
      const ex    = cx + Math.cos(angle)*len;
      const ey    = cy + Math.sin(angle)*len;
      const line  = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1', cx); line.setAttribute('y1', cy);
      line.setAttribute('x2', ex); line.setAttribute('y2', ey);
      line.setAttribute('stroke', 'rgba(255,34,68,0.7)');
      line.setAttribute('stroke-width', 1 + Math.random());
      line.setAttribute('stroke-dasharray', len.toString());
      line.setAttribute('stroke-dashoffset', len.toString());
      line.style.animation = `recruitCrack 0.5s ${i*0.03}s ease forwards`;
      line.style.setProperty('--len', len);
      svg.appendChild(line);
    }
    ov.appendChild(svg);

    // 중앙 텍스트
    const txt = document.createElement('div');
    txt.style.cssText = `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center`;
    txt.innerHTML = `
      <div style="font-size:clamp(60px,14vw,100px);margin-bottom:16px;filter:drop-shadow(0 0 20px rgba(255,34,68,0.9));animation:sfxIconIn 0.5s 0.2s ease forwards;opacity:0">👁️</div>
      <div style="font-family:'Orbitron',monospace;font-size:clamp(14px,3.5vw,24px);font-weight:900;color:#ff4466;letter-spacing:0.15em;text-shadow:0 0 20px rgba(255,34,68,0.9);animation:recruitText 0.8s 0.4s ease forwards;opacity:0">포섭 시도</div>
      ${targetNick ? `<div style="font-family:'Share Tech Mono',monospace;font-size:clamp(11px,2.5vw,16px);color:rgba(255,100,100,0.7);letter-spacing:0.2em;margin-top:8px;animation:sfxSubIn 0.5s 0.7s ease forwards;opacity:0">▶ ${targetNick.toUpperCase()}</div>` : ''}
      <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:rgba(200,100,100,0.5);letter-spacing:0.35em;margin-top:12px;animation:sfxSubIn 0.5s 0.9s ease forwards;opacity:0">INFILTRATING...</div>
    `;
    ov.appendChild(txt);

    if (window.SoundFX) SoundFX.play('recruit');

    setTimeout(() => {
      ov.style.animation = 'sfxOut 0.4s ease forwards';
      setTimeout(() => ov.remove(), 420);
    }, 2200);
  }

  // ── 포섭 당함 전체화면 ────────────────────────────────────
  function showRecruitedFX() {
    injectStyles();
    const ov = makeOverlay(9900);

    // 핏빛 전체화면
    const bg = document.createElement('div');
    bg.style.cssText = 'position:absolute;inset:0;background:rgba(100,0,15,0.9);opacity:0;transition:opacity 0.3s';
    ov.appendChild(bg);
    setTimeout(() => bg.style.opacity = '1', 50);

    // 지지직 선들
    for (let i = 0; i < 10; i++) {
      const el = document.createElement('div');
      const y = Math.random()*100;
      el.style.cssText = `position:absolute;left:0;right:0;height:${2+Math.random()*8}px;top:${y}%;background:rgba(255,80,80,${0.2+Math.random()*0.3});animation:sfxFlash ${0.1+Math.random()*0.15}s ${i*0.05}s ease forwards`;
      ov.appendChild(el);
    }

    // 텍스트
    const txt = document.createElement('div');
    txt.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center';
    txt.innerHTML = `
      <div style="font-family:'Orbitron',monospace;font-size:clamp(20px,5vw,44px);font-weight:900;color:#ff2244;letter-spacing:0.1em;text-shadow:0 0 40px rgba(255,34,68,0.9);animation:recruitText 0.4s 0.2s ease forwards;opacity:0">당신은 포섭되었습니다.</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:clamp(10px,2vw,13px);color:rgba(255,150,150,0.6);letter-spacing:0.35em;margin-top:16px;animation:sfxSubIn 0.5s 0.7s ease forwards;opacity:0">// IDENTITY COMPROMISED</div>
    `;
    ov.appendChild(txt);

    if (window.SoundFX) SoundFX.play('recruited');

    setTimeout(() => {
      bg.style.opacity = '0';
      setTimeout(() => ov.remove(), 600);
    }, 2800);
  }

  // ── 타인에게 포섭 발생 시 글리치 ──────────────────────────
  function showRecruitOthersFX() {
    injectStyles();
    const ov = makeOverlay(7500);
    ov.style.cssText += ';border:3px solid rgba(255,34,68,0.7);box-shadow:inset 0 0 60px rgba(255,34,68,0.2)';
    ov.style.animation = 'sfxFlash 0.6s ease forwards';
    if (window.SoundFX) SoundFX.play('glitch');
    setTimeout(() => ov.remove(), 700);
  }

  // ── 도박꾼 예측 이펙트 ────────────────────────────────────
  function showGamblerFX(prediction) {
    injectStyles();
    const pMap = {
      death:     { color:'rgba(180,0,0,0.25)',     text:'#ff2244', label:'사망 예측',  icon:'☠️' },
      execution: { color:'rgba(200,120,0,0.25)',   text:'#ffb700', label:'처형 예측',  icon:'⚖️' },
      peace:     { color:'rgba(0,180,100,0.2)',    text:'#00ff88', label:'평화 예측',  icon:'🕊️' },
    };
    const cfg = pMap[prediction] || pMap.peace;
    const ov = makeOverlay(9800);

    const bg = document.createElement('div');
    bg.style.cssText = `position:absolute;inset:0;background:radial-gradient(ellipse 70% 70% at 50% 50%,${cfg.color},transparent 70%);opacity:0;animation:sfxBgIn 0.4s ease forwards`;
    ov.appendChild(bg);

    const content = document.createElement('div');
    content.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-55%);text-align:center;display:flex;flex-direction:column;align-items:center;gap:14px';
    content.innerHTML = `
      <div style="font-size:clamp(64px,14vw,100px);opacity:0;animation:sfxIconIn 0.5s 0.05s cubic-bezier(0.34,1.56,0.64,1) forwards">${cfg.icon}</div>
      <div style="font-family:'Orbitron',monospace;font-size:clamp(15px,3.5vw,24px);font-weight:900;letter-spacing:0.18em;color:${cfg.text};text-shadow:0 0 20px ${cfg.text};opacity:0;animation:sfxLabelIn 0.5s 0.3s ease forwards">${cfg.label}</div>
      <div style="font-family:'Share Tech Mono',monospace;font-size:11px;color:rgba(200,220,240,0.5);letter-spacing:0.3em;opacity:0;animation:sfxSubIn 0.4s 0.5s ease forwards">BET PLACED</div>
    `;
    ov.appendChild(content);

    if (window.SoundFX) SoundFX.play('gamble');
    setTimeout(() => {
      ov.style.animation = 'sfxOut 0.35s ease forwards';
      setTimeout(() => ov.remove(), 370);
    }, 1800);
  }

  // ── 공개 API ─────────────────────────────────────────────
  return {
    // 메인 진입점 — executeSkill에서 호출
    play(role, targetUID, extra) {
      const nick = window._nickCache?.[targetUID] || targetUID || '';

      if (role === 'BOSS') {
        const action = extra || 'recruit';
        if (action === 'recruit') showRecruitFX(nick);
        else showFullFX('BOSS_kill', nick);
        return;
      }
      if (role === 'GAMBLER') {
        showGamblerFX(targetUID); // targetUID = prediction
        return;
      }
      if (role === 'DETECTIVE') {
        const nick2 = window._nickCache?.[extra] || extra || '';
        showFullFX('DETECTIVE', nick + (nick2 ? ' + ' + nick2 : ''));
        return;
      }
      // 나머지 직업
      if (CFG[role]) showFullFX(role, nick);
    },

    // 포섭 당한 본인
    RECRUITED: showRecruitedFX,

    // 포섭 발생 감지 (타인)
    RECRUIT_OTHERS: showRecruitOthersFX,

    // 직접 호출용
    showFullFX,
  };

})();

window.SkillFX = SkillFX;
