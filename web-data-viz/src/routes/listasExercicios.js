const express = require("express");
const listaExerciciosController = require("../controllers/listaExerciciosController");

const router = express.Router();

router.get("/listar/:idUsuario", listaExerciciosController.listLists);

module.exports = router;
