import regioncdJson from "./regioncd_seoul.json" with { type: "json" };
import { pick } from "../util/util.js";
import config from "../config/config.js";

function getRegionCdFromJson() {
    // 시도 분류도 데이터베이스에 넣고 어플리케이션에서 시도/시군구/읍면동 구분해서 사용
    let gu = regioncdJson.StanReginCd.row;

    console.log(regioncdJson.StanReginCd.row.length);
    console.log(gu.length);
    gu = gu.map(row => pick(row, Object.keys(config.mapping.regionCd)));
    return gu;
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
