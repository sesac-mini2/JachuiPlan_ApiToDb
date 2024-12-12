import request from 'request-promise';
import convert from 'xml-js';
import secrets from "../config/secrets.json" with { type: "json" };
import xmlUtil from "../util/xml-js.util.js";
import oracleUtil from '../util/oracle.util.js';
import config from '../config/config.js';

// let regioncdArr = await getSggRegionCd();
let regioncdArr = ["11170"]; // 임시 테스트용
const numOfRows = 1000;
regioncdArr.forEach(regioncd => {
    recursiveRequestRTMSDataSvcRHRent(regioncd, "202411", numOfRows);
});

async function recursiveRequestRTMSDataSvcRHRent(LAWD_CD, YEARMONTH, numOfRows) {
    let pageNo = 1;
    let totalCount;
    do {
        let response = await request.get(makeRTMSDataSvcRHRentUri(pageNo, numOfRows, LAWD_CD, YEARMONTH), function (error, response, body) { });
        let header, rows;
        {
            let jsonbody = convert.xml2js(response, xmlUtil.options);
            header = jsonbody.response.header;
            // head = {
            //     numOfRows: jsonbody.response.body.numOfRows,
            //     pageNo: jsonbody.response.body.pageNo,
            //     totalCount: jsonbody.response.body.totalCount
            // }
            rows = jsonbody.response.body.items.item;
            totalCount = jsonbody.response.body.totalCount;
        }
        // console.log(rows);
        console.log("pageNo: " + pageNo);
        console.log("numOfRows: " + numOfRows);
        console.log("totalCount: " + totalCount);
        pageNo++;
    } while ((pageNo - 1) * numOfRows < totalCount);
}

function makeRTMSDataSvcRHRentUri(pageNo, numOfRows, LAWD_CD, YEARMONTH) {
    let uri = `https://apis.data.go.kr/1613000/RTMSDataSvcRHRent/getRTMSDataSvcRHRent?serviceKey=${secrets.apikey.getRTMSDataSvcRHRent}&pageNo=${pageNo}&numOfRows=${numOfRows}&LAWD_CD=${LAWD_CD}&DEAL_YMD=${YEARMONTH}`;
    console.log(uri);
    return {
        uri: uri,
    };
}

// 시군구 단위 법정동코드 배열 반환
async function getSggRegionCd() {
    let list = await oracleUtil.select('REGIONCD', Object.entries(config.mapping.regionCd).map((row) => row[1]));

    // 구 단위 법정동코드 목록을 배열로 변환
    let regioncdArr = [];
    list.forEach(row => {
        if (row.SGG_CD !== "000") // 시도 분류 제거
            regioncdArr.push(row.SIDO_CD + row.SGG_CD);
    });
    return regioncdArr;
}
