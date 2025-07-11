import { sleep, objectToArrayWithMapper } from '../util/util.js';
import requestUtil from '../util/request.util.js';
import oracleUtil from '../util/oracle.util.js';
import config from '../config/config.js';

async function APItoDB(type, tableName, convertFunc, regionCdArr, yearMonthsArr) {
    if (config.apiInfo[type].limitPerDay < regionCdArr.length * yearMonthsArr.length)
        throw new Error("이대로 실행하면 API 호출 횟수 무조건 초과");
    const columns = Object.entries(config.mapping[type]).map((row) => row[1]);
    for (let i = 0; i < yearMonthsArr.length; i++) {
        regionCdArr.forEach(async (regionCd) => {
            let data = await requestUtil.recursiveRequestRTMSDataSvc(type, regionCd, yearMonthsArr[i]).map(convertFunc);
            const arr = objectToArrayWithMapper(data, config.mapping[type]);

            oracleUtil.insertMany(tableName, columns, arr);
        });

        // 초당 API 호출 횟수를 넘지 않도록 1초 대기
        // 지금은 regionCdArr.length만큼 한 번에 호출하고 1초 대기하는데
        // 나중에는 regionCdArr의 크기가 매우 커질 수 있음.
        // 그 때 가서 방법을 생각해봐야할듯. 다음과 같은 방식들을 생각해봄.
        // 1. 미리 배열 크기 계산해서 배열을 짤라서 호출 (regionCdArr.length가 100이 넘어가면 100개씩 짤라서 호출)
        // 2. 초당 API 호출 LIMIT 초과 ERROR가 뜬걸 확인하면 에러 뜬 항목을 포함해서 1초 뒤에 다시 호출
        await sleep(1000);
    }
}

export default { APItoDB };
