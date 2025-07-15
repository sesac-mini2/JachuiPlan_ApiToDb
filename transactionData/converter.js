import { sleep, objectToArrayWithMapper } from '../util/util.js';
import requestUtil from '../util/request.util.js';
import oracleUtil from '../util/oracle.util.js';
import config from '../config/config.js';

// ==================== 메인 함수 ====================

async function APItoDB(type, tableName, convertFunc, regionCdArr, yearMonthsArr) {
    if (config.apiInfo[type].limitPerDay < regionCdArr.length * yearMonthsArr.length)
        throw new Error("이대로 실행하면 API 호출 횟수 무조건 초과");

    // 공통 컨텍스트 객체 생성
    const context = {
        type,                    // API 타입
        tableName,               // 테이블 명
        convertFunc,             // 변환 함수
        columns: Object.entries(config.mapping[type]).map((row) => row[1]), // 컬럼 배열
        mapping: config.mapping[type],  // API/DB 필드간 매핑 정보
    };

    for (const yearMonth of yearMonthsArr) {
        console.log(`\n=== ${yearMonth} 처리 시작 ===`);

        // API 요청을 병렬로 실행
        const dataPromises = regionCdArr.map(regionCd =>
            requestUtil.recursiveRequestRTMSDataSvc(type, regionCd, yearMonth)
                .then(data => processApiResponse(regionCd, yearMonth, data))
                .catch(error => processApiError(regionCd, yearMonth, error))
        );

        const allResults = await Promise.all(dataPromises);

        // 성공한 요청들과 실패한 요청들, 부분 성공 요청들 분리
        const succeededRequests = allResults.filter(result => result.status === 'fulfilled');
        const partialRequests = allResults.filter(result => result.status === 'partial');
        const failedRequests = allResults.filter(result => result.status === 'rejected');

        console.log(`초기 요청 결과: ${succeededRequests.length}개 성공, ${partialRequests.length}개 부분 성공, ${failedRequests.length}개 실패`);

        // 성공한 데이터 처리
        const allSuccessfulRequests = [...succeededRequests, ...partialRequests];
        if (allSuccessfulRequests.length > 0) {
            const rawData = allSuccessfulRequests.map(result => result.value);
            const allTransformedData = rawData.map(data => transformData(data, context));

            // DB 삽입 실행
            allTransformedData.forEach(arr => {
                oracleUtil.insertMany(context.tableName, context.columns, arr);
            });
        }

        await sleep(1000);
    }
}

// ==================== 헬퍼 함수들 ====================

// 데이터 변환 담당
const transformData = (rawData, context) => {
    const convertedData = rawData.map(context.convertFunc);
    return objectToArrayWithMapper(convertedData, context.mapping);
};

// 에러 처리 및 상태 분류
const processApiResponse = (regionCd, yearMonth, data) => {
    return { status: 'fulfilled', value: data, regionCd, yearMonth };
};

const processApiError = (regionCd, yearMonth, error) => {
    // 부분 데이터가 있는 경우 처리
    if (error.partialData && error.partialData.collectedItems.length > 0) {
        console.warn(`부분 데이터 수집됨 - ${regionCd} ${yearMonth}: ${error.partialData.collectedItems.length}개 항목 (페이지 ${error.partialData.lastSuccessfulPage}까지)`);
        return {
            status: 'partial',
            value: error.partialData.collectedItems,
            regionCd,
            yearMonth,
            error: error,
            partialData: error.partialData
        };
    }
    return { status: 'rejected', reason: error, regionCd, yearMonth };
};

export default { APItoDB };
