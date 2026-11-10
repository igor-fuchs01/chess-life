const database = require("../database/config");

/**
 * Saves an attempt. The database sets data_tentativa to the moment of the insert (RN05).
 * Fails with ER_NO_REFERENCED_ROW_2 when the user does not exist or the exercise is not in the list.
 * @param {number} userId
 * @param {{fkLista: number, fkExercicio: number, acertou: boolean}} attempt
 * @returns {Promise<number>} The new attempt's id.
 */
async function registerAttempt(userId, attempt) {
    const sql = `
        INSERT INTO tentativa (fk_usuario, fk_lista, fk_exercicio, acertou)
        VALUES (?, ?, ?, ?);
    `;
    const result = await database.query(sql, [userId, attempt.fkLista, attempt.fkExercicio, attempt.acertou]);
    return result.insertId;
}

/**
 * Lists a user's attempts, from the newest to the oldest, with the list's name and the exercise's title.
 * @param {number} userId
 * @returns {Promise<object[]>} Attempts { id, acertou, data_tentativa, lista, exercicio }, with acertou true or false.
 */
async function listAttempts(userId) {
    const sql = `
        SELECT t.id, t.acertou, t.data_tentativa, l.nome AS lista, e.titulo AS exercicio
        FROM tentativa t
            JOIN lista l ON l.id = t.fk_lista
            JOIN exercicio e ON e.id = t.fk_exercicio
        WHERE t.fk_usuario = ?
        ORDER BY t.data_tentativa DESC, t.id DESC;
    `;
    const attempts = await database.query(sql, [userId]);

    // BOOLEAN is TINYINT(1) in MySQL, so it comes back as 1 or 0.
    for (const attempt of attempts) {
        attempt.acertou = attempt.acertou === 1;
    }
    return attempts;
}

module.exports = {
    registerAttempt,
    listAttempts
};
