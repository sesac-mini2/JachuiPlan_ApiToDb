import config from "./config/config.js";
import { objectToArray } from "./util/util.js";
import sggcd from "./sggcd/sggcd.js";
import oracleRegioncd from "./sggcd/oracleRegioncd.js";

// 오라클 DB에 API로 가져온 법정동코드, 행정구역 한국어 이름 데이터 삽입
let gu = sggcd.getRegionCdFromJson();
console.log(gu);

const arr = objectToArray(gu, Object.keys(config.mapping.regionCd));
console.log(arr);

oracleRegioncd.runApp('REGIONCD', Object.entries(config.mapping.regionCd).map((row) => row[1]), arr);


// 단독/다가구

// 연립다세대

// 오피스텔
