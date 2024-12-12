import oracledb from 'oracledb';
import secrets from "../config/secrets.json" with { type: "json" };
import { checkAllowedTable } from './util.js';

async function getConnection() {
    return oracledb.getConnection({
        user: secrets.oracle.user,
        password: secrets.oracle.password,
        connectionString: secrets.oracle.connectString
    });
}

async function connectionHandler(func) {
    let connection;
    try {
        connection = await getConnection();
        console.log("Successfully connected to Oracle Database");
        return await func(connection);
    } catch (err) {
        console.error(err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

async function select(table, columns) {
    checkAllowedTable(table);

    return await connectionHandler(async (connection) => {
        // TODO: 테이블의 ID 칼럼을 가져오도록 하드코딩 해놨는데, 칼럼명이 ID가 아닐 수 있음.
        // TODO: 현재 매핑은 api로 가져온 데이터와 테이블 칼럼이 1:1 대응하는 경우를 대응하는 중 (API에는 ID가 없음)
        let sql = `select id, `;
        sql += columns.join(', ');
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

    await connectionHandler(async (connection) => {
        // Insert some data
        let sql = `insert into ${table} (`;
        sql += columns.join(', ');
        sql += ') values (';
        sql += columns.map((_, idx) => `:${idx + 1}`).join(', ');
        sql += ')';
        let result = await connection.executeMany(sql, rows);
        console.log(result.rowsAffected, "Rows Inserted");
        connection.commit();
    });
}

async function createRegionCdTable() {
    await connectionHandler(async (connection) => {
        await connection.execute(`begin execute immediate 'drop table regioncd'; exception when others then if sqlcode <> -942 then raise; end if; end;`);
        await connection.execute(`create table regioncd (id number generated always as identity, sido_cd VARCHAR2(2), sgg_cd VARCHAR2(3), umd_cd VARCHAR2(3), locatadd_nm VARCHAR2(100), primary key (id))`);
    });
}

export default { select, insertMany, createRegionCdTable };
