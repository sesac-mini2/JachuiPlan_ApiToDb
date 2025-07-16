import config from '../config/config.js';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function pick(obj, props) {
    return props.reduce((result, prop) => {
        if (obj.hasOwnProperty(prop))
            result[prop] = obj[prop];
        return result;
    }, {});
}

// 객체를 지정된 순서에 따라 배열로 변환 (fieldMapping에 정의된 객체 속성 순서대로)
function objectToArrayWithMapper(obj, fieldMapping) {
    return Object.entries(obj).map(([key, value]) => {
        const result = [];
        Object.keys(fieldMapping).forEach((prop, index) => {
            let convertedValue = value[prop] ?? '';

            // String으로 저장된 Number 처리
            if (fieldMapping[prop].type === 'NUMBER' && typeof convertedValue === 'string') {
                if (convertedValue !== '')
                    convertedValue = Number(convertedValue);
                else
                    convertedValue = null;
            }
            // Number로 저장된 String 처리
            else if (fieldMapping[prop].type === 'STRING' && typeof convertedValue === 'number') {
                convertedValue = String(convertedValue);
            }

            result[index] = convertedValue;
        });
        return result;
    });
}

function generateYearMonths(startYearMonth, endYearMonth) {
    // 입력 검증 (길이만 검증)
    if (startYearMonth.length !== 6 || endYearMonth.length !== 6) {
        throw new Error('Invalid year-month format (YYYYMM)');
    }
    // 연도와 월로 분리
    const startYear = parseInt(startYearMonth.slice(0, 4), 10);
    const startMonth = parseInt(startYearMonth.slice(4), 10);
    const endYear = parseInt(endYearMonth.slice(0, 4), 10);
    const endMonth = parseInt(endYearMonth.slice(4), 10);

    const yearMonths = [];
    for (let year = startYear; year <= endYear; year++) {
        for (let month = 1; month <= 12; month++) {
            // 시작년월 이전 또는 마지막년월 이후의 월은 건너뜀
            if ((year === startYear && month < startMonth) || (year === endYear && month > endMonth)) {
                continue;
            }
            // 월을 두 자리 문자열로 변환
            const monthString = month < 10 ? '0' + month : month.toString();
            // "YYYYMM" 형식의 문자열 생성
            const yearMonth = `${year}${monthString}`;
            yearMonths.push(yearMonth);
        }
    }

    return yearMonths;
}

export { sleep, pick, objectToArrayWithMapper, generateYearMonths };
