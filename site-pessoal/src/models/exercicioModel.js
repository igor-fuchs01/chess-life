const database = require("../database/config");

/**
 * Lists the exercises of a list in their order, with whether the user has solved each one in that list.
 * @param {number} listId
 * @param {number} userId
 * @returns {Promise<object[]>} Exercises { id, titulo, ordem, resolvido }, with resolvido true or false.
 */
async function listExercises(listId, userId) {
    // The derived table holds each exercise the user has solved, once per list, so the join never repeats a row.
    const sql = `
        SELECT e.id, e.titulo, le.ordem,
            CASE 
                WHEN r.fk_exercicio IS NULL THEN FALSE 
                ELSE TRUE 
            END AS resolvido
        FROM lista_exercicio le
            JOIN exercicio e ON e.id = le.fk_exercicio
            LEFT JOIN (
                SELECT DISTINCT fk_lista, fk_exercicio
                FROM tentativa
                WHERE fk_usuario = ? AND acertou = TRUE
            ) r ON r.fk_lista = le.fk_lista AND r.fk_exercicio = le.fk_exercicio
        WHERE le.fk_lista = ?
        ORDER BY le.ordem;
    `;
    const exercises = await database.query(sql, [userId, listId]);

    // MySQL returns TRUE and FALSE as 1 and 0.
    for (const exercise of exercises) {
        exercise.resolvido = exercise.resolvido === 1;
    }
    return exercises;
}

/**
 * Reads an exercise's title and position.
 * @param {number} exerciseId
 * @returns {Promise<object|undefined>} The exercise { id, titulo, fen }, or undefined when it does not exist.
 */
async function findExercise(exerciseId) {
    const sql = `
        SELECT id, titulo, fen
        FROM exercicio
        WHERE id = ?;
    `;
    const rows = await database.query(sql, [exerciseId]);
    return rows[0];
}

/**
 * Reads an exercise's solution, move by move in order.
 * @param {number} exerciseId
 * @returns {Promise<string[]>} The moves in SAN, such as ["Qd8+", "Bxd8", "Re8#"]; empty when the exercise does not exist.
 */
async function findSolution(exerciseId) {
    const sql = `
        SELECT solucao
        FROM exercicio
        WHERE id = ?;
    `;
    const rows = await database.query(sql, [exerciseId]);
    if (rows.length === 0) {
        return [];
    }
    return rows[0].solucao.split(" ");
}

module.exports = {
    listExercises,
    findExercise,
    findSolution
};
