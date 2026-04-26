// ============================================================
//  🔥 FIREBASE CONFIG — 여기에 본인 Firebase 설정값을 넣으세요
//  Firebase Console → 프로젝트 설정 → 내 앱 → SDK 설정에서 복사
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAi-2orfjazSaGlJZP74TAIp0Xx8b9B6uI",
  authDomain: "mafia-protocol.firebaseapp.com",
  databaseURL: "https://mafia-protocol-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "mafia-protocol",
  storageBucket: "mafia-protocol.firebasestorage.app",
  messagingSenderId: "599380720036",
  appId: "1:599380720036:web:3ca7966ea71caa048ca931"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

export { db };
