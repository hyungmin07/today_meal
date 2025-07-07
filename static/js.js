document.addEventListener("DOMContentLoaded", function () {
  const API_KEY = "8e7a77dab2f34ff9b3f7d6ead4d6e39f";

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

   // ✅ 자동완성 기능 (부분일치 포함)
  $("#search-input").on("input", function () {
    const keyword = $(this).val().trim();
    if (!keyword) return;

    const apiUrl = `https://open.neis.go.kr/hub/schoolInfo?KEY=${API_KEY}&Type=json&SCHUL_NM=${keyword}`;

    $.getJSON(apiUrl, function (data) {
      if (!data.schoolInfo || !data.schoolInfo[1]?.row) return;

      const schoolList = data.schoolInfo[1].row;

      // 🔍 부분 일치 필터링 (대소문자 무시)
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
          method: function (value, item) {
            return `${item.SCHUL_NM} - <span style="font-size:0.8em;color:#aaa">${item.SD_SCHUL_CODE}</span>`;
          }
        }
      };

      // 기존 자동완성 제거 후 다시 적용
      $("#search-input").parent().find(".easy-autocomplete-container").remove();
      $("#search-input").off("input");
      $("#search-input").easyAutocomplete(options);
    });
  });

});
