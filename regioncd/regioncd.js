import fs from 'fs';
import { pick } from "../util/util.js";
import config from "../config/config.js";
import oracleUtil from "../util/oracle.util.js";

function getRegionCdFromJson() {
    const regioncdJson = JSON.parse(fs.readFileSync('./regioncd/regioncd_seoul.json', 'utf8')).StanReginCd.row;
    const districtLocationJson = JSON.parse(fs.readFileSync('./regioncd/district_location_filtered.json', 'utf8'));

    console.log(regioncdJson.length);
    regioncdJson.map(row => {
        row.latitude = districtLocationJson[row.locatadd_nm].위도;
        row.longitude = districtLocationJson[row.locatadd_nm].경도;
        pick(row, Object.keys(config.mapping.regionCd));
    });
    return regioncdJson;
}

// 시군구 단위 법정동코드 배열 반환
async function getRegionCdFromDb() {
    let list = await oracleUtil.select('REGIONCD', Object.entries(config.mapping.regionCd).map((row) => row[1]));

    // 구 단위 법정동코드 목록을 배열로 변환
    let regioncdArr = [];
    list.forEach(row => {
        if (row.SGG_CD !== "000" && row.UMD_CD === "000") // 시도 분류 제거, 읍면동 단위 제거
            regioncdArr.push(row.SIDO_CD + row.SGG_CD);
    });
    return regioncdArr;
}

export default { getRegionCdFromJson, getRegionCdFromDb };
