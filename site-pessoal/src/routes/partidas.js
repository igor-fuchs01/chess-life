const express = require("express");
const partidaController = require("../controllers/partidaController");

const router = express.Router();

router.get("/listar/:idUsuario", partidaController.listGames);
router.post("/cadastrar/:idUsuario", partidaController.registerGame);

module.exports = router;
