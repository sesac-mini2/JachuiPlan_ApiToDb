import oracledb from 'oracledb';
import secrets from "../config/secrets.json" with { type: "json" };
async function getRegioncdFromDB() {
    let connection;
    try {
        connection = await oracledb.getConnection({ user: secrets.oracleUser, password: secrets.oraclePassword, connectionString: secrets.oracleConnectString });
        console.log("Successfully connected to Oracle Database");

        // SELECT regioncd
        let result = await connection.execute(`select id, sido_cd||sgg_cd region_cd, locatadd_nm from regioncd`, [], { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT });
        const rs = result.resultSet; let row, rows = [];
        while ((row = await rs.getRow())) {
            rows.push(row);
        }
        await rs.close();
        return rows;
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
export { getRegioncdFromDB };
