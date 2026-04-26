// ============================================================
//  🤖 MAFIA // PROTOCOL — BOT ENGINE v1.0
//  bot-engine.js
//  역할별 AI 봇 로직 + Firebase 자동 위임 시스템
//  플레이어 오프라인/AFK 시 자동 대체
// ============================================================

const BotEngine = (() => {

  // ── 봇 판단 딜레이 (너무 빠르면 부자연스러움) ─────────────
  const BOT_DELAY_MIN = 3000;  // 3초
  const BOT_DELAY_MAX = 8000;  // 8초

  function delay(min = BOT_DELAY_MIN, max = BOT_DELAY_MAX) {
    return new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
  }

  // ── 유틸 ─────────────────────────────────────────────────
  function alive(gs) {
    return Object.entries(gs.assignments)
      .filter(([, p]) => p.alive)
      .map(([uid]) => uid);
  }

  function aliveByTeam(gs, team) {
    return Object.entries(gs.assignments)
      .filter(([, p]) => p.alive && p.team === team)
      .map(([uid]) => uid);
  }

  function aliveExcept(gs, ...excl) {
    return alive(gs).filter(uid => !excl.includes(uid));
  }

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ── 역할별 밤 행동 결정 ─────────────────────────────────
  const nightDecisions = {

    // 보스: 킬러가 있으면 살해 지시, 없으면 포섭 또는 직접 살해
    BOSS(gs, myUID) {
      const killerAlive = Object.entries(gs.assignments)
        .some(([uid, p]) => p.role === 'KILLER' && p.alive && uid !== myUID);
      const targets = aliveExcept(gs, myUID, ...aliveByTeam(gs, 'mafia'));

      if (!targets.length) return null;

      // 포섭 가능하면 50% 확률로 포섭
      const canRecruit = gs.recruitUsed < gs.recruitMax
        && gs.lastRecruitDay !== gs.day - 1;

      if (canRecruit && !killerAlive && Math.random() < 0.5) {
        // 조사직부터 포섭 (경찰, 탐정 우선)
        const infoTargets = targets.filter(uid =>
          ['POLICE','DETECTIVE','WATCHMAN'].includes(gs.assignments[uid].role)
        );
        const target = pick(infoTargets.length ? infoTargets : targets);
        return { action: 'recruit', target1: target };
      }

      // 살해: 경찰/탐정/의사 우선 제거
      const priority = targets.filter(uid =>
        ['POLICE','DETECTIVE','DOCTOR','WATCHMAN'].includes(gs.assignments[uid].role)
      );
      return { action: 'kill', target1: pick(priority.length ? priority : targets) };
    },

    // 킬러: 항상 살해 (경찰/탐정 우선)
    KILLER(gs, myUID) {
      const targets = aliveExcept(gs, myUID, ...aliveByTeam(gs, 'mafia'));
      if (!targets.length) return null;
      const priority = targets.filter(uid =>
        ['POLICE','DETECTIVE','DOCTOR'].includes(gs.assignments[uid].role)
      );
      return { action: 'kill', target1: pick(priority.length ? priority : targets) };
    },

    // 해커: 살아있는 조사직 감청
    HACKER(gs, myUID) {
      const infoRoles = ['POLICE','DETECTIVE','WATCHMAN','ARCHIVIST'];
      const targets = aliveExcept(gs, myUID).filter(uid =>
        infoRoles.includes(gs.assignments[uid].role)
      );
      if (!targets.length) return { action: 'hack', target1: pick(aliveExcept(gs, myUID)) };
      return { action: 'hack', target1: pick(targets) };
    },

    // 경찰: 의심스러운 사람 스캔 (랜덤 중 마피아 팀 우선)
    POLICE(gs, myUID) {
      const targets = aliveExcept(gs, myUID);
      if (!targets.length) return null;
      // 아직 조사 안 된 사람 우선
      return { action: 'scan', target1: pick(targets) };
    },

    // 탐정: 두 명 관계 분석
    DETECTIVE(gs, myUID) {
      const targets = aliveExcept(gs, myUID);
      if (targets.length < 2) return null;
      const t1 = pick(targets);
      const remaining = targets.filter(u => u !== t1);
      const t2 = pick(remaining);
      return { action: 'analyze', target1: t1, target2: t2 };
    },

    // 감시자: 의심 인물 감시
    WATCHMAN(gs, myUID) {
      const targets = aliveExcept(gs, myUID);
      if (!targets.length) return null;
      return { action: 'watch', target1: pick(targets) };
    },

    // 기록관: 랜덤 기록 열람
    ARCHIVIST(gs, myUID) {
      const targets = aliveExcept(gs, myUID);
      if (!targets.length) return null;
      return { action: 'archive', target1: pick(targets) };
    },

    // 의사: 자기 보호 30%, 나머지 랜덤 (의심 경찰 우선 보호)
    DOCTOR(gs, myUID) {
      if (Math.random() < 0.3) return { action: 'heal', target1: myUID };
      const policeUID = Object.entries(gs.assignments)
        .find(([uid, p]) => p.alive && p.role === 'POLICE' && uid !== myUID)?.[0];
      const targets = aliveExcept(gs, myUID);
      if (!targets.length) return null;
      return { action: 'heal', target1: policeUID || pick(targets) };
    },

    // 군인: 의심 인물 또는 경찰 경계
    SOLDIER(gs, myUID) {
      const targets = aliveExcept(gs, myUID);
      if (!targets.length) return null;
      const policeUID = Object.entries(gs.assignments)
        .find(([uid, p]) => p.alive && p.role === 'POLICE' && uid !== myUID)?.[0];
      return { action: 'guard', target1: policeUID || pick(targets) };
    },

    // 변호사: 의뢰인 보호
    LAWYER(gs, myUID, clientUID) {
      if (clientUID && gs.assignments[clientUID]?.alive) {
        return { action: 'protect', target1: clientUID };
      }
      const targets = aliveExcept(gs, myUID);
      if (!targets.length) return null;
      return { action: 'protect', target1: pick(targets) };
    },

    // 도박꾼: 예측 (현재 상황에 따라 판단)
    GAMBLER(gs, myUID) {
      // 마피아 수가 많으면 사망 가능성 높음
      const mafiaAlive = aliveByTeam(gs, 'mafia').length;
      const citizenAlive = aliveByTeam(gs, 'citizen').length;
      const roll = Math.random();
      if (roll < 0.4)      return { prediction: 'death' };
      else if (roll < 0.7) return { prediction: 'execution' };
      else                  return { prediction: 'peace' };
    },

    // 취업준비생/정치인: 패시브 — 행동 없음
    JOBSEEKER() { return null; },
    POLITICIAN() { return null; },
    SHAMAN()    { return null; }, // 낮 전용
  };

  // ── 역할별 낮 투표 결정 ─────────────────────────────────
  function decideVote(gs, myUID, myTeam, knownMafia = []) {
    const targets = aliveExcept(gs, myUID);
    if (!targets.length) return null;

    if (myTeam === 'mafia') {
      // 마피아: 경찰/탐정 우선 처형
      const priority = targets.filter(uid =>
        !aliveByTeam(gs, 'mafia').includes(uid) &&
        ['POLICE','DETECTIVE','WATCHMAN','DOCTOR'].includes(gs.assignments[uid].role)
      );
      return pick(priority.length ? priority : targets.filter(u => !aliveByTeam(gs, 'mafia').includes(u)));
    }

    // 시민: 알려진 마피아 처형, 없으면 랜덤
    if (knownMafia.length) return pick(knownMafia);
    return pick(targets);
  }

  // ── 봇 단일 실행 ─────────────────────────────────────────
  async function runBotAction(db, roomId, uid, gs, clientUID = null) {
    if (!gs || !gs.assignments) return;
    // ★ null 필드 보완
    gs.nightActions  = gs.nightActions  || {};
    gs.voteLog       = gs.voteLog       || {};
    gs.dayActions    = gs.dayActions    || {};
    const assignment = gs.assignments[uid];
    if (!assignment || !assignment.alive) return;

    const role = assignment.role;
    const team = assignment.team;

    if (gs.phase === 'night') {
      // 밤 행동
      await delay();
      const decisionFn = nightDecisions[role];
      if (!decisionFn) return;
      const action = role === 'LAWYER'
        ? decisionFn(gs, uid, clientUID)
        : decisionFn(gs, uid);
      if (!action) return;
      await db.ref(`rooms/${roomId}/gameState/nightActions/${uid}`).set(action);

    } else if (gs.phase === 'day') {
      // 무당: 낮 행동
      if (role === 'SHAMAN') {
        const deadPlayers = Object.keys(gs.assignments)
          .filter(u => !gs.assignments[u].alive);
        if (deadPlayers.length) {
          await delay(2000, 5000);
          await db.ref(`rooms/${roomId}/gameState/dayActions/${uid}`)
            .set({ action: 'shaman', target1: pick(deadPlayers) });
        }
      }
    } else if (gs.phase === 'vote') {
      // 투표
      await delay(2000, 6000);
      const voteTarget = decideVote(gs, uid, team);
      if (voteTarget) {
        await db.ref(`rooms/${roomId}/gameState/voteLog/${uid}`).set(voteTarget);
      }
    }
  }

  // ── 방 전체 봇 관리 ─────────────────────────────────────
  // 오프라인 플레이어를 감지하고 봇으로 대체
  async function manageBots(db, roomId) {
    const snap = await db.ref(`rooms/${roomId}`).get();
    if (!snap.exists()) return;
    const room = snap.val();
    if (room.status !== 'playing') return;

    const gs = room.gameState;
    if (!gs) return;

    const players = room.players || {};

    for (const [uid, player] of Object.entries(players)) {
      // ★ 봇(isBot=true) 또는 오프라인 플레이어 처리
      const isBot = player.isBot === true || uid.startsWith('bot_');
      const isOffline = player.online === false;
      if ((!isBot && !isOffline) || !gs.assignments?.[uid]?.alive) continue;

      // 이미 행동 제출했으면 스킵
      const alreadyActed = gs.phase === 'night'
        ? !!gs.nightActions?.[uid]
        : gs.phase === 'vote'
        ? !!gs.voteLog?.[uid]
        : false;

      if (!alreadyActed) {
        const clientUID = gs.clientUID;
        const isLawyer  = gs.assignments[uid]?.role === 'LAWYER';
        await runBotAction(db, roomId, uid, gs, isLawyer ? clientUID : null);
      }
    }
  }

  // ── 자동 위임 시스템 ─────────────────────────────────────
  // 타이머 종료 직전에 미제출 봇 강제 처리
  async function fillMissingActions(db, roomId) {
    const snap = await db.ref(`rooms/${roomId}`).get();
    if (!snap.exists()) return;
    const room = snap.val();
    const gs = room.gameState;
    if (!gs) return;

    const aliveUIDs = Object.entries(gs.assignments)
      .filter(([, p]) => p.alive).map(([uid]) => uid);

    const players = room.players || {};

    for (const uid of aliveUIDs) {
      const player   = players[uid];
      const isBot    = player?.isBot === true || uid.startsWith('bot_');
      const isOffline = !player || player.online === false;

      if (!isBot && !isOffline) continue;

      if (gs.phase === 'night') {
        if (!gs.nightActions?.[uid]) {
          const clientUID = gs.assignments[uid]?.role === 'LAWYER' ? gs.clientUID : null;
          await runBotAction(db, roomId, uid, gs, clientUID);
        }
      } else if (gs.phase === 'vote') {
        if (!gs.voteLog?.[uid]) {
          await runBotAction(db, roomId, uid, gs);
        }
      }
    }
  }

  // ── 채팅 봇 메시지 (자연스러운 대화) ────────────────────
  const botMessages = {
    day: [
      '아직 정보가 부족하네요.',
      '좀 더 지켜보겠습니다.',
      '의심되는 사람이 있긴 한데...',
      '저는 시민입니다.',
      '투표는 신중하게 해야 할 것 같아요.',
      '어제 밤에 이상한 게 보였어요.',
    ],
    night: [
      '(행동 중...)',
      '오늘 밤도 조심해야겠군요.',
    ],
  };

  async function sendBotChat(db, roomId, uid, nickname, phase) {
    const msgs = botMessages[phase] || botMessages.day;
    const text = pick(msgs);
    await delay(5000, 15000); // 5~15초 사이에 자연스럽게
    await db.ref(`chats/${roomId}`).push({
      uid, nickname: `${nickname} [BOT]`,
      text, channel: 'main',
      isBot: true,
      timestamp: Date.now(),
    });
  }

  // ── 공개 API ─────────────────────────────────────────────
  return {
    // 단일 봇 행동 실행
    runBotAction,
    // 방 전체 봇 관리 (방장이 주기적 호출)
    manageBots,
    // 타이머 종료 시 미제출 강제 처리
    fillMissingActions,
    // 봇 채팅
    sendBotChat,
    // 헬퍼
    decideVote,
  };

})();

window.BotEngine = BotEngine;
