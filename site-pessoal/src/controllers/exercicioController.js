const exercicioModel = require("../models/exercicioModel");

/**
 * Replies with a list's exercises and whether the user solved each one: 200 with them, 204 when the list has none,
 * or 400 for an invalid list or user id.
 */
async function listExercises(req, res) {
    const listId = parseId(req.params.idLista);
    if (!listId) {
        res.status(400).send("Lista inválida.");
        return;
    }
    const userId = parseId(req.params.idUsuario);
    if (!userId) {
        res.status(400).send("Usuário inválido.");
        return;
    }

    try {
        const exercises = await exercicioModel.listExercises(listId, userId);
        if (exercises.length === 0) {
            res.status(204).send();
            return;
        }
        res.status(200).json(exercises);
    } catch (error) {
        console.error("Error listing exercises:", error.message);
        res.status(500).send("Não foi possível listar os exercícios.");
    }
}

/**
 * Replies 200 with an exercise and its solution, 400 for an invalid id, or 404 when it does not exist.
 */
async function findExercise(req, res) {
    const exerciseId = parseId(req.params.idExercicio);
    if (!exerciseId) {
        res.status(400).send("Exercício inválido.");
        return;
    }

    try {
        const exercise = await exercicioModel.findExercise(exerciseId);
        if (!exercise) {
            res.status(404).send("Exercício não encontrado.");
            return;
        }
        exercise.solucao = await exercicioModel.findSolution(exerciseId);
        res.status(200).json(exercise);
    } catch (error) {
        console.error("Error finding an exercise:", error.message);
        res.status(500).send("Não foi possível buscar o exercício.");
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
    listExercises,
    findExercise
};
