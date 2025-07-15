import oracledb from 'oracledb';
import secrets from "../config/secrets.json" with { type: "json" };
import { checkAllowedTable } from './util.js';

// Connection Pool 설정
let pool = null;

async function createPool() {
    if (pool) {
        return pool;
    }

    try {
        pool = await oracledb.createPool({
            user: secrets.oracle.user,
            password: secrets.oracle.password,
            connectionString: secrets.oracle.connectString,
            poolMin: 2,                    // 최소 커넥션 수
            poolMax: 10,                   // 최대 커넥션 수
            poolIncrement: 1,              // 커넥션 증가량
            poolTimeout: 60,               // 커넥션 타임아웃 (초)
            poolPingInterval: 60,          // 커넥션 상태 체크 간격 (초)
            stmtCacheSize: 30,             // 준비된 문장 캐시 크기
            queueRequests: true,           // 큐 요청 활성화
            queueMax: 100,                 // 큐 최대 크기
            queueTimeout: 60000,           // 큐 타임아웃 (밀리초)
            enableStatistics: true         // 통계 활성화
        });

        console.log("Connection Pool이 성공적으로 생성되었습니다.");
        console.log(`Pool 설정: Min=${pool.poolMin}, Max=${pool.poolMax}, Increment=${pool.poolIncrement}`);
        return pool;
    } catch (err) {
        console.error("Connection Pool 생성 실패:", err);
        throw err;
    }
}

async function getConnection() {
    if (!pool) {
        await createPool();
    }
    return pool.getConnection();
}

async function connectionHandler(func) {
    let connection;
    try {
        connection = await getConnection();
        return await func(connection);
    } catch (err) {
        console.error("Database 작업 중 오류 발생:", err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close(); // Pool로 반환
            } catch (err) {
                console.error("Connection 반환 중 오류:", err);
            }
        }
    }
}

// Pool 종료 함수
async function closePool() {
    if (pool) {
        try {
            await pool.close(10); // 10초 대기 후 강제 종료
            console.log("Connection Pool이 성공적으로 종료되었습니다.");
            pool = null;
        } catch (err) {
            console.error("Connection Pool 종료 중 오류:", err);
        }
    }
}

// Pool 상태 확인 함수
function getPoolStatus() {
    if (!pool) {
        return null;
    }

    const status = {
        connectionsInUse: pool.connectionsInUse,
        connectionsOpen: pool.connectionsOpen,
        poolMax: pool.poolMax,
        poolMin: pool.poolMin,
        queueLength: pool.queueLength || 0,
        queueRequests: pool.queueRequests || false,
        queueMax: pool.queueMax || 0,
        queueTimeout: pool.queueTimeout || 0,
        stmtCacheSize: pool.stmtCacheSize || 0,
        poolPingInterval: pool.poolPingInterval || 0,
        poolTimeout: pool.poolTimeout || 0
    };

    // 사용률 계산
    status.usagePercentage = ((status.connectionsInUse / status.poolMax) * 100).toFixed(2);
    status.isHealthy = status.connectionsInUse < status.poolMax * 0.8; // 80% 미만이면 정상

    return status;
}

async function select(table, columns) {
    checkAllowedTable(table);

    return await connectionHandler(async (connection) => {
        // TODO: 테이블의 ID 칼럼을 가져오도록 하드코딩 해놨는데, 칼럼명이 ID가 아닐 수 있음.
        // TODO: 현재 매핑은 api로 가져온 데이터와 테이블 칼럼이 1:1 대응하는 경우를 대응하는 중 (API에는 ID가 없음)
        let sql = `select id, `;
        sql += columns.map(col => col.column_name).join(', ');
        sql += ` from ${table}`;
        let result = await connection.execute(sql, [], { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT });
        const rs = result.resultSet; let row, rows = [];
        while ((row = await rs.getRow())) {
            rows.push(row);
        }
        await rs.close();
        return rows;
    });
}

async function insertMany(table, columns, rows) {
    checkAllowedTable(table);

    return await connectionHandler(async (connection) => {
        try {
            // Insert some data
            let sql = `insert into ${table} (`;
            sql += columns.map(col => col.column_name).join(', ');
            sql += ') values (';
            sql += columns.map((_, idx) => `:${idx + 1}`).join(', ');
            sql += ')';

            // 바인드 변수 옵션 수정
            const options = {
                autoCommit: false,      // 수동 커밋으로 변경
                bindDefs: columns.map(col => (col.type === "STRING" ?
                        {
                            type: oracledb[col.type],
                            maxSize:  col.maxSize // STRING 타입에 대해 maxSize 지정
                        }
                        :
                        {
                            type: oracledb[col.type]
                        }
                )),
                batchErrors: true       // 배치 오류 활성화
            };

            let result = await connection.executeMany(sql, rows, options);

            // 배치 오류가 있는 경우 로그
            if (result.batchErrors && result.batchErrors.length > 0) {
                console.warn(`배치 삽입 중 일부 오류 발생 (${table}): ${result.batchErrors.length}개`);
                result.batchErrors.forEach((error, index) => {
                    console.warn(`  행 ${index}: ${error.message}`);
                });
            }

            await connection.commit();
            console.log(`${result.rowsAffected}개 행이 ${table}에 삽입되었습니다.`);
            return result.rowsAffected;
        } catch (error) {
            console.error(`DB 삽입 에러 (${table}):`, error.message);
            await connection.rollback();
            throw error;
        }
    });
}

async function createRegionCdTable() {
    await connectionHandler(async (connection) => {
        await connection.execute(`begin execute immediate 'drop table REGIONCD'; exception when others then if sqlcode <> -942 then raise; end if; end;`);
        await connection.execute(`create table REGIONCD (id number generated always as identity, sido_cd VARCHAR2(2) NOT NULL, sgg_cd VARCHAR2(3), umd_cd VARCHAR2(3), locatadd_nm VARCHAR2(100), latitude NUMBER(11, 8) NOT NULL, longitude NUMBER(11, 8) NOT NULL, primary key (id))`);
    });
}

async function deleteRegionCdTableItems() {
    return await connectionHandler(async (connection) => {
        try {
            const result = await connection.execute(`DELETE FROM REGIONCD WHERE 1=1`);
            await connection.commit();
            console.log(`${result.rowsAffected}개 행이 REGIONCD 테이블에서 삭제되었습니다.`);
            return result.rowsAffected;
        } catch (error) {
            console.error("REGIONCD 테이블 삭제 중 오류:", error.message);
            await connection.rollback();
            throw error;
        }
    });
}

// 대량 삽입을 위한 최적화된 함수
async function bulkInsert(table, columns, rows, batchSize = 1000) {
    checkAllowedTable(table);

    if (!rows || rows.length === 0) {
        console.log("삽입할 데이터가 없습니다.");
        return 0;
    }

    let totalInserted = 0;
    const batches = [];

    // 배치 단위로 분할
    for (let i = 0; i < rows.length; i += batchSize) {
        batches.push(rows.slice(i, i + batchSize));
    }

    console.log(`총 ${rows.length}개 행을 ${batches.length}개 배치로 나누어 삽입합니다. (배치 크기: ${batchSize})`);

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        try {
            const inserted = await insertMany(table, columns, batch);
            totalInserted += inserted;
            console.log(`배치 ${i + 1}/${batches.length} 완료: ${inserted}개 행 삽입`);
        } catch (error) {
            console.error(`배치 ${i + 1}/${batches.length} 실패:`, error.message);
            // 배치 실패 시 개별 행 삽입 시도
            console.log("개별 행 삽입을 시도합니다...");
            for (const row of batch) {
                try {
                    await insertMany(table, columns, [row]);
                    totalInserted++;
                } catch (rowError) {
                    console.error("개별 행 삽입 실패:", rowError.message);
                }
            }
        }
    }

    return totalInserted;
}

export default {
    createPool,
    closePool,
    getPoolStatus,
    connectionHandler,
    select,
    insertMany,
    bulkInsert,
    createRegionCdTable,
    deleteRegionCdTableItems
};
