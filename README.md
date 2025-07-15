# JachuiPlan API to Database

JachuiPlan 프로젝트의 데이터 수집 도구로, 공공데이터포털 API에서 부동산 실거래 데이터를 가져와 Oracle 데이터베이스에 저장하는 Node.js 애플리케이션입니다.

## 📋 개요

이 프로그램은 다음과 같은 데이터를 수집하여 데이터베이스에 저장합니다:
- **법정동코드**: 행정구역 정보 및 위치 데이터 (저장소 내 JSON 파일 사용)
- **단독/다가구**: 단독주택 및 다가구주택 실거래 데이터 (API 호출)
- **연립다세대**: 연립주택 및 다세대주택 실거래 데이터 (API 호출)
- **오피스텔**: 오피스텔 실거래 데이터 (API 호출)

## 🛠️ 시스템 요구사항

- **Node.js**: v22.12.0 (LTS) 권장 (다른 버전도 대부분 호환)
- **Oracle Database**: 데이터 저장을 위한 Oracle DB 접근 권한
- **API 키**: 공공데이터포털에서 발급받은 API 키 3개 (실거래 데이터용)

## 🚀 설치 및 실행

### 1. 프로젝트 클론 및 의존성 설치
```bash
git clone https://github.com/sesac-mini2/JachuiPlan_ApiToDb
cd JachuiPlan_ApiToDb
npm install
```

### 2. 환경 설정 파일 생성
1. `/config/secrets-example.json` 파일을 복사하여 `/config/secrets.json` 파일 생성
2. `secrets.json` 파일에 실제 데이터베이스 정보와 API 키 입력

### 3. 프로그램 실행
```bash
node index.js [시작년월(YYYYMM)] [종료년월(YYYYMM)]
```

**예시:**
```bash
# 2024년 1월부터 2024년 12월까지의 데이터 수집
node index.js 202401 202412

# 인수 없이 실행하면 기본값 (202411) 사용
node index.js
```

## ⚙️ 환경 설정

### secrets.json 파일 구성
```json
{
    "oracle": {
        "user": "your_username",
        "password": "your_password",
        "connectString": "your_host:port/service_name"
    },
    "apikey": {
        "dandok": "your_dandok_apikey",
        "yeonlip": "your_yeonlip_apikey",
        "officeHotel": "your_officeHotel_apikey"
    }
}
```

> **참고**: 법정동코드 데이터는 API 호출 대신 저장소 내 JSON 파일(`regioncd_seoul.json`, `district_location_filtered.json`)을 사용하므로 `regionCd` API 키는 필요하지 않습니다.

### 📋 API 키 발급 안내

다음 실거래 데이터 수집을 위한 API 키를 공공데이터포털에서 발급받으세요:

| 데이터 유형 | 설명 | 신청 링크 |
|------------|------|----------|
| `regionCd` | 법정동코드 | [신청하기](https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15077871) |
| `dandok` | 단독/다가구 실거래 | [신청하기](https://www.data.go.kr/data/15126472/openapi.do) |
| `yeonlip` | 연립다세대 실거래 | [신청하기](https://www.data.go.kr/data/15126473/openapi.do) |
| `officeHotel` | 오피스텔 실거래 | [신청하기](https://www.data.go.kr/data/15126475/openapi.do) |

> **법정동코드 데이터**는 현재 저장소 내 JSON 파일을 사용하므로 별도의 API 키가 필요하지 않습니다.

## 🗄️ 데이터베이스 설정

### Connection Pool
애플리케이션은 Oracle DB Connection Pool을 사용하여 데이터베이스 연결을 효율적으로 관리합니다.

### 테이블 자동 생성
가장 간단한 방법은 [JachuiPlan 메인 프로젝트](https://github.com/Jaehyuk-Lee/JachuiPlan)의 Spring Boot 서버를 한 번 실행하는 것입니다. JPA가 자동으로 필요한 테이블을 생성합니다.

### 데이터 저장 방식
- **REGIONCD 테이블**: 실행 시마다 기존 데이터를 삭제하고 새로운 데이터로 갱신
- **실거래 데이터 테이블**: 기존 데이터를 유지하며 새로운 데이터만 추가 (API 호출 제한으로 인한 분할 실행 지원)

### 성능 최적화
- **Connection Pool**: 데이터베이스 연결을 효율적으로 관리하여 성능 향상
- **대량 삽입(Bulk Insert)**: 배치 단위로 데이터를 삽입하여 성능 향상
- **배치 크기 최적화**: 데이터 크기에 따라 배치 크기를 자동 조정
- **실패 시 폴백**: 대량 삽입 실패 시 개별 삽입으로 자동 전환

## 📁 프로젝트 구조

```
JachuiPlan_ApiToDb/
├── config/
│   ├── config.js           # 데이터베이스 매핑 설정
│   ├── secrets-example.json # 환경 설정 템플릿
│   └── secrets.json        # 실제 환경 설정 (생성 필요)
├── performance/            # 성능 모니터링 모듈
├── regioncd/               # 법정동코드 관련 모듈
├── transactionData/        # 실거래 데이터 처리 모듈
├── util/                   # 유틸리티 함수들
├── index.js               # 메인 실행 파일
└── package.json           # 프로젝트 정보 및 의존성
```

## 🔧 데이터 매핑 정보

데이터베이스에 저장되는 데이터의 매핑 정보는 `/config/config.js` 파일의 `mapping` 객체를 참고하세요. 이 객체는 API 응답 데이터를 데이터베이스 컬럼으로 매핑하는 규칙을 정의합니다.

## 📊 성능 모니터링

애플리케이션은 실행 중 다음과 같은 성능 지표를 자동으로 모니터링합니다:
- **실행 시간**: 전체 프로세스 및 각 단계별 실행 시간
- **삽입 통계**: 테이블별 삽입된 행 수 및 삽입 속도
- **배치 통계**: 실행된 배치 수 및 배치 성공률
- **오류 통계**: 발생한 오류 수 및 오류 유형
- **Connection Pool 상태**: 연결 사용량 및 대기 상태

실행 완료 시 자동으로 성능 요약 보고서가 출력됩니다.

## ⚠️ 주의사항

1. **API 호출 제한**: 공공데이터포털 API는 일일 호출 한도가 있으므로, 대량 데이터 수집 시 여러 날에 걸쳐 분할 실행이 필요할 수 있습니다.
2. **데이터베이스 연결**: Oracle 데이터베이스가 정상적으로 연결되어 있는지 확인하세요.
3. **API 키 유효성**: 모든 API 키가 정상적으로 발급되고 활성화되어 있는지 확인하세요.
4. **메모리 사용량**: 대량 데이터 처리 시 메모리 사용량이 증가할 수 있습니다. 시스템 리소스를 모니터링하세요.
5. **Connection Pool**: 동시 실행 시 Connection Pool 설정을 고려하여 적절한 간격으로 실행하세요.
6. **오류 처리**: 일부 데이터 처리 실패 시에도 전체 프로세스는 계속 진행됩니다. 오류 로그를 확인하세요.

## 🔗 관련 프로젝트

- [JachuiPlan 메인 프로젝트](https://github.com/Jaehyuk-Lee/JachuiPlan): 이 데이터를 활용하는 부동산 정보 서비스
