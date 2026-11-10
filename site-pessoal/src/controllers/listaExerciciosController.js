const listaExerciciosModel = require("../models/listaExerciciosModel");

/**
 * Replies with the exercise lists and the user's progress: 200 with them, 204 when there are none,
 * or 400 for an invalid user id.
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
