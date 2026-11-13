const usuarioModel = require("../models/usuarioModel");
const perfilController = require("./perfilController");

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 100;
const UPPERCASE_PATTERN = /[A-Z]/;
const LOWERCASE_PATTERN = /[a-z]/;
const DIGIT_PATTERN = /[0-9]/;
const SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 120;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUPLICATE_ENTRY_CODE = "ER_DUP_ENTRY";

/**
 * Creates an account and its player profile in one transaction (RF01, RF02, RF17).
 * The profile fields follow the same rules as PUT /perfis/atualizar.
 *
 * @route POST /usuarios/cadastrar
 * @fromHeader {string} Content-Type - "application/json", so Express can read the body.
 * @fromBody {string} nomeServer - The user's name, up to 80 characters.
 * @fromBody {string} emailServer - The login e-mail, unique (RN01).
 * @fromBody {string} senhaServer - The password, 8 to 100 characters and strong (RN02).
 * @fromBody {number} rating - The player's rating, from 0 to 3500.
 * @fromBody {number} ano_inicio - The year the user started playing, up to the current year.
 * @fromBody {string} bio - A short text about the user, up to 50 characters.
 * @fromBody {string} [abertura_favorita] - Optional: the favorite opening's name, up to 50 characters.
 * @response 201 {{id: number}} The account and the profile were created.
 * @response 400 {string} A field is missing or breaks a rule.
 * @response 409 {string} The e-mail is already registered.
 * @response 500 {string} Unexpected server or database error.
 * @param {object} req
 * @param {object} res
 */
async function registerUser(req, res) {
    const name = String(req.body.nomeServer || "").trim();
    const email = String(req.body.emailServer || "").trim();
    const password = String(req.body.senhaServer || "");

    const error = validateNewUser(name, email, password) || perfilController.validateProfile(req.body);
    if (error) {
        res.status(400).send(error);
        return;
    }

    try {
        const userId = await usuarioModel.createUser(name, email, password, perfilController.readProfile(req.body));
        res.status(201).json({ id: userId });
    } catch (error) {
        if (error.code === DUPLICATE_ENTRY_CODE) {
            res.status(409).send("Este e-mail já está cadastrado.");
            return;
        }
        console.error("Error registering a user:", error.message);
        res.status(500).send("Não foi possível criar a conta.");
    }
}

/**
 * Checks an e-mail and password (RF03). The reply never tells which of the two was wrong.
 *
 * @route POST /usuarios/autenticar
 * @fromHeader {string} Content-Type - "application/json", so Express can read the body.
 * @fromBody {string} emailServer - The login e-mail.
 * @fromBody {string} senhaServer - The password.
 * @response 200 {{id: number, nome: string, email: string}} The user, to be kept in the browser session.
 * @response 400 {string} The e-mail or the password is missing.
 * @response 403 {string} The e-mail and the password do not match.
 * @response 500 {string} Unexpected server or database error.
 * @param {object} req
 * @param {object} res
 */
async function authenticateUser(req, res) {
    const email = String(req.body.emailServer || "").trim();
    const password = String(req.body.senhaServer || "");

    if (!email || !password) {
        res.status(400).send("Informe o e-mail e a senha.");
        return;
    }

    try {
        const user = await usuarioModel.findUserByEmail(email);
        const isPasswordRight = user !== undefined && user.senha === password;

        if (!isPasswordRight) {
            res.status(403).send("E-mail e/ou senha inválidos.");
            return;
        }
        res.status(200).json({ id: user.id, nome: user.nome, email: user.email });
    } catch (error) {
        console.error("Error authenticating a user:", error.message);
        res.status(500).send("Não foi possível entrar.");
    }
}

/**
 * Checks the sign-up fields against the business rules and the column sizes.
 * @returns {string|null} The error message, or null when every field is valid.
 */
function validateNewUser(name, email, password) {
    if (!name || !email || !password) {
        return "Preencha o nome, o e-mail e a senha.";
    }
    if (name.length > MAX_NAME_LENGTH) {
        return `O nome pode ter no máximo ${MAX_NAME_LENGTH} caracteres.`;
    }
    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
        return "Informe um e-mail válido.";
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
        return `A senha pode ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.`;
    }
    return validatePasswordStrength(password);
}

/**
 * Checks that a password is strong (RN02): at least 8 characters, with an uppercase letter,
 * a lowercase letter, a digit and a special character.
 * @returns {string|null} The error message, or null when the password is strong.
 */
function validatePasswordStrength(password) {
    if (password.length < MIN_PASSWORD_LENGTH) {
        return `A senha precisa ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
    }
    if (!UPPERCASE_PATTERN.test(password)) {
        return "A senha precisa ter pelo menos uma letra maiúscula.";
    }
    if (!LOWERCASE_PATTERN.test(password)) {
        return "A senha precisa ter pelo menos uma letra minúscula.";
    }
    if (!DIGIT_PATTERN.test(password)) {
        return "A senha precisa ter pelo menos um número.";
    }
    if (!SPECIAL_CHARACTER_PATTERN.test(password)) {
        return "A senha precisa ter pelo menos um caractere especial.";
    }
    return null;
}

module.exports = {
    registerUser,
    authenticateUser
};
