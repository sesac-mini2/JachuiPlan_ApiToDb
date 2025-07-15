import config from '../config/config.js';

// 간단한 로그 유틸리티
const log = {
    info: (message) => console.log(`[INFO] ${message}`),
    error: (message) => console.error(`[ERROR] ${message}`)
};

// ==================== 검증 함수들 ====================

/**
 * API 호출 제한량 검증
 */
const validateApiLimits = (type, regionCdArr, yearMonthsArr) => {
    const totalRequests = regionCdArr.length * yearMonthsArr.length;
    const dailyLimit = config.apiInfo[type].limitPerDay;

    if (dailyLimit < totalRequests) {
        throw new Error(`API 호출 제한 초과: 예정 최소 요청 수(${totalRequests}) > 일일 제한(${dailyLimit})`);
    }

    log.info(`API 호출 제한 검증 통과: ${totalRequests}/${dailyLimit} 요청`);
    return true;
};

/**
 * 설정 파일 검증
 */
const validateConfig = (type) => {
    if (!config.apiInfo || !config.apiInfo[type]) {
        throw new Error(`API 설정 정보가 없습니다: ${type}`);
    }

    if (!config.mapping || !config.mapping[type]) {
        throw new Error(`매핑 정보가 없습니다: ${type}`);
    }

    if (!config.apiInfo[type].limitPerDay || typeof config.apiInfo[type].limitPerDay !== 'number') {
        throw new Error(`API 일일 제한 설정이 올바르지 않습니다: ${type}`);
    }

    log.info('설정 파일 검증 통과');
    return true;
};

/**
 * 지역 코드 형식 검증
 */
const validateRegionCodes = (regionCdArr) => {
    for (const regionCd of regionCdArr) {
        if (!regionCd || typeof regionCd !== 'string') {
            throw new Error(`올바르지 않은 지역 코드: ${regionCd}`);
        }

        // 지역 코드는 5자리 숫자여야 함
        if (!/^\d{5}$/.test(regionCd)) {
            throw new Error(`지역 코드 형식이 올바르지 않습니다: ${regionCd} (5자리 숫자여야 함)`);
        }
    }

    log.info(`지역 코드 검증 통과: ${regionCdArr.length}개 지역`);
    return true;
};

/**
 * 전체 초기 검증 실행
 */
const validateAll = (type, regionCdArr, yearMonthsArr) => {
    log.info(`=== ${type} 초기 검증 시작 ===`);

    try {
        // 1. 설정 파일 검증
        validateConfig(type);

        // 2. 지역 코드 형식 검증
        validateRegionCodes(regionCdArr);

        // 3. API 호출 제한량 검증
        validateApiLimits(type, regionCdArr, yearMonthsArr);

        log.info(`=== ${type} 모든 초기 검증 완료 ===`);
        return true;

    } catch (error) {
        log.error(`초기 검증 실패: ${error.message}`);
        throw error;
    }
};

export default {
    validateAll,
    validateApiLimits,
    validateConfig,
    validateRegionCodes
};
