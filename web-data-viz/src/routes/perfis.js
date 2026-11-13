const express = require("express");
const perfilController = require("../controllers/perfilController");

const router = express.Router();

router.get("/buscar/:idUsuario", perfilController.findProfile);
router.put("/atualizar/:idUsuario", perfilController.updateProfile);

module.exports = router;
