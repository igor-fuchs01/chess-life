const RESULT_LABELS = { vitoria: "Vitória", derrota: "Derrota", empate: "Empate" };
const OPPONENT_LABELS = { humano: "Humano", ia: "IA" };
const COLOR_LABELS = { brancas: "Brancas", pretas: "Pretas" };
const WEEKS_IN_CHART = 8;
const DAYS_IN_WEEK = 7;
const OPENINGS_IN_CHART = 5;
const currentUser = getSessionUser();
const gamesMessage = document.getElementById("games-message");

let games = [];
let charts = [];
// Read from the theme's CSS variables, and read again when the theme changes.
let chartColors;

/**
 * Prepares the page and loads the user's games.
 */
function startDashboard() {
  Chart.defaults.font.family = readCssVariable("--font-body");
  // Each chart fills its panel's height, which the page layout sets, instead of keeping a fixed proportion.
  Chart.defaults.maintainAspectRatio = false;
  readChartColors();
  document.addEventListener("themechange", redrawChartsForTheme);

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
    showMessage(gamesMessage, "Não foi possível carregar as partidas.", "error");
  }

  renderStats();
  renderCharts();
  renderTable();
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
    const response = await fetch(`/partidas/deletar/${currentUser.id}/${gameId}`, { method: "DELETE" });

    if (!response.ok) {
      showMessage(gamesMessage, "Não foi possível excluir a partida.", "error");
      return;
    }

    loadGames();
  } catch {
    showMessage(gamesMessage, "Não foi possível conectar ao servidor.", "error");
  }
}

/**
 * Fills the three indicator cards at the top of the page.
 */
function renderStats() {
  renderGamesToday();
  renderWinRate();
  renderFavoriteOpening();
}

/**
 * Shows how many games were played today, compared with yesterday.
 */
function renderGamesToday() {
  const todayKey = getDayKey(new Date());
  const yesterdayKey = getDayKey(getYesterday());
  let gamesToday = 0;
  let gamesYesterday = 0;

  for (const game of games) {
    const gameDayKey = getDayKey(new Date(game.data_partida));

    if (gameDayKey === todayKey) {
      gamesToday++;
    }
    if (gameDayKey === yesterdayKey) {
      gamesYesterday++;
    }
  }

  document.getElementById("games-today").textContent = gamesToday;
  document.getElementById("games-today-change").textContent =
    describeChange(gamesToday - gamesYesterday, "", "em relação a ontem");
}

/**
 * Shows the win rate of all games, compared with the win rate of the games played until yesterday.
 */
function renderWinRate() {
  const todayKey = getDayKey(new Date());
  let wins = 0;
  let gamesUntilYesterday = 0;
  let winsUntilYesterday = 0;

  for (const game of games) {
    const isWin = game.resultado === "vitoria";
    // Day keys are "YYYY-MM-DD", so comparing them as text compares the dates.
    const isBeforeToday = getDayKey(new Date(game.data_partida)) < todayKey;

    if (isWin) {
      wins++;
    }
    if (isBeforeToday) {
      gamesUntilYesterday++;
    }
    if (isWin && isBeforeToday) {
      winsUntilYesterday++;
    }
  }

  const winRate = calculateWinRate(wins, games.length);
  let change = "Sem partidas até ontem";
  if (gamesUntilYesterday > 0) {
    const winRateUntilYesterday = calculateWinRate(winsUntilYesterday, gamesUntilYesterday);
    change = describeChange(winRate - winRateUntilYesterday, " p.p.", "desde ontem");
  }

  document.getElementById("win-rate").textContent = `${winRate}%`;
  document.getElementById("win-rate-change").textContent = change;
}

/**
 * Shows the most played opening, with how many games it had and its win rate.
 */
function renderFavoriteOpening() {
  const openings = countOpenings();
  let name = "—";
  let detail = "Jogue uma partida para descobrir";

  if (openings.length > 0) {
    const favorite = openings[0];
    const gamesWord = favorite.total === 1 ? "partida" : "partidas";
    name = favorite.name;
    detail = `${favorite.total} ${gamesWord} · ${calculateWinRate(favorite.wins, favorite.total)}% de vitórias`;
  }

  document.getElementById("favorite-opening").textContent = name;
  document.getElementById("favorite-opening-detail").textContent = detail;
}

/**
 * Describes a change between two values, such as "▲ 2 em relação a ontem".
 * @param {number} difference - Current value minus the previous one.
 * @param {string} unit - Text after the number, such as " p.p.".
 * @param {string} comparison - What the value is compared with, such as "desde ontem".
 * @returns {string}
 */
function describeChange(difference, unit, comparison) {
  if (difference > 0) {
    return `▲ ${difference}${unit} ${comparison}`;
  }
  if (difference < 0) {
    return `▼ ${-difference}${unit} ${comparison}`;
  }
  return `Sem variação ${comparison}`;
}

/**
 * Draws the charts again with the colors of the theme the user switched to.
 */
function redrawChartsForTheme() {
  readChartColors();
  renderCharts();
}

/**
 * Reads the chart colors from the current theme. Wins use --green-text, which stands out on the panels in both themes.
 */
function readChartColors() {
  chartColors = {
    green: readCssVariable("--green-text"),
    brass: readCssVariable("--brass"),
    danger: readCssVariable("--danger"),
    paper: readCssVariable("--paper"),
    muted: readCssVariable("--muted")
  };
  Chart.defaults.color = chartColors.muted;
}

/**
 * Draws the three charts again from the current games.
 */
function renderCharts() {
  // Chart.js cannot reuse a canvas until the previous chart on it is destroyed.
  for (const chart of charts) {
    chart.destroy();
  }

  charts = [createWeeklyChart(), createResultsChart(), createOpeningsChart()];
}

/**
 * Stacked bar chart with the wins, losses and draws of each of the last weeks.
 * @returns {Chart}
 */
function createWeeklyChart() {
  const weeks = countGamesPerWeek();
  const labels = [];
  const wins = [];
  const losses = [];
  const draws = [];

  for (const week of weeks) {
    labels.push(week.label);
    wins.push(week.vitoria);
    losses.push(week.derrota);
    draws.push(week.empate);
  }

  return new Chart(document.getElementById("weekly-chart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        { label: "Vitórias", data: wins, backgroundColor: chartColors.green },
        { label: "Derrotas", data: losses, backgroundColor: chartColors.danger },
        { label: "Empates", data: draws, backgroundColor: chartColors.brass }
      ]
    },
    options: {
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
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
        backgroundColor: [chartColors.green, chartColors.danger, chartColors.brass],
        borderColor: chartColors.paper
      }]
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
      datasets: [{ data: totals, backgroundColor: chartColors.brass }]
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
 * Builds one table row: date, opening, opponent, color, result tag and delete button.
 * @param {object} game
 * @returns {HTMLTableRowElement}
 */
function createGameRow(game) {
  const row = document.createElement("tr");

  row.appendChild(createCell(formatDate(game.data_partida)));
  row.appendChild(createCell(game.abertura));
  row.appendChild(createCell(OPPONENT_LABELS[game.adversario]));
  row.appendChild(createCell(COLOR_LABELS[game.cor]));

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
 * Creates a table cell. Uses textContent, so text from the database is never read as HTML.
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
 * Counts the games and wins of each opening, from the most to the least played.
 * @returns {{name: string, total: number, wins: number}[]}
 */
function countOpenings() {
  const openings = [];

  for (const game of games) {
    let opening = openings.find((item) => item.name === game.abertura);

    if (!opening) {
      opening = { name: game.abertura, total: 0, wins: 0 };
      openings.push(opening);
    }

    opening.total++;
    if (game.resultado === "vitoria") {
      opening.wins++;
    }
  }

  openings.sort((first, second) => second.total - first.total);
  return openings;
}

/**
 * Counts the results of each of the last WEEKS_IN_CHART weeks, from the oldest week to the current one.
 * Weeks start on Monday and are labeled with that day, as "DD/MM".
 * @returns {{start: number, label: string, vitoria: number, derrota: number, empate: number}[]}
 */
function countGamesPerWeek() {
  const weeks = [];
  const weekStart = getWeekStart(new Date());

  for (let i = 0; i < WEEKS_IN_CHART; i++) {
    const label = weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    weeks.unshift({ start: weekStart.getTime(), label: label, vitoria: 0, derrota: 0, empate: 0 });
    weekStart.setDate(weekStart.getDate() - DAYS_IN_WEEK);
  }

  for (const game of games) {
    const gameWeekStart = getWeekStart(new Date(game.data_partida)).getTime();
    const week = weeks.find((item) => item.start === gameWeekStart);

    if (week) {
      week[game.resultado]++;
    }
  }

  return weeks;
}

/**
 * Returns the Monday at midnight of the week a date is in.
 * @param {Date} date
 * @returns {Date}
 */
function getWeekStart(date) {
  const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // getDay() counts from Sunday (0); this counts from Monday instead.
  const daysSinceMonday = (weekStart.getDay() + 6) % DAYS_IN_WEEK;
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);
  return weekStart;
}

/**
 * Returns the current moment one day earlier.
 * @returns {Date}
 */
function getYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

/**
 * Turns a date into its day in the user's time zone, so games can be grouped by day.
 * @param {Date} date
 * @returns {string} Day as "YYYY-MM-DD".
 */
function getDayKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Calculates the share of wins, rounded to a whole percentage.
 * @param {number} wins
 * @param {number} total - Number of games; 0 gives a rate of 0.
 * @returns {number}
 */
function calculateWinRate(wins, total) {
  if (total === 0) {
    return 0;
  }
  return Number(((wins / total) * 100).toFixed(2));
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
 * Turns a date and time from the API into the Brazilian format, in the user's time zone.
 * @param {string} isoDate - Date as sent by the API, such as "2026-10-15T18:30:00.000Z".
 * @returns {string} Date as "DD/MM/YYYY, HH:MM".
 */
function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

startDashboard();
