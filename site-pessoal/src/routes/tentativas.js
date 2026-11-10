const express = require("express");
const tentativaController = require("../controllers/tentativaController");

const router = express.Router();

router.get("/listar/:idUsuario", tentativaController.listAttempts);
router.post("/cadastrar/:idUsuario", tentativaController.registerAttempt);

module.exports = router;
