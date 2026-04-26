// ============================================================
//  🔥 FIREBASE CONFIG — 여기에 본인 Firebase 설정값을 넣으세요
//  Firebase Console → 프로젝트 설정 → 내 앱 → SDK 설정에서 복사
// ============================================================
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_PROJECT.firebaseapp.com",
  databaseURL:       "https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId:             "YOUR_APP_ID"
};

// Firebase 초기화 (중복 초기화 방지)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// ★ 전역 변수로 노출 — export 없이 window.db 로 어디서든 접근
window.db = firebase.database();
