const database = require("../database/config");

/**
 * Lists a user's games, from the newest to the oldest, with the opening's name. The moves are left out.
 * @param {number} userId
 * @returns {Promise<object[]>} Games { id, resultado, adversario, cor, abertura, data_partida }.
 */
function listGames(userId) {
    const sql = `
        SELECT p.id, p.resultado, p.adversario, p.cor, a.nome AS abertura, p.data_partida
        FROM partida p
            JOIN abertura a ON a.id = p.fk_abertura
        WHERE p.fk_usuario = ?
        ORDER BY p.data_partida DESC;
    `;
    return database.query(sql, [userId]);
}

/**
 * Saves a finished game and its moves in one transaction, so a game is never left without its moves.
 * The database sets data_partida to the moment of the insert (RN05).
 * @param {number} userId
 * @param {{resultado: string, adversario: string, cor: string, fkAbertura: number, lances: string[]}} game
 * @returns {Promise<number>} The new game's id.
 */
function registerGame(userId, game) {
    const gameSql = `
        INSERT INTO partida (fk_usuario, fk_abertura, resultado, adversario, cor)
        VALUES (?, ?, ?, ?, ?);
    `;
    // "VALUES ?" with an array of rows inserts all the moves in a single statement.
    const movesSql = `
        INSERT INTO lance (fk_partida, numero, san)
        VALUES ?;
    `;

    return database.transaction(async function (query) {
        const gameResult = await query(gameSql, [userId, game.fkAbertura, game.resultado, game.adversario, game.cor]);
        const gameId = gameResult.insertId;

        // Moves are numbered from 1 in the order they were played.
        const moveRows = [];
        for (let index = 0; index < game.lances.length; index++) {
            moveRows.push([gameId, index + 1, game.lances[index]]);
        }
        await query(movesSql, [moveRows]);

        return gameId;
    });
}

/**
 * Deletes a game only when it belongs to the user (RN03). Its moves are deleted with it (ON DELETE CASCADE).
 * @param {number} userId
 * @param {number} gameId
 * @returns {Promise<object>} The delete result, with affectedRows.
 */
function deleteGame(userId, gameId) {
    const sql = `
        DELETE FROM partida
        WHERE id = ? AND fk_usuario = ?;
    `;
    return database.query(sql, [gameId, userId]);
}

module.exports = {
    listGames,
    registerGame,
    deleteGame
};
