const database = require("../database/config");

/**
 * Lists every known opening, loaded by src/database/02-seed.sql.
 * @returns {Promise<{id: number, nome: string, lances: string}[]>}
 */
function listOpenings() {
    const sql = `
        SELECT id, nome, lances
        FROM abertura;
    `;
    return database.query(sql);
}

module.exports = {
    listOpenings
};
