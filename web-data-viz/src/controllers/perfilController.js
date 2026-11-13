const perfilModel = require("../models/perfilModel");

const MAX_RATING = 3500;
const FIRST_START_YEAR = 1901; // The first year MySQL's YEAR type accepts.
const MAX_BIO_LENGTH = 50;
// The size of the column perfil.abertura_favorita.
const MAX_OPENING_LENGTH = 50;

/**
 * Reads the user's player profile (RF17).
 *
 * @route GET /perfis/buscar/:idUsuario
 * @fromRoute {number} idUsuario - The user's id.
 * @response 200 {object} The profile.
 * @response 204 The user has no profile.
 * @response 400 {string} The user id is not a positive whole number.
 * @response 500 {string} Unexpected server or database error.
 * @param {object} req
 * @param {object} res
 */
async function findProfile(req, res) {
    const userId = parseId(req.params.idUsuario);
    if (!userId) {
        res.status(400).send("Usuário inválido.");
        return;
    }

    try {
        const profile = await perfilModel.findProfile(userId);
        if (!profile) {
            res.status(204).send();
            return;
        }
        res.status(200).json(profile);
    } catch (error) {
        console.error("Error finding a profile:", error.message);
        res.status(500).send("Não foi possível buscar o perfil.");
    }
}

/**
 * Replaces every field of the user's player profile (RF17).
 *
 * @route PUT /perfis/atualizar/:idUsuario
 * @fromHeader {string} Content-Type - "application/json", so Express can read the body.
 * @fromRoute {number} idUsuario - The user's id.
 * @fromBody {number} rating - The player's rating, from 0 to 3500.
 * @fromBody {number} ano_inicio - The year the user started playing, up to the current year.
 * @fromBody {string} bio - A short text about the user, up to 50 characters.
 * @fromBody {string} [abertura_favorita] - Optional: the favorite opening's name, up to 50 characters.
 * @response 204 The profile was updated.
 * @response 400 {string} The user id is invalid, or a field is missing or breaks a rule.
 * @response 404 {string} The user has no profile.
 * @response 500 {string} Unexpected server or database error.
 * @param {object} req
 * @param {object} res
 */
async function updateProfile(req, res) {
    const userId = parseId(req.params.idUsuario);
    if (!userId) {
        res.status(400).send("Usuário inválido.");
        return;
    }

    const error = validateProfile(req.body);
    if (error) {
        res.status(400).send(error);
        return;
    }

    try {
        const wasUpdated = await perfilModel.updateProfile(userId, readProfile(req.body));
        if (!wasUpdated) {
            res.status(404).send("Perfil não encontrado.");
            return;
        }
        res.status(204).send();
    } catch (error) {
        console.error("Error updating a profile:", error.message);
        res.status(500).send("Não foi possível atualizar o perfil.");
    }
}

/**
 * Checks the profile fields. Rating, starting year and bio are required; the favorite opening may be empty,
 * for a user who has none.
 * Also used by the sign-up, which creates the profile together with the account.
 * @param {object} body - The request body.
 * @returns {string|null} The error message, or null when every field is valid.
 */
function validateProfile(body) {
    if (isEmpty(body.rating) || isEmpty(body.ano_inicio) || isEmpty(body.bio)) {
        return "Preencha o rating, o ano de início e a bio.";
    }
    if (!isWholeNumberBetween(body.rating, 0, MAX_RATING)) {
        return "Rating inválido.";
    }
    if (!isWholeNumberBetween(body.ano_inicio, FIRST_START_YEAR, new Date().getFullYear())) {
        return "Ano de início inválido.";
    }
    // A bio that is not text would make trim() throw outside the try, which Express 4 does not catch.
    if (typeof body.bio !== "string" || body.bio.trim().length > MAX_BIO_LENGTH) {
        return `A bio pode ter no máximo ${MAX_BIO_LENGTH} caracteres.`;
    }
    if (isEmpty(body.abertura_favorita)) {
        return null;
    }
    if (typeof body.abertura_favorita !== "string" || body.abertura_favorita.trim().length > MAX_OPENING_LENGTH) {
        return "Abertura inválida.";
    }
    return null;
}

/**
 * Turns a validated body into the model's profile. Also used by the sign-up.
 * @param {object} body - The request body, already validated.
 * @returns {{rating: number, anoInicio: number, bio: string, aberturaFavorita: string|null}}
 */
function readProfile(body) {
    return {
        rating: body.rating,
        anoInicio: body.ano_inicio,
        bio: body.bio.trim(),
        aberturaFavorita: isEmpty(body.abertura_favorita) ? null : body.abertura_favorita.trim()
    };
}

/**
 * @param {*} value
 * @returns {boolean} True when the field was left empty: null, missing or blank text.
 */
function isEmpty(value) {
    return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

/**
 * @param {*} value
 * @param {number} min
 * @param {number} max
 * @returns {boolean} True when the value is a whole number from min to max.
 */
function isWholeNumberBetween(value, min, max) {
    return Number.isInteger(value) && value >= min && value <= max;
}

/**
 * Reads an id from the URL or the body.
 * @param {*} value
 * @returns {number|null} The id, or null when it is not a positive whole number.
 */
function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

module.exports = {
    findProfile,
    updateProfile,
    validateProfile,
    readProfile
};
