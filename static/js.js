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

  // 🔍 자동완성 검색
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

  // 🔼 키보드 이동 처리
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

  // blur 시 자동완성 닫기
  searchInput.addEventListener("blur", function () {
    setTimeout(closeAllSuggestions, 150);
  });

  // 검색 버튼 클릭 시
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
    searchResults.innerHTML = `
      <p><strong>${school.SCHUL_NM}</strong></p>
      <p>설립 구분: ${school.FOND_SC_NM}</p>
      <p>학교 유형: ${school.HS_SC_NM || "정보 없음"}</p>
      <p><a href="${school.HMPG_ADRES || "#"}" target="_blank">홈페이지</a></p>
    `;

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
});
