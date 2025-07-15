## 프로그램 실행하는 법
1. [node.js](https://nodejs.org/ko)를 다운로드 받고 설치한다. 개발자가 테스트한 환경은 `v22.12.0`(LTS) 버전이다. 다른 버전이라도 왠만하면 작동할 것이다.
1. 아래 **`secrets.json` 파일 만들기** 내용을 반드시 읽고, 데이터베이스 접속 정보와 OpenAPI 키 정보를 입력한다.
1. 터미널/CMD에서 `npm install`을 실행한다.
1. DB가 올바르게 준비됐다면, 터미널/CMD에서 `node index.js [시작년월(YYYYMM)] [종료년월(YYYYMM)]`을 실행한다.
    * 어떤 내용이 DB에 입력되는지 알고 싶다면 `/config/config.js` 파일의 `mapping`을 참고해보세요. 이해하기 쉽게 만들지는 못했지만요.
1. 이제 프로그램이 알아서 API에서 제공하는 데이터를 읽어들여 DB 테이블에 입력해준다.

## `secrets.json` 파일 만들기

1. [`/config`](/config/) 디렉토리에 있는 `secrets-example.json` 파일을 복사해서 같은 디렉토리에 `secrets.json` 파일을 만든다.
1. `secrets.json` 파일의 내용을 채운다.
    1. Oracle 데이터베이스 계정 정보를 입력한다.
    1. API 키 가져오기
        1. 법정동코드 (regionCd): [API 키 신청 링크](https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15077871)
        1. 단독/다가구 (dandok): [API 키 신청 링크](https://www.data.go.kr/data/15126472/openapi.do)
        1. 연립 다세대 (yeonlip): [API 키 신청 링크](https://www.data.go.kr/data/15126473/openapi.do)
        1. 오피스텔 (officeHotel): [API 키 신청 링크](https://www.data.go.kr/data/15126475/openapi.do)

## `index.js` 실행시 DB 관련 안내

직접 테이블을 작성하기 귀찮다면, [JachuiPlan 프로젝트](https://github.com/Jaehyuk-Lee/JachuiPlan)의 Spring boot 서버를 한 번 실행해주면 JPA가 알아서 테이블을 생성해준다.

1. 기존 `REGIONCD` 테이블은 모든 내용을 DELETE하고 새로 INSERT된다.
1. `단독/다가구`, `연립다세대`, `오피스텔` 실거래 데이터가 들어가있는 기존 내용은 삭제되지 않는다. 일간 API 호출 한도로 인해 여러번 나눠서 데이터를 입력해야 하기 때문에 기존 데이터를 남기고 며칠에 나눠 실행하는 방향으로 진행하고 있기 때문이다. 테이블이 없다면 미리 만들어줘야 한다. 테이블 구조는 ERDCloud에 작성되어 있음. [ERD Cloud 링크](https://www.erdcloud.com/d/fWGxYKSfrBLTsuG2B)

## 성능 테스트

Git 커밋 간의 API 요청 및 데이터 삽입 성능을 비교할 수 있는 자동화된 테스트 도구가 제공됩니다.

### 사용 방법

```bash
# 특정 커밋과 최신 상태 비교
npm run performance-test -- 610a6de

# 두 커밋 간의 비교
npm run performance-test -- 610a6de b89f7c2

# 직접 실행
node performance/performance-test.js 610a6de
```

### 주요 기능

- **5회 반복 측정**: 각 커밋 상태에서 5번 실행하여 평균값 계산
- **통계 분석**: 평균, 최소, 최대, 표준편차, 변동계수 계산
- **Git 상태 관리**: 테스트 전후 자동 백업 및 복원
- **결과 저장**: JSON 형태로 상세 결과 저장

### 테스트 설정

기본 설정은 효율적인 실행을 위해 서울시 13개 구 2024년 7월 ~ 12월 데이터를 테스트합니다.

⚠️ **주의**: 테스트 중 Oracle DB에 실제 데이터가 삽입되며, 자동 롤백이 불가능합니다. 테스트 전용 DB 환경에서 실행하는 것을 권장합니다.

자세한 내용은 [`performance/README.md`](performance/README.md)를 참고하세요.
