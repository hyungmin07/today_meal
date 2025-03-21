document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");
    const searchResults = document.getElementById("search-results");
    const mealSection = document.getElementById("meal-section");
    const API_KEY = "8e7a77dab2f34ff9b3f7d6ead4d6e39f";

    mealSection.classList.add("hidden");

    const suggestionsContainer = document.createElement("div");
    suggestionsContainer.classList.add("autocomplete-suggestions");
    searchInput.parentNode.appendChild(suggestionsContainer);

    searchInput.addEventListener("input", function () {
        const query = searchInput.value.trim();
        if (query.length === 0) {
            suggestionsContainer.innerHTML = "";
            suggestionsContainer.style.display = "none";
            return;
        }

        fetch(`https://open.neis.go.kr/hub/schoolInfo?KEY=${API_KEY}&Type=json&SCHUL_NM=${query}`)
            .then(response => response.json())
            .then(data => {
                suggestionsContainer.innerHTML = "";
                if (!data.schoolInfo) return;

                suggestionsContainer.style.display = "block";
                data.schoolInfo[1].row.forEach(school => {
                    const suggestion = document.createElement("div");
                    suggestion.classList.add("autocomplete-item");
                    suggestion.textContent = school.SCHUL_NM;

                    suggestion.addEventListener("mousedown", function (e) {
                        e.preventDefault(); // blur 이벤트보다 먼저 실행되도록
                        searchInput.value = school.SCHUL_NM;
                        suggestionsContainer.innerHTML = "";
                        suggestionsContainer.style.display = "none";
                        showSchoolInfo(school);
                    });

                    suggestionsContainer.appendChild(suggestion);
                });
            })
            .catch(error => console.error("자동완성 오류 발생: ", error));
    });

    // blur 시 자동완성 숨기기 (클릭보다 나중에 실행되게 setTimeout 사용)
    searchInput.addEventListener("blur", function () {
        setTimeout(() => {
            suggestionsContainer.innerHTML = "";
            suggestionsContainer.style.display = "none";
        }, 150);
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

                if (!data.schoolInfo) {
                    searchResults.innerHTML = "<p>검색 결과가 없습니다.</p>";
                    return;
                }

                const school = data.schoolInfo[1].row[0];
                showSchoolInfo(school);
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
            } else {
                console.error("meal-button 요소를 찾을 수 없습니다.");
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
