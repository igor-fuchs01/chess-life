var database = require("../database/config");

/**
 * Lists a user's games, from the newest to the oldest. The moves are left out, since the dashboard does not use them.
 * @param {number} userId
 * @returns {Promise<object[]>}
 */
function listGames(userId) {
    var sql = `
        SELECT id, resultado, adversario, cor, abertura, data_partida
        FROM partida
        WHERE fk_usuario = ?
        ORDER BY data_partida DESC;
    `;
    return database.executar(sql, [userId]);
}

/**
 * Saves a finished game. The database sets data_partida to the moment of the insert.
 * @param {number} userId
 * @param {{resultado: string, adversario: string, cor: string, lances: string, abertura: string}} game
 * @returns {Promise<object>} The insert result, with insertId.
 */
function registerGame(userId, game) {
    var sql = `
        INSERT INTO partida (fk_usuario, resultado, adversario, cor, lances, abertura)
        VALUES (?, ?, ?, ?, ?, ?);
    `;
    return database.executar(sql, [userId, game.resultado, game.adversario, game.cor, game.lances, game.abertura]);
}

/**
 * Deletes a game only when it belongs to the user (RN03).
 * @param {number} userId
 * @param {number} gameId
 * @returns {Promise<object>} The delete result, with affectedRows.
 */
function deleteGame(userId, gameId) {
    var sql = `
        DELETE FROM partida WHERE id = ? AND fk_usuario = ?;
    `;
    return database.executar(sql, [gameId, userId]);
}

module.exports = {
    listGames,
    registerGame,
    deleteGame
};
