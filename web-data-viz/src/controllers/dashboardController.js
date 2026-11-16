const dashboardModel = require("../models/dashboardModel");

/**
 * Sends the user's attempts and exercise lists progress in a period, with the totals of the previous period,
 * for the dashboard (RF09, RF10).
 *
 * @route GET /dashboard/desempenho/:idUsuario
 * @fromRoute {number} idUsuario - The user's id.
 * @fromQuery {string} data_inicio - The period's first day, YYYY-MM-DD.
 * @fromQuery {string} data_fim - The period's last day, YYYY-MM-DD, included.
 * @response 200 {{tentativas: {id: number, acertou: boolean, data_tentativa: string, lista: string, exercicio: string}[], periodo_anterior: {total: number, acertos: number}, listas: {id: number, nome: string, descricao: string, total_exercicios: number, resolvidos: number}[]}} The attempts, newest first, and the lists, in order, also when there are none.
 * @response 400 {string} The user id or the period is invalid.
 * @response 500 {string} Unexpected server or database error.
 * @param {object} req
 * @param {object} res
 */
async function findPerformance(req, res) {
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
        const previousPeriod = await dashboardModel.countPreviousAttempts(userId, period.start);
        const lists = await dashboardModel.listLists(userId, period);
        res.status(200).json({ tentativas: attempts, periodo_anterior: previousPeriod, listas: lists });
    } catch (error) {
        console.error("Error loading the dashboard performance:", error.message);
        res.status(500).send("Não foi possível carregar o desempenho.");
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
    findPerformance
};
