// ============================================================
//  🎬 MAFIA // PROTOCOL — SKILL EFFECTS ENGINE v1.0
//  skill-effects.js
//  Canvas + CSS 기반 직업별 스킬 시각 이펙트
//  외부 이미지 없이 순수 코드로 구현
// ============================================================

const SkillFX = (() => {

  // ── 이펙트 오버레이 캔버스 생성 ─────────────────────────────
  let canvas, ctx;

  function initCanvas() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'fx-canvas';
    canvas.style.cssText = `
      position:fixed;inset:0;width:100%;height:100%;
      pointer-events:none;z-index:7000;
    `;
    document.body.appendChild(canvas);
    resize();
    window.addEventListener('resize', resize);
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // ── 카드 위치 가져오기 ───────────────────────────────────────
  function getCardRect(uid) {
    const card = document.querySelector(`[data-uid="${uid}"]`);
    if (!card) return null;
    return card.getBoundingClientRect();
  }

  // ── 공통: 플래시 오버레이 ───────────────────────────────────
  function flashOverlay(color, duration = 400) {
    const div = document.createElement('div');
    div.style.cssText = `
      position:fixed;inset:0;background:${color};
      pointer-events:none;z-index:6999;
      animation:fxFlash ${duration}ms ease forwards;
    `;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), duration + 50);
  }

  // ── 공통: 카드 위 이펙트 레이어 ─────────────────────────────
  function createCardFX(uid, html, duration = 1800) {
    const rect = getCardRect(uid);
    if (!rect) return;
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;
      left:${rect.left}px;top:${rect.top}px;
      width:${rect.width}px;height:${rect.height}px;
      pointer-events:none;z-index:7100;overflow:hidden;
    `;
    el.innerHTML = html;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), duration);
    return el;
  }

  // ── CSS 주입 (최초 1회) ──────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('fx-styles')) return;
    const style = document.createElement('style');
    style.id = 'fx-styles';
    style.textContent = `
      @keyframes fxFlash { 0%{opacity:0.6} 100%{opacity:0} }
      @keyframes fxScan  { 0%{top:-4px} 100%{top:calc(100% + 4px)} }
      @keyframes fxFade  { 0%{opacity:1} 100%{opacity:0} }
      @keyframes fxSlide { 0%{transform:translateY(-100%);opacity:0} 40%{opacity:1} 100%{transform:translateY(100%);opacity:0} }
      @keyframes fxPulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.15);opacity:0.7} }
      @keyframes fxShake { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-3px,2px)} 40%{transform:translate(3px,-2px)} 60%{transform:translate(-2px,3px)} 80%{transform:translate(2px,-1px)} }
      @keyframes fxGlitch { 0%,90%,100%{clip-path:none;transform:none} 91%{clip-path:polygon(0 30%,100% 30%,100% 50%,0 50%);transform:translateX(-4px)} 93%{clip-path:polygon(0 60%,100% 60%,100% 75%,0 75%);transform:translateX(4px)} 95%{clip-path:none;transform:none} }
      @keyframes fxWebDrop { 0%{opacity:0;transform:scaleY(0)} 30%{opacity:1} 100%{transform:scaleY(1);opacity:0.8} }
      @keyframes fxSmokeRise { 0%{transform:translateY(0) scale(1);opacity:0.7} 100%{transform:translateY(-60px) scale(2.5);opacity:0} }
      @keyframes fxECG { 0%{stroke-dashoffset:200} 100%{stroke-dashoffset:0} }
      @keyframes fxShield { 0%{transform:scale(2) translateY(-30px);opacity:0} 30%{transform:scale(1.1) translateY(0);opacity:1} 70%{transform:scale(1);opacity:1} 100%{opacity:0} }
      @keyframes fxReel { 0%,100%{filter:none} 10%,30%,50%{filter:brightness(2) saturate(0)} 20%,40%{filter:hue-rotate(90deg)} }
      @keyframes fxCodeRain { 0%{transform:translateY(-100%);opacity:1} 100%{transform:translateY(100%);opacity:0.3} }
      @keyframes fxCrosshair { 0%{transform:scale(2);opacity:0} 30%{transform:scale(1);opacity:1} 100%{opacity:1} }
      @keyframes fxThread { 0%{stroke-dashoffset:300} 100%{stroke-dashoffset:0} }
      @keyframes fxChip { 0%{transform:translateY(-30px) rotate(0deg);opacity:1} 100%{transform:translateY(10px) rotate(720deg);opacity:0} }
      @keyframes fxIDPrint { 0%{clip-path:inset(0 100% 0 0)} 100%{clip-path:inset(0 0% 0 0)} }
      @keyframes fxGavel { 0%{transform:rotate(-45deg) translateY(-20px);opacity:0} 30%{transform:rotate(0deg) translateY(0);opacity:1} 60%{transform:rotate(5deg)} 100%{opacity:0} }
      @keyframes fxContract { 0%{transform:scale(0) rotate(-10deg);opacity:0} 40%{transform:scale(1.1) rotate(2deg);opacity:1} 100%{opacity:0.8} }
      @keyframes fxBloodDrip { 0%{transform:scaleY(0);transform-origin:top} 100%{transform:scaleY(1)} }
      @keyframes fxRecordBlink { 0%,100%{opacity:1} 50%{opacity:0} }
    `;
    document.head.appendChild(style);
  }

  // ────────────────────────────────────────────────────────────
  //  직업별 이펙트 정의
  // ────────────────────────────────────────────────────────────

  const effects = {

    // ◆ 경찰 — 지문 인식 + 파란 레이저 스캔
    POLICE(targetUID) {
      initCanvas(); injectStyles();
      createCardFX(targetUID, `
        <div style="position:absolute;inset:0;border:2px solid #00c8ff;box-shadow:0 0 15px rgba(0,200,255,0.5);animation:fxPulse 0.4s 3"></div>
        <div style="position:absolute;left:0;right:0;height:3px;background:linear-gradient(90deg,transparent,#00c8ff,transparent);box-shadow:0 0 10px #00c8ff;animation:fxScan 1.2s ease-in-out 2;top:0"></div>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
          <div style="width:48px;height:48px;border:1px solid #00c8ff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;animation:fxPulse 0.6s infinite">🔎</div>
        </div>
        <div style="position:absolute;bottom:4px;left:0;right:0;text-align:center;font-family:monospace;font-size:9px;color:#00c8ff;letter-spacing:0.3em">SCANNING...</div>
      `, 2000);
      SoundFX.play('scan');
    },

    // ◆ 탐정 — 두 초상화 사이 붉은 실 연결
    DETECTIVE(t1UID, t2UID) {
      injectStyles();
      const r1 = getCardRect(t1UID), r2 = getCardRect(t2UID);
      if (!r1 || !r2) return;

      const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:7050';
      const cx1 = r1.left + r1.width/2, cy1 = r1.top + r1.height/2;
      const cx2 = r2.left + r2.width/2, cy2 = r2.top + r2.height/2;
      const len  = Math.hypot(cx2-cx1, cy2-cy1);

      svg.innerHTML = `
        <line x1="${cx1}" y1="${cy1}" x2="${cx2}" y2="${cy2}"
          stroke="#ff2244" stroke-width="2"
          stroke-dasharray="${len}" stroke-dashoffset="${len}"
          style="animation:fxThread 0.6s ease forwards;filter:drop-shadow(0 0 4px #ff2244)"/>
        <circle cx="${cx1}" cy="${cy1}" r="5" fill="#ff2244" opacity="0" style="animation:fxFade 0.3s 0.5s forwards reverse"/>
        <circle cx="${cx2}" cy="${cy2}" r="5" fill="#ff2244" opacity="0" style="animation:fxFade 0.3s 0.7s forwards reverse"/>
      `;
      document.body.appendChild(svg);

      [t1UID, t2UID].forEach(uid => {
        createCardFX(uid, `<div style="position:absolute;inset:0;border:1px solid #ff2244;animation:fxPulse 0.4s 3"></div>`, 1500);
      });
      setTimeout(() => svg.remove(), 2000);
      SoundFX.play('analyze');
    },

    // ◆ 감시자 — CCTV 렌즈 포커싱 + 녹화 점 깜빡임
    WATCHMAN(targetUID) {
      injectStyles();
      createCardFX(targetUID, `
        <div style="position:absolute;inset:0;background:rgba(0,200,255,0.04);border:1px solid rgba(0,200,255,0.4)"></div>
        <div style="position:absolute;top:4px;right:6px;display:flex;align-items:center;gap:4px">
          <div style="width:6px;height:6px;border-radius:50%;background:#ff2244;animation:fxRecordBlink 0.8s infinite"></div>
          <span style="font-family:monospace;font-size:8px;color:#ff2244">REC</span>
        </div>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
          <div style="width:56px;height:56px;border-radius:50%;border:2px solid rgba(0,200,255,0.6);box-shadow:inset 0 0 15px rgba(0,200,255,0.2);animation:fxPulse 1s infinite 2">
            <div style="width:100%;height:100%;border-radius:50%;border:1px solid rgba(0,200,255,0.3);animation:fxPulse 1s 0.3s infinite 2"></div>
          </div>
        </div>
        <div style="position:absolute;bottom:4px;left:0;right:0;text-align:center;font-family:monospace;font-size:8px;color:#00c8ff;letter-spacing:0.2em">MONITORING...</div>
      `, 2000);
      SoundFX.play('cctv');
    },

    // ◆ 무당 — 보라색 연기 + 유령 손
    SHAMAN(targetUID) {
      injectStyles();
      const smokes = Array.from({length:5}, (_,i) => `
        <div style="position:absolute;bottom:${10+i*5}%;left:${20+i*12}%;
          width:${16+i*4}px;height:${16+i*4}px;border-radius:50%;
          background:radial-gradient(circle,rgba(167,139,250,0.6),transparent);
          animation:fxSmokeRise ${1.2+i*0.2}s ${i*0.15}s ease-out forwards">
        </div>`).join('');

      createCardFX(targetUID, `
        <div style="position:absolute;inset:0;background:rgba(88,28,135,0.15);border:1px solid rgba(167,139,250,0.4)"></div>
        ${smokes}
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:28px;animation:fxPulse 1s infinite">🔮</div>
      `, 2200);
      SoundFX.play('shaman');
    },

    // ◆ 기록관 — VHS 되감기 글리치 + 흑백 노이즈
    ARCHIVIST(targetUID) {
      injectStyles();
      createCardFX(targetUID, `
        <div style="position:absolute;inset:0;filter:grayscale(1) contrast(1.5);animation:fxReel 1.5s ease"></div>
        <div style="position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,0.03) 3px,rgba(255,255,255,0.03) 4px)"></div>
        <div style="position:absolute;top:30%;left:0;right:0;height:8px;background:rgba(255,255,255,0.15);animation:fxSlide 0.8s 2"></div>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
          <span style="font-family:monospace;font-size:28px;filter:grayscale(1);animation:fxGlitch 1.5s infinite">📁</span>
        </div>
        <div style="position:absolute;top:4px;left:6px;font-family:monospace;font-size:8px;color:rgba(255,255,255,0.5)">◀◀ REWIND</div>
      `, 2000);
      SoundFX.play('rewind');
    },

    // ◆ 의사 — 홀로그램 십자선 + ECG 박동
    DOCTOR(targetUID) {
      injectStyles();
      createCardFX(targetUID, `
        <div style="position:absolute;inset:0;border:1px solid rgba(0,255,136,0.4);box-shadow:inset 0 0 20px rgba(0,255,136,0.05)"></div>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
          <svg width="60" height="60" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(0,255,136,0.4)" stroke-width="1" style="animation:fxPulse 1s infinite"/>
            <path d="M10 30 L20 30 L25 15 L30 45 L35 25 L40 30 L50 30"
              fill="none" stroke="#00ff88" stroke-width="1.5"
              stroke-dasharray="80" stroke-dashoffset="80"
              style="animation:fxECG 1s 0.3s ease forwards;filter:drop-shadow(0 0 3px #00ff88)"/>
          </svg>
        </div>
        <div style="position:absolute;bottom:4px;left:0;right:0;text-align:center;font-family:monospace;font-size:8px;color:#00ff88;letter-spacing:0.2em">STABILIZING</div>
      `, 2000);
      SoundFX.play('heal');
    },

    // ◆ 군인 — 방탄 방패 아이콘 쾅
    SOLDIER(targetUID) {
      injectStyles();
      createCardFX(targetUID, `
        <div style="position:absolute;inset:0;border:2px solid rgba(0,200,255,0.6);animation:fxShake 0.4s ease"></div>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
          <div style="font-size:42px;animation:fxShield 1.5s ease forwards;filter:drop-shadow(0 0 10px rgba(0,200,255,0.8))">🛡️</div>
        </div>
        <div style="position:absolute;bottom:4px;left:0;right:0;text-align:center;font-family:monospace;font-size:8px;color:#00c8ff;letter-spacing:0.2em">GUARDED</div>
      `, 1800);
      SoundFX.play('shield');
    },

    // ◆ 보스 — 포섭: 붉은 거미줄 / 살해: 십자선
    BOSS(targetUID, action = 'recruit') {
      injectStyles();
      if (action === 'recruit') {
        createCardFX(targetUID, `
          <div style="position:absolute;inset:0;background:rgba(120,0,20,0.2);animation:fxPulse 0.5s 3"></div>
          <svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 100 100" preserveAspectRatio="none">
            ${[0,30,60,90,120,150].map(a => `
              <line x1="50" y1="0" x2="${50+60*Math.cos(a*Math.PI/180)}" y2="${50+60*Math.sin(a*Math.PI/180)}"
                stroke="rgba(255,34,68,0.6)" stroke-width="0.5"
                stroke-dasharray="80" stroke-dashoffset="80"
                style="animation:fxThread 0.8s ${a*0.005}s ease forwards"/>
            `).join('')}
            ${[1,2,3].map(r => `<circle cx="50" cy="50" r="${r*15}" fill="none" stroke="rgba(255,34,68,0.3)" stroke-width="0.5" stroke-dasharray="${r*15*3.14*2}" stroke-dashoffset="${r*15*3.14*2}" style="animation:fxThread 1s ${r*0.2}s ease forwards"/>`).join('')}
          </svg>
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:24px;animation:fxPulse 0.5s infinite">👁️</div>
        `, 2200);
        SoundFX.play('recruit');
      } else {
        effects.KILLER(targetUID);
      }
    },

    // ◆ 킬러 — 저격 십자선 + 화면 진동 + 핏자국
    KILLER(targetUID) {
      injectStyles();
      createCardFX(targetUID, `
        <div style="position:absolute;inset:0;background:rgba(60,0,10,0.3)"></div>
        <svg style="position:absolute;inset:0;width:100%;height:100%" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="30" fill="none" stroke="#ff2244" stroke-width="1" style="animation:fxCrosshair 0.4s ease forwards"/>
          <circle cx="50" cy="50" r="4" fill="rgba(255,34,68,0.8)" style="animation:fxPulse 0.3s infinite"/>
          <line x1="50" y1="10" x2="50" y2="38" stroke="#ff2244" stroke-width="1" opacity="0.8"/>
          <line x1="50" y1="62" x2="50" y2="90" stroke="#ff2244" stroke-width="1" opacity="0.8"/>
          <line x1="10" y1="50" x2="38" y2="50" stroke="#ff2244" stroke-width="1" opacity="0.8"/>
          <line x1="62" y1="50" x2="90" y2="50" stroke="#ff2244" stroke-width="1" opacity="0.8"/>
        </svg>
      `, 1500);
      // 화면 흔들림
      document.getElementById('app').style.animation = 'fxShake 0.4s ease';
      setTimeout(() => document.getElementById('app').style.animation = '', 500);
      SoundFX.play('kill');
    },

    // ◆ 해커 — 매트릭스 코드 레인
    HACKER(targetUID) {
      injectStyles();
      const cols = Array.from({length:8}, (_, i) => {
        const chars = '01アイウエオカキクケコ';
        const colChars = Array.from({length:8}, () => chars[Math.floor(Math.random()*chars.length)]).join('\n');
        return `<div style="position:absolute;left:${i*12.5}%;top:0;font-family:monospace;font-size:8px;color:#00ff41;white-space:pre;line-height:1.4;animation:fxCodeRain ${0.8+i*0.1}s ${i*0.08}s ease-in forwards;text-shadow:0 0 4px #00ff41">${colChars}</div>`;
      }).join('');

      createCardFX(targetUID, `
        <div style="position:absolute;inset:0;background:rgba(0,20,0,0.5);overflow:hidden">${cols}</div>
        <div style="position:absolute;inset:0;border:1px solid #00ff41;box-shadow:0 0 12px rgba(0,255,65,0.3)"></div>
        <div style="position:absolute;bottom:4px;left:0;right:0;text-align:center;font-family:monospace;font-size:8px;color:#00ff41">ACCESS GRANTED</div>
      `, 2000);
      SoundFX.play('hack');
    },

    // ◆ 변호사 — 황금 천칭 + 계약서
    LAWYER(targetUID) {
      injectStyles();
      createCardFX(targetUID, `
        <div style="position:absolute;inset:0;background:rgba(60,40,0,0.2);border:1px solid rgba(255,183,0,0.4)"></div>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
          <div style="font-size:36px;animation:fxContract 1s ease forwards;filter:drop-shadow(0 0 8px rgba(255,183,0,0.8))">⚖️</div>
        </div>
        <div style="position:absolute;top:4px;left:0;right:0;text-align:center;font-family:monospace;font-size:8px;color:#ffb700">PROTECTED</div>
      `, 2000);
      SoundFX.play('protect');
    },

    // ◆ 도박꾼 — 카지노 칩 + 슬롯 연출
    GAMBLER(prediction = 'death') {
      injectStyles();
      const labels = { death:'☠ DEATH', execution:'⚖ EXECUTE', peace:'☮ PEACE' };
      const colors = { death:'#ff2244', execution:'#ffb700', peace:'#00ff88' };
      const col    = colors[prediction] || '#ffb700';
      const lab    = labels[prediction] || 'BET';

      const el = document.createElement('div');
      el.style.cssText = `
        position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
        background:rgba(10,8,1,0.95);border:1px solid ${col};
        padding:20px 40px;z-index:7200;text-align:center;
        clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));
        animation:fxContract 0.4s ease;
      `;
      el.innerHTML = `
        <div style="font-size:32px;margin-bottom:8px;animation:fxChip 1s ease forwards">🎰</div>
        <div style="font-family:monospace;font-size:14px;font-weight:bold;color:${col};letter-spacing:0.2em">${lab}</div>
        <div style="font-family:monospace;font-size:9px;color:rgba(255,255,255,0.3);margin-top:4px">BET PLACED</div>
      `;
      document.body.appendChild(el);
      setTimeout(() => { el.style.animation = 'fxFade 0.4s ease forwards'; setTimeout(() => el.remove(), 450); }, 1600);
      SoundFX.play('gamble');
    },

    // ◆ 취업준비생 — ID카드 프린팅
    JOBSEEKER(newRole) {
      injectStyles();
      const ROLE_NAMES = { POLICE:'경찰',DETECTIVE:'탐정',WATCHMAN:'감시자',SHAMAN:'무당',ARCHIVIST:'기록관',DOCTOR:'의사',SOLDIER:'군인',POLITICIAN:'정치인' };
      const ROLE_ICONS = { POLICE:'🔎',DETECTIVE:'🕵️',WATCHMAN:'📡',SHAMAN:'🔮',ARCHIVIST:'📁',DOCTOR:'💊',SOLDIER:'🛡️',POLITICIAN:'🏛️' };
      const el = document.createElement('div');
      el.style.cssText = `
        position:fixed;bottom:80px;right:20px;
        background:#0b1520;border:1px solid #00c8ff;
        padding:16px 20px;z-index:7200;min-width:180px;
        clip-path:polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px));
      `;
      el.innerHTML = `
        <div style="font-family:monospace;font-size:9px;color:#3a5566;letter-spacing:0.3em;margin-bottom:8px">// IDENTITY UPDATED</div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:24px;animation:fxIDPrint 0.8s 0.3s ease both">${ROLE_ICONS[newRole]||'📋'}</div>
          <div style="animation:fxIDPrint 0.8s 0.5s ease both">
            <div style="font-family:monospace;font-size:13px;font-weight:bold;color:#00c8ff">${ROLE_NAMES[newRole]||newRole}</div>
            <div style="font-family:monospace;font-size:9px;color:#3a5566">직업 승계 완료</div>
          </div>
        </div>
      `;
      document.body.appendChild(el);
      setTimeout(() => { el.style.animation = 'fxFade 0.5s ease forwards'; setTimeout(() => el.remove(), 550); }, 3000);
      SoundFX.play('inherit');
    },

    // ◆ 정치인 — 황금 의사봉 + 파급 효과
    POLITICIAN(targetUID) {
      injectStyles();
      createCardFX(targetUID, `
        <div style="position:absolute;inset:0;background:rgba(50,40,0,0.2)"></div>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
          <div style="font-size:36px;animation:fxGavel 1s ease forwards;filter:drop-shadow(0 0 10px rgba(255,183,0,0.9))">🏛️</div>
        </div>
        <div style="position:absolute;bottom:4px;left:0;right:0;text-align:center;font-family:monospace;font-size:8px;color:#ffb700">✕ 2 VOTES</div>
      `, 1600);
      SoundFX.play('gavel');
    },

    // ★ 포섭 당한 플레이어 화면 이펙트
    RECRUITED() {
      injectStyles();
      // 유리 깨짐 + 피 + 테마 변환
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position:fixed;inset:0;z-index:9800;pointer-events:none;
        background:transparent;transition:background 0.3s;
      `;

      // 균열 SVG
      overlay.innerHTML = `
        <svg style="position:absolute;inset:0;width:100%;height:100%;opacity:0;animation:fxFade 0.2s 0.1s ease forwards reverse" viewBox="0 0 ${window.innerWidth} ${window.innerHeight}">
          ${Array.from({length:12}, (_,i) => {
            const sx = window.innerWidth/2, sy = window.innerHeight/2;
            const angle = (i/12)*Math.PI*2;
            const len   = 150 + Math.random()*200;
            const ex    = sx + Math.cos(angle)*len;
            const ey    = sy + Math.sin(angle)*len;
            return `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="rgba(255,34,68,0.7)" stroke-width="${1+Math.random()}" stroke-dasharray="${len}" stroke-dashoffset="${len}" style="animation:fxThread 0.4s ${i*0.03}s ease forwards"/>`;
          }).join('')}
        </svg>
        <div style="position:absolute;inset:0;background:rgba(120,0,20,0);transition:background 0.4s 0.2s" id="recruit-bg"></div>
        <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:0;animation:fxFade 0.4s 0.5s ease forwards reverse">
          <div style="font-family:'Orbitron',monospace;font-size:clamp(24px,5vw,52px);font-weight:900;color:#ff2244;text-shadow:0 0 40px rgba(255,34,68,0.9);letter-spacing:0.08em;text-align:center;animation:fxGlitch 0.5s 1s infinite">당신은 포섭되었습니다.</div>
        </div>
      `;
      document.body.appendChild(overlay);

      setTimeout(() => { document.getElementById('recruit-bg').style.background = 'rgba(120,0,20,0.88)'; }, 100);
      setTimeout(() => { document.getElementById('recruit-bg').style.background = 'rgba(0,0,0,0)'; }, 2500);
      setTimeout(() => overlay.remove(), 3200);

      SoundFX.play('recruited');
    },

    // ★ 타인 화면 — 포섭 발생 시 붉은 글리치 테두리 0.5초
    RECRUIT_OTHERS() {
      injectStyles();
      const el = document.createElement('div');
      el.style.cssText = `
        position:fixed;inset:0;z-index:7500;pointer-events:none;
        border:4px solid #ff2244;
        box-shadow:inset 0 0 40px rgba(255,34,68,0.3),0 0 40px rgba(255,34,68,0.3);
        animation:fxFade 0.6s ease forwards;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 700);
      SoundFX.play('glitch');
    },

  };

  // ────────────────────────────────────────────────────────────
  //  공개 API
  // ────────────────────────────────────────────────────────────
  return {
    play(roleName, targetUID, extra) {
      const fn = effects[roleName];
      if (!fn) return;
      if (roleName === 'DETECTIVE') fn(targetUID, extra);
      else if (roleName === 'BOSS')   fn(targetUID, extra || 'recruit');
      else if (roleName === 'GAMBLER') fn(targetUID); // targetUID = prediction
      else if (roleName === 'JOBSEEKER') fn(targetUID); // targetUID = newRole
      else if (roleName === 'POLITICIAN') fn(targetUID);
      else if (roleName === 'RECRUITED') fn();
      else if (roleName === 'RECRUIT_OTHERS') fn();
      else fn(targetUID);
    },
    RECRUITED:      () => effects.RECRUITED(),
    RECRUIT_OTHERS: () => effects.RECRUIT_OTHERS(),
  };

})();

window.SkillFX = SkillFX;
