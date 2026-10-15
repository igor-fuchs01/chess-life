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
    const response = await fetch("/usuarios/autenticar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailServer: email, senhaServer: password })
    });

    if (response.status !== 200) {
      const text = await response.text();
      showMessage(loginMessage, text || "Não foi possível entrar. Tente novamente.", "error");
      return;
    }

    const user = await response.json();
    startSession({ id: user.id, name: user.nome, email: user.email });
    window.location = "/dashboard/dashboard.html";
  } catch {
    showMessage(loginMessage, "Não foi possível conectar ao servidor.", "error");
  }
});
