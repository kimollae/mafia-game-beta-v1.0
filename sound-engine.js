// ============================================================
//  🔊 MAFIA // PROTOCOL — SOUND ENGINE v1.0
//  sound-engine.js
//  Web Audio API 기반 절차적 사운드 생성
//  외부 오디오 파일 없이 코드로 모든 사운드 합성
// ============================================================

const SoundFX = (() => {

  let ctx = null;
  let masterGain = null;
  let unlocked = false;
  let bgmNode = null, bgmGain = null;

  // ── AudioContext 초기화 (사용자 인터랙션 후) ─────────────────
  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(ctx.destination);
      unlocked = true;
    } catch(e) {
      console.warn('Web Audio API 미지원:', e);
    }
  }

  // ── 자동 unlock (첫 클릭/터치) ──────────────────────────────
  function autoUnlock() {
    const events = ['click','touchstart','keydown'];
    const unlock = () => {
      init();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      events.forEach(e => document.removeEventListener(e, unlock));
    };
    events.forEach(e => document.addEventListener(e, unlock, { once:true }));
  }
  autoUnlock();

  // ── 유틸: 노이즈 버퍼 생성 ──────────────────────────────────
  function makeNoise(duration) {
    const sr     = ctx.sampleRate;
    const buf    = ctx.createBuffer(1, Math.floor(sr * duration), sr);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ── 유틸: 오실레이터 헬퍼 ───────────────────────────────────
  function osc(freq, type, startTime, duration, gainVal = 0.3) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, startTime);
    g.gain.setValueAtTime(gainVal, startTime);
    g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    o.connect(g); g.connect(masterGain);
    o.start(startTime); o.stop(startTime + duration);
    return { osc:o, gain:g };
  }

  // ── 사운드 정의 ──────────────────────────────────────────────
  const sounds = {

    // 경찰 스캔 — 기계식 키보드 + 스캔 톤
    scan() {
      if (!ctx) return;
      const t = ctx.currentTime;
      // 키보드 타건 (짧은 클릭음 x3)
      [0, 0.08, 0.16].forEach(offset => {
        const n = ctx.createBufferSource();
        n.buffer = makeNoise(0.04);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = 0.5;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.15, t + offset);
        g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.04);
        n.connect(f); f.connect(g); g.connect(masterGain);
        n.start(t + offset); n.stop(t + offset + 0.05);
      });
      // 스캔 스윕 톤
      const s = ctx.createOscillator();
      const sg = ctx.createGain();
      s.frequency.setValueAtTime(800, t + 0.2);
      s.frequency.linearRampToValueAtTime(1800, t + 1.0);
      sg.gain.setValueAtTime(0.05, t + 0.2);
      sg.gain.setValueAtTime(0.05, t + 0.8);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
      s.connect(sg); sg.connect(masterGain);
      s.start(t + 0.2); s.stop(t + 1.2);
    },

    // 탐정 관계 분석 — 긴장감 있는 현악기 느낌
    analyze() {
      if (!ctx) return;
      const t = ctx.currentTime;
      [440, 554, 659].forEach((freq, i) => {
        osc(freq, 'triangle', t + i*0.15, 0.6, 0.06);
      });
      osc(220, 'sine', t, 0.9, 0.08);
    },

    // 감시자 CCTV — 위잉 줌인 + 셔터 찰칵
    cctv() {
      if (!ctx) return;
      const t = ctx.currentTime;
      // 줌인 (주파수 상승)
      const s = ctx.createOscillator();
      const sg = ctx.createGain();
      s.type = 'sawtooth';
      s.frequency.setValueAtTime(200, t);
      s.frequency.exponentialRampToValueAtTime(1200, t + 0.8);
      sg.gain.setValueAtTime(0.04, t);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      s.connect(sg); sg.connect(masterGain);
      s.start(t); s.stop(t + 1.0);
      // 셔터 찰칵
      const n = ctx.createBufferSource();
      n.buffer = makeNoise(0.03);
      const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 4000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.2, t + 0.85);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.88);
      n.connect(f); f.connect(g); g.connect(masterGain);
      n.start(t + 0.85); n.stop(t + 0.9);
    },

    // 무당 혼령 교신 — 신비로운 에테리얼 톤
    shaman() {
      if (!ctx) return;
      const t = ctx.currentTime;
      // 으스스한 화음
      [220, 277, 370].forEach((freq, i) => {
        const s = ctx.createOscillator();
        const sg = ctx.createGain();
        s.type = 'sine';
        s.frequency.setValueAtTime(freq, t);
        s.frequency.linearRampToValueAtTime(freq * 1.02, t + 1.5);
        sg.gain.setValueAtTime(0, t);
        sg.gain.linearRampToValueAtTime(0.06, t + 0.3);
        sg.gain.linearRampToValueAtTime(0.06, t + 1.2);
        sg.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
        s.connect(sg); sg.connect(masterGain);
        s.start(t); s.stop(t + 2.1);
      });
      // 바람 소리
      const n = ctx.createBufferSource();
      n.buffer = makeNoise(2.0);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 1.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.04, t + 0.5);
      g.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
      n.connect(f); f.connect(g); g.connect(masterGain);
      n.start(t); n.stop(t + 2.1);
    },

    // 기록관 VHS 되감기 — 노이즈 워블
    rewind() {
      if (!ctx) return;
      const t = ctx.currentTime;
      const s = ctx.createOscillator();
      const sg = ctx.createGain();
      s.type = 'sawtooth';
      s.frequency.setValueAtTime(1800, t);
      s.frequency.exponentialRampToValueAtTime(400, t + 0.6);
      s.frequency.exponentialRampToValueAtTime(1600, t + 1.2);
      sg.gain.setValueAtTime(0.06, t);
      sg.gain.setValueAtTime(0.06, t + 1.1);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 1.3);
      s.connect(sg); sg.connect(masterGain);
      s.start(t); s.stop(t + 1.4);
    },

    // 의사 응급 처치 — 제세동기 충전 + 스파크
    heal() {
      if (!ctx) return;
      const t = ctx.currentTime;
      // 충전음 (상승)
      const s = ctx.createOscillator();
      const sg = ctx.createGain();
      s.frequency.setValueAtTime(100, t);
      s.frequency.exponentialRampToValueAtTime(2000, t + 0.8);
      sg.gain.setValueAtTime(0.05, t);
      sg.gain.setValueAtTime(0.05, t + 0.75);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
      s.connect(sg); sg.connect(masterGain);
      s.start(t); s.stop(t + 0.9);
      // 스파크 쾅
      const n = ctx.createBufferSource();
      n.buffer = makeNoise(0.1);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 2000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.4, t + 0.85);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
      n.connect(f); f.connect(g); g.connect(masterGain);
      n.start(t + 0.85); n.stop(t + 1.0);
      // ECG 비프
      osc(880, 'sine', t + 1.0, 0.1, 0.08);
      osc(880, 'sine', t + 1.2, 0.1, 0.08);
    },

    // 군인 방패 — 묵직한 금속 충격음
    shield() {
      if (!ctx) return;
      const t = ctx.currentTime;
      // 낮은 임팩트
      osc(60, 'sine', t, 0.3, 0.4);
      osc(120, 'sine', t, 0.2, 0.2);
      // 금속 울림
      const n = ctx.createBufferSource();
      n.buffer = makeNoise(0.15);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = 8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      n.connect(f); f.connect(g); g.connect(masterGain);
      n.start(t); n.stop(t + 0.35);
    },

    // 보스 포섭 — 불길한 저음 드론
    recruit() {
      if (!ctx) return;
      const t = ctx.currentTime;
      // 불길한 코드
      [55, 82, 110].forEach((freq, i) => {
        const s = ctx.createOscillator();
        const sg = ctx.createGain();
        s.type = 'sawtooth';
        s.frequency.setValueAtTime(freq, t);
        sg.gain.setValueAtTime(0, t);
        sg.gain.linearRampToValueAtTime(0.07, t + 0.3);
        sg.gain.linearRampToValueAtTime(0.07, t + 1.5);
        sg.gain.exponentialRampToValueAtTime(0.001, t + 2.0);
        s.connect(sg); sg.connect(masterGain);
        s.start(t); s.stop(t + 2.1);
      });
      osc(55, 'sine', t, 2.0, 0.1);
    },

    // 킬러 살해 — 소음기 권총 (Pew)
    kill() {
      if (!ctx) return;
      const t = ctx.currentTime;
      // 소음기 음 (짧고 건조)
      const n = ctx.createBufferSource();
      n.buffer = makeNoise(0.08);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 800;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      n.connect(f); f.connect(g); g.connect(masterGain);
      n.start(t); n.stop(t + 0.1);
      // 저음 울림
      osc(80, 'sine', t, 0.15, 0.15);
      // 케이스 떨어지는 소리
      const n2 = ctx.createBufferSource();
      n2.buffer = makeNoise(0.04);
      const f2 = ctx.createBiquadFilter();
      f2.type = 'highpass'; f2.frequency.value = 3000;
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.1, t + 0.12);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      n2.connect(f2); f2.connect(g2); g2.connect(masterGain);
      n2.start(t + 0.12); n2.stop(t + 0.18);
    },

    // 해커 해킹 — 빠른 키보드 + 디지털 노이즈
    hack() {
      if (!ctx) return;
      const t = ctx.currentTime;
      for (let i = 0; i < 12; i++) {
        const n = ctx.createBufferSource();
        n.buffer = makeNoise(0.02);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 1000 + Math.random() * 3000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.08, t + i * 0.07);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.02);
        n.connect(f); f.connect(g); g.connect(masterGain);
        n.start(t + i * 0.07); n.stop(t + i * 0.07 + 0.03);
      }
      // 자물쇠 해제음
      osc(1200, 'sine', t + 0.85, 0.1, 0.06);
      osc(1600, 'sine', t + 0.96, 0.1, 0.06);
    },

    // 변호사 보호 — 황금 계약서 도장
    protect() {
      if (!ctx) return;
      const t = ctx.currentTime;
      osc(440, 'triangle', t, 0.3, 0.08);
      osc(554, 'triangle', t + 0.1, 0.3, 0.08);
      osc(659, 'triangle', t + 0.2, 0.4, 0.08);
      // 도장 찍는 소리
      const n = ctx.createBufferSource();
      n.buffer = makeNoise(0.05);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 400;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.2, t + 0.4);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      n.connect(f); f.connect(g); g.connect(masterGain);
      n.start(t + 0.4); n.stop(t + 0.5);
    },

    // 도박꾼 베팅 — 칩 던지는 소리 + 슬롯 릴
    gamble() {
      if (!ctx) return;
      const t = ctx.currentTime;
      // 칩 소리 (딸깍)
      [0, 0.1, 0.2].forEach(offset => {
        const n = ctx.createBufferSource();
        n.buffer = makeNoise(0.03);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 2500; f.Q.value = 3;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.15, t + offset);
        g.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.03);
        n.connect(f); f.connect(g); g.connect(masterGain);
        n.start(t + offset); n.stop(t + offset + 0.04);
      });
      // 슬롯 릴 소리
      const s = ctx.createOscillator();
      const sg = ctx.createGain();
      s.type = 'sawtooth';
      s.frequency.setValueAtTime(400, t + 0.3);
      s.frequency.exponentialRampToValueAtTime(200, t + 0.8);
      sg.gain.setValueAtTime(0.04, t + 0.3);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      s.connect(sg); sg.connect(masterGain);
      s.start(t + 0.3); s.stop(t + 1.0);
    },

    // 취업준비생 승계 — 프린터 소리
    inherit() {
      if (!ctx) return;
      const t = ctx.currentTime;
      for (let i = 0; i < 20; i++) {
        const n = ctx.createBufferSource();
        n.buffer = makeNoise(0.03);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 800 + i*50; f.Q.value = 2;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.06, t + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.03);
        n.connect(f); f.connect(g); g.connect(masterGain);
        n.start(t + i * 0.06); n.stop(t + i * 0.06 + 0.04);
      }
    },

    // 정치인 의사봉 — 목재 타격음
    gavel() {
      if (!ctx) return;
      const t = ctx.currentTime;
      const n = ctx.createBufferSource();
      n.buffer = makeNoise(0.06);
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 300;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      n.connect(f); f.connect(g); g.connect(masterGain);
      n.start(t); n.stop(t + 0.2);
      osc(150, 'sine', t, 0.2, 0.15);
      // 메아리
      osc(150, 'sine', t + 0.25, 0.15, 0.05);
    },

    // ★ 포섭 이벤트 — 유리 깨짐 + 심장 박동 + 악마 속삭임
    recruited() {
      if (!ctx) return;
      const t = ctx.currentTime;

      // 유리 깨짐
      const n = ctx.createBufferSource();
      n.buffer = makeNoise(0.3);
      const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 2000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.8, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      n.connect(f); f.connect(g); g.connect(masterGain);
      n.start(t); n.stop(t + 0.35);

      // 끈적한 피 텍스처 소리
      const n2 = ctx.createBufferSource();
      n2.buffer = makeNoise(0.5);
      const f2 = ctx.createBiquadFilter();
      f2.type = 'lowpass'; f2.frequency.value = 300;
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0, t + 0.3);
      g2.gain.linearRampToValueAtTime(0.3, t + 0.5);
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      n2.connect(f2); f2.connect(g2); g2.connect(masterGain);
      n2.start(t + 0.3); n2.stop(t + 0.85);

      // 심장 박동 (두 번)
      [0.8, 1.0, 1.8, 2.0].forEach(offset => {
        osc(40, 'sine', t + offset, 0.15, 0.4);
        osc(60, 'sine', t + offset, 0.1, 0.3);
      });

      // 악마 속삭임 — 낮은 변조 보이스
      const whisper = ctx.createOscillator();
      const wg      = ctx.createGain();
      const distortion = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = (Math.PI + 200) * x / (Math.PI + 200 * Math.abs(x));
      }
      distortion.curve = curve;
      whisper.type = 'sawtooth';
      whisper.frequency.setValueAtTime(80, t + 1.5);
      whisper.frequency.setValueAtTime(75, t + 2.0);
      wg.gain.setValueAtTime(0, t + 1.5);
      wg.gain.linearRampToValueAtTime(0.15, t + 1.8);
      wg.gain.exponentialRampToValueAtTime(0.001, t + 3.0);
      whisper.connect(distortion); distortion.connect(wg); wg.connect(masterGain);
      whisper.start(t + 1.5); whisper.stop(t + 3.1);
    },

    // 글리치 효과음 (포섭 발생 시 다른 플레이어용)
    glitch() {
      if (!ctx) return;
      const t = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const n = ctx.createBufferSource();
        n.buffer = makeNoise(0.05);
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 500 + Math.random() * 2000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.1, t + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.05);
        n.connect(f); f.connect(g); g.connect(masterGain);
        n.start(t + i * 0.08); n.stop(t + i * 0.08 + 0.06);
      }
    },

    // ── BGM ────────────────────────────────────────────────────
    // 낮 토론 — 수사 스릴러 드론
    bgmDay() {
      if (!ctx) return;
      stopBGM();
      bgmGain = ctx.createGain();
      bgmGain.gain.value = 0.04;
      bgmGain.connect(masterGain);

      // 드론 레이어
      const freqs = [55, 110, 165, 220];
      bgmNode = freqs.map(freq => {
        const s = ctx.createOscillator();
        s.type = 'sine';
        s.frequency.setValueAtTime(freq, ctx.currentTime);
        // 미세한 진동
        const lfo = ctx.createOscillator();
        const lfoG = ctx.createGain();
        lfo.frequency.value = 0.3 + Math.random() * 0.2;
        lfoG.gain.value = 0.5;
        lfo.connect(lfoG); lfoG.connect(s.frequency);
        lfo.start();
        s.connect(bgmGain); s.start();
        return [s, lfo];
      }).flat();

      // 시계 초침 (메트로놈)
      scheduleTicks();
    },

    // 밤 행동 — 다크 앰비언트
    bgmNight() {
      if (!ctx) return;
      stopBGM();
      bgmGain = ctx.createGain();
      bgmGain.gain.value = 0.03;
      bgmGain.connect(masterGain);

      const freqs = [27, 41, 55];
      bgmNode = freqs.map(freq => {
        const s = ctx.createOscillator();
        s.type = 'triangle';
        s.frequency.value = freq;
        const lfo = ctx.createOscillator();
        const lfoG = ctx.createGain();
        lfo.frequency.value = 0.1 + Math.random() * 0.1;
        lfoG.gain.value = 1;
        lfo.connect(lfoG); lfoG.connect(s.frequency);
        lfo.start();
        s.connect(bgmGain); s.start();
        return [s, lfo];
      }).flat();
    },

    bgmUrgent() {
      if (!bgmGain) return;
      bgmGain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.5);
    },
  };

  let tickInterval = null;
  function scheduleTicks() {
    if (tickInterval) clearInterval(tickInterval);
    tickInterval = setInterval(() => {
      if (!ctx || !bgmGain) return;
      const t = ctx.currentTime;
      const n = ctx.createBufferSource();
      n.buffer = makeNoise(0.015);
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 4000; f.Q.value = 8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
      n.connect(f); f.connect(g); g.connect(masterGain);
      n.start(t); n.stop(t + 0.02);
    }, 1000);
  }

  function stopBGM() {
    if (tickInterval) { clearInterval(tickInterval); tickInterval = null; }
    if (!bgmNode) return;
    const nodes = Array.isArray(bgmNode) ? bgmNode : [bgmNode];
    nodes.forEach(n => { try { n.stop(); } catch(e) {} });
    bgmNode = null;
    if (bgmGain) {
      bgmGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    }
  }

  // ── 볼륨 조절 ───────────────────────────────────────────────
  function setVolume(val) {
    if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, val));
  }

  // ── 공개 API ─────────────────────────────────────────────────
  return {
    play(name, ...args) {
      if (!unlocked) init();
      if (ctx && ctx.state === 'suspended') ctx.resume();
      const fn = sounds[name];
      if (fn) fn(...args);
    },
    bgmDay:    () => { if (!unlocked) init(); sounds.bgmDay(); },
    bgmNight:  () => { if (!unlocked) init(); sounds.bgmNight(); },
    bgmUrgent: () => { sounds.bgmUrgent(); },
    stopBGM,
    setVolume,
    unlock: init,
  };

})();

window.SoundFX = SoundFX;
