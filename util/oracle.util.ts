import oracledb from 'oracledb';
import type { Connection, Pool, PoolAttributes } from 'oracledb';
import type { ColumnMapping } from '../types/index.js';
import secrets from "../config/secrets.json" with { type: "json" };

// Connection Pool 설정
let pool: Pool | null = null;

async function createPool(): Promise<Pool> {
    if (pool) {
        return pool;
    }

    try {
        const poolConfig: PoolAttributes = {
            user: secrets.oracle.user,
            password: secrets.oracle.password,
            connectionString: secrets.oracle.connectString,
            poolMin: 2,                    // 최소 커넥션 수
            poolMax: 10,                   // 최대 커넥션 수
            poolIncrement: 1,              // 커넥션 증가량
            poolTimeout: 60,               // 커넥션 타임아웃 (초)
            poolPingInterval: 60,          // 커넥션 상태 체크 간격 (초)
            stmtCacheSize: 30,             // 준비된 문장 캐시 크기
            queueMax: 100,                 // 큐 최대 크기
            queueTimeout: 60000,           // 큐 타임아웃 (밀리초)
            enableStatistics: true         // 통계 활성화
        };

        pool = await oracledb.createPool(poolConfig);

        console.log("Connection Pool이 성공적으로 생성되었습니다.");
        console.log(`Pool 설정: Min=${pool.poolMin}, Max=${pool.poolMax}, Increment=${pool.poolIncrement}`);
        return pool;
    } catch (err) {
        console.error("Connection Pool 생성 실패:", err);
        throw err;
    }
}

async function getConnection(): Promise<Connection> {
    if (!pool) {
        await createPool();
    }
    // 바로 위에서 pool이 null이 아님을 보장했으므로, TypeScript에게 pool이 null이 아님을 확신시킴
    return pool!.getConnection();
}

async function connectionHandler<T>(func: (connection: Connection) => Promise<T>): Promise<T> {
    let connection: Connection | undefined;
    try {
        connection = await getConnection();
        return await func(connection);
    } catch (err) {
        console.error("Connection handler 에러:", err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error("Connection 닫기 실패:", err);
            }
        }
    }
}

async function closePool(): Promise<void> {
    if (pool) {
        try {
            await pool.close();
            pool = null;
            console.log("Connection Pool이 성공적으로 닫혔습니다.");
        } catch (err) {
            console.error("Connection Pool 닫기 실패:", err);
            throw err;
        }
    }
}

interface PoolStatus {
    connectionsOpen: number;
    connectionsInUse: number;
    queueTimeout: number;
    poolMin: number;
    poolMax: number;
    poolIncrement: number;
    poolTimeout: number;
    poolPingInterval: number;
    stmtCacheSize: number;
}

async function getPoolStatus(): Promise<PoolStatus | null> {
    if (!pool) {
        return null;
    }

    const status: PoolStatus = {
        connectionsOpen: pool.connectionsOpen,
        connectionsInUse: pool.connectionsInUse,
        queueTimeout: pool.queueTimeout,
        poolMin: pool.poolMin,
        poolMax: pool.poolMax,
        poolIncrement: pool.poolIncrement,
        poolTimeout: pool.poolTimeout,
        poolPingInterval: pool.poolPingInterval,
        stmtCacheSize: pool.stmtCacheSize
    };

    return status;
}

async function checkTableExists(table: string): Promise<boolean> {
    return await connectionHandler(async (connection) => {
        try {
            const sql = `SELECT COUNT(*) AS table_count FROM USER_TABLES WHERE TABLE_NAME = :table_name`;
            const result = await connection.execute(sql, [table.toUpperCase()], { outFormat: oracledb.OUT_FORMAT_OBJECT });
            const rows = result.rows as { TABLE_COUNT: number }[] | undefined;
            return (rows?.[0]?.TABLE_COUNT ?? 0) > 0;
        } catch (err) {
            console.error(`테이블 존재 확인 실패: ${table}`, err);
            return false;
        }
    });
}

async function select(table: string, columns: ColumnMapping[]): Promise<any[]> {
    return await connectionHandler(async (connection) => {
        // TODO: 테이블의 ID 칼럼을 가져오도록 하드코딩 해놨는데, 칼럼명이 ID가 아닐 수 있음.
        // TODO: 현재 매핑은 api로 가져온 데이터와 테이블 칼럼이 1:1 대응하는 경우를 대응하는 중 (API에는 ID가 없음)
        let sql = `select id, `;
        sql += columns.map(col => col.column_name).join(', ');
        sql += ` from ${table}`;
        let result = await connection.execute(sql, [], { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT });
        const rs = result.resultSet!;
        let row: any, rows: any[] = [];
        while ((row = await rs.getRow())) {
            rows.push(row);
        }
        await rs.close();
        return rows;
    });
}

async function insertMany(table: string, columns: ColumnMapping[], rows: any[][]): Promise<number> {
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
                            maxSize: col.maxSize // STRING 타입에 대해 maxSize 지정
                        } :
                        {
                            type: oracledb[col.type]
                        }
                    )
                )
            };

            const result = await connection.executeMany(sql, rows, options);
            await connection.commit();
            return result.rowsAffected || 0;
        } catch (err) {
            await connection.rollback();
            console.error("insertMany 에러:", err);
            throw err;
        }
    });
}

async function createRegionCdTable(): Promise<void> {
    await connectionHandler(async (connection) => {
        try {
            const sql = `CREATE TABLE REGIONCD (
                ID NUMBER(10) PRIMARY KEY,
                SIDO_CD VARCHAR2(2) NOT NULL,
                SGG_CD VARCHAR2(3) NOT NULL,
                UMD_CD VARCHAR2(3) NOT NULL,
                LOCATADD_NM VARCHAR2(100) NOT NULL,
                LATITUDE NUMBER(10,7),
                LONGITUDE NUMBER(10,7)
            )`;

            await connection.execute(sql);
            console.log("REGIONCD 테이블이 성공적으로 생성되었습니다.");
        } catch (err: any) {
            if (err.errorNum === 955) { // ORA-00955: name is already used by an existing object
                console.log("REGIONCD 테이블이 이미 존재합니다.");
            } else {
                console.error("REGIONCD 테이블 생성 실패:", err);
                throw err;
            }
        }
    });
}

async function deleteRegionCdTableItems(): Promise<void> {
    await connectionHandler(async (connection) => {
        try {
            const sql = `DELETE FROM REGIONCD`;
            await connection.execute(sql);
            await connection.commit();
            console.log("REGIONCD 테이블의 모든 데이터가 삭제되었습니다.");
        } catch (err) {
            await connection.rollback();
            console.error("REGIONCD 테이블 데이터 삭제 실패:", err);
            throw err;
        }
    });
}

// 대량 삽입을 위한 최적화된 함수
async function bulkInsert(table: string, columns: ColumnMapping[], rows: any[][], batchSize: number = 1000): Promise<number> {
    if (!rows || rows.length === 0) {
        console.log("삽입할 데이터가 없습니다.");
        return 0;
    }

    let totalInserted = 0;
    const batches: any[][][] = [];

    // 배치 단위로 분할
    for (let i = 0; i < rows.length; i += batchSize) {
        batches.push(rows.slice(i, i + batchSize));
    }

    console.log(`총 ${rows.length}개 행을 ${batches.length}개 배치로 나누어 삽입합니다. (배치 크기: ${batchSize})`);

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        if (!batch) continue;

        try {
            const inserted = await insertMany(table, columns, batch);
            totalInserted += inserted;
            console.log(`배치 ${i + 1}/${batches.length} 완료: ${inserted}개 행 삽입`);
        } catch (error: any) {
            console.error(`배치 ${i + 1}/${batches.length} 실패:`, error.message);
            // 배치 실패 시 개별 행 삽입 시도
            console.log("개별 행 삽입을 시도합니다...");
            for (const row of batch) {
                try {
                    await insertMany(table, columns, [row]);
                    totalInserted++;
                } catch (rowError: any) {
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
    checkTableExists,
    select,
    insertMany,
    bulkInsert,
    createRegionCdTable,
    deleteRegionCdTableItems
};
