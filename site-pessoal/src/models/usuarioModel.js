const database = require("../database/config");

/**
 * Finds the user with an e-mail, with the password hash needed to check a login.
 * @param {string} email
 * @returns {Promise<object|undefined>} The user { id, nome, email, senha_hash }, or undefined when there is none.
 */
async function findUserByEmail(email) {
    const sql = `
        SELECT id, nome, email, senha_hash
        FROM usuario
        WHERE email = ?;
    `;
    const users = await database.query(sql, [email]);
    return users[0];
}

/**
 * Creates a user. Fails with the MySQL code ER_DUP_ENTRY when the e-mail is already registered (RN01).
 * @param {string} name
 * @param {string} email
 * @param {string} passwordHash - bcrypt hash of the password.
 * @returns {Promise<object>} The insert result, with insertId.
 */
function createUser(name, email, passwordHash) {
    const sql = `
        INSERT INTO usuario (nome, email, senha_hash)
        VALUES (?, ?, ?);
    `;
    return database.query(sql, [name, email, passwordHash]);
}

module.exports = {
    findUserByEmail,
    createUser
};
