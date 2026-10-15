const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signupForm = document.getElementById("signup-form");
const signupMessage = document.getElementById("signup-message");

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

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = signupForm.name.value.trim();
  const email = signupForm.email.value.trim();
  const password = signupForm.password.value;
  const error = validateSignup(name, email, password, signupForm.confirmation.value);

  if (error) {
    showMessage(signupMessage, error, "error");
    return;
  }

  try {
    await apiRequest("/usuarios/cadastrar", {
      method: "POST",
      body: { nomeServer: name, emailServer: email, senhaServer: password },
      errorMessages: { 409: "Este e-mail já está cadastrado." }
    });

    showMessage(signupMessage, "Conta criada com sucesso! Redirecionando para o login...", "success");
    setTimeout(() => { window.location = LOGIN_PAGE; }, 1500);
  } catch (error) {
    showMessage(signupMessage, error.message, "error");
  }
});
