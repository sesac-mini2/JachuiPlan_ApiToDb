import { sleep, objectToArray, generateYearMonths } from '../util/util.js';
import requestUtil from '../util/request.util.js';
import oracleUtil from '../util/oracle.util.js';
import regioncd from '../regioncd/regioncd.js';
import config from '../config/config.js';

// const regioncdArr = await regioncd.getRegionCdFromDb();
// const yearMonthsArr = generateYearMonths(2020, 2024);
const regioncdArr = ["11170"]; // 임시 테스트용
const yearMonthsArr = ["202311"]; // 임시 테스트용

const columns = Object.entries(config.mapping.dandok).map((row) => row[1]);
for (let i = 0; i < yearMonthsArr.length; i++) {
    regioncdArr.forEach(async (regioncd) => {
        let data = await requestUtil.recursiveRequestRTMSDataSvc('dandok', regioncd, yearMonthsArr[i]);
            data.map(convertDandok);
            const arr = objectToArray(data, Object.keys(config.mapping.dandok));

            oracleUtil.insertMany('BUILDING', columns, arr);
    });
    await sleep(1000);
}

// API 데이터를 가공하여 DB에 알맞은 데이터로 변환
function convertDandok(row) {
    row.buildingType = '1'; // 단독/다가구
    row.deposit = ("" + row.deposit).replace(/,/g, '');
    row.monthlyRent = ("" + row.monthlyRent).replace(/,/g, '');
    row.makeDealDate = row.dealYear + ("0" + row.dealMonth).slice(-2) + ("0" + row.dealDay).slice(-2);
}
