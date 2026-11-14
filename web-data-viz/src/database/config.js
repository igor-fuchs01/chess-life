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

module.exports = {
    query
};
