const partidaModel = require("../models/partidaModel");
const aberturaModel = require("../models/aberturaModel");
const openingBook = require("../models/openingBook");

const RESULTS = ["vitoria", "derrota", "empate"];
const OPPONENTS = ["humano", "ia"];
const COLORS = ["brancas", "pretas"];
// One move in standard algebraic notation: castling, or piece, origin, capture, square, promotion and check.
const SAN_MOVE = /^(O-O(-O)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?)[+#]?$/;
// MySQL error when a foreign key points to a row that does not exist, here a user id with no account.
const MISSING_REFERENCE_CODE = "ER_NO_REFERENCED_ROW_2";

/**
 * Replies with the user's games: 200 with the list, 204 when there are none, or 400 for an invalid user id.
 */
async function listGames(req, res) {
    const userId = parseId(req.params.idUsuario);
    if (!userId) {
        res.status(400).send("Usuário inválido.");
        return;
    }

    try {
        const games = await partidaModel.listGames(userId);
        if (games.length === 0) {
            res.status(204).send();
            return;
        }
        res.status(200).json(games);
    } catch (error) {
        console.error("Error listing games:", error.message);
        res.status(500).send("Não foi possível listar as partidas.");
    }
}

/**
 * Validates a finished game, identifies its opening from the moves and saves it with its moves.
 * Replies 201 with { id, abertura }, 400 with the validation error, or 404 when the user does not exist.
 */
async function registerGame(req, res) {
    const userId = parseId(req.params.idUsuario);
    if (!userId) {
        res.status(400).send("Usuário inválido.");
        return;
    }

    const error = validateGame(req.body);
    if (error) {
        res.status(400).send(error);
        return;
    }

    try {
        const openings = await aberturaModel.listOpenings();
        const opening = openingBook.identifyOpening(req.body.lances, openings);
        const gameId = await partidaModel.registerGame(userId, {
            resultado: req.body.resultado,
            adversario: req.body.adversario,
            cor: req.body.cor,
            fkAbertura: opening.id,
            lances: req.body.lances
        });
        res.status(201).json({ id: gameId, abertura: opening.nome });
    } catch (error) {
        if (error.code === MISSING_REFERENCE_CODE) {
            res.status(404).send("Usuário não encontrado.");
            return;
        }
        console.error("Error registering a game:", error.message);
        res.status(500).send("Não foi possível registrar a partida.");
    }
}

/**
 * Checks the body of a new game (RN04 and the allowed opponents, colors and move format).
 * Move legality is not checked here: the game page validates every move while the game is played.
 * @param {object} body - The request body.
 * @returns {string|null} The error message, or null when the game is valid.
 */
function validateGame(body) {
    if (!RESULTS.includes(body.resultado)) {
        return "Resultado inválido.";
    }
    if (!OPPONENTS.includes(body.adversario)) {
        return "Adversário inválido.";
    }
    if (!COLORS.includes(body.cor)) {
        return "Cor inválida.";
    }
    if (!Array.isArray(body.lances) || body.lances.length === 0) {
        return "Informe os lances da partida.";
    }
    for (const move of body.lances) {
        if (!SAN_MOVE.test(move)) {
            return `Lance inválido: ${move}`;
        }
    }
    return null;
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
    listGames,
    registerGame
};
