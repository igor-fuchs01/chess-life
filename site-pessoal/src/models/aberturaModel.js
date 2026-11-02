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

/**
 * Lists the openings' ids and names in alphabetical order, for the favorite opening options.
 * @returns {Promise<{id: number, nome: string}[]>}
 */
function listOpeningNames() {
    const sql = `
        SELECT id, nome
        FROM abertura
        ORDER BY nome;
    `;
    return database.query(sql);
}

module.exports = {
    listOpenings,
    listOpeningNames
};
