import requests
import json

# 학교 검색 API URL (실제 API 주소로 변경해야 함)
API_URL = "https://open.neis.go.kr/hub/schoolInfo?Type=json&SCHUL_NM={}"  # 여기에 실제 API 주소 입력

# 학교 목록을 가져오는 함수
def fetch_schools(query):
    response = requests.get(API_URL.format(query))
    if response.status_code == 200:
        return response.json()
    return []

# 검색한 학교 리스트를 저장하는 함수
def save_schools(school_data, filename="school_list.json"):
    with open(filename, "w", encoding="utf-8") as file:
        json.dump(school_data, file, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    query = input("검색할 학교 이름을 입력하세요: ")
    schools = fetch_schools(query)
    if schools:
        save_schools(schools)
        print(f"{len(schools)}개의 학교 정보가 저장되었습니다.")
    else:
        print("학교 정보를 찾을 수 없습니다.")
