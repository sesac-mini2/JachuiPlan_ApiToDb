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
 * API 설정 정보
 */
export interface ApiInfo {
  url: string;
  limitPerDay: number;
}

/**
 * 전체 설정 객체 (config.ts에서 실제 타입 추론)
 */
export type Config = import('../config/config.js').ConfigType;

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
  failedPage: number;
  totalCount: number;
}
