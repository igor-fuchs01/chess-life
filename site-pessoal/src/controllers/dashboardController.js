const dashboardModel = require("../models/dashboardModel");

// A day as the page's date fields send it.
const DAY_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Replies with the user's attempts in the period of the query string: 200 with them, 204 when there are none,
 * or 400 for an invalid user id or period.
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
 * Replies with the exercise lists and what the user solved in the period of the query string:
 * 200 with them, 204 when there are none, or 400 for an invalid user id or period.
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
 * Checks the period of the query string: two real days, the first one not after the last.
 * @param {{start: *, end: *}} period - data_inicio and data_fim from the query string.
 * @returns {string|null} The error message, or null when the period is valid.
 */
function validatePeriod(period) {
    if (!period.start || !period.end) {
        return "Informe a data de início e a data de fim.";
    }
    if (!isRealDay(period.start) || !isRealDay(period.end)) {
        return "Data inválida.";
    }
    // Days written as "YYYY-MM-DD" compare as text in date order.
    if (period.start > period.end) {
        return "A data de início não pode ser depois da data de fim.";
    }
    return null;
}

/**
 * Tells whether a value is a real day written as "YYYY-MM-DD".
 * @param {*} value
 * @returns {boolean}
 */
function isRealDay(value) {
    if (typeof value !== "string" || !DAY_FORMAT.test(value)) {
        return false;
    }
    const date = new Date(value);
    // An impossible day such as "2026-02-30" rolls over to March, so only a real day comes back unchanged.
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
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
