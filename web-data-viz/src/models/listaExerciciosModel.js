const database = require("../database/config");

/**
 * Lists the exercise lists in their order, with how many exercises each has and how many of them the user
 * has solved at least once in that list.
 * @param {number} userId
 * @returns {Promise<object[]>} Lists { id, nome, descricao, total_exercicios, resolvidos }.
 */
function listLists(userId) {
    const sql = `
        SELECT l.id, l.nome, l.descricao,
            COUNT(DISTINCT le.fk_exercicio) AS total_exercicios,
            COUNT(DISTINCT t.fk_exercicio) AS resolvidos
        FROM lista l
            JOIN lista_exercicio le ON le.fk_lista = l.id
            LEFT JOIN tentativa t ON t.fk_lista = le.fk_lista AND t.fk_exercicio = le.fk_exercicio
                AND t.fk_usuario = ? AND t.acertou = TRUE
        GROUP BY l.id
        ORDER BY l.ordem;
    `;
    return database.query(sql, [userId]);
}

module.exports = {
    listLists
};
