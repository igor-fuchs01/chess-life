const REDIRECT_DELAY_MS = 1500;

const signupForm = document.getElementById("signup-form");
const signupMessage = document.getElementById("signup-message");

/**
 * Validates the form and creates the account together with the player profile. On success, goes to the login page.
 * @param {SubmitEvent} event
 */
async function createAccount(event) {
  event.preventDefault();

  const name = signupForm.name.value;
  const email = signupForm.email.value;
  const password = signupForm.password.value;
  const confirmation = signupForm.confirmation.value;

  const profile = readProfileFields(signupForm);

  const error = validateSignup(name, email, password, confirmation) || validateProfileFields(profile);
  if (error) {
    showMessage(signupMessage, error, "error");
    return;
  }

  try {
    const response = await fetch("/usuarios/cadastrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomeServer: name, emailServer: email, senhaServer: password, ...profile })
    });

    if (!response.ok) {
      const errorText = await response.text();
      showMessage(signupMessage, errorText || "Não foi possível criar a conta.", "error");
      return;
    }

    showMessage(signupMessage, "Conta criada com sucesso! Redirecionando para o login...", "success");
    setTimeout(() => {
      window.location = LOGIN_PAGE;
    }, REDIRECT_DELAY_MS);
  } catch {
    showMessage(signupMessage, "Não foi possível conectar ao servidor.", "error");
  }
}

/**
 * Checks the account fields, including the password strength (business rule RN02). The profile is checked apart.
 * @returns {string|null} The error message, or null when every field is valid.
 */
function validateSignup(name, email, password, confirmation) {
  if (!name || !email || !password || !confirmation) {
    return "Preencha o nome, o e-mail, a senha e a confirmação.";
  }
  if (!email.includes("@") || !email.includes(".")) {
    return "Informe um e-mail válido.";
  }
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return passwordError;
  }
  if (password !== confirmation) {
    return "As senhas não conferem.";
  }
  return null;
}


/**
 * Checks that a password is strong (RN02): at least 8 characters, with an uppercase letter,
 * a lowercase letter, a digit and a special character. Used by the sign-up page.
 * @param {string} password
 * @returns {string|null} The error message, or null when the password is strong.
 */
function validatePasswordStrength(password) {
  if (password.length < 8) {
    return `A senha precisa ter no mínimo 8 caracteres.`;
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


signupForm.addEventListener("submit", createAccount);
fillOpeningOptions(signupForm.opening);
