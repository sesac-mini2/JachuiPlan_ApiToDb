import axios from 'axios';
import secrets from "../config/secrets.json" with { type: "json" };
import config from '../config/config.js';

const numOfRows = 1000;

async function recursiveRequestRTMSDataSvc(type, LAWD_CD, YEARMONTH, startPage = 1) {
    let pageNo = startPage;
    let totalCount;
    let items = [];
    let lastSuccessfulPage = startPage - 1;

    do {
        let rows;
        try {
            const response = await axios.get(config.apiInfo[type].url, {
                params: {
                    serviceKey: secrets.apikey[type],
                    pageNo: pageNo,
                    numOfRows: numOfRows,
                    LAWD_CD: LAWD_CD,
                    DEAL_YMD: YEARMONTH
                }
            });

            // XML 형식의 에러 응답 체크
            if (typeof response.data === 'string' && response.data.includes('<OpenAPI_ServiceResponse>')) {
                const errorInfo = parseXmlError(response.data);
                console.error(`API 에러 발생 (페이지 ${pageNo}): ${errorInfo.errMsg} (코드: ${errorInfo.returnReasonCode})`);

                // 에러 타입에 따른 처리
                if (errorInfo.returnReasonCode === '30') {
                    // 이미 수집한 데이터와 함께 에러 정보 반환
                    const error = new Error('SERVICE_KEY_IS_NOT_REGISTERED_ERROR: API 키가 등록되지 않았습니다.');
                    error.partialData = createPartialData(items, lastSuccessfulPage, pageNo, totalCount);
                    throw error;
                } else if (errorInfo.returnReasonCode === '22') {
                    const error = new Error('LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR: API 호출 횟수가 초과되었습니다.');
                    error.partialData = createPartialData(items, lastSuccessfulPage, pageNo, totalCount);
                    throw error;
                } else {
                    const error = new Error(`API 에러: ${errorInfo.errMsg} (코드: ${errorInfo.returnReasonCode})`);
                    error.partialData = createPartialData(items, lastSuccessfulPage, pageNo, totalCount);
                    throw error;
                }
            }

            const data = response.data.response;
            rows = data.body.items.item;
            totalCount = data.body.totalCount;

            // 성공한 페이지 데이터 추가
            items.push(...rows);
            lastSuccessfulPage = pageNo;

        } catch (err) {
            // 네트워크 에러 등 기타 에러 처리
            if (err.partialData) {
                // 이미 partialData가 있는 API 에러는 그대로 throw
                throw err;
            } else {
                // 새로운 에러에 partialData 추가
                console.error(`네트워크 에러 발생 (페이지 ${pageNo}):`, err.message);
                err.partialData = createPartialData(items, lastSuccessfulPage, pageNo, totalCount);
                throw err;
            }
        }

        pageNo++;
    } while ((pageNo - 1) * numOfRows < totalCount);
    return items;
}

// XML 에러 응답 파싱 함수
function parseXmlError(xmlString) {
    function extractValue (tag) {
        const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'i');
        const match = xmlString.match(regex);
        return match ? match[1] : null;
    }

    return {
        errMsg: extractValue('errMsg'),
        returnAuthMsg: extractValue('returnAuthMsg'),
        returnReasonCode: extractValue('returnReasonCode')
    };
}

// 부분 데이터 객체 생성 함수
function createPartialData(items, lastSuccessfulPage, failedPage, totalCount) {
    return {
        collectedItems: items,
        lastSuccessfulPage: lastSuccessfulPage,
        failedPage: failedPage,
        totalCount: totalCount
    };
}

export default { recursiveRequestRTMSDataSvc }
