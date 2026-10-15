const API_ERROR_MESSAGES = {
  0: "Não foi possível conectar ao servidor. Verifique a sua conexão.",
  400: "Dados inválidos. Confira os campos e tente novamente.",
  401: "A sua sessão expirou. Entre novamente.",
  403: "Você não tem permissão para fazer isso.",
  404: "O recurso solicitado não foi encontrado.",
  409: "Este registro já existe.",
  500: "Erro no servidor. Tente novamente mais tarde."
};
const API_DEFAULT_ERROR_MESSAGE = "Algo deu errado. Tente novamente.";

class ApiError extends Error {
  constructor(status, messages) {
    super(messages[status] || API_ERROR_MESSAGES[status] || API_DEFAULT_ERROR_MESSAGE);
    this.status = status;
  }
}

async function apiRequest(path, { method = "GET", body, errorMessages = {} } = {}) {
  const options = { method };
  if (body !== undefined) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(path, options);
  } catch {
    throw new ApiError(0, errorMessages);
  }

  if (!response.ok) {
    throw new ApiError(response.status, errorMessages);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
