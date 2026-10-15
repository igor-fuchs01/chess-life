var partidaModel = require("../models/partidaModel");
var openingBook = require("../models/openingBook");

var RESULTS = ["vitoria", "derrota", "empate"];
var OPPONENTS = ["humano", "ia"];
var COLORS = ["brancas", "pretas"];
// One move in standard algebraic notation: castling, or piece, origin, capture, square, promotion and check.
var SAN_MOVE = /^(O-O(-O)?|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?)[+#]?$/;

/**
 * Replies with the user's games: 200 with the list, or 204 when there are none.
 */
function listGames(req, res) {
    partidaModel.listGames(req.params.idUsuario)
        .then(function (games) {
            if (games.length === 0) {
                res.status(204).send();
                return;
            }
            res.status(200).json(games);
        })
        .catch(function (error) {
            console.log("Error listing games: ", error.sqlMessage);
            res.status(500).json("Não foi possível listar as partidas.");
        });
}

/**
 * Validates a finished game, identifies its opening from the moves and saves it.
 * Replies 201 with the new id and the opening, or 400 with the validation error.
 */
function registerGame(req, res) {
    var error = validateGame(req.body);
    if (error) {
        res.status(400).json(error);
        return;
    }

    var game = {
        resultado: req.body.resultado,
        adversario: req.body.adversario,
        cor: req.body.cor,
        lances: req.body.lances.join(" "),
        abertura: openingBook.identifyOpening(req.body.lances)
    };

    partidaModel.registerGame(req.params.idUsuario, game)
        .then(function (result) {
            res.status(201).json({ id: result.insertId, abertura: game.abertura });
        })
        .catch(function (error) {
            console.log("Error registering a game: ", error.sqlMessage);
            res.status(500).json("Não foi possível registrar a partida.");
        });
}

/**
 * Deletes one of the user's games. Replies 404 when the game does not exist or belongs to another user.
 */
function deleteGame(req, res) {
    partidaModel.deleteGame(req.params.idUsuario, req.params.idPartida)
        .then(function (result) {
            if (result.affectedRows === 0) {
                res.status(404).json("Partida não encontrada.");
                return;
            }
            res.status(200).send();
        })
        .catch(function (error) {
            console.log("Error deleting a game: ", error.sqlMessage);
            res.status(500).json("Não foi possível excluir a partida.");
        });
}

/**
 * Checks the body of a new game (RN04 and the allowed opponents, colors and move format).
 * Move legality is not checked here: the game board validates every move while the game is played.
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
    for (var move of body.lances) {
        if (!SAN_MOVE.test(move)) {
            return "Lance inválido: " + move;
        }
    }
    return null;
}

module.exports = {
    listGames,
    registerGame,
    deleteGame
};
