// =========================== API 관련 타입 정의 ===========================

import { RequestStatus, ErrorInfo, PartialData } from './common.js';

/**
 * API 응답 헤더
 */
export interface ApiResponseHeader {
  resultCode: string;
  resultMsg: string;
}

/**
 * API 응답 바디
 */
export interface ApiResponseBody {
  items: any[];
  numOfRows: number;
  pageNo: number;
  totalCount: number;
}

/**
 * API 응답 전체 구조
 */
export interface ApiResponse {
  response: {
    header: ApiResponseHeader;
    body: ApiResponseBody;
  };
}

/**
 * API 요청 매개변수
 */
export interface ApiRequestParams {
  serviceKey: string;
  pageNo: number;
  numOfRows: number;
  LAWD_CD: string;
  DEAL_YMD: string;
}

/**
 * API 요청 결과
 */
export interface ApiRequestResult {
    status: RequestStatus;
    value?: any;
    regionCd: string;
    yearMonth: string;
    error?: Error;
    partialData?: PartialData;
    reason?: Error;
}

/**
 * 처리 중인 요청 정보
 */
export interface ProcessingRequest {
  regionCd: string;
  yearMonth: string;
  reason?: ErrorInfo;
  startPage?: number;
  totalCount?: number;
}

/**
 * 년월별 처리 결과
 */
export interface YearMonthProcessResult {
  succeededRequests: ApiRequestResult[];
  partialRequests: ApiRequestResult[];
  failedRequests: ApiRequestResult[];
}

/**
 * 재시도 결과
 */
export interface RetryResult {
  succeeded: ApiRequestResult[];
  failed: FailedRequest[];
}

/**
 * 실패한 요청 정보 (통합 타입)
 */
export interface FailedRequest {
  regionCd: string;
  yearMonth: string;
  reason: Error | ErrorInfo;
  startPage?: number;
  totalCount?: number | undefined;
}
