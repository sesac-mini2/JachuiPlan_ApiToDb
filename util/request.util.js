import axios from 'axios';
import secrets from "../config/secrets.json" with { type: "json" };
import config from '../config/config.js';

const numOfRows = 1000;

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
