# 🕵️ MAFIA // PROTOCOL — 설치 가이드

## Phase 1: Firebase 세팅 (5분)

### Step 1 — Firebase 프로젝트 생성
1. https://console.firebase.google.com 접속
2. **[프로젝트 추가]** 클릭
3. 프로젝트 이름: `mafia-protocol` (자유롭게)
4. Google Analytics: 비활성화해도 OK → **[프로젝트 만들기]**

### Step 2 — 웹 앱 등록
1. 프로젝트 홈에서 **`</>`** (웹) 아이콘 클릭
2. 앱 닉네임 입력 (예: `mafia-web`)
3. Firebase Hosting 체크 ✅
4. **[앱 등록]** → SDK 설정 코드 복사

### Step 3 — Realtime Database 활성화
1. 왼쪽 메뉴 → **[빌드]** → **[Realtime Database]**
2. **[데이터베이스 만들기]**
3. 위치: `asia-southeast1` (싱가포르, 한국에서 가장 빠름)
4. 보안 규칙: **테스트 모드** 선택 (개발 중에는 이걸로)

### Step 4 — 보안 규칙 설정 (Realtime Database → 규칙 탭)
```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```
> 프로덕션 배포 시에는 규칙을 강화해야 합니다.

### Step 5 — firebase-config.js 수정
`firebase-config.js` 파일을 열어서 아래 값을 본인 것으로 교체:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",           // Firebase Console에서 복사
  authDomain: "mafia-xxx.firebaseapp.com",
  databaseURL: "https://mafia-xxx-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mafia-xxx",
  storageBucket: "mafia-xxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc..."
};
```

---

## 파일 구조

```
mafia-game/
├── lobby.html          ← 로비 (현재 완성)
├── game.html           ← 메인 게임 UI (Phase 3에서 제작)
├── firebase-config.js  ← Firebase 설정값
└── README.md           ← 이 파일
```

---

## 로컬 실행 방법

**⚠️ 중요:** `file://` 로 직접 열면 Firebase 연결이 안 됩니다.  
반드시 로컬 서버로 실행하세요.

```bash
# VS Code의 Live Server 확장 설치 후 lobby.html에서 우클릭 → Open with Live Server

# 또는 Python이 있다면:
python -m http.server 8080
# → http://localhost:8080/lobby.html 접속
```

---

## Firebase Hosting 배포 (선택)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## 개발 로드맵

- [x] **Phase 1** — Firebase 세팅 + 로비 (방 만들기/입장/대기실)
- [ ] **Phase 2** — 게임 로직 엔진 (직업 배분, 밤 처리 원자적 단계)
- [ ] **Phase 3** — 메인 게임 UI (사이버펑크 HUD, 채팅, 투표)
- [ ] **Phase 4** — 스킬 이펙트 + 사운드 (Howler.js)
- [ ] **Phase 5** — 모바일 최적화 + AI 봇 + 튕김 방지
