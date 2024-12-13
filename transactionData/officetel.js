import { generateYearMonths } from '../util/util.js';
import regionCd from '../regioncd/regioncd.js';
import converter from './converter.js';

const name = 'officeHotel';
const tableName = 'OFFICE_HOTEL';

// const regionCdArr = await regionCd.getRegionCdFromDb();
// const yearMonthsArr = generateYearMonths(2020, 2024);
const regionCdArr = ["11170"]; // 임시 테스트용
const yearMonthsArr = ["202311"]; // 임시 테스트용

converter.APItoDB(name, tableName, convertOfficeHotel, regionCdArr, yearMonthsArr);

// API 데이터를 가공하여 DB에 알맞은 데이터로 변환
function convertOfficeHotel(row) {
    // deposit, monthlyRent에 쉼표(,)가 들어가 있어서 제거해줘야 함
    // dealYear, dealMonth, dealDay를 합쳐서 makeDealDate로 만들어주기
    row.deposit = ("" + row.deposit).replace(/,/g, '');
    row.monthlyRent = ("" + row.monthlyRent).replace(/,/g, '');
    row.makeDealDate = row.dealYear + ("0" + row.dealMonth).slice(-2) + ("0" + row.dealDay).slice(-2);
}
