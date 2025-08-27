import { sleep, objectToArrayWithMapper } from '../util/util.js';
import requestUtil from '../util/request.util.js';
import oracleUtil from '../util/oracle.util.js';
import config from '../config/config.js';
import performanceMonitor from '../performance/monitor.js';
import type { ConvertFunction, ColumnMapping, ApiRequestResult, RetryResult, FailedRequest, BatchInfo } from '../types/index.js';

export interface ProcessingContext {
    type: keyof typeof config.apiInfo;
    tableName: string;
    convertFunc: ConvertFunction;
    columns: ColumnMapping[];
    fieldMapping: Record<string, ColumnMapping>;
}

// ==================== 메인 함수 ====================

async function APItoDB(
    type: keyof typeof config.apiInfo,
    tableName: string,
    convertFunc: ConvertFunction,
    regionCdArr: string[],
    yearMonthsArr: string[]
): Promise<void> {
    // 공통 컨텍스트 객체 생성
    const typeMapping = config.mapping[type];
    if (!typeMapping) {
        throw new Error(`Mapping configuration not found for type: ${type}`);
    }

    const context: ProcessingContext = {
        type,                    // API 타입
        tableName,               // 테이블 명
        convertFunc,             // 변환 함수
        columns: Object.values(typeMapping.fields), // 컬럼 배열
        fieldMapping: typeMapping.fields,  // API/DB 필드간 매핑 정보
    };

    // 실행 상태 데이터
    const allFailedRequests: FailedRequest[] = [];
    let successfulDataCount = 0;

    // 1. 연월별 초기 처리
    for (const yearMonth of yearMonthsArr) {
        const { succeededRequests, partialRequests, failedRequests } = await processYearMonth(context.type as keyof typeof config.apiInfo, regionCdArr, yearMonth);

        // 2. 성공한 데이터 즉시 처리
        successfulDataCount += await processSuccessfulData(succeededRequests, partialRequests, context);

        // 3. 실패한 요청들 수집
        const partialRetryRequests = createPartialRetryRequests(partialRequests);
        allFailedRequests.push(...failedRequests, ...partialRetryRequests);
    }

    // 4. 실패한 요청들 일괄 재시도
    successfulDataCount += await processFailedRequests(context, allFailedRequests);

    // 5. 처리 완료 로그
    console.log(`\n=== 전체 처리 완료 ===`);
    console.log(`총 ${successfulDataCount}개의 데이터셋이 성공적으로 처리되었습니다.`);
}

// ==================== 헬퍼 함수들 ====================

// 연월별 초기 API 요청 처리
const processYearMonth = async (
    type: keyof typeof config.apiInfo,
    regionCdArr: string[],
    yearMonth: string
): Promise<{
    succeededRequests: ApiRequestResult[];
    partialRequests: ApiRequestResult[];
    failedRequests: FailedRequest[];
}> => {
    console.log(`\n=== ${yearMonth} 처리 시작 ===`);

    // API 요청을 병렬로 실행
    const dataPromises = regionCdArr.map(regionCd =>
        requestUtil.recursiveRequestRTMSDataSvc(type, regionCd, yearMonth)
            .then(data => processApiResponse(regionCd, yearMonth, data))
            .catch(error => processApiError(regionCd, yearMonth, error))
    );

    const allResults = await Promise.all(dataPromises);

    // 성공한 요청들과 실패한 요청들, 부분 성공 요청들 분리
    const succeededRequests = allResults.filter(result => result.status === 'fulfilled') as ApiRequestResult[];
    const partialRequests = allResults.filter(result => result.status === 'partial') as ApiRequestResult[];
    const failedRequests = allResults.filter(result => result.status === 'rejected').map(result => ({
        regionCd: result.regionCd,
        yearMonth: result.yearMonth,
        reason: result.reason || new Error('Unknown error')
    })) as FailedRequest[];

    console.log(`초기 요청 결과: ${succeededRequests.length}개 성공, ${partialRequests.length}개 부분 성공, ${failedRequests.length}개 실패`);

    return { succeededRequests, partialRequests, failedRequests };
};

// 부분 성공 요청들의 재시도 정보 생성
const createPartialRetryRequests = (partialRequests: ApiRequestResult[]): FailedRequest[] => {
    return partialRequests.map(result => ({
        regionCd: result.regionCd,
        yearMonth: result.yearMonth,
        reason: result.error || new Error('Partial data collection'),
        startPage: result.partialData ? result.partialData.lastSuccessfulPage + 1 : 1,
        totalCount: result.partialData?.totalCount
    }));
};

// 실패한 요청들 일괄 재시도 처리
const processFailedRequests = async (context: ProcessingContext, allFailedRequests: FailedRequest[]): Promise<number> => {
    if (allFailedRequests.length === 0) return 0;

    console.log(`\n=== 실패한 요청들 일괄 재시도 시작 ===`);
    console.log(`총 ${allFailedRequests.length}개의 실패한 요청들을 재시도합니다.`);

    let successfulDataCount = 0;

    // 실패한 요청들을 작은 배치로 나누어 처리 (API 제한 고려)
    const batchSize = 100;
    const batches: FailedRequest[][] = [];

    for (let i = 0; i < allFailedRequests.length; i += batchSize) {
        batches.push(allFailedRequests.slice(i, i + batchSize));
    }

    for (const batch of batches) {
        console.log(`배치 처리: ${batch.length}개 요청`);

        // 배치 간 대기를 미리 시작 (병렬 처리)
        const waitPromise = sleep(1000);

        const retryResult = await retryFailedRequests(context.type as keyof typeof config.apiInfo, batch);

        // 재시도 성공한 데이터 처리
        if (retryResult.succeeded.length > 0) {
            const rawData = retryResult.succeeded.map(result => result.value);
            const transformedData = rawData.map(data => transformData(data, context));

            // 각 데이터셋을 개별적으로 DB에 삽입 (병렬 처리, 완료 대기)
            successfulDataCount += await insertTransformedDataToDB(transformedData, retryResult.succeeded, context);
        }

        // 최종 실패한 요청들 로그
        if (retryResult.failed.length > 0) {
            console.error(`배치 내 최종 실패한 요청들:`);
            retryResult.failed.forEach(({ regionCd, yearMonth, reason }) => {
                console.error(`- ${regionCd} ${yearMonth}: ${reason.message}`);
            });
        }

        // 배치 간 대기 완료 확인 (처리가 1초보다 빠르면 남은 시간만 대기)
        await waitPromise;
    }

    return successfulDataCount;
};

// 실패한 요청들을 재시도하는 함수
const retryFailedRequests = async (
    type: keyof typeof config.apiInfo,
    failedRequests: FailedRequest[],
    maxRetries: number = 3
): Promise<RetryResult> => {
    let retryCount = 0;
    let currentFailedRequests = [...failedRequests];

    while (currentFailedRequests.length > 0 && retryCount < maxRetries) {
        console.log(`재시도 ${retryCount + 1}/${maxRetries}: ${currentFailedRequests.length}개 요청 재시도`);

        // 재시도 간 대기를 미리 시작 (병렬 처리)
        const waitPromise = sleep(1000);

        // 실패한 요청들만 재시도
        const retryPromises = currentFailedRequests.map(({ regionCd, yearMonth, startPage = 1 }) => {
            console.log(`재시도: ${regionCd} ${yearMonth} (페이지 ${startPage}부터)`);

            return requestUtil.recursiveRequestRTMSDataSvc(type, regionCd, yearMonth, startPage)
                .then(data => ({ status: 'fulfilled' as const, value: data, regionCd, yearMonth }))
                .catch(error => {
                    // 부분 데이터가 있는 경우 처리
                    if (error.partialData && error.partialData.collectedItems.length > 0) {
                        console.warn(`재시도 중 부분 데이터 수집됨 - ${regionCd} ${yearMonth}: ${error.partialData.collectedItems.length}개 항목 (페이지 ${error.partialData.lastSuccessfulPage}까지)`);
                        return {
                            status: 'partial' as const,
                            value: error.partialData.collectedItems,
                            regionCd,
                            yearMonth,
                            error: error,
                            partialData: error.partialData
                        };
                    }
                    return { status: 'rejected' as const, reason: error, regionCd, yearMonth };
                });
        });

        const retryResults = await Promise.all(retryPromises);

        // 성공한 요청들과 여전히 실패한 요청들, 부분 성공 요청들 분리
        const succeededRequests = retryResults.filter(result => result.status === 'fulfilled') as ApiRequestResult[];
        const partialRequests = retryResults.filter(result => result.status === 'partial') as ApiRequestResult[];
        const stillFailedRequests = retryResults.filter(result => result.status === 'rejected').map(result => ({
            regionCd: result.regionCd,
            yearMonth: result.yearMonth,
            reason: result.reason || new Error('Unknown error')
        })) as FailedRequest[];

        console.log(`재시도 결과: ${succeededRequests.length}개 성공, ${partialRequests.length}개 부분 성공, ${stillFailedRequests.length}개 실패`);

        // 성공한 요청들과 부분 성공 요청들을 반환할 배열에 추가
        const allSucceededInRetry = [...succeededRequests, ...partialRequests];

        // 부분 성공한 요청들의 재시도 정보 생성 (다음 재시도를 위해)
        const newPartialRetryRequests = partialRequests.map(result => ({
            regionCd: result.regionCd,
            yearMonth: result.yearMonth,
            reason: result.error || new Error('Partial data collection'),
            startPage: result.partialData ? result.partialData.lastSuccessfulPage + 1 : 1,
            totalCount: result.partialData?.totalCount
        }));

        // 다음 재시도를 위해 완전 실패한 요청들과 부분 성공 요청들 결합
        currentFailedRequests = [...stillFailedRequests, ...newPartialRetryRequests];

        // 성공한 요청들을 반환할 배열에 추가
        if (allSucceededInRetry.length > 0) {
            return { succeeded: allSucceededInRetry, failed: currentFailedRequests };
        }

        retryCount++;

        // 재시도 간 대기 완료 확인 (처리가 1초보다 빠르면 남은 시간만 대기)
        await waitPromise;
    }

    return { succeeded: [], failed: currentFailedRequests };
};

// 데이터 변환 담당
const transformData = (rawData: any[], context: ProcessingContext): any[][] => {
    const convertedData = rawData.map(context.convertFunc);
    return objectToArrayWithMapper(convertedData, context.fieldMapping);
};

// 변환된 데이터를 DB에 삽입하는 최적화된 함수
const insertTransformedDataToDB = async (
    transformedData: any[][][],
    requests: ApiRequestResult[],
    context: ProcessingContext
): Promise<number> => {
    // 모든 배치를 하나로 합치기
    const combinedData: any[][] = [];
    const batchInfo: BatchInfo[] = [];

    transformedData.forEach((batch, index) => {
        const request = requests[index];
        if (!request) return; // 안전 가드

        const startIndex = combinedData.length;
        combinedData.push(...batch);
        batchInfo.push({
            index,
            startIndex,
            endIndex: combinedData.length - 1,
            request
        });
    });

    if (combinedData.length === 0) {
        return 0;
    }

    try {
        // 대량 삽입 사용
        const batchSize = Math.min(1000, combinedData.length);
        const insertedRows = await oracleUtil.bulkInsert(context.tableName, context.columns, combinedData, batchSize);

        // 성능 모니터링 기록
        performanceMonitor.recordInsert(context.tableName, insertedRows);
        performanceMonitor.recordBatch(context.tableName, 1);

        console.log(`DB 삽입 완료: ${insertedRows}개 행 (요청 ${requests.length}개)`);
        return requests.length; // 성공한 요청 개수 반환
    } catch (error) {
        console.error(`대량 삽입 실패, 개별 삽입으로 전환:`, (error as Error).message);
        performanceMonitor.recordError(context.tableName, 1);

        // 대량 삽입 실패 시 개별 배치로 폴백
        let successCount = 0;
        for (const batch of batchInfo) {
            try {
                const batchData = combinedData.slice(batch.startIndex, batch.endIndex + 1);
                const insertedRows = await oracleUtil.insertMany(context.tableName, context.columns, batchData);

                // 성능 모니터링 기록
                performanceMonitor.recordInsert(context.tableName, insertedRows);
                performanceMonitor.recordBatch(context.tableName, 1);

                successCount++;
                console.log(`개별 삽입 성공: ${batch.request.regionCd} ${batch.request.yearMonth}`);
            } catch (batchError) {
                console.error(`개별 삽입 실패 - ${batch.request.regionCd} ${batch.request.yearMonth}:`, (batchError as Error).message);
                performanceMonitor.recordError(context.tableName, 1);
            }
        }
        return successCount;
    }
};

// 성공한 데이터 즉시 처리
const processSuccessfulData = async (
    succeededRequests: ApiRequestResult[],
    partialRequests: ApiRequestResult[],
    context: ProcessingContext
): Promise<number> => {
    const allSuccessfulRequests = [...succeededRequests, ...partialRequests];
    if (allSuccessfulRequests.length === 0) return 0;

    const rawData = allSuccessfulRequests.map(result => result.value);
    const transformedData = rawData.map(data => transformData(data, context));

    // Load - 성공한 데이터 즉시 DB 삽입 (병렬 처리, 완료 대기)
    return await insertTransformedDataToDB(transformedData, allSuccessfulRequests, context);
};

// 에러 처리 및 상태 분류
const processApiResponse = (regionCd: string, yearMonth: string, data: any): ApiRequestResult => {
    return { status: 'fulfilled', value: data, regionCd, yearMonth };
};

const processApiError = (regionCd: string, yearMonth: string, error: any): ApiRequestResult => {
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
export type { ApiRequestResult, FailedRequest, RetryResult };
