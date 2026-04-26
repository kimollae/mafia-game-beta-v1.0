// ============================================================
//  🔊 MAFIA // PROTOCOL — SOUND ENGINE v3.0
//  하이브리드: 고품질 Web Audio 합성 + URL 오버라이드 시스템
//  실제 파일 없어도 작동 / 파일 추가 시 자동으로 업그레이드
// ============================================================

// ★ 실제 사운드 파일 URL을 여기에 추가하면 자동 적용됩니다
// 파일이 없으면 아래 합성 사운드로 자동 대체됨
const SOUND_OVERRIDES = {
  // 예시: kill: 'https://cdn.pixabay.com/audio/xxxx/gun.mp3',
  // 원하는 사운드 URL을 여기에 추가하세요
};

const SoundFX = (() => {

  // ── Web Audio Context ─────────────────────────────────────
  let ctx = null;
  let masterGain = null;
  let compressor = null;
  let reverb = null;
  let bgmNodes = [];
  let bgmGain = null;
  let masterVol = 0.7;

  function init() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();

      // 마스터 컴프레서 (소리가 찌그러지지 않게)
      compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value      = 30;
      compressor.ratio.value     = 12;
      compressor.attack.value    = 0.003;
      compressor.release.value   = 0.25;

      masterGain = ctx.createGain();
      masterGain.gain.value = masterVol;

      // 리버브 (공간감)
      reverb = makeReverb(ctx, 0.8);

      compressor.connect(masterGain);
      masterGain.connect(ctx.destination);
    } catch(e) { console.warn('[SoundFX]', e); }
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  // ── 리버브 임펄스 응답 생성 ──────────────────────────────
  function makeReverb(ctx, duration = 0.5, decay = 2) {
    const sr  = ctx.sampleRate;
    const len = sr * duration;
    const buf = ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    const node = ctx.createConvolver();
    node.buffer = buf;
    return node;
  }

  // ── 노이즈 버퍼 ─────────────────────────────────────────
  function noise(dur) {
    const sr  = ctx.sampleRate;
    const buf = ctx.createBuffer(1, Math.ceil(sr * dur), sr);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // ── 오실레이터 헬퍼 ─────────────────────────────────────
  function osc(freq, type, t, dur, vol = 0.3, dest = compressor) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.setValueAtTime(vol, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.01);
    return { o, g };
  }

  function noiseNode(dur, f_freq, f_type, f_q, vol, t, dest = compressor) {
    const n = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    n.buffer = noise(dur);
    f.type = f_type || 'bandpass';
    f.frequency.value = f_freq || 1000;
    if (f_q) f.Q.value = f_q;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    n.connect(f); f.connect(g); g.connect(dest);
    n.start(t); n.stop(t + dur + 0.01);
  }

  // ────────────────────────────────────────────────────────────
  //  직업별 합성 사운드 (최고 품질로 재구현)
  // ────────────────────────────────────────────────────────────
  const synth = {

    // 경찰 — 홀로그램 레이저 스캔 + 기계음
    scan() {
      const t = ctx.currentTime;
      // 스캔 업스윕
      const s = ctx.createOscillator();
      const sg = ctx.createGain();
      s.type = 'sine';
      s.frequency.setValueAtTime(300, t);
      s.frequency.exponentialRampToValueAtTime(2400, t + 0.9);
      sg.gain.setValueAtTime(0, t);
      sg.gain.linearRampToValueAtTime(0.18, t + 0.05);
      sg.gain.setValueAtTime(0.18, t + 0.8);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
      s.connect(sg); sg.connect(compressor);
      s.start(t); s.stop(t + 1.1);
      // 비프 3회
      [0, 0.12, 0.24].forEach(d => {
        noiseNode(0.03, 3500, 'bandpass', 8, 0.12, t + d);
        osc(1200 + d*200, 'sine', t + d, 0.04, 0.06);
      });
      // 확인음
      osc(880, 'sine', t + 0.95, 0.12, 0.1);
      osc(1320, 'sine', t + 1.0, 0.1, 0.08);
    },

    // 탐정 — 긴장감 넘치는 현악 피치카토
    analyze() {
      const t = ctx.currentTime;
      const notes = [330, 392, 440, 494, 440];
      notes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const dist = ctx.createWaveShaper();
        const curve = new Float32Array(256).map((_, j) => {
          const x = j / 128 - 1;
          return x * 3 / (1 + 2 * Math.abs(x));
        });
        dist.curve = curve;
        o.type = 'sawtooth';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0, t + i * 0.18);
        g.gain.linearRampToValueAtTime(0.15, t + i * 0.18 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.18 + 0.25);
        o.connect(dist); dist.connect(g); g.connect(compressor);
        o.start(t + i * 0.18); o.stop(t + i * 0.18 + 0.3);
      });
      // 베이스 저음
      osc(82, 'sine', t, 0.9, 0.12);
    },

    // 감시자 — 전기 줌 + 셔터
    cctv() {
      const t = ctx.currentTime;
      // 전기 줌인
      const s = ctx.createOscillator();
      const sg = ctx.createGain();
      s.type = 'sawtooth';
      s.frequency.setValueAtTime(80, t);
      s.frequency.exponentialRampToValueAtTime(1800, t + 0.7);
      sg.gain.setValueAtTime(0.06, t);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
      s.connect(sg); sg.connect(compressor);
      s.start(t); s.stop(t + 0.8);
      // 고주파 잡음
      noiseNode(0.6, 4000, 'highpass', 1, 0.04, t);
      // 셔터 클릭 (임팩트)
      noiseNode(0.04, 2000, 'bandpass', 5, 0.35, t + 0.72);
      osc(80, 'sine', t + 0.72, 0.08, 0.12);
    },

    // 무당 — 신비로운 오버톤 + 종소리
    shaman() {
      const t = ctx.currentTime;
      // 종소리 (벨 합성)
      [1, 2.756, 5.404, 8.933].forEach((ratio, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = 220 * ratio;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.12 / (i + 1), t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.001, t + 2.5 / (i * 0.3 + 1));
        o.connect(g); g.connect(reverb); reverb.connect(compressor);
        o.connect(g); // dry도 살짝
        o.start(t); o.stop(t + 3);
      });
      // 바람
      noiseNode(2.0, 500, 'bandpass', 2, 0.04, t);
      // 공기 진동
      osc(55, 'sine', t, 2.0, 0.06);
    },

    // 기록관 — VHS 테이프 슬라이딩 + 헤드 노이즈
    rewind() {
      const t = ctx.currentTime;
      // 테이프 슬라이딩 (하강)
      const s = ctx.createOscillator();
      const sg = ctx.createGain();
      s.type = 'sawtooth';
      s.frequency.setValueAtTime(2200, t);
      s.frequency.exponentialRampToValueAtTime(180, t + 0.5);
      s.frequency.exponentialRampToValueAtTime(1400, t + 1.0);
      sg.gain.setValueAtTime(0.05, t);
      sg.gain.setValueAtTime(0.05, t + 0.9);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
      s.connect(sg); sg.connect(compressor);
      s.start(t); s.stop(t + 1.2);
      // 헤드 긁힘
      noiseNode(1.0, 800, 'bandpass', 4, 0.06, t);
      // 정적
      noiseNode(0.3, 5000, 'highpass', 1, 0.03, t + 0.9);
    },

    // 의사 — 제세동기 충전 + 심장 비트
    heal() {
      const t = ctx.currentTime;
      // 충전 상승
      const s = ctx.createOscillator();
      const sg = ctx.createGain();
      s.frequency.setValueAtTime(60, t);
      s.frequency.exponentialRampToValueAtTime(3000, t + 0.9);
      sg.gain.setValueAtTime(0.06, t); sg.gain.setValueAtTime(0.06, t + 0.85);
      sg.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
      s.connect(sg); sg.connect(compressor); s.start(t); s.stop(t + 1.0);
      // 방전 임팩트
      noiseNode(0.08, 800, 'lowpass', 1, 0.5, t + 0.9);
      osc(60, 'sine', t + 0.9, 0.12, 0.2);
      // ECG 비프 2회
      [1.1, 1.3].forEach(d => { osc(880, 'sine', t + d, 0.08, 0.1); });
    },

    // 군인 — 묵직한 방패 + 금속 울림
    shield() {
      const t = ctx.currentTime;
      // 충격음 (낮고 묵직)
      noiseNode(0.15, 120, 'lowpass', 1, 0.8, t);
      osc(45, 'sine', t, 0.4, 0.35);
      osc(90, 'sine', t, 0.25, 0.2);
      // 금속 링잉
      noiseNode(0.5, 1800, 'bandpass', 15, 0.25, t + 0.03);
      osc(1200, 'sine', t + 0.03, 0.5, 0.06);
      // 공기 흔들림
      noiseNode(0.3, 200, 'bandpass', 2, 0.15, t + 0.05);
    },

    // 보스 포섭 — 마음 잠식하는 저주파 + 속삭임
    recruit() {
      const t = ctx.currentTime;
      // 불길한 트리톤 (악마의 음정)
      [45, 63.5, 90].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const dist = ctx.createWaveShaper();
        const curve = new Float32Array(256).map((_, j) => {
          const x = j / 128 - 1; return x * 4 / (1 + 3 * Math.abs(x));
        });
        dist.curve = curve;
        o.type = 'sawtooth'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.4);
        g.gain.setValueAtTime(0.09, t + 1.6);
        g.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
        o.connect(dist); dist.connect(g);
        g.connect(reverb); reverb.connect(compressor);
        o.start(t); o.stop(t + 2.3);
      });
      // 속삭임 질감
      noiseNode(1.8, 300, 'bandpass', 3, 0.06, t + 0.3);
      // 저음 펄스
      [0.5, 1.0, 1.5].forEach(d => osc(30, 'sine', t + d, 0.15, 0.18));
    },

    // 킬러 — 소음기 총성 + 탄피
    kill() {
      const t = ctx.currentTime;
      // 총열 폭발압 (순간적)
      noiseNode(0.004, 150, 'lowpass', 1, 1.2, t);
      osc(60, 'sine', t, 0.06, 0.4);
      // 소음기 음 (부드러운 쉬 소리)
      noiseNode(0.18, 400, 'bandpass', 3, 0.4, t + 0.003);
      noiseNode(0.12, 200, 'lowpass', 1, 0.2, t + 0.008);
      // 공기 빠짐
      noiseNode(0.15, 600, 'highpass', 1, 0.06, t + 0.02);
      // 탄피 떨어짐 (딸깍)
      setTimeout(() => {
        if (!ctx) return;
        const t2 = ctx.currentTime;
        noiseNode(0.03, 2500, 'bandpass', 8, 0.15, t2);
        osc(800, 'sine', t2, 0.04, 0.04);
      }, 180);
    },

    // 해커 — 빠른 타이핑 + 접근 완료
    hack() {
      const t = ctx.currentTime;
      // 키스트로크 x14 (랜덤 피치)
      for (let i = 0; i < 14; i++) {
        const delay = i * 0.055 + Math.random() * 0.02;
        const freq  = 2000 + Math.random() * 2000;
        noiseNode(0.018, freq, 'bandpass', 6, 0.12 + Math.random() * 0.05, t + delay);
        osc(800 + Math.random() * 400, 'sine', t + delay, 0.018, 0.04);
      }
      // 접근 완료 멜로디
      [880, 1108, 1318, 1760].forEach((f, i) => osc(f, 'sine', t + 0.82 + i * 0.07, 0.12, 0.08));
    },

    // 변호사 — 황금 계약 도장
    protect() {
      const t = ctx.currentTime;
      // 상승 화음
      [440, 554, 659, 880].forEach((f, i) => osc(f, 'triangle', t + i * 0.09, 0.35 - i * 0.05, 0.1));
      // 도장 찍힘
      noiseNode(0.06, 350, 'lowpass', 2, 0.35, t + 0.38);
      osc(150, 'sine', t + 0.38, 0.1, 0.15);
      // 잔향
      osc(880, 'sine', t + 0.42, 0.3, 0.04);
    },

    // 도박꾼 — 카지노 칩 + 슬롯 결정음
    gamble() {
      const t = ctx.currentTime;
      // 칩 3장 (각각 다른 피치)
      [[0, 2800, 0.18], [0.09, 2400, 0.14], [0.18, 3200, 0.16]].forEach(([d, f, v]) => {
        noiseNode(0.025, f, 'bandpass', 10, v, t + d);
        osc(f * 0.5, 'sine', t + d, 0.025, v * 0.3);
      });
      // 슬롯 결정음
      const s = ctx.createOscillator();
      const sg = ctx.createGain();
      s.type = 'sawtooth';
      s.frequency.setValueAtTime(600, t + 0.28);
      s.frequency.exponentialRampToValueAtTime(120, t + 0.7);
      sg.gain.setValueAtTime(0.06, t + 0.28); sg.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
      s.connect(sg); sg.connect(compressor); s.start(t + 0.28); s.stop(t + 0.8);
      // 결정 비프
      osc(1200, 'sine', t + 0.7, 0.08, 0.07);
    },

    // 취업준비생 — 프린터 + ID 카드 슬라이드
    inherit() {
      const t = ctx.currentTime;
      // 프린터 머리 이동
      for (let i = 0; i < 22; i++) {
        noiseNode(0.022, 700 + i * 40, 'bandpass', 3, 0.07, t + i * 0.055);
      }
      // 카드 완성음
      [784, 988, 1175].forEach((f, i) => osc(f, 'sine', t + 1.3 + i * 0.08, 0.12, 0.08));
    },

    // 정치인 — 육중한 의사봉
    gavel() {
      const t = ctx.currentTime;
      // 나무 충격 (두껍고 중저음)
      noiseNode(0.07, 180, 'lowpass', 2, 0.65, t);
      osc(80, 'sine', t, 0.18, 0.25);
      osc(160, 'sine', t, 0.12, 0.15);
      // 울림
      noiseNode(0.35, 400, 'bandpass', 6, 0.15, t + 0.02);
      // 에코
      [0.3, 0.55].forEach(d => {
        noiseNode(0.05, 180, 'lowpass', 2, 0.2 - d * 0.2, t + d);
        osc(80, 'sine', t + d, 0.1, 0.1 - d * 0.08);
      });
    },

    // ★ 포섭 당함 — 영화급 유리 파괴 + 심장박동
    recruited() {
      const t = ctx.currentTime;
      // 유리 파괴 (고주파 폭발)
      noiseNode(0.06, 4000, 'highpass', 1, 1.5, t);
      noiseNode(0.3, 2000, 'bandpass', 2, 0.6, t + 0.02);
      // 조각 떨어짐 (랜덤 고주파)
      for (let i = 0; i < 8; i++) {
        noiseNode(0.04, 2000 + Math.random() * 3000, 'bandpass', 8, 0.15, t + 0.05 + i * 0.06);
      }
      // 피 떨어지는 저음
      noiseNode(0.6, 100, 'lowpass', 2, 0.4, t + 0.35);
      osc(35, 'sine', t + 0.35, 0.6, 0.25);
      // 심장박동 x3
      [[0.9, 0.06], [1.1, 0.05], [2.0, 0.06], [2.2, 0.05]].forEach(([d, dur]) => {
        osc(38, 'sine', t + d, dur, 0.45);
        osc(55, 'sine', t + d, dur, 0.3);
        noiseNode(dur, 80, 'lowpass', 1, 0.25, t + d);
      });
      // 악마 보이스 (저주파 변조)
      const w = ctx.createOscillator();
      const wg = ctx.createGain();
      const wdist = ctx.createWaveShaper();
      const wc = new Float32Array(512).map((_, j) => {
        const x = j / 256 - 1; return Math.tanh(x * 8) * 0.5;
      });
      wdist.curve = wc;
      w.type = 'sawtooth'; w.frequency.setValueAtTime(65, t + 1.5);
      w.frequency.linearRampToValueAtTime(60, t + 3.0);
      wg.gain.setValueAtTime(0, t + 1.5);
      wg.gain.linearRampToValueAtTime(0.2, t + 1.9);
      wg.gain.exponentialRampToValueAtTime(0.001, t + 3.2);
      w.connect(wdist); wdist.connect(wg);
      wg.connect(reverb); reverb.connect(compressor);
      w.start(t + 1.5); w.stop(t + 3.3);
    },

    // 글리치
    glitch() {
      const t = ctx.currentTime;
      for (let i = 0; i < 4; i++) {
        noiseNode(0.04, 500 + Math.random() * 2000, 'bandpass', 5, 0.15, t + i * 0.07);
        osc(200 + Math.random() * 800, 'square', t + i * 0.07, 0.04, 0.05);
      }
    },

    // ── BGM 합성 ─────────────────────────────────────────────

    // ★ 낮 BGM — 사이버펑크 수사 테마 (멜로디 + 리듬)
    bgmDay() {
      bgmGain = ctx.createGain();
      bgmGain.gain.value = 0.22;
      bgmGain.connect(compressor);

      // ① 베이스 패드 (아주 작게 — 배경만)
      const pad = ctx.createOscillator();
      const padG = ctx.createGain();
      pad.type = 'sine'; pad.frequency.value = 55;
      padG.gain.value = 0.04;
      pad.connect(padG); padG.connect(bgmGain);
      pad.start();
      bgmNodes.push(pad);

      // ② 킥드럼 패턴 (4박자 — 묵직한 서브킥)
      const BPM = 80;
      const beat = 60 / BPM;
      const kickFn = () => {
        if (!bgmGain) return;
        const t2 = ctx.currentTime;
        // 서브킥 (주파수 하강)
        const ko = ctx.createOscillator();
        const kg = ctx.createGain();
        ko.frequency.setValueAtTime(160, t2);
        ko.frequency.exponentialRampToValueAtTime(40, t2 + 0.15);
        kg.gain.setValueAtTime(0.55, t2);
        kg.gain.exponentialRampToValueAtTime(0.001, t2 + 0.25);
        ko.connect(kg); kg.connect(bgmGain);
        ko.start(t2); ko.stop(t2 + 0.3);
        // 킥 타격 노이즈
        const kn = ctx.createBufferSource();
        kn.buffer = noise(0.06);
        const kf = ctx.createBiquadFilter();
        kf.type = 'lowpass'; kf.frequency.value = 200;
        const kng = ctx.createGain();
        kng.gain.setValueAtTime(0.3, t2);
        kng.gain.exponentialRampToValueAtTime(0.001, t2 + 0.06);
        kn.connect(kf); kf.connect(kng); kng.connect(bgmGain);
        kn.start(t2); kn.stop(t2 + 0.07);
      };
      const kickId = setInterval(kickFn, beat * 1000);
      bgmNodes.push({ stop: () => clearInterval(kickId) });

      // ③ 하이햇 (8분음표 — 바삭)
      const hihatFn = () => {
        if (!bgmGain) return;
        const t2 = ctx.currentTime;
        const hn = ctx.createBufferSource();
        hn.buffer = noise(0.025);
        const hf = ctx.createBiquadFilter();
        hf.type = 'highpass'; hf.frequency.value = 8000;
        const hg = ctx.createGain();
        hg.gain.setValueAtTime(0.08, t2);
        hg.gain.exponentialRampToValueAtTime(0.001, t2 + 0.025);
        hn.connect(hf); hf.connect(hg); hg.connect(bgmGain);
        hn.start(t2); hn.stop(t2 + 0.03);
      };
      const hihatId = setInterval(hihatFn, beat * 500);
      bgmNodes.push({ stop: () => clearInterval(hihatId) });

      // ④ 멜로디 시퀀스 (사이버펑크 단조 스케일)
      // Am 펜타토닉: A3 C4 D4 E4 G4 A4
      const melody = [220, 261.6, 293.7, 329.6, 392, 440, 392, 329.6, 293.7, 261.6, 220, 246.9];
      let mIdx = 0;
      const melodyFn = () => {
        if (!bgmGain) return;
        const t2 = ctx.currentTime;
        const freq = melody[mIdx % melody.length];
        mIdx++;

        // 메인 멜로디 (사인파 — 깔끔)
        const mo = ctx.createOscillator();
        const mg = ctx.createGain();
        mo.type = 'sine'; mo.frequency.value = freq;
        mg.gain.setValueAtTime(0, t2);
        mg.gain.linearRampToValueAtTime(0.18, t2 + 0.02);
        mg.gain.setValueAtTime(0.18, t2 + beat * 0.7);
        mg.gain.exponentialRampToValueAtTime(0.001, t2 + beat * 0.95);
        mo.connect(mg); mg.connect(bgmGain);
        mo.start(t2); mo.stop(t2 + beat);

        // 옥타브 위 (하모닉 — 더 얇게)
        const mo2 = ctx.createOscillator();
        const mg2 = ctx.createGain();
        mo2.type = 'triangle'; mo2.frequency.value = freq * 2;
        mg2.gain.setValueAtTime(0, t2);
        mg2.gain.linearRampToValueAtTime(0.05, t2 + 0.02);
        mg2.gain.exponentialRampToValueAtTime(0.001, t2 + beat * 0.8);
        mo2.connect(mg2); mg2.connect(bgmGain);
        mo2.start(t2); mo2.stop(t2 + beat);
      };
      const melId = setInterval(melodyFn, beat * 1000);
      bgmNodes.push({ stop: () => clearInterval(melId) });

      // ⑤ 베이스라인 (4마디 루프)
      const bassNotes = [55, 55, 65.4, 55, 49, 55, 58.3, 55];
      let bIdx = 0;
      const bassFn = () => {
        if (!bgmGain) return;
        const t2 = ctx.currentTime;
        const bo = ctx.createOscillator();
        const bg2 = ctx.createGain();
        bo.type = 'triangle'; bo.frequency.value = bassNotes[bIdx % bassNotes.length];
        bIdx++;
        bg2.gain.setValueAtTime(0.12, t2);
        bg2.gain.exponentialRampToValueAtTime(0.001, t2 + beat * 0.9);
        bo.connect(bg2); bg2.connect(bgmGain);
        bo.start(t2); bo.stop(t2 + beat);
      };
      const bassId = setInterval(bassFn, beat * 1000);
      bgmNodes.push({ stop: () => clearInterval(bassId) });
    },

    // ★ 밤 BGM — 다크 앰비언트 (순수 사인 — 정적 없음)
    bgmNight() {
      bgmGain = ctx.createGain();
      bgmGain.gain.value = 0.18;
      bgmGain.connect(compressor);

      // ★ 핵심: sawtooth 절대 사용 안 함 (정적 원인)
      // ① 메인 드론 — 순수 사인파만 사용
      const droneFreqs = [55, 82.4, 110]; // 완전5도 화음
      const drones = droneFreqs.map((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        // LFO (아주 느리고 미세하게)
        const lfo = ctx.createOscillator();
        const lg  = ctx.createGain();
        o.type = 'sine'; // ★ 반드시 sine만!
        o.frequency.value = f;
        lfo.frequency.value = 0.05 + i * 0.02; // 매우 느린 진동
        lg.gain.value = 0.3; // 미세한 진동폭
        lfo.connect(lg); lg.connect(o.frequency);
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.06 / (i + 1), ctx.currentTime + 2); // 페이드인
        o.connect(g); g.connect(bgmGain);
        lfo.start(); o.start();
        return [o, lfo];
      }).flat();
      bgmNodes.push(...drones);

      // ② 고음 패드 (유리 하모닉)
      const highPad = ctx.createOscillator();
      const hpg = ctx.createGain();
      highPad.type = 'sine'; highPad.frequency.value = 440;
      hpg.gain.setValueAtTime(0, ctx.currentTime);
      hpg.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 3);
      highPad.connect(hpg); hpg.connect(bgmGain);
      highPad.start();
      bgmNodes.push(highPad);

      // ③ 불규칙 멜로디 — 간헐적 단음 (피아노 느낌)
      const nightNotes = [110, 98, 82.4, 110, 123.5, 110, 98, 73.4];
      let nIdx = 0;
      const noteFn = () => {
        if (!bgmGain) return;
        const t2 = ctx.currentTime;
        const freq = nightNotes[nIdx % nightNotes.length];
        nIdx++;
        const no = ctx.createOscillator();
        const ng = ctx.createGain();
        no.type = 'sine'; no.frequency.value = freq;
        ng.gain.setValueAtTime(0, t2);
        ng.gain.linearRampToValueAtTime(0.14, t2 + 0.01); // 빠른 어택
        ng.gain.exponentialRampToValueAtTime(0.001, t2 + 2.5); // 긴 릴리즈
        no.connect(ng); ng.connect(bgmGain);
        no.start(t2); no.stop(t2 + 2.8);
      };
      // 3~5초마다 불규칙하게 울림
      const scheduleNote = () => {
        if (!bgmGain) return;
        noteFn();
        setTimeout(scheduleNote, 3000 + Math.random() * 2000);
      };
      setTimeout(scheduleNote, 1000);
      bgmNodes.push({ stop: () => {} }); // placeholder

      // ④ 저음 심장박동 패턴 (2박자 — 두두~)
      const heartFn = () => {
        if (!bgmGain) return;
        const t2 = ctx.currentTime;
        // 첫 박 (강)
        const h1 = ctx.createOscillator();
        const h1g = ctx.createGain();
        h1.type = 'sine'; h1.frequency.setValueAtTime(55, t2);
        h1.frequency.exponentialRampToValueAtTime(30, t2 + 0.12);
        h1g.gain.setValueAtTime(0.22, t2);
        h1g.gain.exponentialRampToValueAtTime(0.001, t2 + 0.25);
        h1.connect(h1g); h1g.connect(bgmGain);
        h1.start(t2); h1.stop(t2 + 0.3);
        // 두 번째 박 (약 — 0.25초 뒤)
        setTimeout(() => {
          if (!bgmGain) return;
          const t3 = ctx.currentTime;
          const h2 = ctx.createOscillator();
          const h2g = ctx.createGain();
          h2.type = 'sine'; h2.frequency.setValueAtTime(45, t3);
          h2.frequency.exponentialRampToValueAtTime(28, t3 + 0.08);
          h2g.gain.setValueAtTime(0.12, t3);
          h2g.gain.exponentialRampToValueAtTime(0.001, t3 + 0.18);
          h2.connect(h2g); h2g.connect(bgmGain);
          h2.start(t3); h2.stop(t3 + 0.2);
        }, 250);
      };
      const heartId = setInterval(heartFn, 2200);
      bgmNodes.push({ stop: () => clearInterval(heartId) });
    },

    // ★ 긴박 BGM — 빠른 펄스 + 경보음 (독립 실행 가능)
    bgmUrgent() {
      // 기존 BGM이 있으면 속도/볼륨 올리기
      if (bgmGain) {
        bgmGain.gain.linearRampToValueAtTime(0.32, ctx.currentTime + 0.3);
        // 템포 더블 효과 — 킥 추가
        const urgentKickFn = () => {
          if (!bgmGain) return;
          const t2 = ctx.currentTime;
          const ko = ctx.createOscillator();
          const kg = ctx.createGain();
          ko.frequency.setValueAtTime(120, t2);
          ko.frequency.exponentialRampToValueAtTime(35, t2 + 0.1);
          kg.gain.setValueAtTime(0.4, t2);
          kg.gain.exponentialRampToValueAtTime(0.001, t2 + 0.18);
          ko.connect(kg); kg.connect(bgmGain);
          ko.start(t2); ko.stop(t2 + 0.2);
        };
        const uid = setInterval(urgentKickFn, 375); // 160BPM
        bgmNodes.push({ stop: () => clearInterval(uid) });
        return;
      }

      // BGM 없을 때 — 독립 긴박 패턴 시작
      bgmGain = ctx.createGain();
      bgmGain.gain.value = 0;
      bgmGain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.5);
      bgmGain.connect(compressor);

      const BPM = 160;
      const beat = 60 / BPM;

      // ① 빠른 킥 (160BPM)
      const kickFn = () => {
        if (!bgmGain) return;
        const t2 = ctx.currentTime;
        const ko = ctx.createOscillator();
        const kg = ctx.createGain();
        ko.frequency.setValueAtTime(150, t2);
        ko.frequency.exponentialRampToValueAtTime(38, t2 + 0.12);
        kg.gain.setValueAtTime(0.5, t2);
        kg.gain.exponentialRampToValueAtTime(0.001, t2 + 0.2);
        ko.connect(kg); kg.connect(bgmGain);
        ko.start(t2); ko.stop(t2 + 0.22);
      };
      const kickId = setInterval(kickFn, beat * 1000);
      bgmNodes.push({ stop: () => clearInterval(kickId) });

      // ② 경보 사이렌 (두 음 교차)
      let sirenToggle = 0;
      const sirenFn = () => {
        if (!bgmGain) return;
        const t2 = ctx.currentTime;
        const freq = sirenToggle % 2 === 0 ? 880 : 660;
        sirenToggle++;
        const so = ctx.createOscillator();
        const sg = ctx.createGain();
        so.type = 'sine'; so.frequency.value = freq;
        sg.gain.setValueAtTime(0, t2);
        sg.gain.linearRampToValueAtTime(0.12, t2 + 0.02);
        sg.gain.setValueAtTime(0.12, t2 + beat * 0.8);
        sg.gain.exponentialRampToValueAtTime(0.001, t2 + beat);
        so.connect(sg); sg.connect(bgmGain);
        so.start(t2); so.stop(t2 + beat + 0.01);
      };
      const sirenId = setInterval(sirenFn, beat * 1000);
      bgmNodes.push({ stop: () => clearInterval(sirenId) });

      // ③ 긴박 베이스 (반복 단음)
      const bassFreqs = [55, 55, 49, 55, 58.3, 55, 49, 41.2];
      let bIdx = 0;
      const bassFn = () => {
        if (!bgmGain) return;
        const t2 = ctx.currentTime;
        const bo = ctx.createOscillator();
        const bg2 = ctx.createGain();
        bo.type = 'triangle';
        bo.frequency.value = bassFreqs[bIdx % bassFreqs.length];
        bIdx++;
        bg2.gain.setValueAtTime(0.18, t2);
        bg2.gain.exponentialRampToValueAtTime(0.001, t2 + beat * 0.85);
        bo.connect(bg2); bg2.connect(bgmGain);
        bo.start(t2); bo.stop(t2 + beat);
      };
      const bassId = setInterval(bassFn, beat * 1000);
      bgmNodes.push({ stop: () => clearInterval(bassId) });

      // ④ 하이햇 (16분음표 — 바삭바삭)
      const hhFn = () => {
        if (!bgmGain) return;
        const t2 = ctx.currentTime;
        const hn = ctx.createBufferSource();
        hn.buffer = noise(0.015);
        const hf = ctx.createBiquadFilter();
        hf.type = 'highpass'; hf.frequency.value = 9000;
        const hg = ctx.createGain();
        hg.gain.setValueAtTime(0.09, t2);
        hg.gain.exponentialRampToValueAtTime(0.001, t2 + 0.015);
        hn.connect(hf); hf.connect(hg); hg.connect(bgmGain);
        hn.start(t2); hn.stop(t2 + 0.02);
      };
      const hhId = setInterval(hhFn, beat * 500);
      bgmNodes.push({ stop: () => clearInterval(hhId) });
    },
  };

  // ── BGM 정지 ─────────────────────────────────────────────
  function stopBGM() {
    bgmNodes.forEach(n => {
      if (n.stop) n.stop();
      else { try { n.stop(); } catch(e) {} }
    });
    bgmNodes = [];
    if (bgmGain) {
      bgmGain.gain.setValueAtTime(bgmGain.gain.value, ctx.currentTime);
      bgmGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      setTimeout(() => { bgmGain = null; }, 700);
    }
  }

  // ── 재생 메인 ────────────────────────────────────────────
  function play(name) {
    init(); resume();
    // URL 오버라이드 있으면 Howler로 재생
    if (SOUND_OVERRIDES[name] && typeof Howl !== 'undefined') {
      new Howl({ src: [SOUND_OVERRIDES[name]], volume: masterVol, autoplay: true });
      return;
    }
    // 합성 사운드
    const fn = synth[name];
    if (fn) fn();
  }

  function setVolume(v) {
    masterVol = Math.max(0, Math.min(1, v));
    if (masterGain) masterGain.gain.value = masterVol;
  }

  // 자동 초기화
  ['click','touchstart','keydown'].forEach(ev =>
    document.addEventListener(ev, () => { init(); resume(); }, { once:true })
  );

  return {
    play,
    setVolume,
    stopBGM,
    bgmDay:    () => { init(); resume(); stopBGM(); synth.bgmDay(); },
    bgmNight:  () => { init(); resume(); stopBGM(); synth.bgmNight(); },
    bgmUrgent: () => { if (bgmGain) bgmGain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.5); },
    playPhase: (p) => play(p === 'night' ? 'phase_night' : 'phase_day'),
    playVote:  () => play('vote'),
    playWin:   () => play('win'),
    playLose:  () => play('lose'),
    playTick:  () => play('tick'),
  };

})();

window.SoundFX = SoundFX;
