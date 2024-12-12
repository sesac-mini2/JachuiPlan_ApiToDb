// oracle insert 쿼리용 속성 매핑 설정 (속성 이름 -> 배열 인덱스)
// 데이터베이스 칼럼 기준 이름 - DB 관련 작업할 때 테이블을 참조한다면 이 매핑을 사용한다.
// 'API 이름: DB 칼럼명'으로 매핑되어 있음
const mapping = {
    regionCd: {
        'sido_cd': "SIDO_CD",          // 배열의 0번째에 SIDO_CD 값
        'sgg_cd': "SGG_CD",            // 배열의 1번째에 SGG_CD 값
        'locatadd_nm': "LOCATADD_NM"   // 배열의 2번째에 LOCATADD_NM 값
    },
    officeHotel: {
        'sggCd': "SGGCD",              // 배열의 0번째에 SGGCD 값
        'umdNm': "UMDNM",              // 배열의 1번째에 UMDNM 값
        'excluUseAr': "EXCLU_USE_AR",  // 배열의 2번째에 EXCLU_USE_AR 값
        'floor': "FLOOR",              // 배열의 3번째에 FLOOR 값
        'buildYear': "BUILD_YEAR",     // 배열의 4번째에 BUILD_YEAR 값
        'deposit': "DEPOSIT",          // 배열의 5번째에 DEPOSIT 값
        'monthlyRent': "MONTHLY_RENT", // 배열의 6번째에 MONTHLY_RENT 값
        'makeDealDate': "DEALDATE",    // 배열의 7번째에 DEALDATE 값
        'jibun': "JIBUN",              // 배열의 8번째에 JIBUN 값
        'offiNm': "BUILDING_NAME"      // 배열의 9번째에 BUILDING_NAME 값
    }
}

const allowedTables = ['REGIONCD', 'BUILDING', 'OFFICE_HOTEL'];

export default { mapping, allowedTables };