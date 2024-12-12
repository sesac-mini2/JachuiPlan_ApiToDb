import sggcd from "./sggcd_seoul.json" with { type: "json" };
import { pick } from "../util/util.js";
import config from "../config/config.js";

function getRegionCdFromJson() {
    // 시도 분류도 데이터베이스에 넣고 어플리케이션에서 시도/시군구/읍면동 구분해서 사용
    let gu = sggcd.StanReginCd.row;

    console.log(sggcd.StanReginCd.row.length);
    console.log(gu.length);
    gu = gu.map(row => pick(row, Object.keys(config.mapping.regionCd)));
    return gu;
}

export default { getRegionCdFromJson };
