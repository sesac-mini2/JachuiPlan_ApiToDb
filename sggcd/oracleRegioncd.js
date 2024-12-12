import oracledb from 'oracledb';
import secrets from "../config/secrets.json" with { type: "json" };
import { checkAllowedTable } from '../util/util.js';

async function runApp(table, columns, rows) {
    checkAllowedTable(table);

    let connection;
    try {
        connection = await oracledb.getConnection({ user: secrets.oracle.user, password: secrets.oracle.password, connectionString: secrets.oracle.connectString });
        console.log("Successfully connected to Oracle Database");

        // Create a table
        await connection.execute(`begin execute immediate 'drop table ${table}'; exception when others then if sqlcode <> -942 then raise; end if; end;`);
        await connection.execute(`create table ${table} (id number generated always as identity, sido_cd VARCHAR2(2), sgg_cd VARCHAR2(3), locatadd_nm VARCHAR2(100), primary key (id))`);

        // Insert some data
        let sql = `insert into ${table} (`;
        sql += columns.join(', ');
        sql += ') values (';
        sql += columns.map((_, idx) => `:${idx + 1}`).join(', ');
        sql += ')';
        let result = await connection.executeMany(sql, rows);
        console.log(result.rowsAffected, "Rows Inserted");
        connection.commit();

        // Now query the rows back (테스트용)
        sql = `select id, `;
        sql += columns.join(', ');
        sql += ` from ${table}`;
        result = await connection.execute(sql, [], { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT });
        const rs = result.resultSet; let row;
        while ((row = await rs.getRow())) {
            console.log(`${row.ID}: ${row.SIDO_CD} ${row.SGG_CD} ${row.LOCATADD_NM}`);
        }
        await rs.close();
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
export default { runApp };
