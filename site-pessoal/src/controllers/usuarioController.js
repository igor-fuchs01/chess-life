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
const MISSING_REFERENCE_CODE = "ER_NO_REFERENCED_ROW_2";

/**
 * Creates an account and its player profile (RF01, RF02, RF17). Replies 201 with { id }, 400 with the validation error,
 * or 409 when the e-mail is already registered. Error messages are plain text in Portuguese.
 * The profile fields are optional and follow the same rules as PUT /perfis/atualizar.
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
        if (error.code === MISSING_REFERENCE_CODE) {
            res.status(400).send("Abertura inválida.");
            return;
        }
        console.error("Error registering a user:", error.message);
        res.status(500).send("Não foi possível criar a conta.");
    }
}

/**
 * Checks an e-mail and password (RF03). Replies 200 with { id, nome, email }, 400 when a field is missing,
 * or 403 when they do not match. The reply never tells which of the two was wrong.
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
