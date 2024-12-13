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

function objectToArray(obj, mapping) {
    return Object.entries(obj).map(([key, value]) => {
        const result = [];
        for (const [index, prop] of Object.entries(mapping)) {
            // String으로 형변환, undefined일 경우 빈 문자열로 변환
            result[index] = "" + (value[prop] || '');
        }
        return result;
    });
}

function checkAllowedTable(table) {
    if (!config.allowedTables.includes(table)) {
        throw new Error('Invalid table name');
    }
}

function generateYearMonths(startYear = 2022, endYear = 2024) {
    const yearMonths = [];
    for (let year = startYear; year <= endYear; year++) {
        for (let month = 1; month <= 12; month++) {
            // 월이 한 자리일 경우 앞에 0을 추가하여 두 자리로 만듭니다.
            const monthString = month < 10 ? '0' + month : month.toString();
            // 연도와 월을 결합하여 "YYYYMM" 형식의 문자열을 생성합니다.
            const yearMonth = `${year}${monthString}`;
            yearMonths.push(yearMonth);
        }
    }
    return yearMonths;
}

export { sleep, pick, objectToArray, checkAllowedTable, generateYearMonths };
