const aberturaModel = require("../models/aberturaModel");

/**
 * Replies 200 with every opening's id and name, in alphabetical order.
 */
async function listOpenings(req, res) {
    try {
        const openings = await aberturaModel.listOpeningNames();
        res.status(200).json(openings);
    } catch (error) {
        console.error("Error listing openings:", error.message);
        res.status(500).send("Não foi possível listar as aberturas.");
    }
}

module.exports = {
    listOpenings
};
