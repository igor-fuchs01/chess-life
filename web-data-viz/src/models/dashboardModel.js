const database = require("../database/config");

/**
 * Lists a user's attempts in a period, from the newest to the oldest, with the list's name and the exercise's title.
 * @param {number} userId
 * @param {{start: string, end: string}} period - Days written "YYYY-MM-DD", both included.
 * @returns {Promise<object[]>} Attempts { id, acertou, data_tentativa, lista, exercicio }, with acertou true or false.
 */
async function listAttempts(userId, period) {
    // Before the day after the end, so the whole last day is included.
    const sql = `
        SELECT t.id, t.acertou, t.data_tentativa, l.nome AS lista, e.titulo AS exercicio
        FROM tentativa t
            JOIN lista l ON l.id = t.fk_lista
            JOIN exercicio e ON e.id = t.fk_exercicio
        WHERE t.fk_usuario = ?
            AND t.data_tentativa >= ? AND t.data_tentativa < DATE_ADD(?, INTERVAL 1 DAY)
        ORDER BY t.data_tentativa DESC, t.id DESC;
    `;
    const attempts = await database.query(sql, [userId, period.start, period.end]);

    // BOOLEAN is TINYINT(1) in MySQL, so it comes back as 1 or 0.
    for (const attempt of attempts) {
        attempt.acertou = attempt.acertou === 1;
    }
    return attempts;
}

/**
 * Lists the exercise lists in their order, with how many exercises each has and how many of them the user
 * solved at least once in that list during a period.
 * @param {number} userId
 * @param {{start: string, end: string}} period - Days written "YYYY-MM-DD", both included.
 * @returns {Promise<object[]>} Lists { id, nome, descricao, total_exercicios, resolvidos }.
 */
function listLists(userId, period) {
    // The derived table holds each exercise the user solved in the period, once per list, so it is counted only once.
    // Before the day after the end, so the whole last day is included.
    const sql = `
        SELECT l.id, l.nome, l.descricao, COUNT(le.fk_exercicio) AS total_exercicios, COUNT(r.fk_exercicio) AS resolvidos
        FROM lista l
            JOIN lista_exercicio le ON le.fk_lista = l.id
            LEFT JOIN (
                SELECT DISTINCT fk_lista, fk_exercicio
                FROM tentativa
                WHERE fk_usuario = ? AND acertou = TRUE
                    AND data_tentativa >= ? AND data_tentativa < DATE_ADD(?, INTERVAL 1 DAY)
            ) r ON r.fk_lista = le.fk_lista AND r.fk_exercicio = le.fk_exercicio
        GROUP BY l.id
        ORDER BY l.ordem;
    `;
    return database.query(sql, [userId, period.start, period.end]);
}

module.exports = {
    listAttempts,
    listLists
};
