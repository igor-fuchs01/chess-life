const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;

  if (!email || !password) {
    showMessage(loginMessage, "Preencha o e-mail e a senha.", "error");
    return;
  }

  try {
    const user = await apiRequest("/usuarios/autenticar", {
      method: "POST",
      body: { emailServer: email, senhaServer: password },
      errorMessages: { 403: "E-mail ou senha inválidos." }
    });

    if (!user || !user.id) {
      showMessage(loginMessage, "Não foi possível entrar. Tente novamente.", "error");
      return;
    }

    startSession({ id: user.id, name: user.nome, email: user.email });
    window.location = `${SITE_ROOT}dashboard/dashboard.html`;
  } catch (error) {
    showMessage(loginMessage, error.message, "error");
  }
});
