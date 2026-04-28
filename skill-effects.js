// ============================================================
//  MAFIA // PROTOCOL - SKILL EFFECTS v3.0
//  전직업 전체화면 고퀄리티 연출 + 사운드 완전 통합
// ============================================================

const SkillFX = (() => {

  function injectStyles() {
    if (document.getElementById('sfx-v3')) return;
    const s = document.createElement('style');
    s.id = 'sfx-v3';
    s.textContent = `
      @keyframes sfxFadeIn    { from{opacity:0} to{opacity:1} }
      @keyframes sfxFadeOut   { from{opacity:1} to{opacity:0} }
      @keyframes sfxScaleIn   { from{opacity:0;transform:translate(-50%,-50%) scale(0.25) rotate(-8deg)} to{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(0)} }
      @keyframes sfxSlideUp   { from{opacity:0;transform:translateX(-50%) translateY(20px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
      @keyframes sfxScanline  { 0%{top:-4px} 100%{top:calc(100% + 4px)} }
      @keyframes sfxPulse     { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.1);opacity:0.7} }
      @keyframes sfxShake     { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-5px,3px)} 40%{transform:translate(5px,-3px)} 60%{transform:translate(-3px,5px)} 80%{transform:translate(3px,-2px)} }
      @keyframes sfxGlitch    { 0%,88%,100%{clip-path:none;transform:none} 90%{clip-path:polygon(0 20%,100% 20%,100% 40%,0 40%);transform:translateX(-6px)} 94%{clip-path:none;transform:none} }
      @keyframes sfxThread    { from{stroke-dashoffset:var(--len,300)} to{stroke-dashoffset:0} }
      @keyframes sfxECG       { from{stroke-dashoffset:600} to{stroke-dashoffset:0} }
      @keyframes sfxSpin      { to{transform:rotate(360deg)} }
      @keyframes sfxSpinRev   { to{transform:rotate(-360deg)} }
      @keyframes sfxTypeout   { from{width:0} to{width:100%} }
      @keyframes sfxStamp     { 0%{opacity:0;transform:translate(-50%,-50%) scale(2.2) rotate(-15deg)} 40%{opacity:1;transform:translate(-50%,-50%) scale(0.96) rotate(-15deg)} 60%{transform:translate(-50%,-50%) scale(1.03) rotate(-15deg)} 100%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(-15deg)} }
      @keyframes sfxReelSpin  { 0%{transform:translateY(0)} 100%{transform:translateY(-280%)} }
      @keyframes sfxFilm      { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
      @keyframes sfxChipToss  { 0%{transform:translateX(-50%) translateY(-200%) rotate(0deg);opacity:1} 100%{transform:translateX(-50%) translateY(40px) rotate(720deg);opacity:0} }
      @keyframes sfxPing      { 0%{transform:translate(-50%,-50%) scale(0);opacity:0.8} 100%{transform:translate(-50%,-50%) scale(5);opacity:0} }
      @keyframes sfxShield    { 0%{transform:translateX(-50%) scale(1.6) translateY(-50px);opacity:0} 30%{transform:translateX(-50%) scale(1.05) translateY(0);opacity:1} 70%{transform:translateX(-50%) scale(1);opacity:1} 100%{opacity:0} }
      @keyframes sfxIDPrint   { from{clip-path:inset(0 100% 0 0)} to{clip-path:inset(0 0% 0 0)} }
      @keyframes sfxCodeRain  { 0%{transform:translateY(-110%);opacity:1} 100%{transform:translateY(110%);opacity:0.15} }
      @keyframes sfxRadarPing { 0%{r:0;opacity:0.85} 100%{r:200;opacity:0} }
      @keyframes sfxSmoke     { 0%{transform:translateY(0) scale(1);opacity:0.7} 100%{transform:translateY(-80px) scale(3);opacity:0} }
      @keyframes sfxBlink     { 0%,100%{opacity:1} 50%{opacity:0} }
      @keyframes sfxGavel     { 0%{transform:translateX(-50%) rotate(-50deg) translateY(-40px);opacity:0} 25%{transform:translateX(-50%) rotate(0deg) translateY(0);opacity:1} 60%{transform:translateX(-50%) rotate(5deg)} 100%{opacity:1;transform:translateX(-50%) rotate(0deg)} }
      @keyframes sfxShockwave { 0%{transform:translate(-50%,-50%) scale(0);opacity:0.8} 100%{transform:translate(-50%,-50%) scale(6);opacity:0} }
      @keyframes sfxRipple    { 0%{transform:translate(-50%,-50%) scale(0);opacity:0.7} 100%{transform:translate(-50%,-50%) scale(5);opacity:0} }
    `;
    document.head.appendChild(s);
  }

  function makeOv(z) {
    injectStyles();
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:'+(z||9800)+';pointer-events:none;overflow:hidden';
    document.body.appendChild(ov);
    return ov;
  }

  function autoRemove(ov, ms) {
    setTimeout(() => {
      ov.style.animation = 'sfxFadeOut 0.35s ease forwards';
      setTimeout(() => ov.remove(), 380);
    }, ms || 2200);
  }

  function el(tag, css, html) {
    const e = document.createElement(tag);
    if (css) e.style.cssText = css;
    if (html) e.innerHTML = html;
    return e;
  }

  function cx(css, html) {
    return el('div', 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);'+css, html);
  }

  function lbl(text, color, delay, size) {
    const e = el('div',
      'position:absolute;left:50%;top:62%;transform:translateX(-50%);'+
      'font-family:Orbitron,monospace;font-size:'+(size||'clamp(14px,3.5vw,24px)')+';font-weight:900;'+
      'letter-spacing:0.14em;color:'+color+';text-shadow:0 0 20px '+color+';'+
      'text-align:center;white-space:nowrap;'+
      'opacity:0;animation:sfxSlideUp 0.5s '+(delay||0.6)+'s ease forwards'
    );
    e.textContent = text;
    return e;
  }

  function sub(text, delay) {
    const e = el('div',
      'position:absolute;left:50%;top:68%;transform:translateX(-50%);'+
      'font-family:"Share Tech Mono",monospace;font-size:clamp(9px,1.8vw,12px);'+
      'color:rgba(200,220,240,0.5);letter-spacing:0.3em;text-align:center;'+
      'opacity:0;animation:sfxSlideUp 0.4s '+(delay||0.9)+'s ease forwards'
    );
    e.textContent = text;
    return e;
  }

  function bgGlow(c, a) {
    return el('div',
      'position:absolute;inset:0;'+
      'background:radial-gradient(ellipse 80% 75% at 50% 50%,'+c.replace(')',','+(a||0.22)+')').replace('rgb','rgba')+',transparent 72%);'+
      'animation:sfxFadeIn 0.4s ease forwards'
    );
  }

  function corners(c) {
    ['top:18px;left:18px;border-width:2px 0 0 2px',
     'top:18px;right:18px;border-width:2px 2px 0 0',
     'bottom:18px;left:18px;border-width:0 0 2px 2px',
     'bottom:18px;right:18px;border-width:0 2px 2px 0'
    ].forEach(p => {
      return el('div',
        'position:absolute;'+p+';width:44px;height:44px;border-style:solid;border-color:'+c+'80;'+
        'opacity:0;animation:sfxFadeIn 0.3s 0.05s ease forwards'
      );
    });
  }

  function scanLine(c) {
    return el('div',
      'position:absolute;left:0;right:0;height:3px;top:-4px;'+
      'background:linear-gradient(90deg,transparent,'+c+',transparent);'+
      'box-shadow:0 0 10px '+c+';opacity:0.85;'+
      'animation:sfxScanline 1.6s ease-in-out infinite'
    );
  }

  function makeSVG() {
    const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
    s.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    return s;
  }

  function ripples(ov, c, count) {
    for (let i=0;i<(count||3);i++) {
      const r = el('div',
        'position:absolute;left:50%;top:50%;'+
        'width:'+(80+i*100)+'px;height:'+(80+i*100)+'px;'+
        'border-radius:50%;border:1.5px solid '+c+';'+
        'animation:sfxRipple '+(0.8+i*0.18)+'s '+(i*0.12)+'s ease-out forwards'
      );
      ov.appendChild(r);
    }
  }

  function shake() {
    const app = document.getElementById('app');
    if (!app) return;
    app.style.animation = 'sfxShake 0.4s ease';
    setTimeout(() => app.style.animation = '', 450);
  }

  // ── 개별 이펙트 ─────────────────────────────────────────

  function POLICE(nick) {
    const ov = makeOv();
    const C = '#00c8ff';
    ov.appendChild(el('div',
      'position:absolute;inset:0;'+
      'background:repeating-linear-gradient(0deg,transparent,transparent 48px,'+C+'10 48px,'+C+'10 49px),'+
      'repeating-linear-gradient(90deg,transparent,transparent 48px,'+C+'10 48px,'+C+'10 49px);'+
      'animation:sfxFadeIn 0.4s ease forwards'
    ));
    ov.appendChild(bgGlow(C));
    ['top:18px;left:18px;border-width:2px 0 0 2px',
     'top:18px;right:18px;border-width:2px 2px 0 0',
     'bottom:18px;left:18px;border-width:0 0 2px 2px',
     'bottom:18px;right:18px;border-width:0 2px 2px 0'
    ].forEach(p => ov.appendChild(el('div',
      'position:absolute;'+p+';width:44px;height:44px;border-style:solid;border-color:'+C+'80;'+
      'opacity:0;animation:sfxFadeIn 0.3s 0.05s ease forwards'
    )));
    const svg = makeSVG();
    for (let i=0;i<3;i++) {
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx','50%'); c.setAttribute('cy','50%'); c.setAttribute('r','0');
      c.setAttribute('fill','none'); c.setAttribute('stroke',C); c.setAttribute('stroke-width','1.5');
      c.style.animation = 'sfxRadarPing 1.4s '+(i*0.35)+'s ease-out infinite';
      svg.appendChild(c);
    }
    ov.appendChild(svg);
    ov.appendChild(scanLine(C));
    const icon = cx(
      'display:flex;flex-direction:column;align-items:center;gap:12px;'+
      'opacity:0;animation:sfxScaleIn 0.5s 0.1s cubic-bezier(0.34,1.56,0.64,1) forwards',
      '<div style="position:relative;width:100px;height:100px">'+
      '<div style="position:absolute;inset:0;border-radius:50%;border:2px solid '+C+';animation:sfxPulse 0.8s infinite"></div>'+
      '<div style="position:absolute;inset:8px;border-radius:50%;border:1px dashed '+C+'60;animation:sfxSpin 3s linear infinite"></div>'+
      '<div style="position:absolute;inset:16px;border-radius:50%;border:1px solid '+C+'40;animation:sfxSpinRev 5s linear infinite"></div>'+
      '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:36px">&#128270;</div>'+
      '</div>'
    );
    ov.appendChild(icon);
    ov.appendChild(lbl('정체 스캔', C));
    if (nick) ov.appendChild(lbl('▶ '+nick, C+'aa', 0.75, 'clamp(11px,2vw,14px)'));
    ov.appendChild(sub('SCANNING... IDENTITY ANALYSIS'));
    if (window.SoundFX) SoundFX.play('scan');
    autoRemove(ov, 2200);
  }

  function DETECTIVE(nick1, nick2) {
    const ov = makeOv();
    const C = '#ff4466';
    ov.appendChild(bgGlow(C, 0.18));
    ov.appendChild(el('div',
      'position:absolute;inset:0;'+
      'background:repeating-linear-gradient(45deg,transparent,transparent 20px,rgba(255,68,102,0.03) 20px,rgba(255,68,102,0.03) 21px),'+
      'repeating-linear-gradient(-45deg,transparent,transparent 20px,rgba(255,68,102,0.03) 20px,rgba(255,68,102,0.03) 21px);'+
      'opacity:0;animation:sfxFadeIn 0.5s ease forwards'
    ));
    const makeCard = (init, side, d) => {
      return el('div',
        'position:absolute;'+side+';top:50%;transform:translateY(-50%);'+
        'width:88px;height:108px;background:rgba(18,3,8,0.92);border:2px solid '+C+';'+
        'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;'+
        'opacity:0;animation:sfxSlideUp 0.5s '+d+'s ease forwards',
        '<div style="width:50px;height:50px;border-radius:50%;background:rgba(255,68,102,0.12);'+
        'border:1px solid '+C+';display:flex;align-items:center;justify-content:center;'+
        'font-family:Orbitron,monospace;font-size:18px;color:'+C+'">'+init+'</div>'+
        '<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+C+';letter-spacing:0.1em">'+init+'</div>'
      );
    };
    ov.appendChild(makeCard((nick1||'?')[0].toUpperCase(), 'left:8%', 0.1));
    ov.appendChild(makeCard((nick2||'?')[0].toUpperCase(), 'right:8%', 0.2));
    setTimeout(() => {
      const W = window.innerWidth, H = window.innerHeight;
      const svg = makeSVG();
      const len = W * 0.56;
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1', W*0.19); line.setAttribute('y1', H/2);
      line.setAttribute('x2', W*0.81); line.setAttribute('y2', H/2);
      line.setAttribute('stroke', C); line.setAttribute('stroke-width', '2.5');
      line.setAttribute('stroke-dasharray', len); line.setAttribute('stroke-dashoffset', len);
      line.style.cssText = '--len:'+len+'px;filter:drop-shadow(0 0 6px '+C+');animation:sfxThread 0.8s 0.5s ease forwards';
      svg.appendChild(line);
      [W*0.19, W*0.81].forEach((cx2,i) => {
        const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
        c.setAttribute('cx',cx2); c.setAttribute('cy',H/2); c.setAttribute('r','6');
        c.setAttribute('fill',C); c.style.opacity='0';
        c.style.animation='sfxFadeIn 0.3s '+(0.5+i*0.3)+'s ease forwards';
        svg.appendChild(c);
      });
      ov.appendChild(svg);
    }, 100);
    ov.appendChild(lbl('관계 분석', C));
    ov.appendChild(sub('RELATION ANALYSIS'));
    if (window.SoundFX) SoundFX.play('analyze');
    autoRemove(ov, 2400);
  }

  function WATCHMAN(nick) {
    const ov = makeOv();
    const C = '#00ff41';
    ov.appendChild(el('div',
      'position:absolute;inset:0;'+
      'background:radial-gradient(circle 45vw at 50% 50%,rgba(0,40,0,0.3),rgba(0,0,0,0.88));'+
      'animation:sfxFadeIn 0.4s ease forwards'
    ));
    ov.appendChild(el('div',
      'position:absolute;inset:0;'+
      'background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,65,0.05) 3px,rgba(0,255,65,0.05) 4px)'
    ));
    const lens = cx(
      'display:flex;flex-direction:column;align-items:center;gap:12px;'+
      'opacity:0;animation:sfxScaleIn 0.5s 0.1s cubic-bezier(0.34,1.56,0.64,1) forwards',
      '<div style="position:relative;width:120px;height:120px">'+
      '<div style="position:absolute;inset:0;border-radius:50%;border:2px solid '+C+';box-shadow:0 0 20px '+C+'60;animation:sfxPulse 1s infinite"></div>'+
      '<div style="position:absolute;inset:10px;border-radius:50%;border:1px solid '+C+'50;animation:sfxSpin 4s linear infinite"></div>'+
      '<div style="position:absolute;inset:20px;border-radius:50%;border:1px solid '+C+'30;animation:sfxSpinRev 6s linear infinite"></div>'+
      '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:44px">&#128225;</div>'+
      '<div style="position:absolute;top:6px;right:6px;display:flex;align-items:center;gap:4px">'+
      '<div style="width:8px;height:8px;border-radius:50%;background:#ff2244;animation:sfxBlink 0.8s infinite"></div>'+
      '<span style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:#ff2244;letter-spacing:0.2em">REC</span>'+
      '</div></div>'
    );
    ov.appendChild(lens);
    const ts = el('div',
      'position:absolute;bottom:22%;left:50%;transform:translateX(-50%);'+
      'font-family:\'Share Tech Mono\',monospace;font-size:11px;color:'+C+';letter-spacing:0.3em;'+
      'opacity:0;animation:sfxFadeIn 0.5s 0.7s ease forwards'
    );
    ts.textContent = '00:00:00 — MONITORING'+(nick?' : '+nick:'');
    ov.appendChild(ts);
    ov.appendChild(lbl('정밀 감시', C));
    ov.appendChild(sub('SURVEILLANCE ACTIVE'));
    if (window.SoundFX) SoundFX.play('cctv');
    autoRemove(ov, 2300);
  }

  function SHAMAN(nick) {
    const ov = makeOv();
    const C = '#a78bfa';
    ov.appendChild(el('div',
      'position:absolute;inset:0;'+
      'background:radial-gradient(ellipse 80% 70% at 50% 50%,rgba(88,28,135,0.55),rgba(10,0,20,0.88));'+
      'animation:sfxFadeIn 0.5s ease forwards'
    ));
    for (let i=0;i<8;i++) {
      ov.appendChild(el('div',
        'position:absolute;bottom:30%;left:'+(18+i*8)+'%;'+
        'width:'+(20+Math.random()*28)+'px;height:'+(20+Math.random()*28)+'px;'+
        'border-radius:50%;background:radial-gradient(circle,rgba(167,139,250,0.6),transparent);'+
        'animation:sfxSmoke '+(1.2+Math.random()*0.8)+'s '+(Math.random()*0.5)+'s ease-out infinite'
      ));
    }
    const ghost = el('div',
      'position:absolute;left:50%;top:22%;transform:translateX(-50%);'+
      'font-size:clamp(42px,10vw,80px);opacity:0;filter:drop-shadow(0 0 18px '+C+');'+
      'animation:sfxFadeIn 0.7s 0.3s ease forwards'
    );
    ghost.textContent = '👻';
    ov.appendChild(ghost);
    const icon = cx(
      'margin-top:20px;display:flex;flex-direction:column;align-items:center;'+
      'opacity:0;animation:sfxScaleIn 0.6s 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards',
      '<div style="font-size:clamp(64px,15vw,104px);filter:drop-shadow(0 0 28px '+C+');animation:sfxPulse 1.2s infinite">&#128302;</div>'
    );
    ov.appendChild(icon);
    ov.appendChild(lbl('혼령 교신', C));
    ov.appendChild(sub('SPIRIT COMMUNICATION'));
    if (window.SoundFX) SoundFX.play('shaman');
    autoRemove(ov, 2300);
  }

  function ARCHIVIST(nick) {
    const ov = makeOv();
    const C = '#b8ddf0';
    ov.appendChild(el('div','position:absolute;inset:0;background:rgba(5,10,15,0.78);filter:saturate(0.25);animation:sfxFadeIn 0.3s ease forwards'));
    for (let i=0;i<6;i++) {
      ov.appendChild(el('div',
        'position:absolute;left:0;right:0;top:'+(Math.random()*90)+'%;height:'+(2+Math.random()*8)+'px;'+
        'background:rgba(255,255,255,'+(0.07+Math.random()*0.14)+');'+
        'animation:sfxFadeIn '+(0.1+Math.random()*0.15)+'s '+(i*0.05)+'s ease forwards'
      ));
    }
    const film = el('div',
      'position:absolute;bottom:20%;left:0;right:0;height:60px;overflow:hidden;opacity:0;animation:sfxFadeIn 0.5s 0.3s ease forwards'
    );
    const fi = el('div','display:flex;gap:4px;animation:sfxFilm 2s linear infinite;width:200%');
    for (let i=0;i<20;i++) {
      const frame = el('div','width:60px;height:52px;border:1px solid #3a5566;background:rgba(0,0,0,0.5);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:20px');
      frame.textContent = ['📁','📄','🗂️','📋'][i%4];
      fi.appendChild(frame);
    }
    film.appendChild(fi); ov.appendChild(film);
    const glitch = cx(
      'font-family:Orbitron,monospace;font-size:clamp(18px,4vw,30px);font-weight:900;'+
      'color:'+C+';letter-spacing:0.1em;text-align:center;'+
      'opacity:0;animation:sfxFadeIn 0.4s 0.15s ease forwards, sfxGlitch 2s 0.6s infinite'
    );
    glitch.textContent = '📁 ARCHIVE';
    ov.appendChild(glitch);
    const rw = el('div',
      'position:absolute;top:20%;left:50%;transform:translateX(-50%);'+
      'font-family:\'Share Tech Mono\',monospace;font-size:13px;color:rgba(184,221,240,0.55);letter-spacing:0.3em;'+
      'opacity:0;animation:sfxFadeIn 0.4s 0.4s ease forwards'
    );
    rw.textContent = '◀◀ REWIND';
    ov.appendChild(rw);
    setTimeout(() => {
      const stamp = el('div',
        'position:absolute;left:50%;top:50%;'+
        'font-family:Orbitron,monospace;font-size:clamp(14px,3.2vw,24px);font-weight:900;'+
        'color:rgba(184,221,240,0.85);border:3px solid rgba(184,221,240,0.55);padding:7px 18px;letter-spacing:0.2em;'+
        'animation:sfxStamp 0.4s cubic-bezier(0.2,0.8,0.3,1.2) forwards'
      );
      stamp.textContent = 'ARCHIVE ACCESSED';
      ov.appendChild(stamp);
    }, 1200);
    ov.appendChild(lbl('기록 열람', C, 0.4));
    ov.appendChild(sub('RETRIEVING DATA'));
    if (window.SoundFX) SoundFX.play('rewind');
    autoRemove(ov, 2400);
  }

  function DOCTOR(nick) {
    const ov = makeOv();
    const C = '#00ff88';
    ov.appendChild(bgGlow(C, 0.18));
    ov.appendChild(scanLine(C));
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(500px,90vw);height:80px;overflow:visible';
    const ecg = document.createElementNS('http://www.w3.org/2000/svg','path');
    ecg.setAttribute('d','M0,40 L60,40 L75,40 L85,5 L95,75 L105,5 L115,40 L130,40 L145,40 L155,20 L165,60 L175,40 L500,40');
    ecg.setAttribute('fill','none'); ecg.setAttribute('stroke',C); ecg.setAttribute('stroke-width','2.5');
    ecg.setAttribute('stroke-dasharray','600'); ecg.setAttribute('stroke-dashoffset','600');
    ecg.style.cssText = 'filter:drop-shadow(0 0 6px '+C+');animation:sfxECG 1.2s 0.2s ease forwards';
    svg.appendChild(ecg); ov.appendChild(svg);
    const icon = cx(
      'margin-top:-60px;display:flex;flex-direction:column;align-items:center;gap:12px;'+
      'opacity:0;animation:sfxScaleIn 0.5s 0.1s cubic-bezier(0.34,1.56,0.64,1) forwards',
      '<div style="position:relative;width:80px;height:80px">'+
      '<div style="position:absolute;top:50%;left:0;right:0;height:14px;margin-top:-7px;background:'+C+'28;border:1px solid '+C+';border-radius:2px"></div>'+
      '<div style="position:absolute;left:50%;top:0;bottom:0;width:14px;margin-left:-7px;background:'+C+'28;border:1px solid '+C+';border-radius:2px"></div>'+
      '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:28px">&#128138;</div>'+
      '</div>'
    );
    ov.appendChild(icon);
    const hb = el('div',
      'position:absolute;left:50%;bottom:27%;transform:translateX(-50%);'+
      'font-family:\'Share Tech Mono\',monospace;font-size:11px;color:'+C+';letter-spacing:0.28em;'+
      'opacity:0;animation:sfxFadeIn 0.5s 1.1s ease forwards'
    );
    hb.textContent = 'VITAL SIGNS STABILIZED'+(nick?' — '+nick:'');
    ov.appendChild(hb);
    ov.appendChild(lbl('응급 처치', C));
    ov.appendChild(sub('MEDICAL SUPPORT ACTIVE'));
    if (window.SoundFX) SoundFX.play('heal');
    autoRemove(ov, 2300);
  }

  function SOLDIER(nick) {
    const ov = makeOv();
    const C = '#00c8ff';
    ov.appendChild(bgGlow(C, 0.18));
    const shield = el('div',
      'position:absolute;left:50%;top:50%;transform:translateX(-50%);'+
      'font-size:clamp(82px,18vw,130px);filter:drop-shadow(0 0 32px '+C+');'+
      'opacity:0;animation:sfxShield 1.2s 0.1s cubic-bezier(0.2,0.8,0.3,1.2) forwards'
    );
    shield.textContent = '🛡️';
    ov.appendChild(shield);
    setTimeout(() => {
      for (let i=0;i<3;i++) {
        ov.appendChild(el('div',
          'position:absolute;left:50%;top:52%;width:'+(60+i*65)+'px;height:'+(60+i*65)+'px;'+
          'border-radius:50%;border:2px solid '+C+';'+
          'animation:sfxShockwave 0.6s '+(i*0.1)+'s ease-out forwards'
        ));
      }
      shake();
    }, 600);
    ov.appendChild(el('div',
      'position:absolute;inset:0;border:3px solid '+C+'45;box-shadow:inset 0 0 40px '+C+'18;'+
      'opacity:0;animation:sfxFadeIn 0.3s 0.5s ease forwards'
    ));
    ov.appendChild(lbl('초소 경계', C, 0.8));
    if (nick) ov.appendChild(lbl('GUARD: '+nick, C+'aa', 1.0, 'clamp(10px,2vw,14px)'));
    ov.appendChild(sub('GUARD ACTIVE'));
    if (window.SoundFX) SoundFX.play('shield');
    autoRemove(ov, 2200);
  }

  function BOSS_recruit(nick) {
    const ov = makeOv();
    const C = '#ff2244';
    ov.appendChild(el('div',
      'position:absolute;inset:0;background:radial-gradient(ellipse 80% 75% at 50% 50%,rgba(120,0,20,0.5),rgba(5,0,5,0.9));'+
      'animation:sfxFadeIn 0.5s ease forwards'
    ));
    const W = window.innerWidth, H = window.innerHeight;
    const svg = makeSVG();
    const cx2 = W/2, cy2 = H/2;
    for (let i=0;i<14;i++) {
      const ang = (i/14)*Math.PI*2;
      const len = 160+Math.random()*260;
      const ex = cx2+Math.cos(ang)*len, ey = cy2+Math.sin(ang)*len;
      const l = document.createElementNS('http://www.w3.org/2000/svg','line');
      l.setAttribute('x1',cx2); l.setAttribute('y1',cy2); l.setAttribute('x2',ex); l.setAttribute('y2',ey);
      l.setAttribute('stroke','rgba(255,34,68,'+(0.5+Math.random()*0.3)+')');
      l.setAttribute('stroke-width',0.8+Math.random()*1.2);
      const d = Math.hypot(ex-cx2,ey-cy2);
      l.setAttribute('stroke-dasharray',d); l.setAttribute('stroke-dashoffset',d);
      l.style.cssText = '--len:'+d+'px;filter:drop-shadow(0 0 3px '+C+');animation:sfxThread 0.6s '+(i*0.035)+'s ease forwards';
      svg.appendChild(l);
    }
    [60,130,220].forEach((r,i) => {
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx',cx2); c.setAttribute('cy',cy2); c.setAttribute('r',r);
      c.setAttribute('fill','none'); c.setAttribute('stroke','rgba(255,34,68,0.28)'); c.setAttribute('stroke-width','0.8');
      const p=2*Math.PI*r; c.setAttribute('stroke-dasharray',p); c.setAttribute('stroke-dashoffset',p);
      c.style.animation='sfxThread 0.8s '+(0.3+i*0.2)+'s ease forwards';
      svg.appendChild(c);
    });
    ov.appendChild(svg);
    const eye = cx(
      'font-size:clamp(72px,16vw,112px);opacity:0;'+
      'filter:drop-shadow(0 0 32px rgba(255,34,68,0.9));'+
      'animation:sfxScaleIn 0.5s 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards'
    );
    eye.textContent = '👁️';
    ov.appendChild(eye);
    ov.appendChild(lbl('포섭 시도', C, 0.7));
    if (nick) ov.appendChild(lbl('▶ '+nick, C+'aa', 0.9, 'clamp(10px,2vw,14px)'));
    ov.appendChild(sub('INFILTRATING...'));
    if (window.SoundFX) SoundFX.play('recruit');
    autoRemove(ov, 2400);
  }

  function BOSS_kill(nick) {
    const ov = makeOv();
    const C = '#ff2244';
    ov.appendChild(el('div','position:absolute;inset:0;background:rgba(25,0,0,0.78);animation:sfxFadeIn 0.3s ease forwards'));
    const W = window.innerWidth, H = window.innerHeight;
    const svg = makeSVG();
    const cx2=W/2, cy2=H/2;
    [[[cx2,0],[cx2,cy2-55]],[[cx2,cy2+55],[cx2,H]],[[0,cy2],[cx2-55,cy2]],[[cx2+55,cy2],[W,cy2]]
    ].forEach(([[x1,y1],[x2,y2]],i) => {
      const l=document.createElementNS('http://www.w3.org/2000/svg','line');
      l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);
      l.setAttribute('stroke',C);l.setAttribute('stroke-width','1.8');
      const d=Math.hypot(x2-x1,y2-y1);
      l.setAttribute('stroke-dasharray',d);l.setAttribute('stroke-dashoffset',d);
      l.style.cssText='--len:'+d+'px;filter:drop-shadow(0 0 5px '+C+');animation:sfxThread 0.35s '+(i*0.045)+'s ease forwards';
      svg.appendChild(l);
    });
    [28,58,96].forEach((r,i) => {
      const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx',cx2);c.setAttribute('cy',cy2);c.setAttribute('r',r);
      c.setAttribute('fill','none');c.setAttribute('stroke',C);c.setAttribute('stroke-width',i===0?'2.2':'1.2');
      const p=2*Math.PI*r;c.setAttribute('stroke-dasharray',p);c.setAttribute('stroke-dashoffset',p);
      c.style.animation='sfxThread 0.4s '+(0.18+i*0.08)+'s ease forwards';
      svg.appendChild(c);
    });
    const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
    dot.setAttribute('cx',cx2);dot.setAttribute('cy',cy2);dot.setAttribute('r','5');
    dot.setAttribute('fill',C);dot.style.animation='sfxPulse 0.35s infinite';
    svg.appendChild(dot); ov.appendChild(svg);
    setTimeout(() => {
      ov.appendChild(el('div','position:absolute;inset:0;background:rgba(255,34,68,0.35);animation:sfxFadeOut 0.25s ease forwards'));
      shake();
    }, 880);
    ov.appendChild(lbl('처형 명령', C, 0.3));
    if (nick) ov.appendChild(lbl('TARGET: '+nick, C+'aa', 0.5, 'clamp(10px,2vw,14px)'));
    ov.appendChild(sub('EXECUTE ORDER CONFIRMED'));
    if (window.SoundFX) SoundFX.play('kill');
    autoRemove(ov, 1900);
  }

  function KILLER(nick) {
    const ov = makeOv();
    const C = '#ff2244';
    ov.appendChild(el('div','position:absolute;inset:0;background:rgba(18,0,0,0.72);animation:sfxFadeIn 0.3s ease forwards'));
    const W=window.innerWidth, H=window.innerHeight;
    const svg=makeSVG(); const cx2=W/2, cy2=H/2;
    [[[cx2,0],[cx2,cy2-62]],[[cx2,cy2+62],[cx2,H]],[[0,cy2],[cx2-62,cy2]],[[cx2+62,cy2],[W,cy2]]
    ].forEach(([[x1,y1],[x2,y2]],i) => {
      const l=document.createElementNS('http://www.w3.org/2000/svg','line');
      l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);
      l.setAttribute('stroke',C);l.setAttribute('stroke-width','2');
      const d=Math.hypot(x2-x1,y2-y1);
      l.setAttribute('stroke-dasharray',d);l.setAttribute('stroke-dashoffset',d);
      l.style.cssText='--len:'+d+'px;filter:drop-shadow(0 0 6px '+C+');animation:sfxThread 0.32s '+(i*0.04)+'s ease forwards';
      svg.appendChild(l);
    });
    [24,52,88].forEach((r,i) => {
      const c=document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx',cx2);c.setAttribute('cy',cy2);c.setAttribute('r',r);
      c.setAttribute('fill','none');c.setAttribute('stroke',C);c.setAttribute('stroke-width',i===0?'2.5':'1.2');
      const p=2*Math.PI*r;c.setAttribute('stroke-dasharray',p);c.setAttribute('stroke-dashoffset',p);
      c.style.animation='sfxThread 0.38s '+(0.12+i*0.07)+'s ease forwards';
      svg.appendChild(c);
    });
    ov.appendChild(svg);
    ['top:0;left:0','top:0;right:0','bottom:0;left:0','bottom:0;right:0'].forEach((p,i) => {
      ov.appendChild(el('div',
        'position:absolute;'+p+';width:130px;height:130px;'+
        'background:radial-gradient(circle,rgba(180,0,20,0.7),transparent 70%);'+
        'opacity:0;animation:sfxFadeIn 0.5s '+(0.75+i*0.06)+'s ease forwards'
      ));
    });
    setTimeout(() => {
      ov.appendChild(el('div','position:absolute;inset:0;background:rgba(255,255,255,0.12);animation:sfxFadeOut 0.2s ease forwards'));
      shake();
    }, 680);
    ov.appendChild(lbl('살해', C, 0.3));
    if (nick) ov.appendChild(lbl('TARGET: '+nick, C+'aa', 0.5, 'clamp(10px,2vw,14px)'));
    ov.appendChild(sub('ELIMINATING...'));
    if (window.SoundFX) SoundFX.play('kill');
    autoRemove(ov, 1800);
  }

  function HACKER(nick) {
    const ov = makeOv();
    const C = '#00ff41';
    ov.appendChild(el('div','position:absolute;inset:0;background:rgba(0,10,0,0.9);animation:sfxFadeIn 0.3s ease forwards'));
    const chars='01アイウエオカキクケコ'.split('');
    const cols = Math.floor(window.innerWidth/18);
    for (let i=0;i<cols;i++) {
      const col=el('div',
        'position:absolute;left:'+(i*18)+'px;top:0;width:16px;'+
        'font-family:\'Share Tech Mono\',monospace;font-size:12px;color:'+C+';'+
        'white-space:pre;line-height:1.3;text-shadow:0 0 6px '+C+';'+
        'animation:sfxCodeRain '+(0.8+Math.random()*1.2)+'s '+(Math.random()*0.5)+'s ease-in forwards'
      );
      col.textContent = Array.from({length:20},()=>chars[Math.floor(Math.random()*chars.length)]).join('\n');
      ov.appendChild(col);
    }
    const icon = cx(
      'display:flex;flex-direction:column;align-items:center;gap:12px;'+
      'opacity:0;animation:sfxScaleIn 0.5s 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards',
      '<div style="font-size:clamp(60px,14vw,96px);filter:drop-shadow(0 0 22px '+C+');animation:sfxPulse 0.5s infinite">&#128187;</div>'+
      '<div style="width:min(280px,70vw);height:6px;background:rgba(0,255,65,0.18);border:1px solid '+C+';border-radius:3px;overflow:hidden">'+
      '<div style="height:100%;background:'+C+';border-radius:3px;animation:sfxTypeout 1.2s 0.4s ease forwards;width:0"></div>'+
      '</div>'
    );
    ov.appendChild(icon);
    setTimeout(() => {
      const ag = el('div',
        'position:absolute;left:50%;top:56%;transform:translateX(-50%);'+
        'font-family:Orbitron,monospace;font-size:clamp(12px,2.8vw,20px);font-weight:900;'+
        'color:'+C+';text-shadow:0 0 20px '+C+';letter-spacing:0.2em;'+
        'opacity:0;animation:sfxFadeIn 0.4s ease forwards'
      );
      ag.textContent = nick?'ACCESS GRANTED — '+nick:'ACCESS GRANTED';
      ov.appendChild(ag);
    }, 1400);
    ov.appendChild(lbl('정보 해킹', C, 0.3));
    ov.appendChild(sub('BREACHING... MATRIX OVERRIDE'));
    if (window.SoundFX) SoundFX.play('hack');
    autoRemove(ov, 2300);
  }

  function LAWYER(nick) {
    const ov = makeOv();
    const C = '#ffb700';
    ov.appendChild(bgGlow(C, 0.2));
    for (let i=0;i<10;i++) {
      ov.appendChild(el('div',
        'position:absolute;left:'+(10+Math.random()*80)+'%;top:'+(10+Math.random()*80)+'%;'+
        'width:'+(3+Math.random()*4)+'px;height:'+(3+Math.random()*4)+'px;'+
        'border-radius:50%;background:'+C+';'+
        'opacity:0;animation:sfxFadeIn 0.5s '+(Math.random()*0.6)+'s ease forwards'
      ));
    }
    const icon = cx(
      'display:flex;flex-direction:column;align-items:center;'+
      'opacity:0;animation:sfxScaleIn 0.6s 0.1s cubic-bezier(0.34,1.56,0.64,1) forwards',
      '<div style="font-size:clamp(76px,17vw,116px);filter:drop-shadow(0 0 28px '+C+');animation:sfxPulse 1s infinite">&#9878;&#65039;</div>'
    );
    ov.appendChild(icon);
    setTimeout(() => {
      const stamp = el('div',
        'position:absolute;left:50%;top:50%;'+
        'font-family:Orbitron,monospace;font-size:clamp(13px,2.8vw,20px);font-weight:900;'+
        'color:'+C+';border:3px solid '+C+';padding:6px 16px;letter-spacing:0.25em;'+
        'animation:sfxStamp 0.4s cubic-bezier(0.2,0.8,0.3,1.2) forwards'
      );
      stamp.textContent = 'CONFIDENTIAL';
      ov.appendChild(stamp);
    }, 900);
    ov.appendChild(lbl('비밀 유지', C));
    if (nick) ov.appendChild(lbl('CLIENT: '+nick, C+'aa', 0.75, 'clamp(10px,2vw,13px)'));
    ov.appendChild(sub('CONFIDENTIALITY SECURED'));
    if (window.SoundFX) SoundFX.play('protect');
    autoRemove(ov, 2200);
  }

  function GAMBLER(prediction) {
    const pCfg = {
      death:     {C:'#ff2244',icon:'☠️',label:'사망 예측',bg:'rgba(120,0,20,0.42)',result:'DEATH'},
      execution: {C:'#ffb700',icon:'⚖️',label:'처형 예측',bg:'rgba(80,50,0,0.42)',result:'EXECUTE'},
      peace:     {C:'#00ff88',icon:'🕊️',label:'평화 예측',bg:'rgba(0,60,30,0.42)',result:'PEACE'},
    };
    const cfg = pCfg[prediction]||pCfg.peace;
    const ov = makeOv(); const C=cfg.C;
    ov.appendChild(el('div',
      'position:absolute;inset:0;background:radial-gradient(ellipse 80% 75% at 50% 50%,'+cfg.bg+',rgba(5,5,5,0.87));'+
      'animation:sfxFadeIn 0.4s ease forwards'
    ));
    const chip = el('div',
      'position:absolute;left:50%;top:0;font-size:clamp(42px,10vw,72px);'+
      'animation:sfxChipToss 0.8s 0.1s ease-out forwards'
    );
    chip.textContent = '🎰'; ov.appendChild(chip);
    const slotWrap = cx(
      'display:flex;gap:8px;margin-top:-28px;opacity:0;animation:sfxScaleIn 0.5s 0.15s ease forwards'
    );
    ['7',cfg.icon,'7'].forEach((sym,i) => {
      const reel=el('div',
        'width:min(78px,20vw);height:min(88px,22vw);background:rgba(0,0,0,0.82);border:2px solid '+C+';'+
        'display:flex;align-items:center;justify-content:center;font-size:clamp(30px,8vw,48px);overflow:hidden;position:relative'
      );
      const inner=el('div',
        'display:flex;flex-direction:column;align-items:center;gap:4px;'+
        'animation:sfxReelSpin '+(0.5+i*0.15)+'s ease-out '+(i*0.1)+'s forwards'
      );
      ['🎲','🃏','♠️',sym,'🎯','🔮',sym].forEach(s=>{
        const row=el('div','font-size:inherit;line-height:1.2');
        row.textContent=s; inner.appendChild(row);
      });
      reel.appendChild(inner); slotWrap.appendChild(reel);
    });
    ov.appendChild(slotWrap);
    setTimeout(() => {
      const result=el('div',
        'position:absolute;left:50%;top:60%;transform:translateX(-50%);'+
        'font-family:Orbitron,monospace;font-size:clamp(16px,4vw,26px);font-weight:900;'+
        'color:'+C+';text-shadow:0 0 25px '+C+';letter-spacing:0.15em;text-align:center;'+
        'opacity:0;animation:sfxSlideUp 0.5s ease forwards'
      );
      result.textContent='BET: '+cfg.result;
      ov.appendChild(result);
    }, 900);
    ov.appendChild(lbl(cfg.label, C, 1.1));
    ov.appendChild(sub('BET PLACED — CALCULATING...', 1.3));
    if (window.SoundFX) SoundFX.play('gamble');
    autoRemove(ov, 2400);
  }

  function JOBSEEKER(newRole) {
    const ov = makeOv(); const C='#00c8ff';
    const KO={POLICE:'경찰',DETECTIVE:'탐정',WATCHMAN:'감시자',SHAMAN:'무당',ARCHIVIST:'기록관',DOCTOR:'의사',SOLDIER:'군인',BOSS:'보스',KILLER:'킬러',HACKER:'해커',POLITICIAN:'정치인',LAWYER:'변호사'};
    const IC={POLICE:'🔎',DETECTIVE:'🕵️',WATCHMAN:'📡',SHAMAN:'🔮',ARCHIVIST:'📁',DOCTOR:'💊',SOLDIER:'🛡️',BOSS:'👁️',KILLER:'🔫',HACKER:'💻',POLITICIAN:'🏛️',LAWYER:'⚖️'};
    ov.appendChild(bgGlow(C, 0.18));
    const card=cx(
      'width:min(280px,80vw);background:rgba(3,10,22,0.96);border:2px solid '+C+';padding:22px;'+
      'display:flex;flex-direction:column;gap:14px;'+
      'clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px));'+
      'opacity:0;animation:sfxScaleIn 0.5s 0.1s cubic-bezier(0.34,1.56,0.64,1) forwards',
      '<div style="font-family:\'Share Tech Mono\',monospace;font-size:8px;letter-spacing:0.4em;color:'+C+'80">// IDENTITY UPDATED</div>'+
      '<div style="display:flex;align-items:center;gap:14px">'+
      '<div style="width:58px;height:58px;border:2px solid '+C+';background:'+C+'18;'+
      'display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">'+(IC[newRole]||'📋')+'</div>'+
      '<div>'+
      '<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+C+'60;letter-spacing:0.3em;margin-bottom:4px">NEW IDENTITY</div>'+
      '<div style="font-family:Orbitron,monospace;font-size:20px;font-weight:900;color:'+C+';'+
      'overflow:hidden;white-space:nowrap;animation:sfxIDPrint 0.8s 0.5s ease both">'+(KO[newRole]||newRole)+'</div>'+
      '</div></div>'+
      '<div style="height:1px;background:'+C+'28"></div>'+
      '<div style="font-family:\'Share Tech Mono\',monospace;font-size:9px;color:'+C+'48;letter-spacing:0.2em">직업 승계 완료 — ROLE INHERITED</div>'
    );
    ov.appendChild(card);
    const pl=el('div',
      'position:absolute;left:50%;top:50%;width:min(280px,80vw);height:3px;'+
      'background:linear-gradient(90deg,transparent,'+C+',transparent);'+
      'transform:translate(-50%,-50%);animation:sfxScanline 0.9s 0.4s ease-in-out'
    );
    ov.appendChild(pl);
    ov.appendChild(lbl('직업 승계', C, 1.0));
    ov.appendChild(sub('IDENTITY CARD UPDATED'));
    if (window.SoundFX) SoundFX.play('inherit');
    autoRemove(ov, 2600);
  }

  function POLITICIAN(nick) {
    const ov = makeOv(); const C='#ffb700';
    ov.appendChild(bgGlow(C, 0.2));
    const gavel=el('div',
      'position:absolute;left:50%;top:32%;'+
      'font-size:clamp(74px,17vw,118px);filter:drop-shadow(0 0 32px '+C+');'+
      'opacity:0;animation:sfxGavel 0.8s 0.05s cubic-bezier(0.2,0.8,0.3,1.2) forwards'
    );
    gavel.textContent='🏛️'; ov.appendChild(gavel);
    setTimeout(() => {
      for (let i=0;i<4;i++) {
        ov.appendChild(el('div',
          'position:absolute;left:50%;top:50%;'+
          'width:'+(40+i*68)+'px;height:'+(40+i*68)+'px;'+
          'border-radius:50%;border:2px solid '+C+';'+
          'animation:sfxShockwave 0.7s '+(i*0.1)+'s ease-out forwards'
        ));
      }
      shake();
    }, 580);
    setTimeout(() => {
      const votes=el('div',
        'position:absolute;left:50%;top:60%;transform:translateX(-50%);'+
        'font-family:Orbitron,monospace;font-size:clamp(20px,5.5vw,38px);font-weight:900;'+
        'color:'+C+';text-shadow:0 0 32px '+C+';letter-spacing:0.1em;'+
        'opacity:0;animation:sfxScaleIn 0.5s ease forwards'
      );
      votes.textContent='× 2 VOTES'; ov.appendChild(votes);
    }, 680);
    ov.appendChild(lbl('투표 행사', C, 1.0));
    ov.appendChild(sub('DOUBLE VOTE ACTIVATED'));
    if (window.SoundFX) SoundFX.play('gavel');
    autoRemove(ov, 2200);
  }

  function RECRUITED() {
    const ov=makeOv(9900); const C='#ff2244';
    const bg=el('div','position:absolute;inset:0;background:rgba(100,0,15,0);transition:background 0.3s');
    ov.appendChild(bg);
    setTimeout(() => { bg.style.background='rgba(100,0,15,0.93)'; }, 50);
    const W=window.innerWidth, H=window.innerHeight;
    const svg=makeSVG();
    svg.style.opacity='0'; svg.style.animation='sfxFadeIn 0.2s 0.1s ease forwards';
    for (let i=0;i<14;i++) {
      const ang=(i/14)*Math.PI*2, len=150+Math.random()*220;
      const ex=W/2+Math.cos(ang)*len, ey=H/2+Math.sin(ang)*len;
      const l=document.createElementNS('http://www.w3.org/2000/svg','line');
      l.setAttribute('x1',W/2);l.setAttribute('y1',H/2);l.setAttribute('x2',ex);l.setAttribute('y2',ey);
      l.setAttribute('stroke','rgba(255,34,68,'+(0.5+Math.random()*0.4)+')');
      l.setAttribute('stroke-width',0.8+Math.random()*1.5);
      const d=Math.hypot(ex-W/2,ey-H/2);
      l.setAttribute('stroke-dasharray',d);l.setAttribute('stroke-dashoffset',d);
      l.style.cssText='--len:'+d+'px;animation:sfxThread 0.4s '+(i*0.03)+'s ease forwards;filter:drop-shadow(0 0 3px '+C+')';
      svg.appendChild(l);
    }
    ov.appendChild(svg);
    for (let i=0;i<8;i++) {
      ov.appendChild(el('div',
        'position:absolute;left:0;right:0;top:'+(Math.random()*100)+'%;height:'+(2+Math.random()*10)+'px;'+
        'background:rgba(255,80,80,'+(0.2+Math.random()*0.3)+');'+
        'animation:sfxFadeOut '+(0.1+Math.random()*0.15)+'s '+(i*0.05)+'s ease forwards'
      ));
    }
    const txt=el('div','position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center');
    txt.innerHTML =
      '<div style="font-family:Orbitron,monospace;font-size:clamp(20px,5vw,44px);font-weight:900;'+
      'color:'+C+';text-shadow:0 0 40px '+C+';letter-spacing:0.08em;'+
      'opacity:0;animation:sfxScaleIn 0.4s 0.25s ease forwards">당신은 포섭되었습니다.</div>'+
      '<div style="font-family:\'Share Tech Mono\',monospace;font-size:clamp(10px,2vw,13px);'+
      'color:rgba(255,150,150,0.58);letter-spacing:0.35em;margin-top:16px;'+
      'opacity:0;animation:sfxSlideUp 0.5s 0.8s ease forwards">// IDENTITY COMPROMISED</div>';
    ov.appendChild(txt);
    if (window.SoundFX) SoundFX.play('recruited');
    setTimeout(() => { bg.style.background='rgba(0,0,0,0)'; setTimeout(()=>ov.remove(),600); }, 2800);
  }

  function RECRUIT_OTHERS() {
    const ov = makeOv(8200);

    // 배경 서서히 핏빛으로
    const bg = el('div',
      'position:absolute;inset:0;background:rgba(80,0,10,0);transition:background 1.2s ease'
    );
    ov.appendChild(bg);
    setTimeout(() => { bg.style.background = 'rgba(80,0,10,0.45)'; }, 100);

    // 스캔라인 오버레이 (불길함)
    ov.appendChild(el('div',
      'position:absolute;inset:0;'+
      'background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(100,0,0,0.12) 3px,rgba(100,0,0,0.12) 4px)'
    ));

    // 피 흘러내림 — 상단에서 여러 줄기
    const drips = [8,18,27,38,52,63,72,83,91];
    drips.forEach((x, i) => {
      const h  = 30 + Math.random() * 55;  // 길이 %
      const w  = 3  + Math.random() * 7;   // 너비 px
      const d  = i * 0.12 + Math.random() * 0.2; // 딜레이
      const dur = 1.0 + Math.random() * 0.8;

      // 줄기
      const drip = el('div',
        'position:absolute;top:0;left:'+x+'%;width:'+w+'px;'+
        'background:linear-gradient(to bottom,rgba(180,0,20,0.9),rgba(140,0,15,0.7),rgba(100,0,10,0));'+
        'transform:scaleY(0);transform-origin:top;border-radius:0 0 '+(w/2)+'px '+(w/2)+'px;'+
        'animation:sfxBloodDrip '+dur+'s '+d+'s ease-out forwards;height:'+h+'vh;filter:blur(0.5px)'
      );
      ov.appendChild(drip);

      // 핏방울 끝
      const drop = el('div',
        'position:absolute;top:'+h+'vh;left:calc('+x+'% + '+(w/2-4)+'px);'+
        'width:8px;height:10px;border-radius:50% 50% 50% 50% / 40% 40% 60% 60%;'+
        'background:rgba(160,0,15,0.8);'+
        'opacity:0;animation:sfxFadeIn 0.3s '+(d+dur*0.85)+'s ease forwards'
      );
      ov.appendChild(drop);
    });

    // 화면 가장자리 핏빛 광선
    ['top:0;left:0;right:0;height:4px','bottom:0;left:0;right:0;height:4px',
     'top:0;left:0;bottom:0;width:4px','top:0;right:0;bottom:0;width:4px'
    ].forEach((pos, i) => {
      ov.appendChild(el('div',
        'position:absolute;'+pos+';'+
        'background:rgba(200,0,20,0.8);box-shadow:0 0 12px rgba(255,0,30,0.6);'+
        'opacity:0;animation:sfxFadeIn 0.4s '+(0.3+i*0.05)+'s ease forwards'
      ));
    });

    // 중앙 공지 텍스트 (섬뜩하게)
    const notice = el('div',
      'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);'+
      'text-align:center;opacity:0;animation:sfxScaleIn 0.5s 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards'
    );
    notice.innerHTML =
      '<div style="font-family:Orbitron,monospace;font-size:clamp(13px,3vw,22px);font-weight:900;'+
      'color:rgba(220,30,40,0.95);text-shadow:0 0 30px rgba(255,0,30,0.8);letter-spacing:0.06em;'+
      'line-height:1.4;animation:sfxGlitch 1.5s 1s infinite">'+
      '누군가 어둠의 세력의<br>유혹에 넘어갔습니다...</div>'+
      '<div style="font-family:\'Share Tech Mono\',monospace;font-size:clamp(9px,1.8vw,12px);'+
      'color:rgba(180,60,60,0.6);letter-spacing:0.4em;margin-top:14px;'+
      'opacity:0;animation:sfxSlideUp 0.4s 1.1s ease forwards">// DARK SIGNAL DETECTED</div>';
    ov.appendChild(notice);

    // 지지직 노이즈 라인
    for (let i=0; i<5; i++) {
      const y   = Math.random() * 100;
      const dur = 0.08 + Math.random() * 0.1;
      ov.appendChild(el('div',
        'position:absolute;left:0;right:0;top:'+y+'%;height:'+(2+Math.random()*6)+'px;'+
        'background:rgba(255,50,50,'+(0.15+Math.random()*0.25)+');'+
        'animation:sfxFadeOut '+dur+'s '+(i*0.08)+'s ease forwards'
      ));
    }

    if (window.SoundFX) SoundFX.play('recruited'); // 충격적인 사운드

    // 3초 후 서서히 사라짐
    setTimeout(() => {
      bg.style.background = 'rgba(0,0,0,0)';
      ov.style.animation = 'sfxFadeOut 0.8s ease forwards';
      setTimeout(() => ov.remove(), 850);
    }, 3000);
  }

  // ── 공개 API ────────────────────────────────────────────
  return {
    play(role, targetUID, extra) {
      const nick = (window._nickCache&&window._nickCache[targetUID]) || targetUID || '';
      switch(role) {
        case 'POLICE':     POLICE(nick); break;
        case 'DETECTIVE':  DETECTIVE(nick,(window._nickCache&&window._nickCache[extra])||extra||''); break;
        case 'WATCHMAN':   WATCHMAN(nick); break;
        case 'SHAMAN':     SHAMAN(nick); break;
        case 'ARCHIVIST':  ARCHIVIST(nick); break;
        case 'DOCTOR':     DOCTOR(nick); break;
        case 'SOLDIER':    SOLDIER(nick); break;
        case 'BOSS':       extra==='kill'?BOSS_kill(nick):BOSS_recruit(nick); break;
        case 'KILLER':     KILLER(nick); break;
        case 'HACKER':     HACKER(nick); break;
        case 'LAWYER':     LAWYER(nick); break;
        case 'GAMBLER':    GAMBLER(targetUID); break;
        case 'JOBSEEKER':  JOBSEEKER(targetUID); break;
        case 'POLITICIAN': POLITICIAN(nick); break;
      }
    },
    RECRUITED,
    RECRUIT_OTHERS,
  };
})();

window.SkillFX = SkillFX;
