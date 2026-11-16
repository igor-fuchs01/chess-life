const express = require("express");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

router.get("/desempenho/:idUsuario", dashboardController.findPerformance);

module.exports = router;
