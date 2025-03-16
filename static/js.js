document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");
    const searchResults = document.getElementById("search-results");
    const API_KEY = "8e7a77dab2f34ff9b3f7d6ead4d6e39f"; // NEIS API 키

    // 🔹 자동완성 기능 추가
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

        // NEIS API를 사용해 학교 목록 검색
        fetch(`https://open.neis.go.kr/hub/schoolInfo?KEY=${API_KEY}&Type=json&SCHUL_NM=${query}`)
            .then(response => response.json())
            .then(data => {
                suggestionsContainer.innerHTML = "";
                if (!data.schoolInfo) return;

                suggestionsContainer.style.display = "block"; // 자동완성 목록 표시
                data.schoolInfo[1].row.forEach(school => {
                    const suggestion = document.createElement("div");
                    suggestion.classList.add("autocomplete-item");
                    suggestion.textContent = school.SCHUL_NM;
                    suggestion.addEventListener("click", function () {
                        searchInput.value = school.SCHUL_NM;
                        suggestionsContainer.innerHTML = "";
                        suggestionsContainer.style.display = "none"; // 자동완성 목록 숨기기
                        showSchoolInfo(school);
                    });
                    suggestionsContainer.appendChild(suggestion);
                });
            })
            .catch(error => console.error("자동완성 오류 발생: ", error));
    });

    // 🔹 입력 필드 포커스 해제 시 자동완성 목록 숨기기
    searchInput.addEventListener("blur", function () {
        setTimeout(() => {
            suggestionsContainer.style.display = "none";
        }, 200); // 클릭 이벤트가 먼저 실행될 수 있도록 딜레이 추가
    });

    // 🔹 검색 버튼 클릭 시 검색 결과 표시
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

                const school = data.schoolInfo[1].row[0]; // 첫 번째 검색 결과 사용
                showSchoolInfo(school);
            })
            .catch(error => console.error("검색 오류 발생: ", error));
    });

    // 🔹 학교 정보 표시 함수
    function showSchoolInfo(school) {
        searchResults.innerHTML = `
            <p><strong>${school.SCHUL_NM}</strong></p>
            <p>설립 구분: ${school.FOND_SC_NM}</p>
            <p>학교 유형: ${school.HS_SC_NM || "정보 없음"}</p>
            <p><a href="${school.HMPG_ADRES || "#"}" target="_blank">홈페이지</a></p>
            <p>날짜를 입력하세요</p>
            <input type="date" id="meal-date">
            <button id="meal-button">급식 메뉴 확인</button>
            <div id="meal-menu"></div>
        `;

        document.getElementById("meal-button").addEventListener("click", function () {
            const selectedDate = document.getElementById("meal-date").value;
            if (!selectedDate) {
                alert("날짜를 입력하세요!");
                return;
            }
            fetchMeal(school.SD_SCHUL_CODE, school.ATPT_OFCDC_SC_CODE, selectedDate);
        });
    }

    // 🔹 급식 정보 가져오기 함수 (NEIS API 사용)
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
