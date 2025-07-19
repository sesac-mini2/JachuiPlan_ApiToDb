/**
 * 실제 데이터베이스 테이블 스키마 타입들
 */

import type { Pool, Connection } from 'oracledb';
import type { ApiRequestResult } from './api.js';

/**
 * REGIONCD 테이블 스키마
 */
export interface RegionCdSchema {
  SIDO_CD: string;
  SGG_CD: string;
  UMD_CD: string;
  LOCATADD_NM: string;
  LATITUDE: number;
  LONGITUDE: number;
}

/**
 * BUILDING 테이블 스키마
 * (dandok, yeonlip 데이터 모두 이 테이블에 저장)
 */
export interface BuildingSchema {
  BUILDING_TYPE: number;    // 1: 단독/다가구, 2: 연립다세대
  SGGCD: string;
  UMDNM: string;
  TOTAL_FLOOR_AR: number;   // dandok.totalFloorAr, yeonlip.excluUseAr 모두 여기에 매핑
  FLOOR: number;
  BUILD_YEAR: number;
  DEPOSIT: number;
  MONTHLY_RENT: number;
  DEALDATE: Date;           // makeDealDate가 DEALDATE 컬럼에 매핑
  JIBUN: string;
  BUILDING_NAME: string;    // dandok.buildingName, yeonlip.mhouseNm 모두 여기에 매핑
  HOUSE_TYPE: string;
}

/**
 * OFFICE_HOTEL 테이블 스키마
 */
export interface OfficeHotelSchema {
  SGGCD: string;
  UMDNM: string;
  EXCLU_USE_AR: number;     // officeHotel만 고유하게 EXCLU_USE_AR 컬럼 사용
  FLOOR: number;
  BUILD_YEAR: number;
  DEPOSIT: number;
  MONTHLY_RENT: number;
  DEALDATE: Date;           // makeDealDate가 DEALDATE 컬럼에 매핑
  JIBUN: string;
  BUILDING_NAME: string;    // officeHotel.offiNm이 여기에 매핑
}

/**
 * 데이터베이스 스키마 유니온 타입
 */
export type DatabaseSchema = RegionCdSchema | BuildingSchema | OfficeHotelSchema;

/**
 * Oracle 연결 핸들러 함수 타입
 */
export type ConnectionHandler<T> = (connection: Connection) => Promise<T>;

/**
 * 풀 상태 정보 (getPoolStatus 함수 반환 타입)
 * Oracle Pool 타입 확장
 */
export interface PoolStatusInfo extends Pool {
  // Pool 객체에 없는 커스텀 속성들
  queueLength: number;
  queueRequests: boolean;
  // 계산된 속성들
  usagePercentage: string;
  isHealthy: boolean;
}

/**
 * 배치 정보
 */
export interface BatchInfo {
  index: number;
  startIndex: number;
  endIndex: number;
  request: ApiRequestResult;
}
