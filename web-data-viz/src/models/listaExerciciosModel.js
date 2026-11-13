const database = require("../database/config");

/**
 * Lists the exercise lists in their order, with how many exercises each has and how many of them the user
 * has solved at least once in that list.
 * @param {number} userId
 * @returns {Promise<object[]>} Lists { id, nome, descricao, total_exercicios, resolvidos }.
 */
function listLists(userId) {
    // The derived table holds each exercise the user has solved, once per list, so it is counted only once.
    const sql = `
        SELECT l.id, l.nome, l.descricao, COUNT(le.fk_exercicio) AS total_exercicios, COUNT(r.fk_exercicio) AS resolvidos
        FROM lista l
            JOIN lista_exercicio le ON le.fk_lista = l.id
            LEFT JOIN (
                SELECT DISTINCT fk_lista, fk_exercicio
                FROM tentativa
                WHERE fk_usuario = ? AND acertou = TRUE
            ) r ON r.fk_lista = le.fk_lista AND r.fk_exercicio = le.fk_exercicio
        GROUP BY l.id
        ORDER BY l.ordem;
    `;
    return database.query(sql, [userId]);
}

module.exports = {
    listLists
};
