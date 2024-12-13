## `secrets.json` 파일 만들기
1. [`/config`](/config/) 디렉토리에 있는 `secrets-example.json` 파일을 복사해서 `secrets.json` 파일을 만든다.
1. `secrets.json` 파일의 내용을 채운다.
    1. Oracle 데이터베이스 계정 정보를 입력한다.
        1. `index.js`를 실행하면 REGIONCD 테이블은 DROP되고 새로 생성된다. DROP하지 않아야 한다면 `index.js` 파일의 `await oracleUtil.createRegionCdTable();` 코드가 실행되지 않도록 한다.
        1. [`/transactionData`](/transactionData/) 디렉토리에 있는 스크립트들은 테이블을 새로 생성하지 않는다. 이미 테이블이 존재해야 한다. 테이블 구조는 ERDCloud에 작성되어 있음. 현재 공개하지 않은 상태.
    1. API 키 가져오기
        1. 법정동코드 (regionCd): [API 키 신청 링크](https://www.data.go.kr/tcs/dss/selectApiDataDetailView.do?publicDataPk=15077871)
        1. 단독/다가구 (dandok): [API 키 신청 링크](https://www.data.go.kr/data/15126472/openapi.do)
        1. 연립 다세대 (yeonlip): [API 키 신청 링크](https://www.data.go.kr/data/15126473/openapi.do)
        1. 오피스텔 (officeHotel): [API 키 신청 링크](https://www.data.go.kr/data/15126475/openapi.do)
