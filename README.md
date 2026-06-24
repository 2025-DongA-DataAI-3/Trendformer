# TrendFormer

### 데이터 기반 실시간 트렌드 분석 및 콘텐츠 분류 서비스

> 다양한 콘텐츠 데이터를 수집·분석하여 변화하는 트렌드를 시각화하고,
> 머신러닝 기반으로 콘텐츠 특성을 분류하는 데이터 분석 프로젝트입니다.

<br/>

## 1. 프로젝트 소개

**TrendFormer**는 뉴스·콘텐츠 데이터를 기반으로 최근 이슈와 키워드 흐름을 분석하는 트렌드 분석 서비스입니다.

단순히 인기 키워드를 보여주는 것을 넘어, 데이터 전처리와 머신러닝 분류 모델을 통해 콘텐츠의 특성을 분석하고 사용자가 빠르게 흐름을 파악할 수 있도록 설계했습니다.

<br/>

## 2. 주요 기능

### 실시간 트렌드 분석

* 콘텐츠 데이터 수집 및 저장
* 기간별 키워드 빈도 분석
* 급상승 키워드 및 주요 이슈 추출
* 트렌드 변화 시각화

### 머신러닝 기반 콘텐츠 분류

* XGBoost 모델을 활용한 콘텐츠 카테고리 분류
* 제목 및 본문 데이터 기반 특징 추출
* 데이터 특성에 따른 분류 결과 제공

### 데이터 전처리 및 최적화

* 불필요한 데이터 제거 및 결측치 처리
* 텍스트 정제 및 키워드 추출
* 분석 성능 향상을 위한 데이터 구조 최적화

### 사용자 화면

* 트렌드 키워드 및 순위 확인
* 카테고리별 콘텐츠 조회
* 기간별 데이터 변화 확인
* 분석 결과 시각화

<br/>

## 3. 서비스 흐름

```text
콘텐츠 데이터 수집
        ↓
데이터 정제 및 전처리
        ↓
키워드 분석 / 특징 추출
        ↓
XGBoost 콘텐츠 분류
        ↓
트렌드 데이터 저장
        ↓
사용자 화면 시각화
```

<br/>

## 4. 기술 스택

| 구분               | 기술                       |
| ---------------- | ------------------------ |
| Frontend         | HTML, CSS, JavaScript    |
| Backend          | Node.js                  |
| Data Analysis    | Python, Pandas, NumPy    |
| Machine Learning | Scikit-learn, XGBoost    |
| Database         | MySQL                    |
| Data Collection  | Crawling / API           |
| Visualization    | Chart.js / 데이터 시각화 라이브러리 |
| Collaboration    | Git, GitHub              |

<br/>

## 5. 시스템 아키텍처

```text
[ 사용자 ]
    ↓
[ Frontend ]
    ↓
[ Node.js Server ]
    ↓
[ Database ] ← [ Python Data Analysis / ML Model ]
                    ↑
              [ Crawling / External API ]
```

<br/>

## 6. 머신러닝 모델

TrendFormer는 콘텐츠 데이터를 분석하여 카테고리 또는 트렌드 특성을 분류하기 위해 **XGBoost** 모델을 활용했습니다.

### 모델 적용 과정

1. 콘텐츠 제목 및 본문 데이터 수집
2. 텍스트 정제 및 불용어 제거
3. 키워드 및 특징 데이터 추출
4. 학습 데이터 구성
5. XGBoost 모델 학습
6. 신규 콘텐츠 분류 및 결과 저장

### 기대 효과

* 수작업 분류 시간 감소
* 콘텐츠 특성에 따른 자동 분류
* 대량 데이터 분석 효율 향상
* 트렌드 변화 탐지 정확도 개선

<br/>

## 7. 프로젝트 폴더 구조

```text
TrendFormer
├─ frontend
│  ├─ css
│  ├─ js
│  ├─ images
│  └─ index.html
│
├─ backend
│  ├─ routes
│  ├─ controllers
│  ├─ services
│  └─ server.js
│
├─ data
│  ├─ raw
│  ├─ processed
│  └─ model
│
├─ analysis
│  ├─ preprocessing.py
│  ├─ trend_analysis.py
│  └─ model_train.py
│
└─ README.md
```

<br/>

## 8. 실행 방법

### 1) 프로젝트 클론

```bash
git clone [GitHub Repository URL]
cd TrendFormer
```

### 2) Backend 실행

```bash
cd backend
nodemon server.js
```

### 3) Frontend 실행

```bash
cd frontend
npm run dev
```

### 4) 분석 파일 실행

```bash
python analysis/trend_analysis.py
```

<br/>

## 9. 기대 효과

* 사용자가 최근 이슈와 트렌드 변화를 빠르게 확인할 수 있음
* 콘텐츠 데이터를 자동으로 분류하여 관리 효율 향상
* 데이터 기반 의사결정에 활용 가능한 인사이트 제공
* 머신러닝 모델을 실제 서비스 흐름에 적용한 경험 확보

<br/>

## 10. 담당 역할

| 분야       | 담당 내용                   |
| -------- | ----------------------- |
| 데이터 분석   | 콘텐츠 데이터 전처리 및 키워드 분석    |
| 머신러닝     | XGBoost 기반 콘텐츠 분류 모델 구현 |
| Backend  | Node.js 기반 API 및 데이터 연동 |
| Frontend | 트렌드 결과 및 분석 데이터 화면 구현   |
| Database | 데이터 저장 구조 설계 및 조회 기능 구현 |

<br/>

## 11. 프로젝트 화면

| 메인 화면     | 트렌드 분석    | 콘텐츠 분류    |
| --------- | --------- | --------- |
| 이미지 추가 예정 | 이미지 추가 예정 | 이미지 추가 예정 |

<br/>

## 12. 개선 방향

* 실시간 데이터 수집 주기 자동화
* 사용자 관심사 기반 개인화 추천 기능
* LLM 기반 트렌드 요약 기능 추가
* 감성 분석을 활용한 긍정·부정 이슈 분류
* 기간별 트렌드 예측 모델 확장

<br/>

## 13. 팀원

| 이름  | 역할                              |
| --- | ------------------------------- |
| 박진엽 | DB 구축, 머신러닝, Backend,|
| 이상원 | pm, Backend, 머신러닝, AI 모델링                           |
| 강동연 | Frontend, 데이터 분석                           |
| 황지용 | Frontend |
| 김지호 | 역할 작성                           |
 
<br/>

## 14. GitHub

* Repository: `[GitHub 주소 입력]`
* Notion: `[Notion 주소 입력]`
* Demo: `[배포 주소 입력]`

---

### TrendFormer

**데이터에서 흐름을 찾고, 트렌드를 더 빠르게 이해하다.**
