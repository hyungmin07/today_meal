import json

# 학교 리스트 파일 경로
SCHOOL_LIST_FILE = "school_list.json"

# 저장된 학교 리스트 불러오기
def load_school_list():
    try:
        with open(SCHOOL_LIST_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        return []
    except json.JSONDecodeError:
        return []

# 학교 리스트 저장하기
def save_school_list(school_list):
    with open(SCHOOL_LIST_FILE, "w", encoding="utf-8") as file:
        json.dump(school_list, file, ensure_ascii=False, indent=4)

if __name__ == "__main__":
    schools = load_school_list()
    if schools:
        print(f"불러온 학교 개수: {len(schools)}")
    else:
        print("저장된 학교 리스트가 없습니다.")
