import request from 'request-promise';
import convert from 'xml-js';
import secrets from "../config/secrets.json" with { type: "json" };
import xmlUtil from "../util/xml-js.util.js";
import config from '../config/config.js';

const numOfRows = 1000;

async function recursiveRequestRTMSDataSvc(type, LAWD_CD, YEARMONTH) {
    let pageNo = 1;
    let totalCount;
    let items = [];
    do {
        let rows;
        {
            const response = await request.get(makeRTMSDataSvcUri(type, pageNo, LAWD_CD, YEARMONTH));
            const jsonbody = convert.xml2js(response, xmlUtil.options);
            try {
                rows = jsonbody.response.body.items.item;
                totalCount = jsonbody.response.body.totalCount;
            } catch (err) {
                // console.log("ERROR: " + pageNo + " " + LAWD_CD + " " + YEARMONTH);
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

function makeRTMSDataSvcUri(type, pageNo, LAWD_CD, YEARMONTH) {
    let uri = `${config.url[type]}?serviceKey=${secrets.apikey[type]}&pageNo=${pageNo}&numOfRows=${numOfRows}&LAWD_CD=${LAWD_CD}&DEAL_YMD=${YEARMONTH}`;
    console.log(uri);
    return {
        uri: uri,
    };
}

export default { recursiveRequestRTMSDataSvc }
