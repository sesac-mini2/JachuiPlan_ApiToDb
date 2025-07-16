/**
 * API 데이터와 데이터베이스 간 매핑 설정
 *
 * 구조:
 * - meta: 테이블 메타데이터 (테이블명, 인덱스 등)
 * - fields: API 필드명 → DB 컬럼 매핑 정보
 *
 * 각 필드 설정:
 * - column_name: 데이터베이스 컬럼명
 * - type: 데이터 타입 (STRING, NUMBER, DATE)
 * - maxSize: 문자열 타입의 최대 길이 (STRING 타입인 경우)
 *
 * 사용 용도:
 * - API 응답 데이터 → 데이터베이스 삽입 시 필드 변환
 * - 데이터베이스 스키마 정보 제공
 * - 데이터 타입 검증 및 변환
 */
const mapping = {
    regionCd: {
        meta: {
            table: 'REGIONCD'
        },
        fields: {
            'sido_cd': { column_name: "SIDO_CD", type: "STRING", maxSize: 8 },
            'sgg_cd': { column_name: "SGG_CD", type: "STRING", maxSize: 12 },
            'umd_cd': { column_name: "UMD_CD", type: "STRING", maxSize: 12 },
            'locatadd_nm': { column_name: "LOCATADD_NM", type: "STRING", maxSize: 400 },
            'latitude': { column_name: "LATITUDE", type: "NUMBER" },
            'longitude': { column_name: "LONGITUDE", type: "NUMBER" }
        }
    },
    dandok: {
        meta: {
            table: 'BUILDING'
        },
        fields: {
            'buildingType': { column_name: "BUILDING_TYPE", type: "NUMBER" },
            'sggCd': { column_name: "SGGCD", type: "STRING", maxSize: 20 },
            'umdNm': { column_name: "UMDNM", type: "STRING", maxSize: 80 },
            'totalFloorAr': { column_name: "TOTAL_FLOOR_AR", type: "NUMBER" },
            'floor': { column_name: "FLOOR", type: "NUMBER" },
            'buildYear': { column_name: "BUILD_YEAR", type: "NUMBER" },
            'deposit': { column_name: "DEPOSIT", type: "NUMBER" },
            'monthlyRent': { column_name: "MONTHLY_RENT", type: "NUMBER" },
            'makeDealDate': { column_name: "DEALDATE", type: "DATE" },
            'jibun': { column_name: "JIBUN", type: "STRING", maxSize: 80 },
            'buildingName': { column_name: "BUILDING_NAME", type: "STRING", maxSize: 1200 },
            'houseType': { column_name: "HOUSE_TYPE", type: "STRING", maxSize: 120 }
        }
    },
    yeonlip: {
        meta: {
            table: 'BUILDING'
        },
        fields: {
            'buildingType': { column_name: "BUILDING_TYPE", type: "NUMBER" },
            'sggCd': { column_name: "SGGCD", type: "STRING", maxSize: 20 },
            'umdNm': { column_name: "UMDNM", type: "STRING", maxSize: 80 },
            'excluUseAr': { column_name: "TOTAL_FLOOR_AR", type: "NUMBER" },
            'floor': { column_name: "FLOOR", type: "NUMBER" },
            'buildYear': { column_name: "BUILD_YEAR", type: "NUMBER" },
            'deposit': { column_name: "DEPOSIT", type: "NUMBER" },
            'monthlyRent': { column_name: "MONTHLY_RENT", type: "NUMBER" },
            'makeDealDate': { column_name: "DEALDATE", type: "DATE" },
            'jibun': { column_name: "JIBUN", type: "STRING", maxSize: 80 },
            'mhouseNm': { column_name: "BUILDING_NAME", type: "STRING", maxSize: 1200 },
            'houseType': { column_name: "HOUSE_TYPE", type: "STRING", maxSize: 120 }
        }
    },
    officeHotel: {
        meta: {
            table: 'OFFICE_HOTEL'
        },
        fields: {
            'sggCd': { column_name: "SGGCD", type: "STRING", maxSize: 20 },
            'umdNm': { column_name: "UMDNM", type: "STRING", maxSize: 80 },
            'excluUseAr': { column_name: "EXCLU_USE_AR", type: "NUMBER" },
            'floor': { column_name: "FLOOR", type: "NUMBER" },
            'buildYear': { column_name: "BUILD_YEAR", type: "NUMBER" },
            'deposit': { column_name: "DEPOSIT", type: "NUMBER" },
            'monthlyRent': { column_name: "MONTHLY_RENT", type: "NUMBER" },
            'makeDealDate': { column_name: "DEALDATE", type: "DATE" },
            'jibun': { column_name: "JIBUN", type: "STRING", maxSize: 80 },
            'offiNm': { column_name: "BUILDING_NAME", type: "STRING", maxSize: 1200 }
        }
    }
};

/**
 * API 엔드포인트 정보 설정
 *
 * 각 API 타입별 설정:
 * - url: API 엔드포인트 URL
 * - limitPerDay: 일일 API 호출 제한 수
 *
 * 사용 용도:
 * - API 호출 시 엔드포인트 정보 제공
 * - API 호출 제한 검증
 * - 요청 레이트 제한 관리
 */
const apiInfo = {
    regionCd: {
        url: "https://apis.data.go.kr/1741000/StanReginCd/getStanReginCdList",
        limitPerDay: 10000
    },
    dandok: {
        url: "http://apis.data.go.kr/1613000/RTMSDataSvcSHRent/getRTMSDataSvcSHRent",
        limitPerDay: 1000
    },
    yeonlip: {
        url: "http://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent",
        limitPerDay: 10000
    },
    officeHotel: {
        url: "https://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent",
        limitPerDay: 10000
    }
}

export default { mapping, apiInfo };
