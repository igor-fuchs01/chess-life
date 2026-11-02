const express = require("express");
const aberturaController = require("../controllers/aberturaController");

const router = express.Router();

router.get("/listar", aberturaController.listOpenings);

module.exports = router;
