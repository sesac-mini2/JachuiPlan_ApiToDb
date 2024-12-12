import oracledb from 'oracledb';
import secrets from "../config/secrets.json" with { type: "json" };
async function runApp(mapping, rows) {
    let connection;
    try {
        connection = await oracledb.getConnection({ user: secrets.oracle.user, password: secrets.oracle.password, connectionString: secrets.oracle.connectString });
        console.log("Successfully connected to Oracle Database");

        // Create a table
        await connection.execute(`begin execute immediate 'drop table regioncd'; exception when others then if sqlcode <> -942 then raise; end if; end;`);
        await connection.execute(`create table regioncd (id number generated always as identity, sido_cd VARCHAR2(2), sgg_cd VARCHAR2(3), locatadd_nm VARCHAR2(100), primary key (id))`);

        // Insert some data
        const sql = `insert into regioncd (${mapping[0]}, ${mapping[1]}, ${mapping[2]}) values(:1, :2, :3)`;
        let result = await connection.executeMany(sql, rows);
        console.log(result.rowsAffected, "Rows Inserted");
        connection.commit();

        // Now query the rows back
        result = await connection.execute(`select id, ${mapping[0]}, ${mapping[1]}, ${mapping[2]} from regioncd`, [], { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT });
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
