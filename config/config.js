// oracle insert 쿼리용 속성 매핑 설정 (속성 이름 -> 배열 인덱스)
// 데이터베이스 칼럼 기준 이름 - DB 관련 작업할 때 테이블을 참조한다면 이 매핑을 사용한다.
// 'API 이름: DB 칼럼명'으로 매핑되어 있음
const mapping = {
    regionCd: {
        'sido_cd': "SIDO_CD",          // 배열의 0번째에 SIDO_CD 값
        'sgg_cd': "SGG_CD",            // 배열의 1번째에 SGG_CD 값
        'umd_cd': "UMD_CD",            // 배열의 2번째에 UMD_CD 값
        'locatadd_nm': "LOCATADD_NM",  // 배열의 3번째에 LOCATADD_NM 값
        'latitude': "LATITUDE",        // 배열의 4번째에 LATITUDE 값
        'longitude': "LONGITUDE"       // 배열의 5번째에 LONGITUDE 값
    },
    dandok: {
        // buildingType은 dandok(단독/다가구) 1, yeonlip 2 (직접 넣어줘야 함)
        'buildingType': "BUILDING_TYPE",  // 배열의 0번째에 BUILDING_TYPE 값
        'sggCd': "SGGCD",                 // 배열의 1번째에 SGGCD 값
        'umdNm': "UMDNM",                 // 배열의 2번째에 UMDNM 값
        'totalFloorAr': "TOTAL_FLOOR_AR", // 배열의 3번째에 TOTAL_FLOOR_AR 값
        'floor': "FLOOR",                 // 배열의 4번째에 FLOOR 값
        'buildYear': "BUILD_YEAR",        // 배열의 5번째에 BUILD_YEAR 값
        'deposit': "DEPOSIT",             // 배열의 6번째에 DEPOSIT 값
        'monthlyRent': "MONTHLY_RENT",    // 배열의 7번째에 MONTHLY_RENT 값
        'makeDealDate': "DEALDATE",       // 배열의 8번째에 DEALDATE 값
        'jibun': "JIBUN",                 // 배열의 9번째에 JIBUN 값
        'buildingName': "BUILDING_NAME",  // 배열의 10번째에 BUILDING_NAME 값
        'houseType': "HOUSE_TYPE"         // 배열의 11번째에 HOUSE_TYPE 값
    },
    yeonlip: {
        // buildingType은 dandok(단독/다가구) 1, yeonlip 2 (직접 넣어줘야 함)
        'buildingType': "BUILDING_TYPE",  // 배열의 0번째에 BUILDING_TYPE 값
        'sggCd': "SGGCD",                 // 배열의 1번째에 SGGCD 값
        'umdNm': "UMDNM",                 // 배열의 2번째에 UMDNM 값
        'excluUseAr': "TOTAL_FLOOR_AR",   // 배열의 3번째에 TOTAL_FLOOR_AR 값
        'floor': "FLOOR",                 // 배열의 4번째에 FLOOR 값
        'buildYear': "BUILD_YEAR",        // 배열의 5번째에 BUILD_YEAR 값
        'deposit': "DEPOSIT",             // 배열의 6번째에 DEPOSIT 값
        'monthlyRent': "MONTHLY_RENT",    // 배열의 7번째에 MONTHLY_RENT 값
        'makeDealDate': "DEALDATE",       // 배열의 8번째에 DEALDATE 값
        'jibun': "JIBUN",                 // 배열의 9번째에 JIBUN 값
        'mhouseNm': "BUILDING_NAME",      // 배열의 10번째에 BUILDING_NAME 값
        'houseType': "HOUSE_TYPE"         // 배열의 11번째에 HOUSE_TYPE 값
    },
    officeHotel: {
        'sggCd': "SGGCD",              // 배열의 0번째에 SGGCD 값
        'umdNm': "UMDNM",              // 배열의 1번째에 UMDNM 값
        'excluUseAr': "EXCLU_USE_AR",  // 배열의 2번째에 EXCLU_USE_AR 값
        'floor': "FLOOR",              // 배열의 3번째에 FLOOR 값
        'buildYear': "BUILD_YEAR",     // 배열의 4번째에 BUILD_YEAR 값
        // API에서 deposit 숫자를 3자리 단위마다 쉼표(,)로 구분하기 때문에 DB에 넣기 전에 제거해야 함.
        'deposit': "DEPOSIT",          // 배열의 5번째에 DEPOSIT 값
        'monthlyRent': "MONTHLY_RENT", // 배열의 6번째에 MONTHLY_RENT 값
        // API에서는 년월일 따로 주기 때문에 makeDealDate를 직접 만들어줘야 함.
        'makeDealDate': "DEALDATE",    // 배열의 7번째에 DEALDATE 값
        'jibun': "JIBUN",              // 배열의 8번째에 JIBUN 값
        'offiNm': "BUILDING_NAME"      // 배열의 9번째에 BUILDING_NAME 값
    }
}

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
