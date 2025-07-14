import { sleep, objectToArrayWithMapper } from '../util/util.js';
import requestUtil from '../util/request.util.js';
import oracleUtil from '../util/oracle.util.js';
import config from '../config/config.js';

// 데이터 변환 담당
const transformData = (rawData, convertFunc, mapping) => {
    const convertedData = rawData.map(convertFunc);
    return objectToArrayWithMapper(convertedData, mapping);
};

// 사이드 이펙트를 포함한 메인 함수
async function APItoDB(type, tableName, convertFunc, regionCdArr, yearMonthsArr) {
    if (config.apiInfo[type].limitPerDay < regionCdArr.length * yearMonthsArr.length)
        throw new Error("이대로 실행하면 API 호출 횟수 무조건 초과");

    const columns = Object.entries(config.mapping[type]).map((row) => row[1]);
    const mapping = config.mapping[type];

    for (const yearMonth of yearMonthsArr) {
        // Extract
        // API 요청을 병렬로 실행
        const dataPromises = regionCdArr.map(regionCd =>
            requestUtil.recursiveRequestRTMSDataSvc(type, regionCd, yearMonth)
        );

        // 모든 API 요청이 완료될 때까지 대기
        const allRawData = await Promise.all(dataPromises);

        // Transform
        // 데이터 변환
        const allTransformedData = allRawData.map(rawData =>
            transformData(rawData, convertFunc, mapping)
        );

        // Load
        // DB 삽입 실행
        allTransformedData.forEach(arr => {
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
