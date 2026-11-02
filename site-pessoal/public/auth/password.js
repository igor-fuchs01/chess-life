const MIN_PASSWORD_LENGTH = 8;
const UPPERCASE_PATTERN = /[A-Z]/;
const LOWERCASE_PATTERN = /[a-z]/;
const DIGIT_PATTERN = /[0-9]/;
const SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/;

/**
 * Checks that a password is strong (RN02): at least 8 characters, with an uppercase letter,
 * a lowercase letter, a digit and a special character. Used by the sign-up page.
 * @param {string} password
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
