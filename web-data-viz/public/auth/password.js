const MIN_PASSWORD_LENGTH = 8;

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

  let hasUppercase = false;
  let hasLowercase = false;
  let hasDigit = false;
  let hasSpecialCharacter = false;

  for (const character of password) {
    if (character >= "A" && character <= "Z") {
      hasUppercase = true;
    } else if (character >= "a" && character <= "z") {
      hasLowercase = true;
    } else if (character >= "0" && character <= "9") {
      hasDigit = true;
    } else {
      hasSpecialCharacter = true;
    }
  }

  if (!hasUppercase) {
    return "A senha precisa ter pelo menos uma letra maiúscula.";
  }
  if (!hasLowercase) {
    return "A senha precisa ter pelo menos uma letra minúscula.";
  }
  if (!hasDigit) {
    return "A senha precisa ter pelo menos um número.";
  }
  if (!hasSpecialCharacter) {
    return "A senha precisa ter pelo menos um caractere especial.";
  }
  return null;
}
