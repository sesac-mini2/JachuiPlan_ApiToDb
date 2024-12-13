import { sleep, objectToArray } from '../util/util.js';
import requestUtil from '../util/request.util.js';
import oracleUtil from '../util/oracle.util.js';
import config from '../config/config.js';

async function APItoDB(type, tableName, convertFunc, regionCdArr, yearMonthsArr) {
    if (config.apiInfo[type].limitPerDay < regionCdArr.length * yearMonthsArr.length)
        throw new Error("이대로 실행하면 API 호출 횟수 무조건 초과");
    const columns = Object.entries(config.mapping[type]).map((row) => row[1]);
    for (let i = 0; i < yearMonthsArr.length; i++) {
        regionCdArr.forEach(async (regionCd) => {
            let data = await requestUtil.recursiveRequestRTMSDataSvc(type, regionCd, yearMonthsArr[i]);
            data.map(convertFunc);
            const arr = objectToArray(data, Object.keys(config.mapping[type]));

            oracleUtil.insertMany(tableName, columns, arr);
        });

        // 초당 API 호출 횟수를 넘지 않도록 1초 대기
        await sleep(1000);
    }
}

export default { APItoDB };
