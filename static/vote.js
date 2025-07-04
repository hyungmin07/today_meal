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

// ✅ Firebase 관련 설정 및 인증 확인
const today = new Date();
const todayStr = today.toISOString().split('T')[0];
const auth = firebase.auth();
const db = firebase.firestore();
let selectedSchool = null;

auth.onAuthStateChanged(user => {
  if (!user) {
    alert("로그인이 필요합니다. 로그인 페이지로 이동합니다.");
    window.location.href = "auth.html";
  } else {
    const uid = user.uid;
    const voteDocId = uid + "_" + todayStr;
    db.collection("votes").doc(voteDocId).get().then((doc) => {
      if (doc.exists) {
        document.getElementById("vote-message").innerText = "✅ 이미 오늘 투표를 완료했습니다. 하루에 한 번만 투표할 수 있습니다.";
        document.getElementById("vote-message").style.color = "green";
        document.getElementById("vote-button").disabled = true;
      }
    }).catch((error) => {
      console.error("투표 기록 확인 오류:", error);
    });
  }
});

// ✅ 학교 자동완성 기능
const searchInput = document.getElementById("search-input");
const suggestionsEl = document.getElementById("autocomplete-suggestions");
const API_KEY = "8e7a77dab2f34ff9b3f7d6ead4d6e39f";

searchInput.addEventListener("input", () => {
  const query = searchInput.value.trim();
  suggestionsEl.innerHTML = "";
  if (query.length === 0) return;
  fetch(`https://open.neis.go.kr/hub/schoolInfo?KEY=${API_KEY}&Type=json&SCHUL_NM=${query}`)
    .then(res => res.json())
    .then(data => {
      if (!data.schoolInfo) return;
      const rows = data.schoolInfo[1].row.slice(0, 5);
      rows.forEach(school => {
        const item = document.createElement("div");
        item.className = "autocomplete-item";
        item.textContent = school.SCHUL_NM;
        item.addEventListener("mousedown", (e) => {
          e.preventDefault();
          closeSuggestions();
          searchInput.value = school.SCHUL_NM;
          showSchoolInfo(school);
        });
        suggestionsEl.appendChild(item);
      });
    }).catch(err => console.error("자동완성 오류:", err));
});

function closeSuggestions() {
  suggestionsEl.innerHTML = "";
}
sessionStorage.setItem('today', todayStr);
searchInput.addEventListener("blur", () => setTimeout(closeSuggestions, 150));

// ✅ 학교 검색 버튼
const searchButton = document.getElementById("search-button");
searchButton.addEventListener("click", () => {
  const query = searchInput.value.trim();
  if (!query) {
    alert("학교 이름을 입력하세요.");
    return;
  }
  fetch(`https://open.neis.go.kr/hub/schoolInfo?KEY=${API_KEY}&Type=json&SCHUL_NM=${query}`)
    .then(res => res.json())
    .then(data => {
      if (!data.schoolInfo || !data.schoolInfo[1]?.row?.length) {
        document.getElementById("school-info").innerHTML = "<p>검색 결과가 없습니다.</p>";
        return;
      }
      const school = data.schoolInfo[1].row[0];
      showSchoolInfo(school);
    }).catch(err => console.error("학교 검색 오류:", err));
});

// ✅ 학교 선택 시 급식 조회
function showSchoolInfo(school) {
  selectedSchool = {
    name: school.SCHUL_NM,
    code: school.SD_SCHUL_CODE,
    office: school.ATPT_OFCDC_SC_CODE
  };
  const infoEl = document.getElementById("school-info");
  infoEl.innerHTML = `
    <h3>${school.SCHUL_NM}</h3>
    <p>설립구분: ${school.FOND_SC_NM}</p>
    <p>학교 유형: ${school.HS_SC_NM || "정보 없음"}</p>
    <p><a href="${school.HMPG_ADRES || "#"}" target="_blank">학교 홈페이지 바로가기</a></p>
  `;
  fetchMeal(selectedSchool.code, selectedSchool.office, todayStr);
  document.getElementById("meal-section").classList.remove("hidden");
}

function fetchMeal(schoolCode, officeCode, dateStr) {
  const apiURL = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${officeCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${dateStr.replace(/-/g, "")}`;
  fetch(apiURL)
    .then(res => res.json())
    .then(data => {
      const mealMenuEl = document.getElementById("meal-menu");
      mealMenuEl.innerHTML = "";
      if (!data.mealServiceDietInfo || data.mealServiceDietInfo.length < 2) {
        mealMenuEl.innerHTML = `<p>${dateStr} 급식 정보가 없습니다.</p>`;
        selectedSchool.meal = "";
        return;
      }
      const meals = data.mealServiceDietInfo[1].row[0].DDISH_NM.replace(/<br\/>/g, "<br>");
      mealMenuEl.innerHTML = `<h3>${dateStr} 급식 메뉴</h3><p>${meals}</p>`;
      selectedSchool.meal = meals;
    })
    .catch(error => {
      console.error("급식 조회 오류:", error);
      document.getElementById("meal-menu").innerHTML = "<p>급식 정보를 불러오는 중 오류가 발생했습니다.</p>";
    });
}

// ✅ 투표 버튼 이벤트
const voteButton = document.getElementById("vote-button");
voteButton.addEventListener("click", () => {
  const user = auth.currentUser;
  if (!user) {
    alert("로그인이 필요합니다.");
    return;
  }
  if (!selectedSchool || !selectedSchool.code) {
    alert("학교를 선택하고 급식 정보를 확인한 후 투표해주세요.");
    return;
  }
  const uid = user.uid;
  const voteDocId = uid + "_" + todayStr;

  db.collection("votes").doc(voteDocId).get().then(doc => {
    if (doc.exists) {
      alert("이미 오늘 투표하셨습니다!");
    } else {
      const voteData = {
        userId: uid,
        date: todayStr,
        schoolName: selectedSchool.name
      };
      const dailyDocId = todayStr + "_" + selectedSchool.office + "_" + selectedSchool.code;
      db.collection("votes").doc(voteDocId).set(voteData).then(() => {
        db.collection("dailyVotes").doc(dailyDocId).set({
          date: todayStr,
          schoolName: selectedSchool.name,
          meal: selectedSchool.meal || "",
          count: firebase.firestore.FieldValue.increment(1)
        }, { merge: true }).then(() => {
          const msgEl = document.getElementById("vote-message");
          msgEl.innerText = "✅ 투표가 완료되었습니다!";
          msgEl.style.color = "green";
          voteButton.disabled = true;
        });
      });
    }
  }).catch(error => {
    console.error("투표 처리 오류:", error);
    const msgEl = document.getElementById("vote-message");
    msgEl.innerText = "❌ 투표 중 오류가 발생했습니다.";
    msgEl.style.color = "red";
  });
});
