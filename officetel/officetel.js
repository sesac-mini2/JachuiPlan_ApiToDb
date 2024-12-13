import { sleep, objectToArray, generateYearMonths } from '../util/util.js';
import requestUtil from '../util/request.util.js';
import oracleUtil from '../util/oracle.util.js';
import regioncd from '../regioncd/regioncd.js';
import config from '../config/config.js';

const regioncdArr = await regioncd.getRegionCdFromDb();
const yearMonthsArr = generateYearMonths(2020, 2024);
// const regioncdArr = ["11170"]; // 임시 테스트용
// const yearMonthsArr = ["202311"]; // 임시 테스트용

const columns = Object.entries(config.mapping.officeHotel).map((row) => row[1]);
for (let i = 0; i < yearMonthsArr.length; i++) {
    regioncdArr.forEach(async (regioncd) => {
        let data = await requestUtil.recursiveRequestRTMSDataSvc('officeHotel', regioncd, yearMonthsArr[i]);
            data.map(convertOfficeHotel);
            const arr = objectToArray(data, Object.keys(config.mapping.officeHotel));

            oracleUtil.insertMany('OFFICE_HOTEL', columns, arr);
    });
    await sleep(1000);
}

// API 데이터를 가공하여 DB에 알맞은 데이터로 변환
function convertOfficeHotel(row) {
    // deposit, monthlyRent에 쉼표(,)가 들어가 있어서 제거해줘야 함
    // dealYear, dealMonth, dealDay를 합쳐서 makeDealDate로 만들어주기
    row.deposit = ("" + row.deposit).replace(/,/g, '');
    row.monthlyRent = ("" + row.monthlyRent).replace(/,/g, '');
    row.makeDealDate = row.dealYear + ("0" + row.dealMonth).slice(-2) + ("0" + row.dealDay).slice(-2);
}
