const RESULT_LABELS = { vitoria: "Vitória", derrota: "Derrota", empate: "Empate" };
const OPPONENT_LABELS = { humano: "Humano", ia: "IA" };
const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTHS_SHOWN = 6;
const TOP_OPENINGS = 5;

const currentUser = getSessionUser();
const gameForm = document.getElementById("game-form");
const gameMessage = document.getElementById("game-message");
const charts = {};

let games = [];

function todayIso() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

function formatDate(isoDate) {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function lastMonths(count) {
  const months = [];
  const date = new Date();
  date.setDate(1);
  for (let i = 0; i < count; i++) {
    months.unshift({ key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`, label: MONTH_LABELS[date.getMonth()] });
    date.setMonth(date.getMonth() - 1);
  }
  return months;
}

function drawChart(id, config) {
  if (charts[id]) {
    charts[id].data = config.data;
    charts[id].update();
    return;
  }
  charts[id] = new Chart(document.getElementById(id), config);
}

function renderStats() {
  const results = countBy(games, (game) => game.resultado);
  const openings = Object.entries(countBy(games, (game) => game.abertura)).sort((a, b) => b[1] - a[1]);

  document.getElementById("stat-total").textContent = games.length;
  document.getElementById("stat-win-rate").textContent = games.length ? `${Math.round(((results.vitoria || 0) / games.length) * 100)}%` : "0%";
  document.getElementById("stat-opening").textContent = openings.length ? openings[0][0] : "—";
  document.getElementById("stat-ai").textContent = games.filter((game) => game.adversario === "ia").length;
}

function renderCharts() {
  const results = countBy(games, (game) => game.resultado);
  const monthly = countBy(games, (game) => game.data_partida.slice(0, 7));
  const months = lastMonths(MONTHS_SHOWN);
  const openings = Object.entries(countBy(games, (game) => game.abertura)).sort((a, b) => b[1] - a[1]).slice(0, TOP_OPENINGS);

  drawChart("results-chart", {
    type: "pie",
    data: {
      labels: Object.values(RESULT_LABELS),
      datasets: [{ data: Object.keys(RESULT_LABELS).map((key) => results[key] || 0), backgroundColor: ["#2f4a3a", "#a4472f", "#b08d57"], borderColor: "#f4efe6" }]
    }
  });

  drawChart("monthly-chart", {
    type: "line",
    data: {
      labels: months.map((month) => month.label),
      datasets: [{ label: "Partidas", data: months.map((month) => monthly[month.key] || 0), borderColor: "#2f4a3a", backgroundColor: "rgba(176, 141, 87, .2)", fill: true, tension: .35 }]
    },
    options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } }
  });

  drawChart("openings-chart", {
    type: "bar",
    data: {
      labels: openings.map(([name]) => name),
      datasets: [{ data: openings.map(([, total]) => total), backgroundColor: "#b08d57" }]
    },
    options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } }
  });
}

function renderTable() {
  const body = document.getElementById("games-body");
  body.innerHTML = "";

  document.getElementById("games-empty").hidden = games.length > 0;
  document.getElementById("games-table").hidden = games.length === 0;

  games.forEach((game) => {
    const row = document.createElement("tr");
    [formatDate(game.data_partida), game.abertura, OPPONENT_LABELS[game.adversario]].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    const resultCell = document.createElement("td");
    const tag = document.createElement("span");
    tag.className = `tag ${game.resultado}`;
    tag.textContent = RESULT_LABELS[game.resultado];
    resultCell.appendChild(tag);
    row.appendChild(resultCell);

    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Excluir";
    deleteButton.addEventListener("click", () => deleteGame(game.id));
    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);

    body.appendChild(row);
  });
}

function renderDashboard() {
  renderStats();
  renderCharts();
  renderTable();
}

async function loadGames() {
  try {
    games = (await apiRequest(`/partidas/listar/${currentUser.id}`)) || [];
  } catch (error) {
    games = [];
    showMessage(gameMessage, error.message, "error");
  }
  renderDashboard();
}

function validateGame(game) {
  if (!RESULT_LABELS[game.resultado]) {
    return "Escolha um resultado válido.";
  }
  if (!game.abertura) {
    return "Informe a abertura.";
  }
  if (!OPPONENT_LABELS[game.adversario]) {
    return "Escolha um adversário válido.";
  }
  if (!game.dataPartida) {
    return "Informe a data da partida.";
  }
  if (game.dataPartida > todayIso()) {
    return "A data da partida não pode ser futura.";
  }
  return null;
}

async function deleteGame(gameId) {
  if (!confirm("Excluir esta partida?")) {
    return;
  }
  try {
    await apiRequest(`/partidas/deletar/${gameId}`, {
      method: "DELETE",
      errorMessages: { 404: "Esta partida não existe mais." }
    });
    await loadGames();
  } catch (error) {
    showMessage(gameMessage, error.message, "error");
  }
}

gameForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const game = {
    resultado: gameForm.result.value,
    abertura: gameForm.opening.value.trim(),
    adversario: gameForm.opponent.value,
    dataPartida: gameForm.date.value
  };
  const error = validateGame(game);

  if (error) {
    showMessage(gameMessage, error, "error");
    return;
  }

  try {
    await apiRequest(`/partidas/cadastrar/${currentUser.id}`, { method: "POST", body: game });

    gameForm.reset();
    gameForm.date.value = todayIso();
    showMessage(gameMessage, "Partida registrada!", "success");
    await loadGames();
  } catch (error) {
    showMessage(gameMessage, error.message, "error");
  }
});

Chart.defaults.font.family = getComputedStyle(document.documentElement).getPropertyValue("--font-body");
Chart.defaults.color = "#6b6053";

document.getElementById("greeting").textContent = `Olá, ${currentUser.name}. Estas são as suas partidas.`;
gameForm.date.max = todayIso();
gameForm.date.value = todayIso();
loadGames();
