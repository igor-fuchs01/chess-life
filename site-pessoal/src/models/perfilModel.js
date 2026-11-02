const database = require("../database/config");

/**
 * Reads a user's profile, with the favorite opening's name.
 * @param {number} userId
 * @returns {Promise<object|undefined>} The profile { rating, ano_inicio, bio, fk_abertura_favorita, abertura_favorita },
 *   or undefined when the user has none.
 */
async function findProfile(userId) {
    // LEFT JOIN, because the favorite opening is optional.
    const sql = `
        SELECT p.rating, p.ano_inicio, p.bio, p.fk_abertura_favorita, a.nome AS abertura_favorita
        FROM perfil p
            LEFT JOIN abertura a ON a.id = p.fk_abertura_favorita
        WHERE p.fk_usuario = ?;
    `;
    const rows = await database.query(sql, [userId]);
    return rows[0];
}

/**
 * Replaces every field of a user's profile. Fails with ER_NO_REFERENCED_ROW_2 when the opening does not exist.
 * @param {number} userId
 * @param {{rating: number, anoInicio: number, bio: string, fkAberturaFavorita: number}} profile
 * @returns {Promise<boolean>} False when the user has no profile to update.
 */
async function updateProfile(userId, profile) {
    const sql = `
        UPDATE perfil
        SET rating = ?, ano_inicio = ?, bio = ?, fk_abertura_favorita = ?
        WHERE fk_usuario = ?;
    `;
    const result = await database.query(sql, [profile.rating, profile.anoInicio, profile.bio, profile.fkAberturaFavorita, userId]);
    return result.affectedRows > 0;
}

module.exports = {
    findProfile,
    updateProfile
};
