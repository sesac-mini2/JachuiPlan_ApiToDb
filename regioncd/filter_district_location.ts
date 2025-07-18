import fs from 'fs';

interface DistrictLocationData {
    시도: string;
    시군구?: string;
    읍면동구?: string;
    읍면리동?: string;
    위도: number;
    경도: number;
}

interface DistrictLocationJson {
    [key: string]: DistrictLocationData[];
}

interface FilteredLocation {
    위도: number;
    경도: number;
}

interface FilteredDistrictLocationJson {
    [key: string]: FilteredLocation;
}

const districtLocationJson: DistrictLocationJson = JSON.parse(fs.readFileSync('./regioncd/district_location.json', 'utf8'));

const newJson: FilteredDistrictLocationJson = {};

// JSON 데이터 필터링
Object.entries(districtLocationJson).forEach(([key, list]) => {
    // 읍면리동이 있는 데이터는 제외
    districtLocationJson[key] = list.filter((value) => { return value['읍면리동'] === undefined; });
    // 시도 시군구 읍면동구를 합쳐서 지역명으로 만듬
    districtLocationJson[key].map((value) => {
        let str = value['시도'];
        str += value['시군구'] ? ' ' + value['시군구'] : '';
        str += value['읍면동구'] ? ' ' + value['읍면동구'] : '';
        newJson[str] = { '위도': value['위도'], '경도': value['경도'] };
    });
});

fs.writeFileSync('./regioncd/district_location_filtered.json', JSON.stringify(newJson, null, 4), 'utf8');

export type { DistrictLocationData, FilteredLocation, FilteredDistrictLocationJson };
