import axios from 'axios';
import type { AxiosResponse } from 'axios';
import type { PartialData } from '../types/index.js';
import secrets from "../config/secrets.json" with { type: "json" };
import config from '../config/config.js';

const numOfRows = 1000;

interface ApiResponse {
    response: {
        body: {
            items: {
                item: any[];
            };
            totalCount: number;
        };
    };
}

interface ApiErrorInfo {
    errMsg: string | null;
    returnAuthMsg: string | null;
    returnReasonCode: string | null;
}

interface ApiError extends Error {
    partialData?: PartialData;
}

async function recursiveRequestRTMSDataSvc(type: keyof typeof config.apiInfo, LAWD_CD: string, YEARMONTH: string, startPage: number = 1): Promise<any[]> {
    let pageNo = startPage;
    let totalCount: number = 0;
    let items: any[] = [];
    let lastSuccessfulPage = startPage - 1;

    do {
        let rows: any[];
        try {
            const response: AxiosResponse<ApiResponse | string> = await axios.get(config.apiInfo[type].url, {
                params: {
                    serviceKey: secrets.apikey[type as keyof typeof secrets.apikey],
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
                    const error: ApiError = new Error('SERVICE_KEY_IS_NOT_REGISTERED_ERROR: API 키가 등록되지 않았습니다.');
                    error.partialData = createPartialData(items, lastSuccessfulPage, pageNo, totalCount);
                    throw error;
                } else if (errorInfo.returnReasonCode === '22') {
                    const error: ApiError = new Error('LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR: API 호출 횟수가 초과되었습니다.');
                    error.partialData = createPartialData(items, lastSuccessfulPage, pageNo, totalCount);
                    throw error;
                } else if (errorInfo.returnReasonCode === '23') {
                    const error: ApiError = new Error('LIMITED_NUMBER_OF_SERVICE_REQUESTS_PER_SECOND_EXCEEDS_ERROR: 초당 API 호출 횟수가 초과되었습니다.');
                    error.partialData = createPartialData(items, lastSuccessfulPage, pageNo, totalCount);
                    throw error;
                } else {
                    const error: ApiError = new Error(`API 에러: ${errorInfo.errMsg} (코드: ${errorInfo.returnReasonCode})`);
                    error.partialData = createPartialData(items, lastSuccessfulPage, pageNo, totalCount);
                    throw error;
                }
            }

            const data = (response.data as ApiResponse).response;
            rows = data.body.items.item;
            totalCount = data.body.totalCount;

            // 성공한 페이지 데이터 추가
            items.push(...rows);
            lastSuccessfulPage = pageNo;

        } catch (err: any) {
            // 네트워크 에러 등 기타 에러 처리
            if (err.partialData) {
                // 이미 partialData가 있는 API 에러는 그대로 throw
                throw err;
            } else {
                // 새로운 에러에 partialData 추가
                console.error(`네트워크 에러 발생 (페이지 ${pageNo}):`, err.message);
                const apiError: ApiError = err;
                apiError.partialData = createPartialData(items, lastSuccessfulPage, pageNo, totalCount);
                throw apiError;
            }
        }

        pageNo++;
    } while ((pageNo - 1) * numOfRows < totalCount);
    return items;
}

// XML 에러 응답 파싱 함수
function parseXmlError(xmlString: string): ApiErrorInfo {
    function extractValue(tag: string): string | null {
        const regex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'i');
        const match = xmlString.match(regex);
        return match ? match[1] ?? null : null;
    }

    return {
        errMsg: extractValue('errMsg'),
        returnAuthMsg: extractValue('returnAuthMsg'),
        returnReasonCode: extractValue('returnReasonCode')
    };
}

// 부분 데이터 객체 생성 함수
function createPartialData(items: any[], lastSuccessfulPage: number, failedPage: number, totalCount: number): PartialData {
    return {
        collectedItems: items,
        lastSuccessfulPage: lastSuccessfulPage,
        failedPage: failedPage,
        totalCount: totalCount
    };
}

export default { recursiveRequestRTMSDataSvc };
