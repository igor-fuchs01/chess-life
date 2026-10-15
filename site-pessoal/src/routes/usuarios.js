const express = require("express");
const usuarioController = require("../controllers/usuarioController");

const router = express.Router();

router.post("/cadastrar", usuarioController.registerUser);
router.post("/autenticar", usuarioController.authenticateUser);

module.exports = router;
