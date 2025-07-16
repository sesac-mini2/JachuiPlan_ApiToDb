// =========================== 공통 타입 정의 ===========================

/**
 * 데이터베이스 컬럼 매핑 정보
 */
export interface ColumnMapping {
  column_name: string;
  type: "STRING" | "NUMBER" | "DATE";
  maxSize?: number;
}

/**
 * 테이블 메타데이터 정보
 */
export interface TableMeta {
  table: string;
}

/**
 * 테이블별 매핑 정보 (메타데이터 + 필드 매핑)
 */
export interface TableMapping {
  meta: TableMeta;
  fields: {
    [key: string]: ColumnMapping;
  };
}

/**
 * 전체 매핑 설정 (확장 가능한 구조)
 */
export interface MappingConfig {
  [key: string]: TableMapping;
}

/**
 * API 설정 정보
 */
export interface ApiInfo {
  url: string;
  limitPerDay: number;
}

/**
 * 전체 API 설정
 */
export interface ApiConfig {
  regionCd: ApiInfo;
  dandok: ApiInfo;
  yeonlip: ApiInfo;
  officeHotel: ApiInfo;
}

/**
 * 전체 설정 객체
 */
export interface Config {
  mapping: MappingConfig;
  apiInfo: ApiConfig;
}

/**
 * 시크릿 설정
 */
export interface Secrets {
  oracle: {
    user: string;
    password: string;
    connectString: string;
  };
  apikey: {
    dandok: string;
    yeonlip: string;
    officeHotel: string;
  };
}

/**
 * 년월 문자열 타입 (예: "202411")
 */
export type YearMonth = string;

/**
 * 지역코드 타입
 */
export type RegionCode = string;

/**
 * 요청 상태
 */
export type RequestStatus = 'fulfilled' | 'rejected' | 'partial';

/**
 * 에러 정보
 */
export interface ErrorInfo {
  message: string;
  code?: string;
  partialData?: PartialData;
}

/**
 * 부분 데이터 정보
 */
export interface PartialData {
  collectedItems: any[];
  lastSuccessfulPage: number;
  totalCount: number;
}
