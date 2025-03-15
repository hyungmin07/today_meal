document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-input");
    const searchButton = document.getElementById("search-button");
    const searchResults = document.getElementById("search-results");
    
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

        fetch("http://127.0.0.1:5500/search_school?query=" + query)
            .then(response => response.json())
            .then(data => {
                suggestionsContainer.innerHTML = "";
                if (data.length === 0) return;

                suggestionsContainer.style.display = "block"; // 자동완성 목록 표시
                data.forEach(school => {
                    const suggestion = document.createElement("div");
                    suggestion.classList.add("autocomplete-item");
                    suggestion.textContent = school["학교명"];
                    suggestion.addEventListener("click", function () {
                        searchInput.value = school["학교명"];
                        suggestionsContainer.innerHTML = "";
                        suggestionsContainer.style.display = "none"; // 자동완성 목록 숨기기
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

        fetch("http://127.0.0.1:5500/search_school?query=" + query)
            .then(response => {
                if (!response.ok) {
                    throw new Error("서버 오류: " + response.status);
                }
                return response.json();
            })
            .then(data => {
                searchResults.innerHTML = "";
                searchResults.style.display = "block";

                if (data.length === 0) {
                    searchResults.innerHTML = "<p>검색 결과가 없습니다.</p>";
                    return;
                }

                const school = data[0];
                searchResults.innerHTML = `
                    <p><strong>${school["학교명"]}</strong></p>
                    <p>설립 구분: ${school["설립 구분"]}</p>
                    <p>학교 유형: ${school["학교 유형"]}</p>
                    <p><a href="${school["홈페이지"]}" target="_blank">홈페이지</a></p>
                    <input type="date" id="meal-date">
                    <button id="meal-button">급식 메뉴 확인</button>
                    <div id="meal-menu"></div>
                `;

                document.getElementById("meal-button").addEventListener("click", function () {
                    fetchMeal(school["학교코드"], school["교육청코드"]);
                });
            })
            .catch(error => console.error("검색 오류 발생: ", error));
    });

    // 🔹 급식 정보 가져오기 함수
    function fetchMeal(schoolCode, eduOfficeCode) {
        const dateInput = document.getElementById("meal-date");
        const date = dateInput.value.replace(/-/g, "");

        if (!date) {
            alert("날짜를 선택하세요.");
            return;
        }

        fetch(`http://127.0.0.1:5500/get_meal?school_code=${schoolCode}&edu_office_code=${eduOfficeCode}&date=${date}`)
            .then(response => response.json())
            .then(data => {
                const mealMenu = document.getElementById("meal-menu");
                mealMenu.innerHTML = "";

                if (data.error) {
                    mealMenu.innerHTML = `<p>${data.error}</p>`;
                    return;
                }

                if (data.mealServiceDietInfo && data.mealServiceDietInfo.length > 1) {
                    const meals = data.mealServiceDietInfo[1]["row"][0]["DDISH_NM"].replace(/<br\/>/g, "<br>");
                    mealMenu.innerHTML = `<h3>${date} 급식 정보</h3><p>${meals}</p>`;
                } else {
                    mealMenu.innerHTML = "<p>급식 정보가 없습니다.</p>";
                }
            })
            .catch(error => console.error("급식 정보 조회 오류: ", error));
    }
});
