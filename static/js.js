document.addEventListener("DOMContentLoaded", function () {
  const API_KEY = "8e7a77dab2f34ff9b3f7d6ead4d6e39f";

  // ✅ Firebase 초기화
  const firebaseConfig = {
    apiKey: "AIzaSyC03AFLg_KQpTMANt5b6hfPj3pEBjo8SBs",
    authDomain: "todaymeal-1e714.firebaseapp.com",
    projectId: "todaymeal-1e714",
    storageBucket: "todaymeal-1e714.appspot.com",
    messagingSenderId: "815968093910",
    appId: "1:815968093910:web:015a59857e22478230ab77"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // 사이드바
  const hamburger = document.getElementById("hamburger");
  const menu = document.getElementById("menu");

  if (hamburger && menu) {
    hamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("open");
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
        menu.classList.remove("open");
      }
    });
  }



  // ✅ 급식 검색 기능
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const searchResults = document.getElementById("search-results");
  const mealSection = document.getElementById("meal-section");

  if (!searchInput || !searchButton || !searchResults || !mealSection) return;

  mealSection.classList.add("hidden");

  searchButton.addEventListener("click", function () {
    const query = searchInput.value.trim();
    if (!query) {
      alert("학교 이름을 입력하세요.");
      return;
    }

    fetch(`https://open.neis.go.kr/hub/schoolInfo?KEY=${API_KEY}&Type=json&SCHUL_NM=${query}`)
      .then(response => response.json())
      .then(data => {
        searchResults.innerHTML = "";
        searchResults.style.display = "block";

        if (!data.schoolInfo || !data.schoolInfo[1]?.row?.length) {
          searchResults.innerHTML = "<p>검색 결과가 없습니다.</p>";
          return;
        }

        const school = data.schoolInfo[1].row[0];
        showSchoolInfo(school);
        mealSection.classList.remove("hidden");
      })
      .catch(error => console.error("검색 오류 발생: ", error));
  });

  function showSchoolInfo(school) {
    searchResults.innerHTML = "";
    mealSection.classList.remove("hidden");

    setTimeout(() => {
      const mealButton = document.getElementById("meal-button");
      if (mealButton) {
        mealButton.addEventListener("click", function () {
          const selectedDate = document.getElementById("meal-date").value;
          if (!selectedDate) {
            alert("날짜를 입력하세요!");
            return;
          }
          fetchMeal(school.SD_SCHUL_CODE, school.ATPT_OFCDC_SC_CODE, selectedDate);
        });
      }
    }, 300);
  }

  function fetchMeal(schoolCode, eduOfficeCode, date) {
    const mealApiUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${eduOfficeCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${date.replace(/-/g, "")}`;

    fetch(mealApiUrl)
      .then(response => response.json())
      .then(data => {
        const mealMenu = document.getElementById("meal-menu");
        mealMenu.innerHTML = "";

        if (!data.mealServiceDietInfo || data.mealServiceDietInfo.length < 2) {
          mealMenu.innerHTML = "<p>급식 정보가 없습니다.</p>";
          return;
        }

        const meals = data.mealServiceDietInfo[1].row[0].DDISH_NM.replace(/<br\/?>/g, "<br>");
        mealMenu.innerHTML = `<h3>${date} 급식 정보</h3><p>${meals}</p>`;
      })
      .catch(error => console.error("급식 정보 조회 오류: ", error));
  }

  // ✅ 오늘의 인기 급식 불러오기
  async function loadPopularMeal() {
    const popularDiv = document.getElementById("popular-meal-info");

    const today = new Date();
    const yyyyMMdd = today.toISOString().split("T")[0];
    const dayOfWeek = today.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      popularDiv.innerHTML = "<p>오늘은 주말입니다!</p>";
      return;
    }

    const votesSnapshot = await db.collection("votes").get();
    let topDoc = null;
    let maxVotes = 0;

    for (const doc of votesSnapshot.docs) {
      if (!doc.id.endsWith(`_${yyyyMMdd}`)) continue;

      const userVotes = await db.collection("votes").doc(doc.id).collection("users").get();
      const count = userVotes.size;

      if (count > maxVotes) {
        maxVotes = count;
        topDoc = doc.id;
      }
    }

    if (!topDoc) {
      popularDiv.innerHTML = `<p>아직 ${yyyyMMdd}의 인기 급식 투표가 없습니다.</p>`;
      return;
    }

    const [schoolName, date] = topDoc.split("_");
    const voteDoc = await db.collection("votes").doc(topDoc).get();
    if (!voteDoc.exists) {
      popularDiv.innerHTML = "<p>급식 데이터를 찾을 수 없습니다.</p>";
      return;
    }

    const { schoolCode, eduOfficeCode } = voteDoc.data();
    const mealDate = yyyyMMdd.replace(/-/g, "");

    const mealRes = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${eduOfficeCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${mealDate}`);
    const mealData = await mealRes.json();

    if (!mealData.mealServiceDietInfo || mealData.mealServiceDietInfo.length < 2) {
      popularDiv.innerHTML = `<p>${schoolName}의 ${date} 급식 정보가 없습니다.</p>`;
      return;
    }

    const menu = mealData.mealServiceDietInfo[1].row[0].DDISH_NM.replace(/<br\/?>/g, "<br>");
    popularDiv.innerHTML = `
      <h3>${schoolName} (${date})</h3>
      <div class="meal-card" style="margin-top:10px;">
        <p>${menu}</p>
        <p style="color: #5c6bc0; font-weight: bold;">❤️ ${maxVotes}표</p>
      </div>
    `;
  }

  // ✅ 자동완성 기능
  $("#search-input").on("input", function () {
    const keyword = $(this).val().trim();
    if (!keyword) return;

    const apiUrl = `https://open.neis.go.kr/hub/schoolInfo?KEY=${API_KEY}&Type=json&SCHUL_NM=${keyword}`;

    $.getJSON(apiUrl, function (data) {
      if (!data.schoolInfo || !data.schoolInfo[1]?.row) return;

      const schoolList = data.schoolInfo[1].row;
      const filtered = schoolList.filter(s =>
        s.SCHUL_NM.toLowerCase().includes(keyword.toLowerCase())
      );

      const options = {
        data: filtered,
        getValue: "SCHUL_NM",
        list: {
          maxNumberOfElements: 5,
          match: { enabled: true },
          onChooseEvent: function () {
            const selected = $("#search-input").getSelectedItemData();
            if (selected) {
              $("#search-input").val(selected.SCHUL_NM);
              document.getElementById("search-button").click();
            }
          }
        },
   template: {
  type: "custom",
  method: function(value, item) {
    return item.SCHUL_NM;
  }
}

      };

      $("#search-input").parent().find(".easy-autocomplete-container").remove();
      $("#search-input").off("input");
      $("#search-input").easyAutocomplete(options);
    });
  });

  // ✅ 오늘의 인기 급식 출력 실행
  loadPopularMeal();

firebase.auth().onAuthStateChanged(async (user) => {
  if (!user) return;

  const today = new Date().toISOString().slice(0, 10);
  const mealMenuDiv = document.getElementById("meal-menu");
  const mealSection = document.getElementById("meal-section");
  const loginRequired = document.getElementById("login-required");
  const searchInput = document.getElementById("search-input");
  const mealDate = document.getElementById("meal-date");
const manualCheck = document.getElementById("manual-check");
if (manualCheck) manualCheck.style.display = "none";


  try {
    const doc = await db.collection("users").doc(user.uid).get();
    if (!doc.exists) return;

    const schoolInfo = doc.data().schoolInfo;
    if (!schoolInfo) {
      mealMenuDiv.innerHTML = "<p>학교 정보가 없습니다. 마이페이지에서 학교를 먼저 설정해주세요.</p>";
      return;
    }

    const schoolName = schoolInfo.SCHUL_NM;
    const schoolCode = schoolInfo.SD_SCHUL_CODE;
    const eduOfficeCode = schoolInfo.ATPT_OFCDC_SC_CODE;

    // 🔒 검색창 숨기고 급식 섹션 보이기
    if (loginRequired) loginRequired.style.display = "none";
    mealSection.classList.remove("hidden");

    // 🔽 오늘 날짜 설정 + 자동 급식 출력
    if (mealDate) mealDate.value = today;
    if (searchInput) searchInput.value = schoolName;
    fetchMeal(schoolCode, eduOfficeCode, today);
  } catch (error) {
    console.error("자동 급식 표시 오류:", error);
  }
});






//문서 끝 이 아래수정 금지//
});
