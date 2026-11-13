const listaExerciciosModel = require("../models/listaExerciciosModel");

/**
 * Lists the exercise lists with how many exercises the user has solved in each (RF08, RF09).
 *
 * @route GET /listasExercicios/listar/:idUsuario
 * @fromRoute {number} idUsuario - The user's id.
 * @response 200 {object[]} The lists, in order.
 * @response 204 There are no lists.
 * @response 400 {string} The user id is not a positive whole number.
 * @response 500 {string} Unexpected server or database error.
 * @param {object} req
 * @param {object} res
 */
async function listLists(req, res) {
    const userId = parseId(req.params.idUsuario);
    if (!userId) {
        res.status(400).send("Usuário inválido.");
        return;
    }

    try {
        const lists = await listaExerciciosModel.listLists(userId);
        if (lists.length === 0) {
            res.status(204).send();
            return;
        }
        res.status(200).json(lists);
    } catch (error) {
        console.error("Error listing exercise lists:", error.message);
        res.status(500).send("Não foi possível listar as listas de exercícios.");
    }
}

/**
 * Reads an id from the URL.
 * @param {string} value
 * @returns {number|null} The id, or null when it is not a positive whole number.
 */
function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

module.exports = {
    listLists
};
