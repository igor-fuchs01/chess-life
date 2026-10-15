const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REDIRECT_DELAY_MS = 1500;

const signupForm = document.getElementById("signup-form");
const signupMessage = document.getElementById("signup-message");

/**
 * Validates the form and creates the account. On success, goes to the login page.
 * @param {SubmitEvent} event
 */
async function createAccount(event) {
  event.preventDefault();

  const name = signupForm.name.value.trim();
  const email = signupForm.email.value.trim();
  const password = signupForm.password.value;
  const confirmation = signupForm.confirmation.value;

  const error = validateSignup(name, email, password, confirmation);
  if (error) {
    showMessage(signupMessage, error, "error");
    return;
  }

  try {
    const response = await fetch("/usuarios/cadastrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomeServer: name, emailServer: email, senhaServer: password })
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
 * Checks the sign-up fields (business rule RN02: password of at least 8 characters).
 * @returns {string|null} The error message, or null when every field is valid.
 */
function validateSignup(name, email, password, confirmation) {
  if (!name || !email || !password || !confirmation) {
    return "Preencha todos os campos.";
  }
  if (!EMAIL_PATTERN.test(email)) {
    return "Informe um e-mail válido.";
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha precisa ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  if (password !== confirmation) {
    return "As senhas não conferem.";
  }
  return null;
}

signupForm.addEventListener("submit", createAccount);
