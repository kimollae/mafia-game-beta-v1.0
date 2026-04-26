// ============================================================
//  🕵️ MAFIA // PROTOCOL — GAME ENGINE v3.0
//  설계 결정사항 10개 전체 반영
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
  6:  { mafia:['BOSS'],           neutral:['GAMBLER'],          citizen:['POLICE','DOCTOR','JOBSEEKER','POLITICIAN'],                                              recruitMax:1 },
  7:  { mafia:['BOSS'],           neutral:['LAWYER'],           citizen:['POLICE','DOCTOR','JOBSEEKER','ARCHIVIST','SOLDIER'],                                     recruitMax:1 },
  8:  { mafia:['BOSS','HACKER'],  neutral:['GAMBLER'],          citizen:['POLICE','DOCTOR','JOBSEEKER','DETECTIVE','POLITICIAN'],                                  recruitMax:1 },
  9:  { mafia:['BOSS','HACKER'],  neutral:['LAWYER'],           citizen:['POLICE','DOCTOR','JOBSEEKER','ARCHIVIST','SHAMAN','WATCHMAN'],                           recruitMax:1 },
  10: { mafia:['BOSS','HACKER'],  neutral:['LAWYER','GAMBLER'], citizen:['POLICE','DOCTOR','JOBSEEKER','SOLDIER','DETECTIVE','POLITICIAN'],                        recruitMax:1 },
  11: { mafia:['BOSS','HACKER'],  neutral:['LAWYER','GAMBLER'], citizen:['POLICE','DOCTOR','JOBSEEKER','ARCHIVIST','WATCHMAN','SHAMAN','SOLDIER'],                 recruitMax:2 },
  12: { mafia:['BOSS','HACKER'],  neutral:['LAWYER','GAMBLER'], citizen:['POLICE','DOCTOR','JOBSEEKER','ARCHIVIST','DETECTIVE','WATCHMAN','SOLDIER','POLITICIAN'],  recruitMax:2 },
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
  // ★ 방어 코드: players null 체크
  if (!roomData || !roomData.players) throw new Error('플레이어 정보가 없습니다');
  const players    = Object.values(roomData.players).filter(p => p.online !== false);
  const playerUIDs = players.map(p => p.uid);
  const count      = playerUIDs.length;
  if (count < 6 || count > 13) throw new Error('지원하지 않는 인원: ' + count + '명 (6~13명 필요)');
  const table      = ROLE_TABLE[count];
  if (!table) throw new Error('배분표 없음: ' + count + '명');
  const assignments = assignRoles(playerUIDs);

  let clientUID = null;
  if (table.neutral.includes('LAWYER')) {
    const lawyerUID   = playerUIDs.find(uid => assignments[uid].role === 'LAWYER');
    const citizenUIDs = playerUIDs.filter(uid => assignments[uid].team === 'citizen' && uid !== lawyerUID);
    clientUID = citizenUIDs[Math.floor(Math.random() * citizenUIDs.length)];
  }

  return {
    phase: 'night',
    // ★ [Q1] day=1 첫날 밤/낮은 살해·처형 없음. day=2 부터 본격 진행
    day: 1,
    status: 'playing',
    recruitMax: table.recruitMax, recruitUsed: 0, lastRecruitDay: null,
    assignments, clientUID,
    // ★ 변호사 승리 조건
    // 'client_alive'  → 기본: 게임 종료 시 의뢰인 생존
    // 'mafia_dead'    → 의뢰인 사라짐(살해 or 포섭) → 마피아 전멸 시 승리
    // 'citizen_lose'  → 의뢰인 투표 처형 → 시민 패배 시 승리
    lawyerCondition: clientUID ? 'client_alive' : null,
    nightActions: {}, dayActions: {}, voteLog: {},
    soldierShield: {}, doctorSelfUsed: {},
    gamblerSuccess: {}, gamblerBetCache: {},
    actionHistory: {},
    // ★ [Q9] 방장 관리
    host: roomData.host,
    hostTransferAt: null,
    // ★ [Q10] 유령 채팅은 Firebase chat 경로에서 channel 필드로 구분
    // channel: 'main' | 'ghost'
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

  // ★ [Q1] 첫날 밤(day=1)은 포섭 포함 모든 행동 결과 없음, 페이즈만 전환
  if (gs.day === 1) {
    gs.nightActions = {};
    gs.phase        = 'day';
    gs.day          = 2;
    gs.phaseEndAt   = Date.now() + (gs.dayTimer * 1000);
    gs.winResult    = null;
    return { gameState: gs, results: {}, deadUID: null, firstNight: true };
  }

  // ── STEP 1: 포섭 검증 & 살해 잠금 ──────────────────────────
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

  // ── STEP 2: 포섭 실행 & 직업 승계 ──────────────────────────
  let recruitedUID = null;
  if (isRecruiting && bossAction?.target1) {
    const tuid = bossAction.target1;
    if (!isAlive(tuid) || teamOf(tuid) !== 'citizen') {
      results[bossUID] = { type:'error', msg:'유효하지 않은 포섭 대상' };
    } else {
      const originalRole = assign[tuid].role;
      recruitedUID = tuid;

      // ★ [Q8] 포섭 즉시 그날 밤 시민 능력 불발 — 행동 무효화
      delete actions[tuid];

      assign[tuid].role = 'KILLER'; assign[tuid].team = 'mafia';
      assign[tuid].recruitedDay = gs.day;
      gs.recruitUsed++; gs.lastRecruitDay = gs.day;

      results[tuid]    = { type:'recruited', msg:'당신은 포섭되었습니다. 오늘 밤 능력은 무효화됩니다.' };
      results[bossUID] = { type:'recruit_success', msg:'포섭 성공 (' + ROLES[originalRole].nameKo + ' → 킬러)' };

      // ★ [Q5] 의뢰인이 포섭됨 = 마피아에게 빼앗긴 것 → 조건 변경
      if (tuid === gs.clientUID && gs.lawyerCondition === 'client_alive') {
        gs.lawyerCondition = 'mafia_dead';
        // 변호사에게 통보
        const lawyerUID = Object.keys(assign).find(u => assign[u].role === 'LAWYER' && isAlive(u));
        if (lawyerUID) results[lawyerUID] = { type:'client_recruited', msg:'의뢰인이 포섭되었습니다. 승리 조건이 변경됩니다: 마피아 전멸.' };
      }

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

  // ── STEP 3: 방어 & 은폐 설정 ────────────────────────────────
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
    // ★ [Q3] 포섭은 의사/군인 보호 무용 → guardedMap/protectedUIDs는 살해에만 적용
    if (role === 'SOLDIER') guardedMap[act.target1] = uid;
    if (role === 'LAWYER')  lawyerMasked.add(act.target1);
  });

  // ── STEP 4-A: 조사 처리 (해커 제외) ────────────────────────
  Object.entries(actions).forEach(([uid, act]) => {
    if (!isAlive(uid) || !act) return;
    const role = roleOf(uid);

    // 경찰
    if (role === 'POLICE' && act.target1) {
      const tuid   = act.target1;
      const isBoss = assign[tuid]?.role === 'BOSS';
      const masked = lawyerMasked.has(tuid);
      results[uid] = {
        type:'scan', target:tuid,
        result: (isBoss || masked) ? '시민' : (assign[tuid]?.team === 'mafia' ? '마피아' : '시민'),
      };
    }

    // 탐정
    // ★ [Q6] 중립 세력은 탐정 결과에서 시민으로 표기
    if (role === 'DETECTIVE' && act.target1 && act.target2) {
      const t1 = act.target1, t2 = act.target2;
      const effectiveTeam = uid => {
        if (lawyerMasked.has(uid)) return 'citizen';
        const t = assign[uid]?.team;
        return t === 'neutral' ? 'citizen' : t; // ★ 중립 → 시민 표기
      };
      const t1Team = effectiveTeam(t1), t2Team = effectiveTeam(t2);
      const hasBoss = (assign[t1]?.role === 'BOSS' && !lawyerMasked.has(t1))
                   || (assign[t2]?.role === 'BOSS' && !lawyerMasked.has(t2));
      let rel = '동맹';
      if      (hasBoss)                          rel = '경계';
      else if (t1Team === 'mafia' && t2Team === 'mafia') rel = '동맹';
      else if (t1Team === 'mafia' || t2Team === 'mafia') rel = '대립';
      results[uid] = { type:'relation', t1, t2, result:rel };
    }

    // 감시자
    // ★ [Q2] 타겟이 방문한 사람 + 타겟을 방문한 사람 모두 표시
    if (role === 'WATCHMAN' && act.target1) {
      const tuid = act.target1;
      // 타겟이 방문한 사람
      const visitedBy = actions[tuid]?.target1 || null;
      const visitedBy2 = actions[tuid]?.target2 || null;
      // 타겟을 방문한 사람들
      const visitors = Object.entries(actions)
        .filter(([u, a]) => u !== tuid && isAlive(u) && (a?.target1 === tuid || a?.target2 === tuid))
        .map(([u]) => u);

      results[uid] = {
        type:'watch', target:tuid,
        visitedBy: [visitedBy, visitedBy2].filter(Boolean),
        visitors,
        tendency: getActionTendency(roleOf(tuid)),
        msg: '감시 완료: 동선 및 방문자 로그 수신.',
      };
    }

    // 기록관
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

    // 도박꾼 — 베팅 캐시 저장
    // ★ [Q7] prediction: 'death' | 'execution' | 'peace'
    if (role === 'GAMBLER' && act.prediction) {
      gs.gamblerBetCache[uid] = act.prediction;
    }
  });

  // ── STEP 4-B: 해커 (조사 결과 탈취) ───────────────────────
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

  // ── STEP 5: 살해 처리 ───────────────────────────────────────
  let deadUID = null;
  if (!killLocked) {
    const killerUID   = Object.keys(assign).find(uid => roleOf(uid) === 'KILLER' && isAlive(uid));
    const attackerUID = killerUID || bossUID;
    const attackAct   = attackerUID ? actions[attackerUID] : null;

    if (attackAct?.action === 'kill' && attackAct.target1 && isAlive(attackAct.target1)) {
      const target = attackAct.target1;

      if (protectedUIDs.has(target)) {
        // ★ [Q3] 포섭엔 무용이지만 살해에는 여전히 유효
        results[target] = { type:'protected', msg:'누군가의 보호로 살아남았습니다.' };

      } else if (guardedMap[target] !== undefined) {
        const soldierUID = guardedMap[target];
        results[soldierUID] = { type:'guard_success', attacker:attackerUID, msg:'공격을 저지했습니다.' };
        results[attackerUID] = { type:'blocked', msg:'공격이 군인에게 저지되었습니다.' };

      } else {
        assign[target].alive     = false;
        assign[target].killedBy  = 'mafia';
        assign[target].killedDay = gs.day;
        deadUID = target;
        results[target] = { type:'killed', msg:'당신은 살해당했습니다.' };

        if (target === gs.clientUID && gs.lawyerCondition === 'client_alive') {
          gs.lawyerCondition = 'mafia_dead';
          const lawyerUID = Object.keys(assign).find(u => assign[u].role === 'LAWYER' && isAlive(u));
          if (lawyerUID) results[lawyerUID] = { type:'client_killed', msg:'의뢰인이 살해당했습니다. 승리 조건 변경: 마피아 전멸.' };
        }
      }
    }
  }

  // ── STEP 5-B: 군인 1회 생존 패시브 ─────────────────────────
  Object.keys(assign).forEach(uid => {
    if (roleOf(uid) !== 'SOLDIER' || assign[uid].alive) return;
    if (gs.soldierShield[uid] || assign[uid].killedBy !== 'mafia') return;
    assign[uid].alive    = true;
    assign[uid].killedBy = undefined; assign[uid].killedDay = undefined;
    gs.soldierShield[uid] = true;
    deadUID = null;
    const attackerUID = Object.keys(actions).find(u => actions[u]?.action === 'kill' && actions[u]?.target1 === uid);
    results[uid] = { type:'soldier_revive', attacker:attackerUID || null, msg:'불굴의 의지로 생존! 공격자 정보를 획득했습니다.' };
  });

  // ── STEP 6: 도박꾼 밤 예측 결과 ────────────────────────────
  // ★ [Q7] 'death' | 'peace' 는 밤에 결과 확인, 'execution' 은 투표 후 확인
  Object.entries(gs.gamblerBetCache).forEach(([uid, prediction]) => {
    if (!isAlive(uid)) return;

    if (prediction === 'death') {
      const success = !!deadUID;
      if (success) {
        gs.gamblerSuccess[uid] = (gs.gamblerSuccess[uid] || 0) + 1;
        const bonus = getGamblerBonus(assign, uid);
        results[uid] = { type:'gambler_win', bonus, msg:'사망 예측 성공!' + (bonus ? ' ' + ROLES[bonus.role].nameKo + ' 정보 획득' : '') };
      } else {
        results[uid] = { type:'gambler_fail', msg:'오늘 밤 사망자 없음 — 예측 실패' };
      }
    }

    if (prediction === 'peace') {
      // ★ [Q7] 평화 예측: 이 밤 사망자 없고 다음 낮 처형도 없어야 성공
      // 밤 결과는 여기서, 낮 처형 없음 확인은 processVote에서 추가 검증
      if (!deadUID) {
        // 조건 반만 충족 — execution 없음 확인은 투표 후
        gs.gamblerBetCache[uid] = 'peace_half'; // 임시 마킹
        results[uid] = { type:'gambler_peace_half', msg:'이 밤 사망 없음. 낮 처형도 없어야 최종 성공.' };
      } else {
        delete gs.gamblerBetCache[uid];
        results[uid] = { type:'gambler_fail', msg:'이 밤 사망 발생 — 평화 예측 실패' };
      }
    }
    // 'execution'은 캐시 유지 → processVote에서 처리
  });

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
//  6. 낮 행동 처리 (무당)
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
    if (roleOf(uid) === 'SHAMAN') {
      const tuid = act.target1;
      if (!assign[tuid] || assign[tuid].alive) {
        results[uid] = { type:'shaman_fail', msg:'살아있는 플레이어는 조회할 수 없습니다.' };
      } else {
        results[uid] = {
          type:'shaman', target:tuid,
          role:assign[tuid].role, nameKo:ROLES[assign[tuid].role].nameKo,
          msg:tuid + '의 직업: ' + ROLES[assign[tuid].role].nameKo,
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

  // ★ [Q1] 첫날 낮(day=2, 첫 번째 낮)은 처형 없음
  const isFirstDay = gs.day === 2;

  const tally = {};
  if (!isFirstDay) {
    Object.entries(votes).forEach(([voter, target]) => {
      if (!isAlive(voter) || !target) return;
      // ★ [Q4] 정치인 2표 — 항상 발동
      const weight = assign[voter]?.role === 'POLITICIAN' ? 2 : 1;
      tally[target] = (tally[target] || 0) + weight;
    });
  }

  let maxVotes = 0, executed = null, isTie = false;
  Object.entries(tally).forEach(([uid, cnt]) => {
    if (cnt > maxVotes)        { maxVotes = cnt; executed = uid; isTie = false; }
    else if (cnt === maxVotes)  { isTie = true; }
  });
  if (isTie || isFirstDay) executed = null;

  const results = {};

  if (executed) {
    // ★ [Q4] 정치인 면제 — 항상 발동 (횟수 제한 없음)
    if (assign[executed]?.role === 'POLITICIAN') {
      results[executed] = { type:'politician_immune', msg:'정치인 면제권 발동 — 처형 면제' };
      executed = null;
    } else {
      assign[executed].alive      = false;
      assign[executed].killedBy   = 'vote';
      assign[executed].executedDay = gs.day - 1;
      results[executed] = { type:'executed', msg:'투표로 처형되었습니다.' };

      if (executed === gs.clientUID && gs.lawyerCondition === 'client_alive') {
        gs.lawyerCondition = 'citizen_lose';
        const lawyerUID = Object.keys(assign).find(u => assign[u].role === 'LAWYER' && isAlive(u));
        if (lawyerUID) results[lawyerUID] = { type:'client_executed', msg:'의뢰인이 처형되었습니다. 승리 조건 변경: 시민 패배 시 승리.' };
      }
    }
  }

  // ◆ 도박꾼 처형/평화 예측 최종 검증
  Object.entries(gs.gamblerBetCache || {}).forEach(([uid, prediction]) => {
    if (!isAlive(uid)) return;

    if (prediction === 'execution') {
      if (executed) {
        gs.gamblerSuccess[uid] = (gs.gamblerSuccess[uid] || 0) + 1;
        const bonus = getGamblerBonus(assign, uid);
        results[uid] = { type:'gambler_win', bonus, msg:'처형 예측 성공!' + (bonus ? ' ' + ROLES[bonus.role].nameKo + ' 정보 획득' : '') };
      } else {
        results[uid] = { type:'gambler_fail', msg:'처형 없음 — 예측 실패' };
      }
    }

    // ★ [Q7] 평화 예측: 밤 사망 없음(peace_half) + 낮 처형 없음 → 최종 성공
    if (prediction === 'peace_half') {
      if (!executed) {
        gs.gamblerSuccess[uid] = (gs.gamblerSuccess[uid] || 0) + 1;
        const bonus = getGamblerBonus(assign, uid);
        results[uid] = { type:'gambler_win', bonus, msg:'평화 예측 성공! 이 라운드 사망자 없음.' + (bonus ? ' ' + ROLES[bonus.role].nameKo + ' 정보 획득' : '') };
      } else {
        results[uid] = { type:'gambler_fail', msg:'처형 발생 — 평화 예측 실패' };
      }
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
//  8. 승리 조건 판정
// ────────────────────────────────────────────────────────────
function checkWinCondition(gs) {
  const assign       = gs.assignments;
  const aliveList    = Object.keys(assign).filter(uid => assign[uid]?.alive);
  const aliveMafia   = aliveList.filter(uid => assign[uid].team === 'mafia').length;
  const aliveCitizen = aliveList.filter(uid => assign[uid].team === 'citizen').length;
  const aliveNeutral = aliveList.filter(uid => assign[uid].team === 'neutral').length;

  const mafiaWins = aliveCitizen === 0 || (aliveMafia > 0 && aliveMafia >= aliveCitizen + aliveNeutral);

  if (mafiaWins) {
    const reason    = aliveCitizen === 0 ? '시민 진영 전멸' : '마피아 수 우세';
    return { winner:'mafia', reason, lawyerWin:resolveLawyerWin(gs,'mafia_wins'), gamblerWin:resolveGamblerWin(gs) };
  }
  if (aliveMafia === 0) {
    return { winner:'citizen', reason:'마피아 진영 전멸', lawyerWin:resolveLawyerWin(gs,'citizen_wins'), gamblerWin:resolveGamblerWin(gs) };
  }
  return null;
}

// ── 변호사 개인 승리 ─────────────────────────────────────────
function resolveLawyerWin(gs, gameOutcome) {
  if (!gs.clientUID || !gs.lawyerCondition) return null;
  const assign    = gs.assignments;
  const lawyerUID = Object.keys(assign).find(uid => assign[uid].role === 'LAWYER');
  if (!lawyerUID || !assign[lawyerUID]?.alive) return null;
  const cond = gs.lawyerCondition;
  // CASE 1: 의뢰인 생존 (어느 진영이 이기든)
  if (cond === 'client_alive' && assign[gs.clientUID]?.alive)
    return { uid:lawyerUID, reason:'의뢰인 생존 — 변호사 개인 승리' };
  // CASE 2: ★[Q5] 의뢰인 사라짐(살해 or 포섭) → 마피아 전멸 시 승리
  if (cond === 'mafia_dead' && gameOutcome === 'citizen_wins')
    return { uid:lawyerUID, reason:'의뢰인의 복수 달성 — 변호사 개인 승리' };
  // CASE 3: 의뢰인 투표 처형 → 시민 패배 시 승리
  if (cond === 'citizen_lose' && gameOutcome === 'mafia_wins')
    return { uid:lawyerUID, reason:'의뢰인 처형의 대가 — 변호사 개인 승리' };
  return null;
}

// ── 도박꾼 최종 승리 ─────────────────────────────────────────
function resolveGamblerWin(gs) {
  const assign  = gs.assignments;
  const winners = Object.keys(assign).filter(uid => {
    if (assign[uid].role !== 'GAMBLER' || !assign[uid].alive) return false;
    return (gs.gamblerSuccess?.[uid] || 0) >= 3;
  }).map(uid => ({ uid, successes:gs.gamblerSuccess[uid], reason:'예측 ' + gs.gamblerSuccess[uid] + '회 성공 — 도박꾼 개인 승리' }));
  return winners.length ? winners : null;
}

// ────────────────────────────────────────────────────────────
//  9. 방장 자동 이전 (Q9)
// ────────────────────────────────────────────────────────────
// Firebase 클라이언트에서 주기적으로 호출
async function checkHostTransfer(db, roomId) {
  const snap = await db.ref('rooms/' + roomId).get();
  if (!snap.exists()) return;
  const room = snap.val();
  if (room.status !== 'playing' && room.status !== 'waiting') return;

  const players = Object.values(room.players || {});
  const host    = players.find(p => p.uid === room.host);

  // 방장이 오프라인이면
  if (!host || host.online === false) {
    const now = Date.now();
    if (!room.hostOfflineSince) {
      // 오프라인 시작 기록
      await db.ref('rooms/' + roomId + '/hostOfflineSince').set(now);
      return;
    }
    // 90초 경과 시 자동 이전
    if (now - room.hostOfflineSince >= 90000) {
      const nextHost = players
        .filter(p => p.online !== false && p.uid !== room.host)
        .sort((a, b) => a.joinedAt - b.joinedAt)[0];
      if (nextHost) {
        await db.ref('rooms/' + roomId).update({
          host: nextHost.uid,
          hostOfflineSince: null,
        });
        await db.ref('rooms/' + roomId + '/players/' + nextHost.uid + '/isHost').set(true);
        await db.ref('rooms/' + roomId + '/players/' + room.host + '/isHost').set(false);
      }
    }
  } else {
    // 방장 온라인이면 오프라인 타이머 초기화
    if (room.hostOfflineSince) {
      await db.ref('rooms/' + roomId + '/hostOfflineSince').set(null);
    }
  }
}

// ────────────────────────────────────────────────────────────
//  10. 채팅 헬퍼 (Q10 — 유령 채팅)
// ────────────────────────────────────────────────────────────
// channel: 'main'  → 생존자 전용 (사망자 발신/수신 불가)
// channel: 'ghost' → 사망자 + 관전자 전용 (생존자는 볼 수 없음)
// channel: 'mafia' → 마피아 진영 비밀 채팅 (밤 페이즈 한정)
const ChatChannel = {
  // 메시지 전송
  async send(db, roomId, uid, nickname, text, channel) {
    const ref = db.ref('chats/' + roomId).push();
    await ref.set({
      uid, nickname, text, channel,
      timestamp: Date.now(),
    });
  },

  // 채널별 메시지 구독
  // visibleChannels: 해당 플레이어가 볼 수 있는 채널 배열
  subscribe(db, roomId, visibleChannels, callback) {
    return db.ref('chats/' + roomId)
      .orderByChild('timestamp')
      .limitToLast(200)
      .on('value', snap => {
        const messages = [];
        snap.forEach(child => {
          const msg = child.val();
          if (visibleChannels.includes(msg.channel)) {
            messages.push({ id:child.key, ...msg });
          }
        });
        callback(messages);
      });
  },

  // 플레이어 상태에 따른 접근 가능 채널 결정
  getVisibleChannels(playerInfo, phase) {
    const channels = [];
    if (playerInfo.alive) {
      channels.push('main');
      if (playerInfo.team === 'mafia' && phase === 'night') channels.push('mafia');
    } else {
      // ★ [Q10] 사망자는 main 채팅 불가, ghost 채팅만 가능
      channels.push('ghost');
    }
    return channels;
  },

  // 발신 가능 채널 결정
  getSendableChannels(playerInfo, phase) {
    if (!playerInfo.alive) return ['ghost']; // 사망자는 ghost에만 발신
    const channels = ['main'];
    if (playerInfo.team === 'mafia' && phase === 'night') channels.push('mafia');
    return channels;
  },
};

// ────────────────────────────────────────────────────────────
//  11. Firebase 연동 헬퍼
// ────────────────────────────────────────────────────────────
const GameDB = {
  async startGame(db, roomId) {
    const snap = await db.ref('rooms/' + roomId).get();
    const gs   = createGameState(snap.val());
    await db.ref('rooms/' + roomId).update({ status:'playing', gameState:gs });
    // ★ 개별 set() 사용 — multi-location update 경로 충돌 원천 차단
    for (const [uid, info] of Object.entries(gs.assignments)) {
      const roleData = {
        role:   info.role,
        team:   info.team,
        nameKo: ROLES[info.role].nameKo,
      };
      if (info.role === 'LAWYER' && gs.clientUID) {
        roleData.clientUID = gs.clientUID;
      }
      await db.ref('playerRoles/' + roomId + '/' + uid).set(roleData);
    }
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
    if (!snap.exists()) throw new Error('gameState 없음');
    const gs = snap.val();
    if (!gs.phase || gs.phase !== 'night') {
      console.warn('[processNight] 이미 처리됨 or 잘못된 phase:', gs.phase);
      return { gameState: gs, results: {}, deadUID: null };
    }
    const { gameState:newGS, results, deadUID } = processNight(gs);
    await db.ref('rooms/' + roomId + '/gameState').set(newGS);
    // 개인 결과 개별 set (경로 충돌 방지)
    for (const [uid, r] of Object.entries(results)) {
      await db.ref('nightResults/' + roomId + '/' + uid).set(r);
    }
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
//  12. 유틸
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

function getGamblerBonus(assign, gamblerUID) {
  const aliveUIDs = Object.keys(assign).filter(u => assign[u]?.alive && u !== gamblerUID);
  if (!aliveUIDs.length) return null;
  const lucky = aliveUIDs[Math.floor(Math.random() * aliveUIDs.length)];
  return { uid:lucky, role:assign[lucky].role };
}

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

// 전역 노출
window.MafiaEngine = {
  ROLES, ROLE_TABLE,
  assignRoles, createGameState,
  processNight, processDayActions, processVote,
  checkWinCondition, resolveLawyerWin, resolveGamblerWin,
  checkHostTransfer, ChatChannel, GameDB,
};
