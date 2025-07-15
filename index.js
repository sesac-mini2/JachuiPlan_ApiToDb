import config from "./config/config.js";
import { objectToArrayWithMapper, generateYearMonths } from "./util/util.js";
import regionCd from "./regioncd/regioncd.js";
import converter from "./transactionData/converter.js";
import convertFunctions from "./transactionData/convertFunctions.js";
import oracleUtil from './util/oracle.util.js';
import validator from './transactionData/validator.js';

// node index.js [startYearMonth] [endYearMonth]
const startYearMonth = process.argv[2] || "202411";
const endYearMonth = process.argv[3] || "202411";

// 오라클 DB에 API로 가져온 법정동코드, 행정구역 한국어 이름 데이터 삽입
let gu = regionCd.getRegionCdFromJson();

const arr = objectToArrayWithMapper(gu, config.mapping.regionCd);
console.log(arr);

await oracleUtil.deleteRegionCdTableItems();
await oracleUtil.insertMany('REGIONCD', Object.entries(config.mapping.regionCd).map((row) => row[1]), arr);


const regionCdArr = await regionCd.getRegionCdFromDb();
// const regionCdArr = ["11170"]; // 임시 테스트용
const yearMonthsArr = generateYearMonths(startYearMonth, endYearMonth);

// API 호출 전 검증

validator.validateAll('dandok', regionCdArr, yearMonthsArr);
validator.validateAll('yeonlip', regionCdArr, yearMonthsArr);
validator.validateAll('officeHotel', regionCdArr, yearMonthsArr);

// Q: 함수의 결과값을 받아오지도 않고 결과에 영향을 받는 코드도 없는데 왜 converter.APItoDB에 await을 걸었냐?
// A: 초당 API 호출 횟수에 제한을 두기 위해 함수 내부에 반복 중에 1초 대기하는 코드가 들어가 있음.
//    await을 걸어야 1초를 기다림. 없으면 OpenAPI에서 초당 호출 횟수를 초과하는 에러가 발생할 가능성이 높음.

// 단독/다가구
console.log('\n=== 단독/다가구 API 요청 시작 ===');
await converter.APItoDB('dandok', 'BUILDING', convertFunctions.dandok, regionCdArr, yearMonthsArr);

// 연립다세대
console.log('\n=== 연립다세대 API 요청 시작 ===');
await converter.APItoDB('yeonlip', 'BUILDING', convertFunctions.yeonlip, regionCdArr, yearMonthsArr);

// 오피스텔
console.log('\n=== 오피스텔 API 요청 시작 ===');
await converter.APItoDB('officeHotel', 'OFFICE_HOTEL', convertFunctions.officeHotel, regionCdArr, yearMonthsArr);
