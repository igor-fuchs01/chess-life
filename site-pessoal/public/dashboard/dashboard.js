const RESULT_LABELS = { vitoria: "Vitória", derrota: "Derrota", empate: "Empate" };
const OPPONENT_LABELS = { humano: "Humano", ia: "IA" };
const MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const MONTHS_IN_CHART = 6;
const OPENINGS_IN_CHART = 5;
const COLORS = {
  green: readCssVariable("--green"),
  brass: readCssVariable("--brass"),
  danger: readCssVariable("--danger"),
  paper: readCssVariable("--paper"),
  muted: readCssVariable("--muted"),
  paper2: readCssVariable("--paper-2")
};

const currentUser = getSessionUser();
const gameForm = document.getElementById("game-form");
const gameMessage = document.getElementById("game-message");

let games = [];
let charts = [];

/**
 * Prepares the page and loads the user's games.
 */
function startDashboard() {
  Chart.defaults.font.family = readCssVariable("--font-body");
  Chart.defaults.color = COLORS.muted;

  document.getElementById("greeting").textContent = `Olá, ${currentUser.name}. Estas são as suas partidas.`;
  gameForm.date.max = getToday();
  gameForm.date.value = getToday();
  gameForm.addEventListener("submit", saveGame);

  loadGames();
}

/**
 * Fetches the user's games and redraws the whole dashboard.
 */
async function loadGames() {
  try {
    const response = await fetch(`/partidas/listar/${currentUser.id}`);

    // 204 means the user has no games yet.
    if (response.status === 200) {
      games = await response.json();
    } else {
      games = [];
    }
  } catch {
    games = [];
    showMessage(gameMessage, "Não foi possível carregar as partidas.", "error");
  }

  renderStats();
  renderCharts();
  renderTable();
}

/**
 * Validates the form and sends the new game to the API.
 * @param {SubmitEvent} event
 */
async function saveGame(event) {
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
    const response = await fetch(`/partidas/cadastrar/${currentUser.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(game)
    });

    if (!response.ok) {
      showMessage(gameMessage, "Não foi possível salvar a partida.", "error");
      return;
    }

    gameForm.reset();
    gameForm.date.value = getToday();
    showMessage(gameMessage, "Partida registrada!", "success");
    loadGames();
  } catch {
    showMessage(gameMessage, "Não foi possível conectar ao servidor.", "error");
  }
}

/**
 * Asks for confirmation and deletes a game.
 * @param {number} gameId
 */
async function deleteGame(gameId) {
  if (!confirm("Excluir esta partida?")) {
    return;
  }

  try {
    const response = await fetch(`/partidas/deletar/${gameId}`, { method: "DELETE" });

    if (!response.ok) {
      showMessage(gameMessage, "Não foi possível excluir a partida.", "error");
      return;
    }

    loadGames();
  } catch {
    showMessage(gameMessage, "Não foi possível conectar ao servidor.", "error");
  }
}

/**
 * Checks a game before sending it (business rules RN04 and RN05).
 * @param {object} game - The game read from the form.
 * @returns {string|null} The error message, or null when the game is valid.
 */
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
  if (game.dataPartida > getToday()) {
    return "A data da partida não pode ser futura.";
  }
  return null;
}

/**
 * Fills the four indicator cards at the top of the page.
 */
function renderStats() {
  const results = countResults();
  const openings = countOpenings();

  let winRate = 0;
  if (games.length > 0) {
    winRate = Math.round((results.vitoria / games.length) * 100);
  }

  let favoriteOpening = "—";
  if (openings.length > 0) {
    favoriteOpening = openings[0].name;
  }

  let gamesAgainstAi = 0;
  for (const game of games) {
    if (game.adversario === "ia") {
      gamesAgainstAi++;
    }
  }

  document.getElementById("stat-total").textContent = games.length;
  document.getElementById("stat-win-rate").textContent = `${winRate}%`;
  document.getElementById("stat-opening").textContent = favoriteOpening;
  document.getElementById("stat-ai").textContent = gamesAgainstAi;
}

/**
 * Draws the three charts again from the current games.
 */
function renderCharts() {
  // Chart.js cannot reuse a canvas until the previous chart on it is destroyed.
  for (const chart of charts) {
    chart.destroy();
  }

  charts = [createResultsChart(), createMonthlyChart(), createOpeningsChart()];
}

/**
 * Pie chart with the number of wins, losses and draws.
 * @returns {Chart}
 */
function createResultsChart() {
  const results = countResults();

  return new Chart(document.getElementById("results-chart"), {
    type: "pie",
    data: {
      labels: ["Vitórias", "Derrotas", "Empates"],
      datasets: [{
        data: [results.vitoria, results.derrota, results.empate],
        backgroundColor: [COLORS.green, COLORS.danger, COLORS.brass],
        borderColor: COLORS.paper
      }]
    }
  });
}

/**
 * Line chart with the number of games in each of the last months.
 * @returns {Chart}
 */
function createMonthlyChart() {
  const months = countGamesPerMonth();
  const labels = [];
  const totals = [];

  for (const month of months) {
    labels.push(month.label);
    totals.push(month.total);
  }

  return new Chart(document.getElementById("monthly-chart"), {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        data: totals,
        borderColor: COLORS.green,
        backgroundColor: COLORS.paper2,
        fill: true,
        tension: 0.35
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

/**
 * Horizontal bar chart with the most played openings.
 * @returns {Chart}
 */
function createOpeningsChart() {
  const openings = countOpenings().slice(0, OPENINGS_IN_CHART);
  const labels = [];
  const totals = [];

  for (const opening of openings) {
    labels.push(opening.name);
    totals.push(opening.total);
  }

  return new Chart(document.getElementById("openings-chart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{ data: totals, backgroundColor: COLORS.brass }]
    },
    options: {
      indexAxis: "y",
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

/**
 * Fills the games table, or shows the empty message when there are no games.
 */
function renderTable() {
  const tableBody = document.getElementById("games-body");
  const hasGames = games.length > 0;

  document.getElementById("games-empty").hidden = hasGames;
  document.getElementById("games-table").hidden = !hasGames;

  tableBody.innerHTML = "";
  for (const game of games) {
    tableBody.appendChild(createGameRow(game));
  }
}

/**
 * Builds one table row: date, opening, opponent, result tag and delete button.
 * @param {object} game
 * @returns {HTMLTableRowElement}
 */
function createGameRow(game) {
  const row = document.createElement("tr");

  row.appendChild(createCell(formatDate(game.data_partida)));
  row.appendChild(createCell(game.abertura));
  row.appendChild(createCell(OPPONENT_LABELS[game.adversario]));

  const resultTag = document.createElement("span");
  resultTag.className = `tag ${game.resultado}`;
  resultTag.textContent = RESULT_LABELS[game.resultado];
  const resultCell = createCell("");
  resultCell.appendChild(resultTag);
  row.appendChild(resultCell);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Excluir";
  deleteButton.addEventListener("click", () => deleteGame(game.id));
  const actionCell = createCell("");
  actionCell.appendChild(deleteButton);
  row.appendChild(actionCell);

  return row;
}

/**
 * Creates a table cell. Uses textContent, so text typed by users is never read as HTML.
 * @param {string} text
 * @returns {HTMLTableCellElement}
 */
function createCell(text) {
  const cell = document.createElement("td");
  cell.textContent = text;
  return cell;
}

/**
 * Counts the games of each result.
 * @returns {{vitoria: number, derrota: number, empate: number}}
 */
function countResults() {
  const results = { vitoria: 0, derrota: 0, empate: 0 };

  for (const game of games) {
    results[game.resultado]++;
  }

  return results;
}

/**
 * Counts the games of each opening, from the most to the least played.
 * @returns {{name: string, total: number}[]}
 */
function countOpenings() {
  const openings = [];

  for (const game of games) {
    const opening = openings.find((item) => item.name === game.abertura);

    if (opening) {
      opening.total++;
    } else {
      openings.push({ name: game.abertura, total: 1 });
    }
  }

  openings.sort((first, second) => second.total - first.total);
  return openings;
}

/**
 * Counts the games of each of the last MONTHS_IN_CHART months, from the oldest month to the current one.
 * @returns {{key: string, label: string, total: number}[]} key is "YYYY-MM", as in the start of game.data_partida.
 */
function countGamesPerMonth() {
  const months = [];
  const date = new Date();
  // Day 1 avoids skipping a month when going back from a 31st.
  date.setDate(1);

  for (let i = 0; i < MONTHS_IN_CHART; i++) {
    const monthNumber = String(date.getMonth() + 1).padStart(2, "0");
    months.unshift({ key: `${date.getFullYear()}-${monthNumber}`, label: MONTH_NAMES[date.getMonth()], total: 0 });
    date.setMonth(date.getMonth() - 1);
  }

  for (const game of games) {
    const gameMonth = game.data_partida.slice(0, 7);
    const month = months.find((item) => item.key === gameMonth);

    if (month) {
      month.total++;
    }
  }

  return months;
}

/**
 * Returns today's date in the user's time zone.
 * @returns {string} Date as "YYYY-MM-DD", the format of date inputs.
 */
function getToday() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

/**
 * Reads a design variable from the :root block of shared/style.css, so charts use the same colors as the page.
 * @param {string} name - Variable name, such as "--green".
 * @returns {string}
 */
function readCssVariable(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Turns a date from the API into the Brazilian format.
 * @param {string} isoDate - Date starting with "YYYY-MM-DD".
 * @returns {string} Date as "DD/MM/YYYY".
 */
function formatDate(isoDate) {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

startDashboard();
