const database = require("../database/config");

/**
 * Finds the user with an e-mail, with the password needed to check a login.
 * @param {string} email
 * @returns {Promise<object|undefined>} The user { id, nome, email, senha }, or undefined when there is none.
 */
async function findUserByEmail(email) {
    const sql = `
        SELECT id, nome, email, senha
        FROM usuario
        WHERE email = ?;
    `;
    const users = await database.query(sql, [email]);
    return users[0];
}

/**
 * Creates a user and their profile in one transaction, so an account never exists without its profile.
 * Fails with ER_DUP_ENTRY when the e-mail is already registered (RN01); then neither row is saved.
 * @param {string} name
 * @param {string} email
 * @param {string} password - Stored as plain text.
 * @param {{rating: number, anoInicio: number, bio: string, aberturaFavorita: string|null}} profile
 * @returns {Promise<number>} The new user's id.
 */
function createUser(name, email, password, profile) {
    const userSql = `
        INSERT INTO usuario (nome, email, senha)
        VALUES (?, ?, ?);
    `;
    const profileSql = `
        INSERT INTO perfil (fk_usuario, rating, ano_inicio, bio, abertura_favorita)
        VALUES (?, ?, ?, ?, ?);
    `;

    return database.transaction(async function (query) {
        const userResult = await query(userSql, [name, email, password]);
        const userId = userResult.insertId;
        await query(profileSql, [userId, profile.rating, profile.anoInicio, profile.bio, profile.aberturaFavorita]);
        return userId;
    });
}

module.exports = {
    findUserByEmail,
    createUser
};
