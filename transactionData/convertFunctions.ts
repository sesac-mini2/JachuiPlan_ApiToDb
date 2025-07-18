// Description: API 데이터를 가공하여 DB에 알맞은 데이터로 변환하는 함수들을 정의한 파일

import type { DandokData, YeonlipData, OfficeHotelData } from '../types/index.js';
import config from '../config/config.js';

function officeHotel(row: Record<string, any>): OfficeHotelData {
    // config.mapping.officeHotel.fields 기반으로 필요한 필드만 추출
    const mapping = config.mapping.officeHotel.fields;
    const result: any = {};
    Object.keys(mapping).forEach(key => {
        result[key] = row[key];
    });
    // deposit, monthlyRent 변환
    result.deposit = Number(("" + row.deposit).replace(/,/g, ''));
    result.monthlyRent = Number(("" + row.monthlyRent).replace(/,/g, ''));
    // dealYear, dealMonth, dealDay 합치기
    result.makeDealDate = new Date(
        `${row.dealYear}-${("0" + row.dealMonth).slice(-2)}-${("0" + row.dealDay).slice(-2)}`
    );
    return result as OfficeHotelData;
}

function yeonlip(row: Record<string, any>): YeonlipData {
    const mapping = config.mapping.yeonlip.fields;
    const result: any = {};
    Object.keys(mapping).forEach(key => {
        result[key] = row[key];
    });
    result.deposit = Number(("" + row.deposit).replace(/,/g, ''));
    result.monthlyRent = Number(("" + row.monthlyRent).replace(/,/g, ''));
    result.makeDealDate = new Date(
        `${row.dealYear}-${("0" + row.dealMonth).slice(-2)}-${("0" + row.dealDay).slice(-2)}`
    );
    result.buildingType = 2; // 연립다세대 타입 = 2
    return result as YeonlipData;
}

function dandok(row: Record<string, any>): DandokData {
    const mapping = config.mapping.dandok.fields;
    const result: any = {};
    Object.keys(mapping).forEach(key => {
        result[key] = row[key];
    });
    result.deposit = Number(("" + row.deposit).replace(/,/g, ''));
    result.monthlyRent = Number(("" + row.monthlyRent).replace(/,/g, ''));
    result.makeDealDate = new Date(
        `${row.dealYear}-${("0" + row.dealMonth).slice(-2)}-${("0" + row.dealDay).slice(-2)}`
    );
    result.buildingType = 1; // 단독/다가구 타입 = 1
    return result as DandokData;
}

export default { officeHotel, dandok, yeonlip };
