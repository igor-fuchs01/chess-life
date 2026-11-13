const exercicioModel = require("../models/exercicioModel");

/**
 * Lists a list's exercises in order, with whether the user has solved each one (RF08).
 *
 * @route GET /exercicios/listar/:idLista/:idUsuario
 * @fromRoute {number} idLista - The list's id.
 * @fromRoute {number} idUsuario - The user's id.
 * @response 200 {object[]} The exercises.
 * @response 204 The list has no exercises.
 * @response 400 {string} The list id or the user id is not a positive whole number.
 * @response 500 {string} Unexpected server or database error.
 * @param {object} req
 * @param {object} res
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
 * Reads an exercise to solve, with its solution split into moves (RF08).
 *
 * @route GET /exercicios/buscar/:idExercicio
 * @fromRoute {number} idExercicio - The exercise's id.
 * @response 200 {object} The exercise and its solution.
 * @response 400 {string} The exercise id is not a positive whole number.
 * @response 404 {string} The exercise does not exist.
 * @response 500 {string} Unexpected server or database error.
 * @param {object} req
 * @param {object} res
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
