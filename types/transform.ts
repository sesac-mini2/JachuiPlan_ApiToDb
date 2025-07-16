// =========================== API -> DB 중간 변환 관련 타입 정의 ===========================

import { ColumnMapping, TableMapping } from './common.js';

/**
 * 지역코드 변환 데이터 (API → DB 중간 형태)
 */
export interface RegionData {
  sido_cd: string;
  sgg_cd: string;
  umd_cd: string;
  locatadd_nm: string;
  latitude: number;
  longitude: number;
}

/**
 * 단독/다가구 변환 데이터 (API → DB 중간 형태)
 */
export interface BuildingData {
  buildingType: number;
  sggCd: string;
  umdNm: string;
  totalFloorAr: number;
  floor: number;
  buildYear: number;
  deposit: number;
  monthlyRent: number;
  makeDealDate: Date;
  jibun: string;
  buildingName: string;
  houseType: string;
}

/**
 * 연립다세대 변환 데이터 (API → DB 중간 형태)
 */
export interface YeonlipData {
  buildingType: number;
  sggCd: string;
  umdNm: string;
  excluUseAr: number;  // API 필드명 (DB에서는 TOTAL_FLOOR_AR로 매핑)
  floor: number;
  buildYear: number;
  deposit: number;
  monthlyRent: number;
  makeDealDate: Date;
  jibun: string;
  mhouseNm: string;    // API 필드명 (DB에서는 BUILDING_NAME로 매핑)
  houseType: string;
}

/**
 * 오피스텔 변환 데이터 (API → DB 중간 형태)
 */
export interface OfficeHotelData {
  sggCd: string;
  umdNm: string;
  excluUseAr: number;  // API 필드명 (DB에서는 EXCLU_USE_AR로 매핑)
  floor: number;
  buildYear: number;
  deposit: number;
  monthlyRent: number;
  makeDealDate: Date;
  jibun: string;
  offiNm: string;      // API 필드명 (DB에서는 BUILDING_NAME로 매핑)
}

/**
 * 제네릭 변환 함수 타입 정의
 * 새로운 API 타입이 추가되어도 타입 수정 불필요
 */
export type ConvertFunction<TInput = any, TOutput = any> = (data: TInput) => TOutput;

/**
 * 변환 컨텍스트 (converter.js에서 사용)
 * API 데이터를 DB로 변환하는 과정에서 필요한 모든 정보를 포함
 * 제네릭을 사용하여 확장성 확보
 */
export interface TransformContext<TOutput = any> {
  type: string;                    // API 타입 (dandok, yeonlip, officeHotel, ...)
  tableName: string;               // 대상 테이블명
  convertFunc: ConvertFunction<any, TOutput>; // 제네릭 변환 함수
  columns: ColumnMapping[];        // 컬럼 정보 배열
  fieldMapping: { [key: string]: ColumnMapping }; // API/DB 필드간 매핑 정보
}
