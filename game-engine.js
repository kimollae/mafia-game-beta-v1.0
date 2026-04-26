// ============================================================
//  🕵️ MAFIA // PROTOCOL — GAME ENGINE v2.0
//  기획서 완전 반영판
// ============================================================

// ────────────────────────────────────────────────────────────
//  1. 직업 정의
// ────────────────────────────────────────────────────────────
const ROLES = {
  BOSS:       { id:'BOSS',       team:'mafia',   nameKo:'보스',       type:'mafia'    },
  HACKER:     { id:'HACKER',     team:'mafia',   nameKo:'해커',       type:'mafia'    },
  KILLER:     { id:'KILLER',     team:'mafia',   nameKo:'킬러',       type:'mafia'    },
  POLICE:     { id:'POLICE',     team:'citizen', nameKo:'경찰',       type:'info'     },
  DETECTIVE:  { id:'DETECTIVE',  team:'citizen', nameKo:'탐정',       type:'info'     },
  WATCHMAN:   { id:'WATCHMAN',   team:'citizen', nameKo:'감시자',     type:'info'     },
  SHAMAN:     { id:'SHAMAN',     team:'citizen', nameKo:'무당',       type:'info'     },
  ARCHIVIST:  { id:'ARCHIVIST',  team:'citizen', nameKo:'기록관',     type:'info'     },
  DOCTOR:     { id:'DOCTOR',     team:'citizen', nameKo:'의사',       type:'defense'  },
  SOLDIER:    { id:'SOLDIER',    team:'citizen', nameKo:'군인',       type:'defense'  },
  JOBSEEKER:  { id:'JOBSEEKER',  team:'citizen', nameKo:'취업준비생', type:'defense'  },
  POLITICIAN: { id:'POLITICIAN', team:'citizen', nameKo:'정치인',     type:'variable' },
  LAWYER:     { id:'LAWYER',     team:'neutral', nameKo:'변호사',     type:'neutral'  },
  GAMBLER:    { id:'GAMBLER',    team:'neutral', nameKo:'도박꾼',     type:'neutral'  },
};

// ────────────────────────────────────────────────────────────
//  2. 인원별 직업 배분표
// ────────────────────────────────────────────────────────────
const ROLE_TABLE = {
  6:  { mafia:['BOSS'],           neutral:['GAMBLER'],          citizen:['POLICE','DOCTOR','JOBSEEKER','POLITICIAN'],                                          recruitMax:1 },
  7:  { mafia:['BOSS'],           neutral:['LAWYER'],           citizen:['POLICE','DOCTOR','JOBSEEKER','ARCHIVIST','SOLDIER'],                                 recruitMax:1 },
  8:  { mafia:['BOSS','HACKER'],  neutral:['GAMBLER'],          citizen:['POLICE','DOCTOR','JOBSEEKER','DETECTIVE','POLITICIAN'],                              recruitMax:1 },
  9:  { mafia:['BOSS','HACKER'],  neutral:['LAWYER'],           citizen:['POLICE','DOCTOR','JOBSEEKER','ARCHIVIST','SHAMAN','WATCHMAN'],                       recruitMax:1 },
  10: { mafia:['BOSS','HACKER'],  neutral:['LAWYER','GAMBLER'], citizen:['POLICE','DOCTOR','JOBSEEKER','SOLDIER','DETECTIVE','POLITICIAN'],                    recruitMax:1 },
  11: { mafia:['BOSS','HACKER'],  neutral:['LAWYER','GAMBLER'], citizen:['POLICE','DOCTOR','JOBSEEKER','ARCHIVIST','WATCHMAN','SHAMAN','SOLDIER'],             recruitMax:2 },
  12: { mafia:['BOSS','HACKER'],  neutral:['LAWYER','GAMBLER'], citizen:['POLICE','DOCTOR','JOBSEEKER','ARCHIVIST','DETECTIVE','WATCHMAN','SOLDIER','POLITICIAN'], recruitMax:2 },
  13: { mafia:['BOSS','HACKER'],  neutral:['LAWYER','GAMBLER'], citizen:['POLICE','DETECTIVE','WATCHMAN','SHAMAN','ARCHIVIST','DOCTOR','SOLDIER','JOBSEEKER','POLITICIAN'], recruitMax:2 },
};

// ────────────────────────────────────────────────────────────
//  3. 직업 배분
// ────────────────────────────────────────────────────────────
function assignRoles(playerUIDs) {
  const count = playerUIDs.length;
  if (count < 6 || count > 13) throw new Error('지원하지 않는 인원: ' + count);
  const table    = ROLE_TABLE[count];
  const allRoles = [...table.mafia, ...table.neutral, ...table.citizen];
  for (let i = allRoles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allRoles[i], allRoles[j]] = [allRoles[j], allRoles[i]];
  }
  const assignments = {};
  playerUIDs.forEach((uid, idx) => {
    assignments[uid] = {
      role: allRoles[idx], team: ROLES[allRoles[idx]].team,
      originalRole: allRoles[idx], alive: true, online: true,
    };
  });
  return assignments;
}

// ────────────────────────────────────────────────────────────
//  4. 게임 초기 상태 생성
// ────────────────────────────────────────────────────────────
function createGameState(roomData) {
  const players     = Object.values(roomData.players).filter(p => p.online !== false);
  const playerUIDs  = players.map(p => p.uid);
  const table       = ROLE_TABLE[playerUIDs.length];
  const assignments = assignRoles(playerUIDs);

  let clientUID = null;
  if (table.neutral.includes('LAWYER')) {
    const lawyerUID   = playerUIDs.find(uid => assignments[uid].role === 'LAWYER');
    const citizenUIDs = playerUIDs.filter(uid => assignments[uid].team === 'citizen' && uid !== lawyerUID);
    clientUID = citizenUIDs[Math.floor(Math.random() * citizenUIDs.length)];
  }

  return {
    phase: 'night', day: 1, status: 'playing',
    recruitMax: table.recruitMax, recruitUsed: 0, lastRecruitDay: null,
    assignments, clientUID,
    // 변호사 승리 조건 상태
    // 'client_alive' → 기본: 게임 종료 시 의뢰인 생존하면 승리
    // 'mafia_dead'   → 의뢰인 마피아에게 살해 → 마피아 전멸 시 승리
    // 'citizen_lose' → 의뢰인 투표로 처형   → 시민 패배 시 승리
    lawyerCondition: clientUID ? 'client_alive' : null,
    nightActions: {}, dayActions: {}, voteLog: {},
    soldierShield: {}, doctorSelfUsed: {},
    gamblerSuccess: {},
    gamblerBetCache: {}, // 밤→낮 사이 예측값 보존용
    actionHistory: {},
    dayTimer: roomData.dayTimer || 90,
    nightTimer: roomData.nightTimer || 45,
    phaseEndAt: Date.now() + ((roomData.nightTimer || 45) * 1000),
  };
}

// ────────────────────────────────────────────────────────────
//  5. 밤 행동 처리
// ────────────────────────────────────────────────────────────
function processNight(gameState) {
  const gs      = deepClone(gameState);
  const actions = gs.nightActions || {};
  const assign  = gs.assignments;
  const results = {};
  const isAlive = uid => assign[uid]?.alive === true;
  const roleOf  = uid => assign[uid]?.role;
  const teamOf  = uid => assign[uid]?.team;

  // STEP 1: 포섭 검증 & 살해 잠금
  const bossUID    = Object.keys(assign).find(uid => roleOf(uid) === 'BOSS' && isAlive(uid));
  const bossAction = bossUID ? actions[bossUID] : null;
  let   isRecruiting = bossAction?.action === 'recruit';

  if (isRecruiting && gs.lastRecruitDay === gs.day - 1) {
    results[bossUID] = { type:'error', msg:'포섭은 연속으로 사용할 수 없습니다.' };
    isRecruiting = false;
  }
  if (isRecruiting && gs.recruitUsed >= gs.recruitMax) {
    results[bossUID] = { type:'error', msg:'포섭 횟수를 모두 사용했습니다.' };
    isRecruiting = false;
  }
  const killLocked = isRecruiting;

  // STEP 2: 포섭 실행 & 직업 승계
  if (isRecruiting && bossAction?.target1) {
    const tuid = bossAction.target1;
    if (!isAlive(tuid) || teamOf(tuid) !== 'citizen') {
      results[bossUID] = { type:'error', msg:'유효하지 않은 포섭 대상' };
    } else {
      const originalRole = assign[tuid].role;
      assign[tuid].role = 'KILLER'; assign[tuid].team = 'mafia';
      assign[tuid].recruitedDay = gs.day;
      gs.recruitUsed++; gs.lastRecruitDay = gs.day;
      results[tuid]    = { type:'recruited', msg:'당신은 포섭되었습니다.' };
      results[bossUID] = { type:'recruit_success', msg:'포섭 성공 (' + ROLES[originalRole].nameKo + ' → 킬러)' };

      // 취업준비생 승계: 첫 번째 포섭에만
      if (gs.recruitUsed === 1) {
        const jsUID = Object.keys(assign).find(uid => roleOf(uid) === 'JOBSEEKER' && isAlive(uid) && uid !== tuid);
        if (jsUID) {
          assign[jsUID].role = originalRole;
          assign[jsUID].inheritedRole = originalRole;
          results[jsUID] = { type:'inherit', msg:'직업 승계: ' + ROLES[originalRole].nameKo };
        }
      }
    }
  }

  // STEP 3: 방어 & 은폐 설정
  const protectedUIDs = new Set();
  const guardedMap    = {}; // { targetUID: soldierUID }
  const lawyerMasked  = new Set();

  Object.entries(actions).forEach(([uid, act]) => {
    if (!isAlive(uid) || !act?.target1) return;
    const role = roleOf(uid);
    if (role === 'DOCTOR') {
      if (act.target1 === uid) {
        if (gs.doctorSelfUsed[uid]) return;
        gs.doctorSelfUsed[uid] = true;
      }
      protectedUIDs.add(act.target1);
    }
    if (role === 'SOLDIER')  guardedMap[act.target1] = uid;
    if (role === 'LAWYER')   lawyerMasked.add(act.target1);
  });

  // STEP 4-A: 조사 처리 (해커 제외 먼저)
  Object.entries(actions).forEach(([uid, act]) => {
    if (!isAlive(uid) || !act) return;
    const role = roleOf(uid);

    // 경찰: 보스 은신 + 변호사 마스킹 시 시민으로 왜곡
    if (role === 'POLICE' && act.target1) {
      const tuid   = act.target1;
      const isBoss = assign[tuid]?.role === 'BOSS';
      const masked = lawyerMasked.has(tuid);
      results[uid] = {
        type:'scan', target:tuid,
        result: (isBoss || masked) ? '시민' : (assign[tuid]?.team === 'mafia' ? '마피아' : '시민'),
      };
    }

    // 탐정: 변호사 마스킹 대상 포함 시 관계 왜곡
    if (role === 'DETECTIVE' && act.target1 && act.target2) {
      const t1 = act.target1, t2 = act.target2;
      const t1Mafia = assign[t1]?.team === 'mafia' && !lawyerMasked.has(t1);
      const t2Mafia = assign[t2]?.team === 'mafia' && !lawyerMasked.has(t2);
      const hasBoss = (assign[t1]?.role === 'BOSS' && !lawyerMasked.has(t1))
                   || (assign[t2]?.role === 'BOSS' && !lawyerMasked.has(t2));
      let rel = '동맹';
      if      (hasBoss)             rel = '경계';
      else if (t1Mafia && t2Mafia)  rel = '동맹';
      else if (t1Mafia || t2Mafia)  rel = '대립';
      results[uid] = { type:'relation', t1, t2, result:rel };
    }

    // 감시자
    if (role === 'WATCHMAN' && act.target1) {
      const tuid    = act.target1;
      const visited = actions[tuid]?.target1 || null;
      results[uid]  = {
        type:'watch', target:tuid, visited,
        tendency: getActionTendency(roleOf(tuid)),
        msg: visited ? tuid + '이(가) 이 밤 누군가를 방문했습니다.' : tuid + '이(가) 이 밤 아무도 방문하지 않았습니다.',
      };
    }

    // 기록관: 변호사 마스킹 대상이면 열람 실패
    if (role === 'ARCHIVIST' && act.target1) {
      const tuid = act.target1;
      if (lawyerMasked.has(tuid)) {
        results[uid] = { type:'archive_fail', msg:'대상의 기록이 봉인되어 있습니다.' };
      } else {
        const days    = Object.keys(gs.actionHistory || {}).map(Number);
        const pastDay = days.length ? days[Math.floor(Math.random() * days.length)] : null;
        const pastAct = pastDay ? gs.actionHistory[pastDay]?.[tuid] : null;
        results[uid]  = {
          type:'archive', target:tuid,
          log: pastDay
            ? (pastAct?.target1 ? pastDay + '일 전 밤, 누군가를 방문했습니다.' : pastDay + '일 전 밤, 아무 행동도 하지 않았습니다.')
            : '조회할 과거 기록이 없습니다.',
        };
      }
    }

    // 도박꾼: 베팅 캐시 저장
    if (role === 'GAMBLER' && act.prediction) {
      gs.gamblerBetCache[uid] = act.prediction;
    }
  });

  // STEP 4-B: 해커 (다른 조사 결과 탈취 — 마지막 처리)
  Object.entries(actions).forEach(([uid, act]) => {
    if (!isAlive(uid) || roleOf(uid) !== 'HACKER' || !act?.target1) return;
    const tuid      = act.target1;
    const infoRoles = ['POLICE','DETECTIVE','WATCHMAN','ARCHIVIST'];
    if (infoRoles.includes(roleOf(tuid)) && results[tuid]) {
      results[uid] = { type:'hacked', target:tuid, stolen:results[tuid], msg:tuid + '의 조사 결과를 탈취했습니다.' };
    } else {
      results[uid] = { type:'hack_fail', msg:'대상은 조사직이 아니거나 이 밤 조사하지 않았습니다.' };
    }
  });

  // STEP 5: 살해 처리
  let deadUID = null;
  if (!killLocked) {
    const killerUID   = Object.keys(assign).find(uid => roleOf(uid) === 'KILLER' && isAlive(uid));
    const attackerUID = killerUID || bossUID;
    const attackAct   = attackerUID ? actions[attackerUID] : null;

    if (attackAct?.action === 'kill' && attackAct.target1 && isAlive(attackAct.target1)) {
      const target = attackAct.target1;

      if (protectedUIDs.has(target)) {
        results[target] = { type:'protected', msg:'누군가의 보호로 살아남았습니다.' };

      } else if (guardedMap[target] !== undefined) {
        const soldierUID = guardedMap[target];
        results[soldierUID] = { type:'guard_success', attacker:attackerUID, msg:'공격을 저지했습니다.' };
        results[attackerUID] = { type:'blocked', msg:'공격이 군인에게 저지되었습니다.' };

      } else {
        assign[target].alive    = false;
        assign[target].killedBy = 'mafia';
        assign[target].killedDay = gs.day;
        deadUID = target;
        results[target] = { type:'killed', msg:'당신은 살해당했습니다.' };

        // ★ 변호사 조건 변경: 의뢰인 마피아에게 살해됨
        if (target === gs.clientUID && gs.lawyerCondition === 'client_alive') {
          gs.lawyerCondition = 'mafia_dead';
        }
      }
    }
  }

  // STEP 5-B: 군인 1회 생존 패시브
  Object.keys(assign).forEach(uid => {
    if (roleOf(uid) !== 'SOLDIER' || assign[uid].alive) return;
    if (gs.soldierShield[uid] || assign[uid].killedBy !== 'mafia') return;
    assign[uid].alive    = true;
    assign[uid].killedBy = undefined;
    assign[uid].killedDay = undefined;
    gs.soldierShield[uid] = true;
    deadUID = null;
    const attackerUID = Object.keys(actions).find(u => actions[u]?.action === 'kill' && actions[u]?.target1 === uid);
    results[uid] = { type:'soldier_revive', attacker:attackerUID || null, msg:'불굴의 의지로 생존! 공격자 정보를 획득했습니다.' };
  });

  // STEP 6: 도박꾼 밤 예측 결과 (death)
  Object.entries(gs.gamblerBetCache).forEach(([uid, prediction]) => {
    if (!isAlive(uid) || prediction !== 'death') return;
    if (deadUID) {
      gs.gamblerSuccess[uid] = (gs.gamblerSuccess[uid] || 0) + 1;
      const aliveUIDs = Object.keys(assign).filter(u => isAlive(u) && u !== uid);
      const lucky     = aliveUIDs[Math.floor(Math.random() * aliveUIDs.length)];
      results[uid] = {
        type:'gambler_win',
        bonus: lucky ? { uid:lucky, role:assign[lucky].role } : null,
        msg: '예측 성공!' + (lucky ? ' ' + ROLES[assign[lucky].role].nameKo + ' 정보 획득' : ''),
      };
    } else {
      results[uid] = { type:'gambler_fail', msg:'오늘 밤 사망자 없음 — 예측 실패' };
    }
  });
  // execution 예측 캐시는 유지 (processVote에서 소비)

  // 행동 이력 저장
  if (!gs.actionHistory) gs.actionHistory = {};
  gs.actionHistory[gs.day] = deepClone(actions);

  gs.nightActions = {};
  gs.phase        = 'day';
  gs.day         += 1;
  gs.phaseEndAt   = Date.now() + (gs.dayTimer * 1000);
  gs.winResult    = checkWinCondition(gs);

  return { gameState:gs, results, deadUID };
}

// ────────────────────────────────────────────────────────────
//  6. 낮 행동 처리 (무당 — 낮에만 사용)
// ────────────────────────────────────────────────────────────
function processDayActions(gameState) {
  const gs      = deepClone(gameState);
  const actions = gs.dayActions || {};
  const assign  = gs.assignments;
  const results = {};
  const isAlive = uid => assign[uid]?.alive === true;
  const roleOf  = uid => assign[uid]?.role;

  Object.entries(actions).forEach(([uid, act]) => {
    if (!isAlive(uid) || !act?.target1) return;
    // 무당: 사망자의 정확한 직업 조회
    if (roleOf(uid) === 'SHAMAN') {
      const tuid = act.target1;
      if (!assign[tuid] || assign[tuid].alive) {
        results[uid] = { type:'shaman_fail', msg:'살아있는 플레이어는 조회할 수 없습니다.' };
      } else {
        results[uid] = {
          type:'shaman', target:tuid,
          role: assign[tuid].role,
          nameKo: ROLES[assign[tuid].role].nameKo,
          msg: tuid + '의 직업: ' + ROLES[assign[tuid].role].nameKo,
        };
      }
    }
  });

  gs.dayActions = {};
  return { gameState:gs, results };
}

// ────────────────────────────────────────────────────────────
//  7. 낮 투표 처리
// ────────────────────────────────────────────────────────────
function processVote(gameState) {
  const gs      = deepClone(gameState);
  const assign  = gs.assignments;
  const votes   = gs.voteLog || {};
  const isAlive = uid => assign[uid]?.alive === true;

  const tally = {};
  Object.entries(votes).forEach(([voter, target]) => {
    if (!isAlive(voter) || !target) return;
    const weight = assign[voter]?.role === 'POLITICIAN' ? 2 : 1;
    tally[target] = (tally[target] || 0) + weight;
  });

  let maxVotes = 0, executed = null, isTie = false;
  Object.entries(tally).forEach(([uid, cnt]) => {
    if (cnt > maxVotes)        { maxVotes = cnt; executed = uid; isTie = false; }
    else if (cnt === maxVotes)  { isTie = true; }
  });
  if (isTie) executed = null;

  const results = {};

  if (executed) {
    // ★ 정치인 처형 면제 패시브
    if (assign[executed]?.role === 'POLITICIAN') {
      results[executed] = { type:'politician_immune', msg:'정치인 면제권 발동 — 처형 면제' };
      executed = null;
    } else {
      assign[executed].alive      = false;
      assign[executed].killedBy   = 'vote';
      assign[executed].executedDay = gs.day - 1;
      results[executed] = { type:'executed', msg:'투표로 처형되었습니다.' };

      // ★ 변호사 조건 변경: 의뢰인 투표로 처형됨
      if (executed === gs.clientUID && gs.lawyerCondition === 'client_alive') {
        gs.lawyerCondition = 'citizen_lose';
      }
    }
  }

  // ◆ 도박꾼 처형 예측 검증
  Object.entries(gs.gamblerBetCache || {}).forEach(([uid, prediction]) => {
    if (!isAlive(uid) || prediction !== 'execution') return;
    if (executed) {
      gs.gamblerSuccess[uid] = (gs.gamblerSuccess[uid] || 0) + 1;
      const aliveUIDs = Object.keys(assign).filter(u => isAlive(u) && u !== uid);
      const lucky     = aliveUIDs[Math.floor(Math.random() * aliveUIDs.length)];
      results[uid] = {
        type:'gambler_win',
        bonus: lucky ? { uid:lucky, role:assign[lucky].role } : null,
        msg: '처형 예측 성공!' + (lucky ? ' ' + ROLES[assign[lucky].role].nameKo + ' 정보 획득' : ''),
      };
    } else {
      results[uid] = { type:'gambler_fail', msg:'처형 없음 — 예측 실패' };
    }
  });

  gs.gamblerBetCache = {};
  gs.voteLog         = {};
  gs.phase           = 'night';
  gs.phaseEndAt      = Date.now() + (gs.nightTimer * 1000);
  gs.winResult       = checkWinCondition(gs);

  return { gameState:gs, results, executed };
}

// ────────────────────────────────────────────────────────────
//  8. 승리 조건 판정 ★ 완전 재작성
// ────────────────────────────────────────────────────────────
function checkWinCondition(gs) {
  const assign       = gs.assignments;
  const aliveList    = Object.keys(assign).filter(uid => assign[uid]?.alive);
  const aliveMafia   = aliveList.filter(uid => assign[uid].team === 'mafia').length;
  const aliveCitizen = aliveList.filter(uid => assign[uid].team === 'citizen').length;
  const aliveNeutral = aliveList.filter(uid => assign[uid].team === 'neutral').length;

  // ── 마피아 승리 ──────────────────────────────────────────
  const mafiaWins = aliveCitizen === 0 || (aliveMafia > 0 && aliveMafia >= aliveCitizen + aliveNeutral);
  if (mafiaWins) {
    const reason     = aliveCitizen === 0 ? '시민 진영 전멸' : '마피아 수 우세';
    const lawyerWin  = resolveLawyerWin(gs, 'mafia_wins');
    const gamblerWin = resolveGamblerWin(gs);
    return { winner:'mafia', reason, lawyerWin, gamblerWin };
  }

  // ── 시민 승리 ────────────────────────────────────────────
  if (aliveMafia === 0) {
    const lawyerWin  = resolveLawyerWin(gs, 'citizen_wins');
    const gamblerWin = resolveGamblerWin(gs);
    return { winner:'citizen', reason:'마피아 진영 전멸', lawyerWin, gamblerWin };
  }

  return null; // 진행 중
}

// ── 변호사 개인 승리 판정 ────────────────────────────────────
function resolveLawyerWin(gs, gameOutcome) {
  if (!gs.clientUID || !gs.lawyerCondition) return null;
  const assign    = gs.assignments;
  const lawyerUID = Object.keys(assign).find(uid => assign[uid].role === 'LAWYER');
  if (!lawyerUID || !assign[lawyerUID]?.alive) return null; // 변호사 사망 시 승리 불가

  const cond = gs.lawyerCondition;

  // CASE 1: 기본 — 의뢰인이 살아있으면 승리 (어느 진영 승리든)
  if (cond === 'client_alive' && assign[gs.clientUID]?.alive) {
    return { uid:lawyerUID, reason:'의뢰인 생존 — 변호사 개인 승리' };
  }
  // CASE 2: 의뢰인 마피아에게 살해됨 → 마피아 전멸(시민 승리)하면 변호사 승리
  if (cond === 'mafia_dead' && gameOutcome === 'citizen_wins') {
    return { uid:lawyerUID, reason:'의뢰인의 복수 달성 — 변호사 개인 승리' };
  }
  // CASE 3: 의뢰인 투표로 처형됨 → 마피아 승리하면 변호사 승리
  if (cond === 'citizen_lose' && gameOutcome === 'mafia_wins') {
    return { uid:lawyerUID, reason:'의뢰인 처형의 대가 — 변호사 개인 승리' };
  }

  return null;
}

// ── 도박꾼 최종 승리 판정 ────────────────────────────────────
// 게임 종료 시 살아있고 예측 3회 이상 성공 시 개인 승리
function resolveGamblerWin(gs) {
  const assign  = gs.assignments;
  const winners = [];
  Object.keys(assign).forEach(uid => {
    if (assign[uid].role !== 'GAMBLER' || !assign[uid].alive) return;
    const cnt = gs.gamblerSuccess?.[uid] || 0;
    if (cnt >= 3) winners.push({ uid, successes:cnt, reason:'예측 ' + cnt + '회 성공 — 도박꾼 개인 승리' });
  });
  return winners.length ? winners : null;
}

// ────────────────────────────────────────────────────────────
//  9. 행동 성향 헬퍼
// ────────────────────────────────────────────────────────────
function getActionTendency(role) {
  const map = {
    BOSS:'공격', KILLER:'공격', HACKER:'정보',
    POLICE:'정보', DETECTIVE:'정보', WATCHMAN:'정보', ARCHIVIST:'정보', SHAMAN:'없음',
    DOCTOR:'보조', SOLDIER:'보조', JOBSEEKER:'없음', POLITICIAN:'없음',
    LAWYER:'보조', GAMBLER:'없음',
  };
  return map[role] || '알 수 없음';
}

// ────────────────────────────────────────────────────────────
//  10. Firebase 연동 헬퍼
// ────────────────────────────────────────────────────────────
const GameDB = {
  async startGame(db, roomId) {
    const snap = await db.ref('rooms/' + roomId).get();
    const gs   = createGameState(snap.val());
    await db.ref('rooms/' + roomId).update({ status:'playing', gameState:gs });
    const writes = {};
    Object.entries(gs.assignments).forEach(([uid, info]) => {
      writes['playerRoles/' + roomId + '/' + uid] = { role:info.role, team:info.team, nameKo:ROLES[info.role].nameKo };
      if (info.role === 'LAWYER' && gs.clientUID)
        writes['playerRoles/' + roomId + '/' + uid + '/clientUID'] = gs.clientUID;
    });
    await db.ref().update(writes);
    return gs;
  },
  async submitNightAction(db, roomId, uid, data) {
    await db.ref('rooms/' + roomId + '/gameState/nightActions/' + uid).set(data);
  },
  async submitDayAction(db, roomId, uid, data) {
    await db.ref('rooms/' + roomId + '/gameState/dayActions/' + uid).set(data);
  },
  async submitVote(db, roomId, voterUID, targetUID) {
    await db.ref('rooms/' + roomId + '/gameState/voteLog/' + voterUID).set(targetUID);
  },
  async processNightActions(db, roomId) {
    const snap = await db.ref('rooms/' + roomId + '/gameState').get();
    const { gameState:newGS, results, deadUID } = processNight(snap.val());
    await db.ref('rooms/' + roomId + '/gameState').set(newGS);
    const writes = {};
    Object.entries(results).forEach(([uid, r]) => { writes['nightResults/' + roomId + '/' + uid] = r; });
    await db.ref().update(writes);
    return { gameState:newGS, results, deadUID };
  },
  async processDayActions(db, roomId) {
    const snap = await db.ref('rooms/' + roomId + '/gameState').get();
    const { gameState:newGS, results } = processDayActions(snap.val());
    await db.ref('rooms/' + roomId + '/gameState').set(newGS);
    return { gameState:newGS, results };
  },
  async processVoteResults(db, roomId) {
    const snap = await db.ref('rooms/' + roomId + '/gameState').get();
    const { gameState:newGS, results, executed } = processVote(snap.val());
    await db.ref('rooms/' + roomId + '/gameState').set(newGS);
    return { gameState:newGS, results, executed };
  },
};

// ────────────────────────────────────────────────────────────
//  11. 유틸
// ────────────────────────────────────────────────────────────
function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

window.MafiaEngine = {
  ROLES, ROLE_TABLE,
  assignRoles, createGameState,
  processNight, processDayActions, processVote,
  checkWinCondition, resolveLawyerWin, resolveGamblerWin,
  GameDB,
};
