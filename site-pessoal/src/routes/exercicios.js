const express = require("express");
const exercicioController = require("../controllers/exercicioController");

const router = express.Router();

router.get("/listar/:idLista/:idUsuario", exercicioController.listExercises);
router.get("/buscar/:idExercicio", exercicioController.findExercise);

module.exports = router;
