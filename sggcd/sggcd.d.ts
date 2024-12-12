// Description: 지역 코드 정보를 담는 타입 선언 파일
// Typescript를 아직 적용하지 않았지만 json 데이터를 이해하기 쉽게 타입을 선언해놓음

export interface StanReginCd {
    head: Head;
    row: Row[];
}

export interface Head {
    totalCount: string; // 전체 데이터 개수
    numOfRows: string;  // 한 페이지에 표시할 행 수
    pageNo: string;     // 현재 페이지 번호
    type: string;       // 데이터 형식 (예: XML, JSON)
    RESULT: Result;     // 결과 코드 및 메시지
}

export interface Result {
    resultCode: string; // 결과 코드 (예: INFO-0)
    resultMsg: string;  // 결과 메시지 (예: NOMAL SERVICE)
}

export interface Row {
    region_cd: string;        // 지역 코드
    sido_cd: string;          // 시도 코드
    sgg_cd: string;           // 시군구 코드
    umd_cd: string;           // 읍면동 코드
    ri_cd: string;            // 리 코드
    locatjumin_cd: string;    // 주민등록 기준 지역 코드
    locatjijuk_cd: string;    // 지적 기준 지역 코드
    locatadd_nm: string;      // 지역 주소명 (예: 서울특별시 송파구)
    locat_order: string;      // 지역 정렬 순서
    locat_rm?: string;        // 비고 (옵션 값)
    locathigh_cd: string;     // 상위 지역 코드
    locallow_nm: string;      // 하위 지역명 (예: 송파동)
    adpt_de?: string;         // 적용 날짜 (옵션 값, 형식 예시: "20061229")
}

export type Picked<T, K extends keyof T> = {
    [P in K]: T[P];
};
