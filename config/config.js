// oracle insert 쿼리용 속성 매핑 설정 (속성 이름 -> 배열 인덱스)
// 데이터베이스 칼럼 기준 이름 - DB 관련 작업할 때 테이블을 참조한다면 이 매핑을 사용한다.
// 'API 이름: DB 칼럼명'으로 매핑되어 있음
const mapping = {
    regionCd: {
        'sido_cd': { column_name: "SIDO_CD", type: "STRING", maxSize: 8 },
        'sgg_cd': { column_name: "SGG_CD", type: "STRING", maxSize: 12 },
        'umd_cd': { column_name: "UMD_CD", type: "STRING", maxSize: 12 },
        'locatadd_nm': { column_name: "LOCATADD_NM", type: "STRING", maxSize: 400 },
        'latitude': { column_name: "LATITUDE", type: "NUMBER" },
        'longitude': { column_name: "LONGITUDE", type: "NUMBER" }
    },
    dandok: {
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
    },
    yeonlip: {
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
    },
    officeHotel: {
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
};

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

// 프로그램에서 테이블 이름을 직접 사용할 때는 무조건 대문자로 사용
const allowedTables = ['REGIONCD', 'BUILDING', 'OFFICE_HOTEL'];

export default { mapping, apiInfo, allowedTables };
