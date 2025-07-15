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
            transformData(rawData, context)
        );

        // Load
        // DB 삽입 실행
        allTransformedData.forEach(arr => {
            oracleUtil.insertMany(context.tableName, context.columns, arr);
        });

        await sleep(1000);
    }
}

// ==================== 헬퍼 함수들 ====================

// 데이터 변환 담당
const transformData = (rawData, context) => {
    const convertedData = rawData.map(context.convertFunc);
    return objectToArrayWithMapper(convertedData, context.mapping);
};

export default { APItoDB };
