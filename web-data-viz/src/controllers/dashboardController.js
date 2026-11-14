const dashboardModel = require("../models/dashboardModel");

/**
 * Lists the user's attempts in a period, for the dashboard (RF09, RF10).
 *
 * @route GET /dashboard/tentativas/:idUsuario
 * @fromRoute {number} idUsuario - The user's id.
 * @fromQuery {string} data_inicio - The period's first day, YYYY-MM-DD.
 * @fromQuery {string} data_fim - The period's last day, YYYY-MM-DD, included.
 * @response 200 {object[]} The attempts in the period.
 * @response 204 The user has no attempts in the period.
 * @response 400 {string} The user id or the period is invalid.
 * @response 500 {string} Unexpected server or database error.
 * @param {object} req
 * @param {object} res
 */
async function listAttempts(req, res) {
    const userId = parseId(req.params.idUsuario);
    if (!userId) {
        res.status(400).send("Usuário inválido.");
        return;
    }

    const period = { start: req.query.data_inicio, end: req.query.data_fim };
    const periodError = validatePeriod(period);
    if (periodError) {
        res.status(400).send(periodError);
        return;
    }

    try {
        const attempts = await dashboardModel.listAttempts(userId, period);
        if (attempts.length === 0) {
            res.status(204).send();
            return;
        }
        res.status(200).json(attempts);
    } catch (error) {
        console.error("Error listing the dashboard attempts:", error.message);
        res.status(500).send("Não foi possível listar as tentativas.");
    }
}

/**
 * Lists the exercise lists with how many exercises the user solved in a period, for the dashboard (RF09).
 *
 * @route GET /dashboard/listasExercicios/:idUsuario
 * @fromRoute {number} idUsuario - The user's id.
 * @fromQuery {string} data_inicio - The period's first day, YYYY-MM-DD.
 * @fromQuery {string} data_fim - The period's last day, YYYY-MM-DD, included.
 * @response 200 {object[]} The lists, in order.
 * @response 204 There are no lists.
 * @response 400 {string} The user id or the period is invalid.
 * @response 500 {string} Unexpected server or database error.
 * @param {object} req
 * @param {object} res
 */
async function listLists(req, res) {
    const userId = parseId(req.params.idUsuario);
    if (!userId) {
        res.status(400).send("Usuário inválido.");
        return;
    }

    const period = { start: req.query.data_inicio, end: req.query.data_fim };
    const periodError = validatePeriod(period);
    if (periodError) {
        res.status(400).send(periodError);
        return;
    }

    try {
        const lists = await dashboardModel.listLists(userId, period);
        if (lists.length === 0) {
            res.status(204).send();
            return;
        }
        res.status(200).json(lists);
    } catch (error) {
        console.error("Error listing the dashboard exercise lists:", error.message);
        res.status(500).send("Não foi possível listar as listas de exercícios.");
    }
}

/**
 * Checks the period of the query string: two dates, the first one not after the last.
 * @param {{start: *, end: *}} period - data_inicio and data_fim from the query string.
 * @returns {string|null} The error message, or null when the period is valid.
 */
function validatePeriod(period) {
    if (!period.start || !period.end) {
        return "Informe a data de início e a data de fim.";
    }

    const start = Date.parse(period.start);
    const end = Date.parse(period.end);
    if (Number.isNaN(start) || Number.isNaN(end)) {
        return "Data inválida.";
    }
    if (start > end) {
        return "A data de início não pode ser depois da data de fim.";
    }
    return null;
}

/**
 * Reads an id from the URL.
 * @param {string} value
 * @returns {number|null} The id, or null when it is not a positive whole number.
 */
function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

module.exports = {
    listAttempts,
    listLists
};
