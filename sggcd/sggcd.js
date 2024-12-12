import sggcd from "./sggcd_seoul.json" with { type: "json" };
import { pick } from "../util/util.js";
import config from "../config/config.js";

function getRegionCdFromJson() {
    // 시도 분류도 데이터베이스에 넣고 어플리케이션에서 시도/시군구 구분해서 사용
    // umd_cd가 000인 경우는 시도/시군구를 의미
    let gu = sggcd.StanReginCd.row.filter(row => row.umd_cd === "000");

    console.log(sggcd.StanReginCd.row.length);
    console.log(gu.length);
    gu = gu.map(row => pick(row, config.regionCdMapping[0], config.regionCdMapping[1], config.regionCdMapping[2]));
    return gu;
}

export default { getRegionCdFromJson };
