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
    const response = await fetch("/usuarios/cadastrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomeServer: name, emailServer: email, senhaServer: password })
    });

    if (!response.ok) {
      const text = await response.text();
      showMessage(signupMessage, text || "Não foi possível criar a conta.", "error");
      return;
    }

    showMessage(signupMessage, "Conta criada com sucesso! Redirecionando para o login...", "success");
    setTimeout(() => { window.location = LOGIN_PAGE; }, 1500);
  } catch {
    showMessage(signupMessage, "Não foi possível conectar ao servidor.", "error");
  }
});
