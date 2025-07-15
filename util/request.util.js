import axios from 'axios';
import secrets from "../config/secrets.json" with { type: "json" };
import config from '../config/config.js';

const numOfRows = 1000;

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

async function recursiveRequestRTMSDataSvc(type, LAWD_CD, YEARMONTH) {
    let pageNo = 1;
    let totalCount;
    let items = [];
    do {
        let rows;
        {
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
                console.error(`API 에러 발생: ${errorInfo.errMsg} (코드: ${errorInfo.returnReasonCode})`);

                // 에러 타입에 따른 처리
                if (errorInfo.returnReasonCode === '30') {
                    throw new Error('SERVICE_KEY_IS_NOT_REGISTERED_ERROR: API 키가 등록되지 않았습니다.');
                } else if (errorInfo.returnReasonCode === '22') {
                    throw new Error('LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR: API 호출 횟수가 초과되었습니다.');
                } else {
                    throw new Error(`API 에러: ${errorInfo.errMsg} (코드: ${errorInfo.returnReasonCode})`);
                }
            }

            const data = response.data.response;
            try {
                rows = data.body.items.item;
                totalCount = data.body.totalCount;
            } catch (err) {
                // console.log("ERROR: " + pageNo + " " + LAWD_CD + " " + YEARMONTH);
                console.log(response);
                console.error(err);
                process.exit(1);
            }
        }
        items.push(...rows);
        pageNo++;
    } while ((pageNo - 1) * numOfRows < totalCount);
    return items;
}

export default { recursiveRequestRTMSDataSvc }
