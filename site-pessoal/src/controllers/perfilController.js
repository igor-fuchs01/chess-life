const perfilModel = require("../models/perfilModel");

const MAX_RATING = 3500;
// The first year MySQL's YEAR type accepts.
const FIRST_START_YEAR = 1901;
const MAX_BIO_LENGTH = 50;
// MySQL error when a foreign key points to a row that does not exist. An update never changes the user,
// so here it can only be the favorite opening.
const MISSING_REFERENCE_CODE = "ER_NO_REFERENCED_ROW_2";

/**
 * Replies with the user's profile: 200 with it, 204 when there is none, or 400 for an invalid user id.
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
 * Replaces every field of the user's profile. Replies 204, 400 with the validation error,
 * or 404 when the user has no profile.
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
        if (error.code === MISSING_REFERENCE_CODE) {
            res.status(400).send("Abertura inválida.");
            return;
        }
        console.error("Error updating a profile:", error.message);
        res.status(500).send("Não foi possível atualizar o perfil.");
    }
}

/**
 * Checks the profile fields. Every field is required: the player profile is not optional.
 * Also used by the sign-up, which creates the profile together with the account.
 * @param {object} body - The request body.
 * @returns {string|null} The error message, or null when every field is valid.
 */
function validateProfile(body) {
    if (isEmpty(body.rating) || isEmpty(body.ano_inicio) || isEmpty(body.bio) || isEmpty(body.fk_abertura_favorita)) {
        return "Preencha o rating, o ano de início, a abertura favorita e a bio.";
    }
    if (!isWholeNumberBetween(body.rating, 0, MAX_RATING)) {
        return "Rating inválido.";
    }
    if (!isWholeNumberBetween(body.ano_inicio, FIRST_START_YEAR, new Date().getFullYear())) {
        return "Ano de início inválido.";
    }
    if (typeof body.bio !== "string" || body.bio.trim().length > MAX_BIO_LENGTH) {
        return `A bio pode ter no máximo ${MAX_BIO_LENGTH} caracteres.`;
    }
    if (!parseId(body.fk_abertura_favorita)) {
        return "Abertura inválida.";
    }
    return null;
}

/**
 * Turns a validated body into the model's profile. Also used by the sign-up.
 * @param {object} body - The request body, already validated.
 * @returns {{rating: number, anoInicio: number, bio: string, fkAberturaFavorita: number}}
 */
function readProfile(body) {
    return {
        rating: body.rating,
        anoInicio: body.ano_inicio,
        bio: body.bio.trim(),
        fkAberturaFavorita: parseId(body.fk_abertura_favorita)
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
