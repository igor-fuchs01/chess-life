const database = require("../database/config");

/**
 * Reads a user's profile.
 * @param {number} userId
 * @returns {Promise<object|undefined>} The profile { rating, ano_inicio, bio, abertura_favorita },
 *   or undefined when the user has none.
 */
async function findProfile(userId) {
    const sql = `
        SELECT rating, ano_inicio, bio, abertura_favorita
        FROM perfil
        WHERE fk_usuario = ?;
    `;
    const rows = await database.query(sql, [userId]);
    return rows[0];
}

/**
 * Replaces every field of a user's profile.
 * @param {number} userId
 * @param {{rating: number, anoInicio: number, bio: string, aberturaFavorita: string|null}} profile
 * @returns {Promise<boolean>} False when the user has no profile to update.
 */
async function updateProfile(userId, profile) {
    const sql = `
        UPDATE perfil
        SET rating = ?, ano_inicio = ?, bio = ?, abertura_favorita = ?
        WHERE fk_usuario = ?;
    `;
    const result = await database.query(sql, [profile.rating, profile.anoInicio, profile.bio, profile.aberturaFavorita, userId]);
    return result.affectedRows > 0;
}

module.exports = {
    findProfile,
    updateProfile
};
