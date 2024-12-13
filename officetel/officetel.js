import request from 'request-promise';
import convert from 'xml-js';
import secrets from "../config/secrets.json" with { type: "json" };
import { objectToArray, generateYearMonths } from '../util/util.js';
import xmlUtil from "../util/xml-js.util.js";
import oracleUtil from '../util/oracle.util.js';
import regioncd from '../regioncd/regioncd.js';
import config from '../config/config.js';

const regioncdArr = await regioncd.getRegionCdFromDb();
const yearMonthsArr = generateYearMonths(2020, 2024);
// const regioncdArr = ["11170"]; // 임시 테스트용
// const yearMonthsArr = ["202311"]; // 임시 테스트용
const numOfRows = 1000;

const columns = Object.entries(config.mapping.officeHotel).map((row) => row[1]);
for (let i = 0; i < yearMonthsArr.length; i++) {
    setTimeout(() => {
        regioncdArr.forEach(async (regioncd) => {
            let data = await recursiveRequestRTMSDataSvcOffiRent(regioncd, yearMonthsArr[i], numOfRows);
                // deposit, monthlyRent에 쉼표(,)가 들어가 있어서 제거해줘야 함
                // dealYear, dealMonth, dealDay를 합쳐서 makeDealDate로 만들어주기
                data.map((row) => {
                    row.deposit = ("" + row.deposit).replace(/,/g, '');
                    row.monthlyRent = ("" + row.monthlyRent).replace(/,/g, '');
                    row.makeDealDate = yearMonthsArr[i] + ("0" + row.dealDay).slice(-2);
                });
                const arr = objectToArray(data, Object.keys(config.mapping.officeHotel));

                oracleUtil.insertMany('OFFICE_HOTEL', columns, arr);
        });
    }, i * 1000);
}

async function recursiveRequestRTMSDataSvcOffiRent(LAWD_CD, YEARMONTH, numOfRows) {
    let pageNo = 1;
    let totalCount;
    let items = [];
    do {
        let rows;
        {
            const response = await request.get(makeRTMSDataSvcOffiRent(pageNo, numOfRows, LAWD_CD, YEARMONTH));
            const jsonbody = convert.xml2js(response, xmlUtil.options);
            try {
                rows = jsonbody.response.body.items.item;
                totalCount = jsonbody.response.body.totalCount;
            } catch (err) {
                console.log("ERROR: " + pageNo + " " + LAWD_CD + " " + YEARMONTH);
                console.log(jsonbody);
                console.error(err);
                process.exit(1);
            }
        }
        items.push(...rows);
        pageNo++;
    } while ((pageNo - 1) * numOfRows < totalCount);
    return items;
}

function makeRTMSDataSvcOffiRent(pageNo, numOfRows, LAWD_CD, YEARMONTH) {
    let uri = `${config.url.officeHotel}?serviceKey=${secrets.apikey.officeHotel}&pageNo=${pageNo}&numOfRows=${numOfRows}&LAWD_CD=${LAWD_CD}&DEAL_YMD=${YEARMONTH}`;
    console.log(uri);
    return {
        uri: uri,
    };
}
