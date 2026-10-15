var express = require("express");
var router = express.Router();

var partidaController = require("../controllers/partidaController");

router.get("/listar/:idUsuario", function (req, res) {
    partidaController.listGames(req, res);
});

router.post("/cadastrar/:idUsuario", function (req, res) {
    partidaController.registerGame(req, res);
});

router.delete("/deletar/:idUsuario/:idPartida", function (req, res) {
    partidaController.deleteGame(req, res);
});

module.exports = router;
