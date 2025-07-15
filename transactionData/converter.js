import { sleep, objectToArrayWithMapper } from '../util/util.js';
import requestUtil from '../util/request.util.js';
import oracleUtil from '../util/oracle.util.js';
import config from '../config/config.js';

// ==================== 메인 함수 ====================

async function APItoDB(type, tableName, convertFunc, regionCdArr, yearMonthsArr) {
    // 1. 초기 설정 및 검증
    if (config.apiInfo[type].limitPerDay < regionCdArr.length * yearMonthsArr.length) {
        throw new Error("이대로 실행하면 API 호출 횟수 무조건 초과");
    }

    // 공통 컨텍스트 객체 생성
    const context = {
        type,                    // API 타입
        tableName,               // 테이블 명
        convertFunc,             // 변환 함수
        columns: Object.entries(config.mapping[type]).map((row) => row[1]), // 컬럼 배열
        mapping: config.mapping[type],  // API/DB 필드간 매핑 정보
    };

    // 실행 상태 데이터
    const allFailedRequests = [];
    const allSuccessfulData = [];

    // 2. 연월별 초기 처리
    for (const yearMonth of yearMonthsArr) {
        const { succeededRequests, partialRequests, failedRequests } = await processYearMonth(context.type, regionCdArr, yearMonth);

        // 3. 성공한 데이터 즉시 처리
        processSuccessfulData(succeededRequests, partialRequests, context, allSuccessfulData);

        // 4. 실패한 요청들 수집
        const partialRetryRequests = createPartialRetryRequests(partialRequests);
        allFailedRequests.push(...failedRequests, ...partialRetryRequests);
    }

    // 5. 실패한 요청들 일괄 재시도
    await processFailedRequests(context, allFailedRequests, allSuccessfulData);

    // 6. 처리 완료 로그
    console.log(`\n=== 전체 처리 완료 ===`);
    console.log(`총 ${allSuccessfulData.length}개의 데이터셋이 성공적으로 처리되었습니다.`);
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

// 연월별 초기 API 요청 처리
const processYearMonth = async (type, regionCdArr, yearMonth) => {
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

    return { succeededRequests, partialRequests, failedRequests };
};

// 성공한 데이터 즉시 처리
const processSuccessfulData = (succeededRequests, partialRequests, context, allSuccessfulData) => {
    const allSuccessfulRequests = [...succeededRequests, ...partialRequests];
    if (allSuccessfulRequests.length > 0) {
        const rawData = allSuccessfulRequests.map(result => result.value);
        const transformedData = rawData.map(data => transformData(data, context));

        // Load - 성공한 데이터 즉시 DB 삽입
        transformedData.forEach(arr => {
            oracleUtil.insertMany(context.tableName, context.columns, arr);
        });

        allSuccessfulData.push(...transformedData);
    }
};

// 부분 성공 요청들의 재시도 정보 생성
const createPartialRetryRequests = (partialRequests) => {
    return partialRequests.map(result => ({
        regionCd: result.regionCd,
        yearMonth: result.yearMonth,
        reason: result.error,
        startPage: result.partialData.lastSuccessfulPage + 1,
        totalCount: result.partialData.totalCount
    }));
};

// 실패한 요청들 일괄 재시도 처리
const processFailedRequests = async (context, allFailedRequests, allSuccessfulData) => {
    if (allFailedRequests.length === 0) return;

    console.log(`\n=== 실패한 요청들 일괄 재시도 시작 ===`);
    console.log(`총 ${allFailedRequests.length}개의 실패한 요청들을 재시도합니다.`);

    // 실패한 요청들을 작은 배치로 나누어 처리 (API 제한 고려)
    const batchSize = 100;
    const batches = [];

    for (let i = 0; i < allFailedRequests.length; i += batchSize) {
        batches.push(allFailedRequests.slice(i, i + batchSize));
    }

    for (const batch of batches) {
        console.log(`배치 처리: ${batch.length}개 요청`);
        const retryResult = await retryFailedRequests(context.type, batch);

        // 재시도 성공한 데이터 처리
        if (retryResult.succeeded.length > 0) {
            const rawData = retryResult.succeeded.map(result => result.value);
            const transformedData = rawData.map(data => transformData(data, context));

            transformedData.forEach(arr => {
                oracleUtil.insertMany(context.tableName, context.columns, arr);
            });

            allSuccessfulData.push(...transformedData);
        }

        // 최종 실패한 요청들 로그
        if (retryResult.failed.length > 0) {
            console.error(`배치 내 최종 실패한 요청들:`);
            retryResult.failed.forEach(({ regionCd, yearMonth, reason }) => {
                console.error(`- ${regionCd} ${yearMonth}: ${reason.message}`);
            });
        }

        // 배치 간 대기
        await sleep(1000);
    }
};

// 실패한 요청들을 재시도하는 함수
const retryFailedRequests = async (type, failedRequests, maxRetries = 3) => {
    let retryCount = 0;
    let currentFailedRequests = [...failedRequests];

    while (currentFailedRequests.length > 0 && retryCount < maxRetries) {
        console.log(`재시도 ${retryCount + 1}/${maxRetries}: ${currentFailedRequests.length}개 요청 재시도`);

        // 실패한 요청들만 재시도
        const retryPromises = currentFailedRequests.map(({ regionCd, yearMonth, startPage = 1 }) => {
            console.log(`재시도: ${regionCd} ${yearMonth} (페이지 ${startPage}부터)`);

            return requestUtil.recursiveRequestRTMSDataSvc(type, regionCd, yearMonth, startPage)
                .then(data => ({ status: 'fulfilled', value: data, regionCd, yearMonth }))
                .catch(error => {
                    // 부분 데이터가 있는 경우 처리
                    if (error.partialData && error.partialData.collectedItems.length > 0) {
                        console.warn(`재시도 중 부분 데이터 수집됨 - ${regionCd} ${yearMonth}: ${error.partialData.collectedItems.length}개 항목 (페이지 ${error.partialData.lastSuccessfulPage}까지)`);
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
                });
        });

        const retryResults = await Promise.all(retryPromises);

        // 성공한 요청들과 여전히 실패한 요청들, 부분 성공 요청들 분리
        const succeededRequests = retryResults.filter(result => result.status === 'fulfilled');
        const partialRequests = retryResults.filter(result => result.status === 'partial');
        const stillFailedRequests = retryResults.filter(result => result.status === 'rejected');

        console.log(`재시도 결과: ${succeededRequests.length}개 성공, ${partialRequests.length}개 부분 성공, ${stillFailedRequests.length}개 실패`);

        // 성공한 요청들과 부분 성공 요청들을 반환할 배열에 추가
        const allSucceededInRetry = [...succeededRequests, ...partialRequests];

        // 부분 성공한 요청들의 재시도 정보 생성 (다음 재시도를 위해)
        const newPartialRetryRequests = partialRequests.map(result => ({
            regionCd: result.regionCd,
            yearMonth: result.yearMonth,
            reason: result.error,
            startPage: result.partialData.lastSuccessfulPage + 1,
            totalCount: result.partialData.totalCount
        }));

        // 다음 재시도를 위해 완전 실패한 요청들과 부분 성공 요청들 결합
        currentFailedRequests = [...stillFailedRequests, ...newPartialRetryRequests];

        // 성공한 요청들을 반환할 배열에 추가
        if (allSucceededInRetry.length > 0) {
            return { succeeded: allSucceededInRetry, failed: currentFailedRequests };
        }

        retryCount++;

        // 요청 사이 1초 대기
        await sleep(1000);
    }

    return { succeeded: [], failed: currentFailedRequests };
};

export default { APItoDB };
