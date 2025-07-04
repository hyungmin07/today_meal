document.addEventListener("DOMContentLoaded", function () {
  // ✅ 햄버거 메뉴 열기/닫기
  const hamburger = document.getElementById("hamburger");
  const menu = document.getElementById("menu");

  if (hamburger && menu) {
    hamburger.addEventListener("click", (e) => {
      e.stopPropagation();
      const isVisible = menu.style.display === "flex";
      menu.style.display = isVisible ? "none" : "flex";
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
        menu.style.display = "none";
      }
    });
  }

  // ✅ 급식 검색 기능
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");
  const searchResults = document.getElementById("search-results");
  const mealSection = document.getElementById("meal-section");
  const API_KEY = "8e7a77dab2f34ff9b3f7d6ead4d6e39f";

  if (!searchInput || !searchButton || !searchResults || !mealSection) return;

  let currentFocus = -1;
  const suggestionsContainer = document.createElement("div");
  suggestionsContainer.classList.add("autocomplete-suggestions");
  searchInput.parentNode.appendChild(suggestionsContainer);

  mealSection.classList.add("hidden");

  searchInput.addEventListener("input", function () {
    const query = searchInput.value.trim();
    if (query.length === 0) {
      closeAllSuggestions();
      return;
    }

    fetch(`https://open.neis.go.kr/hub/schoolInfo?KEY=${API_KEY}&Type=json&SCHUL_NM=${query}`)
      .then(response => response.json())
      .then(data => {
        closeAllSuggestions();
        if (!data.schoolInfo) return;
        const rows = data.schoolInfo[1].row.slice(0, 5);

        rows.forEach((school) => {
          const suggestion = document.createElement("div");
          suggestion.classList.add("autocomplete-item");
          suggestion.textContent = school.SCHUL_NM;
          suggestion.addEventListener("mousedown", function (e) {
            e.preventDefault();
            searchInput.value = school.SCHUL_NM;
            closeAllSuggestions();
            showSchoolInfo(school);
          });
          suggestionsContainer.appendChild(suggestion);
        });
      })
      .catch(error => console.error("자동완성 오류 발생: ", error));
  });

  searchInput.addEventListener("keydown", function (e) {
    const items = suggestionsContainer.getElementsByClassName("autocomplete-item");
    if (e.key === "ArrowDown") {
      currentFocus++;
      addActive(items);
    } else if (e.key === "ArrowUp") {
      currentFocus--;
      addActive(items);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentFocus > -1 && items[currentFocus]) {
        items[currentFocus].click();
      }
    }
  });

  function addActive(items) {
    if (!items) return;
    removeActive(items);
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = items.length - 1;
    items[currentFocus].classList.add("autocomplete-active");
  }

  function removeActive(items) {
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove("autocomplete-active");
    }
  }

  function closeAllSuggestions() {
    suggestionsContainer.innerHTML = "";
    currentFocus = -1;
  }

  searchInput.addEventListener("blur", function () {
    setTimeout(closeAllSuggestions, 150);
  });

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

        const meals = data.mealServiceDietInfo[1].row[0].DDISH_NM.replace(/<br\/>/g, "<br>");
        mealMenu.innerHTML = `<h3>${date} 급식 정보</h3><p>${meals}</p>`;
      })
      .catch(error => console.error("급식 정보 조회 오류: ", error));
  }

  // ✅ 인기 급식 기능 (수정됨)
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

  const popularDiv = document.getElementById("popular-meal-info");

  async function loadPopularMeal() {
    const votesSnapshot = await db.collection("votes").get();
    let topDoc = null;
    let maxVotes = 0;

    for (const doc of votesSnapshot.docs) {
      const userVotes = await db.collection("votes").doc(doc.id).collection("users").get();
      const count = userVotes.size;

      if (count > maxVotes) {
        maxVotes = count;
        topDoc = doc.id;
      }
    }

    if (!topDoc) {
      popularDiv.innerHTML = "<p>아직 인기 급식이 없습니다.</p>";
      return;
    }

    const [schoolName, date] = topDoc.split("_");
    const mealDate = date.replace(/-/g, "");

    // ✅ Firestore에서 직접 schoolCode, eduOfficeCode 읽기
    const voteDoc = await db.collection("votes").doc(topDoc).get();
    if (!voteDoc.exists) {
      popularDiv.innerHTML = "<p>급식 데이터를 찾을 수 없습니다.</p>";
      return;
    }

    const { schoolCode, eduOfficeCode } = voteDoc.data();

    const mealRes = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${API_KEY}&Type=json&ATPT_OFCDC_SC_CODE=${eduOfficeCode}&SD_SCHUL_CODE=${schoolCode}&MLSV_YMD=${mealDate}`);
    const mealData = await mealRes.json();

    if (!mealData.mealServiceDietInfo || mealData.mealServiceDietInfo.length < 2) {
      popularDiv.innerHTML = `<p>${schoolName}의 ${date} 급식 정보가 없습니다.</p>`;
      return;
    }

    const menu = mealData.mealServiceDietInfo[1].row[0].DDISH_NM.replace(/<br\/>/g, "<br>");
    popularDiv.innerHTML = `
      <h3>${schoolName} (${date})</h3>
      <div class="meal-card" style="margin-top:10px;">
        <p>${menu}</p>
        <p style="color: #5c6bc0; font-weight: bold;">❤️ ${maxVotes}표</p>
      </div>
    `;
  }

  loadPopularMeal();
});
