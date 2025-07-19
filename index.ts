import config from "./config/config.js";
import { objectToArrayWithMapper, generateYearMonths } from "./util/util.js";
import regionCd from "./regioncd/regioncd.js";
import validator from "./transactionData/validator.js";
import converter from "./transactionData/converter.js";
import convertFunctions from "./transactionData/convertFunctions.js";
import oracleUtil from './util/oracle.util.js';
import performanceMonitor from './performance/monitor.js';

async function main(): Promise<void> {
    // 성능 모니터링 시작
    performanceMonitor.start();

    try {
        // Connection Pool 초기화
        console.log("Connection Pool을 초기화합니다...");
        await oracleUtil.createPool();

        // Pool 상태 확인
        const poolStatus = oracleUtil.getPoolStatus();
        console.log("초기 Pool 상태:", poolStatus);

        // node index.js [startYearMonth] [endYearMonth]
        const startYearMonth: string = process.argv[2] || "202411";
        const endYearMonth: string = process.argv[3] || "202411";

        // 오라클 DB에 API로 가져온 법정동코드, 행정구역 한국어 이름 데이터 삽입
        console.log("지역코드 데이터를 처리합니다...");
        const gu = regionCd.getRegionCdFromJson();
        const arr = objectToArrayWithMapper(gu, config.mapping.regionCd.fields);
        console.log(`${arr.length}개의 지역코드 데이터를 처리합니다.`);

        await oracleUtil.deleteRegionCdTableItems();
        const insertedRegionCd: number = await oracleUtil.bulkInsert('REGIONCD', Object.values(config.mapping.regionCd.fields), arr);

        // 성능 모니터링 기록
        performanceMonitor.recordInsert('REGIONCD', insertedRegionCd);
        performanceMonitor.recordBatch('REGIONCD', 1);

        // API 데이터 처리 준비
        const regionCdArr = await regionCd.getRegionCdFromDb();
        const yearMonthsArr: string[] = generateYearMonths(startYearMonth, endYearMonth);

        console.log(`처리할 지역: ${regionCdArr.length}개`);
        console.log(`처리할 기간: ${yearMonthsArr.length}개월 (${startYearMonth} ~ ${endYearMonth})`);
        console.log(`예상 총 API 호출 수: ${regionCdArr.length * yearMonthsArr.length * 3}개`);

        // API 호출 전 검증
        await validator.validateAll('dandok', regionCdArr, yearMonthsArr);
        await validator.validateAll('yeonlip', regionCdArr, yearMonthsArr);
        await validator.validateAll('officeHotel', regionCdArr, yearMonthsArr);

        // 데이터 변환 및 DB 저장
        console.log("\n=== 데이터 수집 및 변환 시작 ===");
        console.log(`경과 시간: ${performanceMonitor.getElapsedTimeFormatted()}`);

        // 단독/다가구
        console.log("\n1. 단독/다가구 데이터 처리 시작");
        await converter.APItoDB('dandok', 'BUILDING', convertFunctions.dandok, regionCdArr, yearMonthsArr);
        console.log(`단독/다가구 완료 - 경과 시간: ${performanceMonitor.getElapsedTimeFormatted()}`);

        // 연립다세대
        console.log("\n2. 연립다세대 데이터 처리 시작");
        await converter.APItoDB('yeonlip', 'BUILDING', convertFunctions.yeonlip, regionCdArr, yearMonthsArr);
        console.log(`연립다세대 완료 - 경과 시간: ${performanceMonitor.getElapsedTimeFormatted()}`);

        // 오피스텔
        console.log("\n3. 오피스텔 데이터 처리 시작");
        await converter.APItoDB('officeHotel', 'OFFICE_HOTEL', convertFunctions.officeHotel, regionCdArr, yearMonthsArr);
        console.log(`오피스텔 완료 - 경과 시간: ${performanceMonitor.getElapsedTimeFormatted()}`);

        console.log("\n=== 모든 데이터 처리가 완료되었습니다 ===");

        // 최종 Pool 상태 확인
        const finalPoolStatus = oracleUtil.getPoolStatus();
        console.log("최종 Pool 상태:", finalPoolStatus);

    } catch (error) {
        console.error("메인 처리 중 오류 발생:", error);
        performanceMonitor.recordError('MAIN', 1);
    } finally {
        // Connection Pool 종료
        console.log("Connection Pool을 종료합니다...");
        await oracleUtil.closePool();

        // 성능 모니터링 종료
        performanceMonitor.end();
    }
}

// 메인 함수 실행
main().catch(console.error);
