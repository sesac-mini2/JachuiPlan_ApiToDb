import { generateYearMonths } from '../util/util.js';
import regionCd from '../regioncd/regioncd.js';
import converter from './converter.js';

const name = 'dandok';
const tableName = 'BUILDING';

// const regionCdArr = await regionCd.getRegionCdFromDb();
// const yearMonthsArr = generateYearMonths(2020, 2024);
const regionCdArr = ["11170"]; // 임시 테스트용
const yearMonthsArr = ["202311"]; // 임시 테스트용

converter.APItoDB(name, tableName, convertDandok, regionCdArr, yearMonthsArr);

// API 데이터를 가공하여 DB에 알맞은 데이터로 변환
function convertDandok(row) {
    row.buildingType = '1'; // 단독/다가구
    row.deposit = ("" + row.deposit).replace(/,/g, '');
    row.monthlyRent = ("" + row.monthlyRent).replace(/,/g, '');
    row.makeDealDate = row.dealYear + ("0" + row.dealMonth).slice(-2) + ("0" + row.dealDay).slice(-2);
}
