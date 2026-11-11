const express = require("express");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

router.get("/tentativas/:idUsuario", dashboardController.listAttempts);
router.get("/listasExercicios/:idUsuario", dashboardController.listLists);

module.exports = router;
