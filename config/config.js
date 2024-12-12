// oracle insert 쿼리용 속성 매핑 설정 (속성 이름 -> 배열 인덱스)
// 데이터베이스 칼럼 기준 이름 - regionCd 관련 작업할 때 테이블을 참조한다면 이 매핑을 사용한다.
const regionCdMapping = {
    0: "sido_cd",    // 배열의 0번째에 sido_cd 값
    1: "sgg_cd",     // 배열의 1번째에 sgg_cd 값
    2: "locatadd_nm" // 배열의 2번째에 locatadd_nm 값
};
const officetelDataMapping = {
    0: "sido_cd",    // 배열의 0번째에 sido_cd 값
    1: "sgg_cd",     // 배열의 1번째에 sgg_cd 값
    2: "locatadd_nm" // 배열의 2번째에 locatadd_nm 값
};

export default { regionCdMapping, officetelDataMapping };
