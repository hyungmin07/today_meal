from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import requests
import json
import os

app = Flask(__name__, static_folder='static')
CORS(app, resources={r"/*": {"origins": "*"}})  # CORS 허용

# ✅ NEIS API KEY 설정 (실제 API 키 입력 필요)
API_KEY = "8e7a77dab2f34ff9b3f7d6ead4d6e39f"

# ✅ 학교 검색 API URL (NEIS API)
SCHOOL_API_URL = "https://open.neis.go.kr/hub/schoolInfo?Type=json&SCHUL_NM={}&KEY={}"

# ✅ 급식 정보 API URL (NEIS API)
MEAL_API_URL = "https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&ATPT_OFCDC_SC_CODE={}&SD_SCHUL_CODE={}&MLSV_YMD={}&KEY={}"

# ✅ 홈 경로 (index.html 반환)
@app.route('/')
def home():
    return render_template("index.html")  # index.html 렌더링

# ✅ 학교 검색 API
@app.route('/search_school', methods=['GET'])
def search_school():
    query = request.args.get('query', '').strip()
    if not query:
        return jsonify([])  # 빈 검색어일 경우 빈 리스트 반환

    response = requests.get(SCHOOL_API_URL.format(query, API_KEY))
    
    if response.status_code == 200:
        try:
            data = response.json()
            schools = []
            if "schoolInfo" in data and len(data["schoolInfo"]) > 1:
                for school in data["schoolInfo"][1]["row"]:
                    if query in school["SCHUL_NM"]:  # 부분 일치 검색
                        schools.append({
                            "학교명": school["SCHUL_NM"],
                            "학교코드": school["SD_SCHUL_CODE"],
                            "교육청코드": school["ATPT_OFCDC_SC_CODE"],  # ✅ 추가됨
                            "설립 구분": school["FOND_SC_NM"],
                            "학교 유형": school["SCHUL_KND_SC_NM"],
                            "홈페이지": school.get("HMPG_ADRES", "정보 없음")
                        })
            return jsonify(schools)
        except json.JSONDecodeError:
            return jsonify({'error': 'JSON 데이터 파싱 오류'}), 500
    return jsonify({'error': '학교 정보를 가져오지 못했습니다.'}), 500

# ✅ 급식 정보 API (교육청 코드 포함)
@app.route('/get_meal', methods=['GET'])
def get_meal():
    school_code = request.args.get('school_code')
    date = request.args.get('date')
    edu_office_code = request.args.get('edu_office_code')  # ✅ 추가됨

    if not school_code or not date or not edu_office_code:
        return jsonify({'error': '학교 코드, 교육청 코드, 날짜를 입력하세요.'}), 400

    response = requests.get(MEAL_API_URL.format(edu_office_code, school_code, date, API_KEY))
    
    if response.status_code == 200:
        try:
            return jsonify(response.json())
        except json.JSONDecodeError:
            return jsonify({'error': 'JSON 데이터 파싱 오류'}), 500
    return jsonify({'error': '급식 데이터를 불러오지 못했습니다.'}), 500

# ✅ 정적 파일 제공 (CSS, JS 등)
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5500, debug=True)
