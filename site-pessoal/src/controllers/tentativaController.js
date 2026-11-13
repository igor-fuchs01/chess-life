const tentativaModel = require("../models/tentativaModel");
const exercicioModel = require("../models/exercicioModel");

// One move in standard algebraic notation: castling, or piece, origin, capture, square, promotion and check.
const SAN_MOVE = /^(O-O(-O)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?)[+#]?$/;
const MISSING_REFERENCE_CODE = "ER_NO_REFERENCED_ROW_2";

/**
 * Compares an attempt's moves with the exercise's solution and saves whether it was right (RF08, RN04).
 * Move legality is not checked here: the exercise page only allows legal moves.
 *
 * @route POST /tentativas/cadastrar/:idUsuario
 * @fromHeader {string} Content-Type - "application/json", so Express can read the body.
 * @fromRoute {number} idUsuario - The user's id.
 * @fromBody {number} fk_lista - The id of the list the exercise was opened from.
 * @fromBody {number} fk_exercicio - The exercise's id.
 * @fromBody {string[]} lances - Every move played, in SAN, the opponent's replies included.
 * @response 201 {{id: number, acertou: boolean}} The attempt was saved.
 * @response 400 {string} The user id is invalid, or a field is missing or wrong.
 * @response 404 {string} The user, the exercise or the exercise in that list does not exist.
 * @response 500 {string} Unexpected server or database error.
 * @param {object} req
 * @param {object} res
 */
async function registerAttempt(req, res) {
    const userId = parseId(req.params.idUsuario);
    if (!userId) {
        res.status(400).send("Usuário inválido.");
        return;
    }

    const error = validateAttempt(req.body);
    if (error) {
        res.status(400).send(error);
        return;
    }

    try {
        const solution = await exercicioModel.findSolution(req.body.fk_exercicio);
        if (solution.length === 0) {
            res.status(404).send("Exercício não encontrado.");
            return;
        }

        const isRight = isWholeSolution(req.body.lances, solution);
        const attemptId = await tentativaModel.registerAttempt(userId, {
            fkLista: req.body.fk_lista,
            fkExercicio: req.body.fk_exercicio,
            acertou: isRight
        });
        res.status(201).json({ id: attemptId, acertou: isRight });
    } catch (error) {
        if (error.code === MISSING_REFERENCE_CODE) {
            res.status(404).send("Usuário, lista ou exercício não encontrado.");
            return;
        }
        console.error("Error registering an attempt:", error.message);
        res.status(500).send("Não foi possível registrar a tentativa.");
    }
}

/**
 * Lists the user's attempts, newest first (RF10).
 *
 * @route GET /tentativas/listar/:idUsuario
 * @fromRoute {number} idUsuario - The user's id.
 * @response 200 {object[]} The attempts.
 * @response 204 The user has no attempts.
 * @response 400 {string} The user id is not a positive whole number.
 * @response 500 {string} Unexpected server or database error.
 * @param {object} req
 * @param {object} res
 */
async function listAttempts(req, res) {
    const userId = parseId(req.params.idUsuario);
    if (!userId) {
        res.status(400).send("Usuário inválido.");
        return;
    }

    try {
        const attempts = await tentativaModel.listAttempts(userId);
        if (attempts.length === 0) {
            res.status(204).send();
            return;
        }
        res.status(200).json(attempts);
    } catch (error) {
        console.error("Error listing attempts:", error.message);
        res.status(500).send("Não foi possível listar as tentativas.");
    }
}

/**
 * Checks the body of a new attempt: the list and exercise ids and the move format.
 * Move legality is not checked here: the exercise page only allows legal moves.
 * @param {object} body - The request body.
 * @returns {string|null} The error message, or null when the attempt is valid.
 */
function validateAttempt(body) {
    if (!parseId(body.fk_lista)) {
        return "Lista inválida.";
    }
    if (!parseId(body.fk_exercicio)) {
        return "Exercício inválido.";
    }
    if (!Array.isArray(body.lances) || body.lances.length === 0) {
        return "Informe os lances da tentativa.";
    }
    for (const move of body.lances) {
        if (!SAN_MOVE.test(move)) {
            return `Lance inválido: ${move}`;
        }
    }
    return null;
}

/**
 * Tells whether an attempt played the whole solution, move by move (RN04).
 * @param {string[]} moves - The attempt's moves in SAN, the opponent's replies included.
 * @param {string[]} solution - The exercise's solution in SAN.
 * @returns {boolean}
 */
function isWholeSolution(moves, solution) {
    if (moves.length !== solution.length) {
        return false;
    }
    for (let index = 0; index < solution.length; index++) {
        if (moves[index] !== solution[index]) {
            return false;
        }
    }
    return true;
}

/**
 * Reads an id from the URL or the body.
 * @param {*} value
 * @returns {number|null} The id, or null when it is not a positive whole number.
 */
function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

module.exports = {
    registerAttempt,
    listAttempts
};
