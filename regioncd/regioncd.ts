import fs from 'fs';
import { pick } from "../util/util.js";
import config from "../config/config.js";
import oracleUtil from "../util/oracle.util.js";

interface RegionCdJson {
    StanReginCd: {
        row: RegionCdRow[];
    };
}

interface RegionCdRow {
    sido_cd: string; // 시도 코드
    sgg_cd: string;  // 시군구 코드
    umd_cd: string;  // 읍면동 코드
    locatadd_nm: string; // 법정동명
    latitude?: number; // 위도
    longitude?: number; // 경도
}

interface DistrictLocation {
    위도: number;
    경도: number;
}

interface DistrictLocationJson {
    [key: string]: DistrictLocation;
}

interface DbRegionRow {
    ID: number;
    SIDO_CD: string;
    SGG_CD: string;
    UMD_CD: string;
    LOCATADD_NM: string;
    LATITUDE?: number;
    LONGITUDE?: number;
}

function getRegionCdFromJson(): RegionCdRow[] {
    const regioncdJsonFile = fs.readFileSync('./regioncd/regioncd_seoul.json', 'utf8');
    const regioncdData: RegionCdJson = JSON.parse(regioncdJsonFile);
    const regioncdJson = regioncdData.StanReginCd.row;

    const districtLocationFile = fs.readFileSync('./regioncd/district_location_filtered.json', 'utf8');
    const districtLocationJson: DistrictLocationJson = JSON.parse(districtLocationFile);

    console.log(regioncdJson.length);

    const regionCdMapping = config.mapping.regionCd;
    if (!regionCdMapping) {
        throw new Error('RegionCd mapping configuration not found');
    }

    regioncdJson.map(row => {
        const locationData = districtLocationJson[row.locatadd_nm];
        if (locationData) {
            row.latitude = locationData.위도;
            row.longitude = locationData.경도;
        }
        return pick(row, Object.keys(regionCdMapping.fields) as (keyof RegionCdRow)[]);
    });

    return regioncdJson;
}

// 시군구 단위 법정동코드 배열 반환
async function getRegionCdFromDb(): Promise<string[]> {
    const regionCdMapping = config.mapping.regionCd;
    if (!regionCdMapping) {
        throw new Error('RegionCd mapping configuration not found');
    }

    const list = await oracleUtil.select('REGIONCD', Object.values(regionCdMapping.fields)) as DbRegionRow[];

    // 구 단위 법정동코드 목록을 배열로 변환
    const regioncdArr: string[] = [];
    list.forEach(row => {
        if (row.SGG_CD !== "000" && row.UMD_CD === "000") { // 시도 분류 제거, 읍면동 단위 제거
            regioncdArr.push(row.SIDO_CD + row.SGG_CD);
        }
    });

    return regioncdArr;
}

export default { getRegionCdFromJson, getRegionCdFromDb };
export type { RegionCdRow, DistrictLocation, DbRegionRow };
