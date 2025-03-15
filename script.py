import requests
import json

# 급식 정보 API URL (실제 API 주소로 변경해야 함)
MEAL_API_URL = "https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE=B10&SD_SCHUL_CODE={}&MLSV_YMD={}"

# 급식 정보 가져오기
def fetch_meal(school_code, date):
    response = requests.get(MEAL_API_URL.format(school_code, date))
    if response.status_code == 200:
        try:
            return response.json()
        except json.JSONDecodeError:
            return {"error": "JSON 데이터 파싱 오류"}
    return {"error": "API 요청 실패"}

if __name__ == "__main__":
    school_code = input("학교 코드를 입력하세요: ")
    date = input("날짜를 입력하세요 (YYYYMMDD 형식): ")
    meal_data = fetch_meal(school_code, date)
    
    if "error" in meal_data:
        print(meal_data["error"])
    else:
        print(json.dumps(meal_data, indent=4, ensure_ascii=False))
