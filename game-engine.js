// ============================================================
//  🕵️ MAFIA // PROTOCOL — GAME ENGINE v1.0
//  game-engine.js
//  Firebase Realtime DB 기반 게임 로직 엔진
//  빌드 도구 없이 <script src="game-engine.js"> 로 사용
// ============================================================

// ────────────────────────────────────────────────────────────
//  1. 직업 정의
// ────────────────────────────────────────────────────────────
const ROLES = {
  // 마피아 진영
  BOSS:       { id: 'BOSS',       team: 'mafia',   nameKo: '보스',       type: 'mafia' },
  HACKER:     { id: 'HACKER',     team: 'mafia',   nameKo: '해커',       type: 'mafia' },
  KILLER:     { id: 'KILLER',     team: 'mafia',   nameKo: '킬러',       type: 'mafia' },

  // 시민 진영 — 정보수집형
  POLICE:     { id: 'POLICE',     team: 'citizen', nameKo: '경찰',       type: 'info' },
  DETECTIVE:  { id: 'DETECTIVE',  team: 'citizen', nameKo: '탐정',       type: 'info' },
  WATCHMAN:   { id: 'WATCHMAN',   team: 'citizen', nameKo: '감시자',     type: 'info' },
  SHAMAN:     { id: 'SHAMAN',     team: 'citizen', nameKo: '무당',       type: 'info' },
  ARCHIVIST:  { id: 'ARCHIVIST',  team: 'citizen', nameKo: '기록관',     type: 'info' },

  // 시민 진영 — 방어생존형
  DOCTOR:     { id: 'DOCTOR',     team: 'citizen', nameKo: '의사',       type: 'defense' },
  SOLDIER:    { id: 'SOLDIER',    team: 'citizen', nameKo: '군인',       type: 'defense' },
  JOBSEEKER:  { id: 'JOBSEEKER',  team: 'citizen', nameKo: '취업준비생', type: 'defense' },

  // 시민 진영 — 변수창출형
  POLITICIAN: { id: 'POLITICIAN', team: 'citizen', nameKo: '정치인',     type: 'variable' },

  // 중립 세력
  LAWYER:     { id: 'LAWYER',     team: 'neutral', nameKo: '변호사',     type: 'neutral' },
  GAMBLER:    { id: 'GAMBLER',    team: 'neutral', nameKo: '도박꾼',     type: 'neutral' },
};

// ────────────────────────────────────────────────────────────
//  2. 인원별 직업 배분표 (기획서 1.3 기준)
// ────────────────────────────────────────────────────────────
const ROLE_TABLE = {
  6:  { mafia: ['BOSS'],              neutral: ['GAMBLER'],          citizen: ['POLICE','DOCTOR','JOBSEEKER','POLITICIAN'],                                         recruitMax: 1 },
  7:  { mafia: ['BOSS'],              neutral: ['LAWYER'],           citizen: ['POLICE','DOCTOR','JOBSEEKER','ARCHIVIST','SOLDIER'],                                recruitMax: 1 },
  8:  { mafia: ['BOSS','HACKER'],     neutral: ['GAMBLER'],          citizen: ['POLICE','DOCTOR','JOBSEEKER','DETECTIVE','POLITICIAN'],                             recruitMax: 1 },
  9:  { mafia: ['BOSS','HACKER'],     neutral: ['LAWYER'],           citizen: ['POLICE','DOCTOR','JOBSEEKER','ARCHIVIST','SHAMAN','WATCHMAN'],                      recruitMax: 1 },
  10: { mafia: ['BOSS','HACKER'],     neutral: ['LAWYER','GAMBLER'], citizen: ['POLICE','DOCTOR','JOBSEEKER','SOLDIER','DETECTIVE','POLITICIAN'],                   recruitMax: 1 },
  11: { mafia: ['BOSS','HACKER'],     neutral: ['LAWYER','GAMBLER'], citizen: ['POLICE','DOCTOR','JOBSEEKER','ARCHIVIST','WATCHMAN','SHAMAN','SOLDIER'],            recruitMax: 2 },
  12: { mafia: ['BOSS','HACKER'],     neutral: ['LAWYER','GAMBLER'], citizen: ['POLICE','DOCTOR','JOBSEEKER','ARCHIVIST','DETECTIVE','WATCHMAN','SOLDIER','POLITICIAN'], recruitMax: 2 },
  13: { mafia: ['BOSS','HACKER'],     neutral: ['LAWYER','GAMBLER'], citizen: ['POLICE','DETECTIVE','WATCHMAN','SHAMAN','ARCHIVIST','DOCTOR','SOLDIER','JOBSEEKER','POLITICIAN'], recruitMax: 2 },
};

// ────────────────────────────────────────────────────────────
//  3. 직업 배분 — Fisher-Yates 셔플 후 배분
// ────────────────────────────────────────────────────────────
function assignRoles(playerUIDs) {
  const count = playerUIDs.length;
  if (count < 6 || count > 13) throw new Error(`지원하지 않는 인원: ${count}`);

  const table = ROLE_TABLE[count];

  // 전체 역할 배열 구성
  const allRoles = [
    ...table.mafia,
    ...table.neutral,
    ...table.citizen,
  ];

  // Fisher-Yates 셔플
  for (let i = allRoles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allRoles[i], allRoles[j]] = [allRoles[j], allRoles[i]];
  }

  // uid → 역할 매핑
  const assignments = {};
  playerUIDs.forEach((uid, idx) => {
    assignments[uid] = {
      role:          allRoles[idx],
      team:          ROLES[allRoles[idx]].team,
      originalRole:  allRoles[idx],   // 포섭 후에도 원래 직업 추적용
      alive:         true,
      online:        true,
    };
  });

  return assignments;
}

// ────────────────────────────────────────────────────────────
//  4. 게임 초기 상태 생성
// ────────────────────────────────────────────────────────────
function createGameState(roomData) {
  const players   = Object.values(roomData.players).filter(p => p.online !== false);
  const playerUIDs = players.map(p => p.uid);
  const count     = playerUIDs.length;
  const table     = ROLE_TABLE[count];

  const assignments = assignRoles(playerUIDs);

  // 변호사의 의뢰인 배정 (무작위 시민 1명)
  let clientUID = null;
  if (table.neutral.includes('LAWYER')) {
    const lawyerUID  = playerUIDs.find(uid => assignments[uid].role === 'LAWYER');
    const citizenUIDs = playerUIDs.filter(uid =>
      assignments[uid].team === 'citizen' && uid !== lawyerUID
    );
    clientUID = citizenUIDs[Math.floor(Math.random() * citizenUIDs.length)];
  }

  return {
    phase:         'night',   // night | day | vote | result
    day:           1,
    status:        'playing',
    recruitMax:    table.recruitMax,
    recruitUsed:   0,
    lastRecruitDay: null,     // 연속 포섭 방지용
    assignments,
    clientUID,                // 변호사 의뢰인 (서버만 알고 있음)
    nightActions:  {},        // { uid: { action, target1, target2 } }
    chatLog:       [],
    voteLog:       {},        // { voterUID: targetUID }
    soldierShield: {},        // { uid: true } 군인 방패 1회 사용 여부
    doctorSelfUsed:{},        // { uid: true } 의사 자가치료 사용 여부
    gamblerBets:   {},        // { uid: { day, prediction } }
    gamblerSuccess:{},        // { uid: count }
    dayTimer:      roomData.dayTimer   || 90,
    nightTimer:    roomData.nightTimer || 45,
    phaseEndAt:    Date.now() + ((roomData.nightTimer || 45) * 1000),
  };
}

// ────────────────────────────────────────────────────────────
//  5. 밤 행동 처리 — 원자적 5단계 (기획서 3.1 기준)
// ────────────────────────────────────────────────────────────
function processNight(gameState) {
  const gs      = deepClone(gameState);
  const actions = gs.nightActions || {};
  const assign  = gs.assignments;
  const results = {};  // uid → 이 밤에 받을 시스템 메시지

  // 살아있는 플레이어 헬퍼
  const isAlive = uid => assign[uid]?.alive === true;
  const roleOf  = uid => assign[uid]?.role;
  const teamOf  = uid => assign[uid]?.team;

  // ── STEP 1: 제어권 확정 & 포섭 잠금 ────────────────────────
  const bossUID   = Object.keys(assign).find(uid => roleOf(uid) === 'BOSS' && isAlive(uid));
  const bossAction = bossUID ? actions[bossUID] : null;
  const isRecruiting = bossAction?.action === 'recruit';

  // 연속 포섭 검증
  if (isRecruiting && gs.lastRecruitDay === gs.day - 1) {
    // 연속 포섭 시도 — 차단
    results[bossUID] = { type: 'error', msg: '포섭은 연속으로 사용할 수 없습니다.' };
    bossAction.action = null;
  }

  // 포섭 사용 횟수 초과 검증
  if (isRecruiting && gs.recruitUsed >= gs.recruitMax) {
    results[bossUID] = { type: 'error', msg: '포섭 횟수를 모두 사용했습니다.' };
    bossAction.action = null;
  }

  const killLocked = isRecruiting; // 포섭 시 살해 잠금

  // ── STEP 2: 데이터 전이 (포섭 실행 & 직업 승계) ────────────
  let recruitTarget = null;
  if (isRecruiting && bossAction?.target1) {
    const tuid = bossAction.target1;

    if (!isAlive(tuid) || teamOf(tuid) !== 'citizen') {
      results[bossUID] = { type: 'error', msg: '유효하지 않은 포섭 대상' };
    } else {
      recruitTarget = tuid;
      const originalRole = assign[tuid].role;

      // 타겟 → 킬러로 변환
      assign[tuid].role       = 'KILLER';
      assign[tuid].team       = 'mafia';
      assign[tuid].recruitedDay = gs.day;

      gs.recruitUsed++;
      gs.lastRecruitDay = gs.day;

      results[tuid] = { type: 'recruited', msg: '당신은 포섭되었습니다.' };
      results[bossUID] = { type: 'recruit_success', msg: `${tuid} 포섭 성공` };

      // 취업준비생 직업 승계 (첫 번째 포섭에만)
      if (gs.recruitUsed === 1) {
        const jobseekerUID = Object.keys(assign).find(uid =>
          roleOf(uid) === 'JOBSEEKER' && isAlive(uid) && uid !== tuid
        );
        if (jobseekerUID) {
          assign[jobseekerUID].role = originalRole;
          assign[jobseekerUID].inheritedRole = originalRole;
          results[jobseekerUID] = {
            type: 'inherit',
            msg: `직업 승계: ${ROLES[originalRole].nameKo}`
          };
        }
      }
    }
  }

  // ── STEP 3: 방어 및 은폐 설정 ──────────────────────────────
  const protectedUIDs  = new Set(); // 의사 보호
  const guardedUIDs    = new Set(); // 군인 경계
  const lawyerMasked   = new Set(); // 변호사 은폐

  Object.entries(actions).forEach(([uid, act]) => {
    if (!isAlive(uid)) return;
    const role = roleOf(uid);

    if (role === 'DOCTOR' && act.target1) {
      // 자가치료 1회 제한
      if (act.target1 === uid) {
        if (gs.doctorSelfUsed[uid]) return; // 이미 사용함
        gs.doctorSelfUsed[uid] = true;
      }
      protectedUIDs.add(act.target1);
    }

    if (role === 'SOLDIER' && act.target1) {
      guardedUIDs.add(act.target1);
    }

    if (role === 'LAWYER' && act.target1) {
      lawyerMasked.add(act.target1);
    }
  });

  // ── STEP 4: 정보 생성 (조사 결과) ─────────────────────────
  Object.entries(actions).forEach(([uid, act]) => {
    if (!isAlive(uid)) return;
    const role = roleOf(uid);

    // 경찰 — 정체 스캔
    if (role === 'POLICE' && act.target1) {
      const tuid   = act.target1;
      const isMafia = assign[tuid]?.team === 'mafia';
      // 은신(보스) 또는 변호사 마스킹 시 시민으로 왜곡
      const isBoss    = assign[tuid]?.role === 'BOSS';
      const isMasked  = lawyerMasked.has(tuid);
      const result    = (isBoss || isMasked) ? '시민' : (isMafia ? '마피아' : '시민');
      results[uid] = { type: 'scan', target: tuid, result };
    }

    // 탐정 — 관계 분석
    if (role === 'DETECTIVE' && act.target1 && act.target2) {
      const t1 = act.target1, t2 = act.target2;
      const t1team = assign[t1]?.team;
      const t2team = assign[t2]?.team;
      const hasBoss = assign[t1]?.role === 'BOSS' || assign[t2]?.role === 'BOSS';
      let rel;
      if (hasBoss)                             rel = '경계';
      else if (t1team === t2team)              rel = '동맹';
      else if (t1team === 'mafia' || t2team === 'mafia') rel = '대립';
      else                                     rel = '경계';
      results[uid] = { type: 'relation', t1, t2, result: rel };
    }

    // 감시자 — 정밀 관측
    if (role === 'WATCHMAN' && act.target1) {
      const tuid = act.target1;
      const targetAction = actions[tuid];
      const visitLog = targetAction?.target1
        ? `${tuid}이(가) 이 밤 누군가를 방문했습니다.`
        : `${tuid}이(가) 이 밤 아무도 방문하지 않았습니다.`;
      const tendency = getActionTendency(roleOf(tuid));
      results[uid] = { type: 'watch', target: tuid, visitLog, tendency };
    }

    // 기록관 — 기록 열람 (과거 랜덤 하루 동선)
    if (role === 'ARCHIVIST' && act.target1) {
      const tuid      = act.target1;
      const pastDay   = Math.max(1, gs.day - 1 - Math.floor(Math.random() * (gs.day)));
      const pastAction = gs.actionHistory?.[pastDay]?.[tuid];
      const log = pastAction?.target1
        ? `${pastDay}일 전 밤에 누군가를 방문했습니다.`
        : `${pastDay}일 전 밤에 아무 행동도 하지 않았습니다.`;
      results[uid] = { type: 'archive', target: tuid, log };
    }

    // 해커 — 조사직 결과 감청
    if (role === 'HACKER' && act.target1) {
      const tuid      = act.target1;
      const targetRole = roleOf(tuid);
      const infoRoles  = ['POLICE','DETECTIVE','WATCHMAN','ARCHIVIST'];
      if (infoRoles.includes(targetRole) && results[tuid]) {
        const hackerUID = uid;
        results[hackerUID] = {
          type:   'hacked',
          target: tuid,
          stolen: results[tuid],
          msg:    `${tuid}의 조사 결과를 탈취했습니다.`
        };
      } else {
        results[uid] = { type: 'hack_fail', msg: '대상은 조사직이 아닙니다.' };
      }
    }
  });

  // ── STEP 5: 물리적 충돌 해결 (살해) ───────────────────────
  let killTarget = null;

  if (!killLocked) {
    // 킬러가 살아있으면 킬러가 살해, 없으면 보스가 직접
    const killerUID = Object.keys(assign).find(uid => roleOf(uid) === 'KILLER' && isAlive(uid));
    const attackerUID = killerUID || bossUID;

    if (attackerUID && actions[attackerUID]?.action === 'kill') {
      killTarget = actions[attackerUID].target1;
    }

    if (killTarget && isAlive(killTarget)) {
      if (protectedUIDs.has(killTarget)) {
        // 의사 보호 — 생존
        results[killTarget] = { type: 'protected', msg: '누군가 당신을 지켜줬습니다.' };
        killTarget = null;
      } else if (guardedUIDs.has(killTarget)) {
        // 군인 경계 — 공격 저지
        const soldierUID = Object.keys(actions).find(uid =>
          roleOf(uid) === 'SOLDIER' && actions[uid].target1 === killTarget
        );
        if (soldierUID) {
          results[soldierUID] = {
            type: 'guard_success',
            msg: `공격자를 저지했습니다.`,
            attacker: attackerUID
          };
        }
        results[attackerUID] = { type: 'blocked', msg: '공격이 저지되었습니다.' };
        killTarget = null;
      } else {
        // 살해 성공
        assign[killTarget].alive = false;
        results[killTarget] = { type: 'killed', msg: '당신은 살해당했습니다.' };
      }
    }
  }

  // 군인 본인 습격 시 1회 생존 패시브
  Object.keys(assign).forEach(uid => {
    if (roleOf(uid) === 'SOLDIER' && !isAlive(uid) && !gs.soldierShield[uid]) {
      // 군인이 처음 죽었을 때 → 1회 생존
      assign[uid].alive = true;
      gs.soldierShield[uid] = true;
      const attackerUID = Object.keys(actions).find(u =>
        (actions[u]?.action === 'kill') && actions[u]?.target1 === uid
      );
      results[uid] = {
        type: 'soldier_revive',
        msg: '불굴의 의지로 생존했습니다!',
        attacker: attackerUID || null
      };
    }
  });

  // ── STEP 6 (사후처리): 도박꾼 베팅 결과 ────────────────────
  const deadTonight = killTarget;

  Object.entries(actions).forEach(([uid, act]) => {
    if (!isAlive(uid) || roleOf(uid) !== 'GAMBLER') return;
    const bet = act.prediction; // 'death' | 'execution'
    if (bet === 'death' && deadTonight) {
      gs.gamblerSuccess[uid] = (gs.gamblerSuccess[uid] || 0) + 1;
      // 보상: 무작위 생존자 직업 정보
      const aliveUIDs = Object.keys(assign).filter(u => isAlive(u) && u !== uid);
      if (aliveUIDs.length > 0) {
        const lucky = aliveUIDs[Math.floor(Math.random() * aliveUIDs.length)];
        results[uid] = {
          type: 'gambler_win',
          msg: `예측 성공! 정보 획득: ${assign[lucky].role}`
        };
      }
    } else if (bet === 'death' && !deadTonight) {
      results[uid] = { type: 'gambler_fail', msg: '오늘 밤 사망자가 없어 예측 실패' };
    }
  });

  // 행동 이력 저장 (기록관용)
  if (!gs.actionHistory) gs.actionHistory = {};
  gs.actionHistory[gs.day] = deepClone(actions);

  // 밤 행동 초기화
  gs.nightActions = {};

  // 페이즈 전환 → 낮
  gs.phase     = 'day';
  gs.day      += 1;
  gs.phaseEndAt = Date.now() + (gs.dayTimer * 1000);

  // 승리 조건 체크
  gs.winResult = checkWinCondition(gs);

  return { gameState: gs, results };
}

// ────────────────────────────────────────────────────────────
//  6. 낮 투표 처리
// ────────────────────────────────────────────────────────────
function processVote(gameState) {
  const gs     = deepClone(gameState);
  const assign = gs.assignments;
  const votes  = gs.voteLog || {};
  const isAlive = uid => assign[uid]?.alive === true;

  // 득표 집계 (정치인은 2표)
  const tally = {};
  Object.entries(votes).forEach(([voter, target]) => {
    if (!isAlive(voter) || !target) return;
    const weight = assign[voter]?.role === 'POLITICIAN' ? 2 : 1;
    tally[target] = (tally[target] || 0) + weight;
  });

  // 최다 득표자
  let maxVotes  = 0;
  let executed  = null;
  let isTie     = false;

  Object.entries(tally).forEach(([uid, cnt]) => {
    if (cnt > maxVotes)      { maxVotes = cnt; executed = uid; isTie = false; }
    else if (cnt === maxVotes) { isTie = true; }
  });

  if (isTie) executed = null; // 동률 → 처형 없음

  const results = {};

  if (executed) {
    // 정치인 면제 패시브
    if (assign[executed]?.role === 'POLITICIAN') {
      results[executed] = { type: 'politician_immune', msg: '정치인 면제권 발동 — 처형 면제' };
      executed = null;
    } else {
      assign[executed].alive = false;
      assign[executed].executedDay = gs.day - 1;
      results[executed] = { type: 'executed', msg: '투표로 처형되었습니다.' };

      // 변호사 승리 조건 변경: 의뢰인이 처형당함 → 시민 진영 패배가 목표
      if (executed === gs.clientUID) {
        gs.lawyerCondition = 'citizen_lose';
      }
    }
  } else {
    // 아무도 처형 안 됨
  }

  // 변호사 베팅: 처형 예측
  Object.keys(assign).forEach(uid => {
    if (!isAlive(uid) || assign[uid].role !== 'GAMBLER') return;
    const bet = gameState.nightActions?.[uid]?.prediction;
    if (bet === 'execution' && executed) {
      gs.gamblerSuccess[uid] = (gs.gamblerSuccess[uid] || 0) + 1;
    }
  });

  gs.voteLog    = {};
  gs.phase      = 'night';
  gs.phaseEndAt = Date.now() + (gs.nightTimer * 1000);

  gs.winResult  = checkWinCondition(gs);

  return { gameState: gs, results, executed };
}

// ────────────────────────────────────────────────────────────
//  7. 승리 조건 판정 (기획서 1.2 기준)
// ────────────────────────────────────────────────────────────
function checkWinCondition(gs) {
  const assign = gs.assignments;
  const alive  = Object.entries(assign).filter(([, p]) => p.alive);

  const aliveMafia   = alive.filter(([, p]) => p.team === 'mafia').length;
  const aliveCitizen = alive.filter(([, p]) => p.team === 'citizen').length;
  const aliveNeutral = alive.filter(([, p]) => p.team === 'neutral').length;

  // 마피아 승리: 마피아 수 >= 시민+중립 또는 시민 전멸
  if (aliveCitizen === 0) return { winner: 'mafia', reason: '시민 진영 전멸' };
  if (aliveMafia >= aliveCitizen + aliveNeutral) return { winner: 'mafia', reason: '마피아 수 우세' };

  // 시민 승리: 마피아 전멸
  if (aliveMafia === 0) return { winner: 'citizen', reason: '마피아 진영 전멸' };

  // 개인 승리 판정 (도박꾼)
  const gamblerEntries = alive.filter(([, p]) => p.role === 'GAMBLER');
  for (const [uid] of gamblerEntries) {
    const successes = gs.gamblerSuccess?.[uid] || 0;
    if (successes >= 3) return { winner: 'gambler', uid, reason: '도박꾼 개인 승리' };
  }

  return null; // 게임 진행 중
}

// ────────────────────────────────────────────────────────────
//  8. 행동 성향 헬퍼 (감시자용)
// ────────────────────────────────────────────────────────────
function getActionTendency(role) {
  const map = {
    BOSS: '공격', KILLER: '공격', HACKER: '정보',
    POLICE: '정보', DETECTIVE: '정보', WATCHMAN: '정보',
    ARCHIVIST: '정보', SHAMAN: '정보',
    DOCTOR: '보조', SOLDIER: '보조', JOBSEEKER: '없음', POLITICIAN: '없음',
    LAWYER: '보조', GAMBLER: '없음',
  };
  return map[role] || '알 수 없음';
}

// ────────────────────────────────────────────────────────────
//  9. Firebase 연동 헬퍼
// ────────────────────────────────────────────────────────────
const GameDB = {
  // 게임 시작 — 역할 배분 후 Firebase에 기록
  async startGame(db, roomId) {
    const snap     = await db.ref(`rooms/${roomId}`).get();
    const roomData = snap.val();
    const gs       = createGameState(roomData);

    await db.ref(`rooms/${roomId}`).update({
      status:    'playing',
      gameState: gs,
    });

    // 각 플레이어에게 본인 역할만 개인 경로로 전달
    const writes = {};
    Object.entries(gs.assignments).forEach(([uid, info]) => {
      writes[`playerRoles/${roomId}/${uid}`] = {
        role:    info.role,
        team:    info.team,
        nameKo:  ROLES[info.role].nameKo,
      };
      // 변호사에게 의뢰인 정보 전달
      if (info.role === 'LAWYER' && gs.clientUID) {
        writes[`playerRoles/${roomId}/${uid}/clientUID`] = gs.clientUID;
      }
    });

    await db.ref().update(writes);
    return gs;
  },

  // 밤 행동 제출
  async submitNightAction(db, roomId, uid, actionData) {
    await db.ref(`rooms/${roomId}/gameState/nightActions/${uid}`).set(actionData);
  },

  // 투표 제출
  async submitVote(db, roomId, voterUID, targetUID) {
    await db.ref(`rooms/${roomId}/gameState/voteLog/${voterUID}`).set(targetUID);
  },

  // 밤 행동 처리 (방장만 호출)
  async processNightActions(db, roomId) {
    const snap = await db.ref(`rooms/${roomId}/gameState`).get();
    const gs   = snap.val();
    const { gameState: newGS, results } = processNight(gs);

    await db.ref(`rooms/${roomId}/gameState`).set(newGS);

    // 개인 결과 메시지 전달
    const writes = {};
    Object.entries(results).forEach(([uid, result]) => {
      writes[`nightResults/${roomId}/${uid}`] = result;
    });
    await db.ref().update(writes);

    return { gameState: newGS, results };
  },

  // 투표 처리 (방장만 호출)
  async processVoteResults(db, roomId) {
    const snap = await db.ref(`rooms/${roomId}/gameState`).get();
    const gs   = snap.val();
    const { gameState: newGS, results, executed } = processVote(gs);

    await db.ref(`rooms/${roomId}/gameState`).set(newGS);
    return { gameState: newGS, results, executed };
  },
};

// ────────────────────────────────────────────────────────────
//  10. 유틸
// ────────────────────────────────────────────────────────────
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// 전역 노출 (모듈 없이 <script> 태그로 사용)
window.MafiaEngine = {
  ROLES,
  ROLE_TABLE,
  assignRoles,
  createGameState,
  processNight,
  processVote,
  checkWinCondition,
  GameDB,
};
