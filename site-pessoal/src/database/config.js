const mysql = require("mysql2/promise");

// One pool for the whole server, so connections are reused instead of opened for every query.
// It reads the DB_* variables that app.js loads from the environment file.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
});

/**
 * Runs one SQL statement. The values replace its ? placeholders and are escaped by mysql2.
 * @param {string} sql
 * @param {Array} [values]
 * @returns {Promise<object[]|object>} The rows of a SELECT, or the result of a write (insertId, affectedRows).
 */
async function query(sql, values) {
    const [result] = await pool.query(sql, values);
    return result;
}

/**
 * Runs several statements as one transaction: either all of them are saved, or none is when one fails.
 * @param {function(function(string, Array): Promise<object>): Promise<*>} runStatements - Receives a query
 *   function, with the same signature as query(), that runs on the transaction's connection.
 * @returns {Promise<*>} What runStatements returns.
 */
async function transaction(runStatements) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();
        const result = await runStatements(async function (sql, values) {
            const [statementResult] = await connection.query(sql, values);
            return statementResult;
        });
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    query,
    transaction
};
