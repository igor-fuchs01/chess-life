const database = require("../database/config");

/**
 * Finds the user with an e-mail, with the password needed to check a login and the name from their profile.
 * @param {string} email
 * @returns {Promise<object|undefined>} The user { id, nome, email, senha }, or undefined when there is none.
 */
async function findUserByEmail(email) {
    const sql = `
        SELECT u.id, p.nome, u.email, u.senha
        FROM usuario u
            JOIN perfil p ON p.fk_usuario = u.id
        WHERE u.email = ?;
    `;
    const users = await database.query(sql, [email]);
    return users[0];
}

/**
 * Creates a user and then their profile, one statement after the other.
 * The user row holds only the e-mail and the password; the name goes in the profile.
 * Fails with ER_DUP_ENTRY when the e-mail is already registered (RN01); then no profile is saved.
 * @param {string} name
 * @param {string} email
 * @param {string} password - Stored as plain text.
 * @param {{rating: number, anoInicio: number, bio: string, aberturaFavorita: string|null}} profile
 * @returns {Promise<number>} The new user's id.
 */
async function createUser(name, email, password, profile) {
    const userSql = `
        INSERT INTO usuario (email, senha)
        VALUES (?, ?);
    `;
    const profileSql = `
        INSERT INTO perfil (fk_usuario, nome, rating, ano_inicio, bio, abertura_favorita)
        VALUES (?, ?, ?, ?, ?, ?);
    `;

    const userResult = await database.query(userSql, [email, password]);
    const userId = userResult.insertId;
    await database.query(profileSql, [userId, name, profile.rating, profile.anoInicio, profile.bio, profile.aberturaFavorita]);
    return userId;
}

module.exports = {
    findUserByEmail,
    createUser
};
