document.addEventListener("DOMContentLoaded", function () {
  // ✅ Firebase 설정 및 초기화
  const firebaseConfig = {
    apiKey: "AIzaSyC03AFLg_KQpTMANt5b6hfPj3pEBjo8SBs",
    authDomain: "todaymeal-1e714.firebaseapp.com",
    projectId: "todaymeal-1e714",
    storageBucket: "todaymeal-1e714.firebasestorage.app",
    messagingSenderId: "815968093910",
    appId: "1:815968093910:web:015a59857e22478230ab77"
    
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const db = firebase.firestore();

  // ✅ 햄버거 메뉴 열기/닫기
  const hamburger = document.getElementById("hamburger");
  const menu = document.getElementById("menu");

  if (hamburger && menu) {
    hamburger.addEventListener("click", () => {
      menu.style.display = menu.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", (e) => {
      if (!hamburger.contains(e.target) && !menu.contains(e.target)) {
        menu.style.display = "none";
      }
    });
  }

  // ✅ DOM 요소 준비
  const searchInput = document.getElementById("search-input");
  const schoolInfoDiv = document.getElementById("school-info");
  const mealSection = document.getElementById("meal-section");
  const mealMenu = document.getElementById("meal-menu");
  const voteButton = document.getElementById("vote-button");
  const voteMessage = document.getElementById("vote-message");

  const API_KEY = "8e7a77dab2f34ff9b3f7d6ead4d6e39f";
  let selectedSchool = null;

  // ✅ 자동완성
  searchInput.addEventListener("input", function () {
    const query = searchInput.value.trim();
    const suggestionsDiv = document.querySelector(".autocomplete-suggestions");
    suggestionsDiv.innerHTML = "";
    suggestionsDiv.style.display = "none";

    if (query.length === 0) return;

    fetch(`https://open.neis.go.kr/hub/schoolInfo?KEY=${API_KEY}&Type=json&SCHUL_NM=${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.schoolInfo || !data.schoolInfo[1]) return;
        const rows = data.schoolInfo[1].row;

        rows.forEach((school) => {
          const div = document.createElement("div");
          div.classList.add("autocomplete-item");
          div.textContent = school.SCHUL_NM;
          div.addEventListener("mousedown", () => {
            searchInput.value = school.SCHUL_NM;
            selectedSchool = school;
            showSchoolInfo(school);
            fetchTodayMeal(school);
          });
          suggestionsDiv.appendChild(div);
        });

        suggestionsDiv.style.display = "block";
      });
  });

  // ✅ 학교 정보 표시
  function showSchoolInfo(school) {
    schoolInfoDiv.innerHTML = `
      <p><strong>${school.SCHUL_NM}</strong></p>
      <p>설립: ${school.FOND_SC_NM} / 유형: ${school.HS_SC_NM || "정보 없음"}</p>
    `;
  }

  // ✅ 오늘 급식 불러오기
  function fetchTodayMeal(school) {
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${school.ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${school.SD_SCHUL_CODE}&MLSV_YMD=${today}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!data.mealServiceDietInfo || data.mealServiceDietInfo.length < 2) {
          mealMenu.innerHTML = "<p>급식 정보가 없습니다.</p>";
        } else {
          const meals = data.mealServiceDietInfo[1].row[0].DDISH_NM.replace(/<br\/>/g, "<br>");
          mealMenu.innerHTML = `<p>${meals}</p>`;
        }

        mealSection.classList.remove("hidden");
      });
  }

  // ✅ 하트 투표
  voteButton.addEventListener("click", () => {
    const user = firebase.auth().currentUser;

    if (!user) {
      alert("로그인이 필요합니다!");
      return;
    }

    if (!selectedSchool) {
      alert("먼저 학교를 검색하세요.");
      return;
    }

    const userId = user.uid;
    const today = new Date().toISOString().split("T")[0];
    const docId = `${userId}_${selectedSchool.SD_SCHUL_CODE}_${today}`;

    const voteRef = db.collection("votes").doc(docId);

    voteRef.get().then((doc) => {
      if (doc.exists) {
        voteMessage.innerText = "❌ 이미 오늘 투표하셨습니다!";
        voteMessage.style.color = "red";
      } else {
        voteRef.set({
          userId: userId,
          schoolName: selectedSchool.SCHUL_NM,
          schoolCode: selectedSchool.SD_SCHUL_CODE,
          eduCode: selectedSchool.ATPT_OFCDC_SC_CODE,
          date: today,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        }).then(() => {
          voteMessage.innerText = "✅ 투표가 완료되었습니다!";
          voteMessage.style.color = "green";
        });
      }
    });
  });
});
