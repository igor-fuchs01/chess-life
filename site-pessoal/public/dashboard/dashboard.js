const RESULT_LABELS = { vitoria: "Vitória", derrota: "Derrota", empate: "Empate" };
const OPPONENT_LABELS = { humano: "Humano", ia: "IA" };
const COLOR_LABELS = { brancas: "Brancas", pretas: "Pretas" };
const WEEKS_IN_CHART = 8;
const DAYS_IN_WEEK = 7;
const OPENINGS_IN_CHART = 5;
// Longer opening names are shortened on the chart's axis; the tooltip keeps the full name.
const MAX_OPENING_LABEL_LENGTH = 22;
// Results in chart order: the neutral draw sits between the win and the loss.
const RESULTS_IN_CHARTS = ["vitoria", "empate", "derrota"];
const RESULT_CHART_LABELS = { vitoria: "Vitórias", empate: "Empates", derrota: "Derrotas" };
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
  Chart.defaults.plugins.legend.display = false;
  Chart.register(barValuesPlugin);
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
 * Fills the three indicator cards at the top of the page and the numbers next to the results chart.
 */
function renderStats() {
  renderGamesToday();
  renderWinRate();
  renderFavoriteOpening();
  renderResultCounts();
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
    // Rounded like the rates themselves: subtracting two decimals leaves noise such as 2.5500000000000043.
    const difference = Number((winRate - winRateUntilYesterday).toFixed(2));
    change = describeChange(difference, " p.p.", "desde ontem");
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
 * Writes the number of each result in the legend of the results chart, and the win rate in its middle.
 */
function renderResultCounts() {
  const results = countResults();

  for (const result of RESULTS_IN_CHARTS) {
    document.getElementById(`results-${result}`).textContent = results[result];
  }
  document.getElementById("results-win-rate").textContent = `${calculateWinRate(results.vitoria, games.length)}%`;
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
 * Reads the chart colors from the current theme: the result colors (--win, --draw, --loss),
 * the panel color for the gaps between marks, and the text and line colors.
 */
function readChartColors() {
  chartColors = {
    vitoria: readCssVariable("--win"),
    empate: readCssVariable("--draw"),
    derrota: readCssVariable("--loss"),
    brass: readCssVariable("--brass"),
    card: readCssVariable("--card"),
    ink: readCssVariable("--ink")
  };
  Chart.defaults.color = readCssVariable("--muted");
  Chart.defaults.borderColor = readCssVariable("--line");
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
 * Stacked bar chart with the wins, draws and losses of each of the last weeks.
 * A 2px gap in the panel color separates the stacked results; only the top of each bar is rounded.
 * @returns {Chart}
 */
function createWeeklyChart() {
  const weeks = countGamesPerWeek();
  const labels = [];
  const datasets = [];

  for (const week of weeks) {
    labels.push(week.label);
  }

  for (const result of RESULTS_IN_CHARTS) {
    const counts = [];
    for (const week of weeks) {
      counts.push(week[result]);
    }

    const isTopOfBar = result === RESULTS_IN_CHARTS[RESULTS_IN_CHARTS.length - 1];
    datasets.push({
      label: RESULT_CHART_LABELS[result],
      data: counts,
      backgroundColor: chartColors[result],
      borderColor: chartColors.card,
      borderWidth: { top: 2 },
      borderSkipped: false,
      borderRadius: isTopOfBar ? { topLeft: 4, topRight: 4 } : 0,
      maxBarThickness: 28
    });
  }

  return new Chart(document.getElementById("weekly-chart"), {
    type: "bar",
    data: { labels: labels, datasets: datasets },
    options: {
      scales: {
        x: { stacked: true, grid: { display: false } },
        y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
      }
    }
  });
}

/**
 * Donut chart with the number of wins, draws and losses; the win rate is written in its middle by the page.
 * @returns {Chart}
 */
function createResultsChart() {
  const results = countResults();
  const labels = [];
  const counts = [];
  const colors = [];

  for (const result of RESULTS_IN_CHARTS) {
    labels.push(RESULT_CHART_LABELS[result]);
    counts.push(results[result]);
    colors.push(chartColors[result]);
  }

  return new Chart(document.getElementById("results-chart"), {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [{ data: counts, backgroundColor: colors, borderColor: chartColors.card, borderWidth: 3 }]
    },
    options: { cutout: "68%" }
  });
}

/**
 * Horizontal bar chart with the most played openings, with the number of games at the end of each bar.
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
      datasets: [{ data: totals, backgroundColor: chartColors.brass, borderRadius: 4, borderSkipped: "start", maxBarThickness: 20 }]
    },
    options: {
      indexAxis: "y",
      // Room on the right for the value written after the longest bar.
      layout: { padding: { right: 28 } },
      plugins: { barValues: { display: true } },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 } },
        y: { grid: { display: false }, ticks: { callback: shortenOpeningLabel } }
      }
    }
  });
}

/**
 * Chart.js tick callback that shortens a long opening name with "…".
 * @param {number} value - Index of the label on the axis.
 * @returns {string}
 */
function shortenOpeningLabel(value) {
  const name = this.getLabelForValue(value);

  if (name.length <= MAX_OPENING_LABEL_LENGTH) {
    return name;
  }
  return `${name.slice(0, MAX_OPENING_LABEL_LENGTH - 1)}…`;
}

/**
 * Chart.js plugin that writes each bar's value after its end, for the horizontal charts that turn it on
 * with `plugins: { barValues: { display: true } }`. The brass bars are light, so their numbers are written in text too.
 */
const barValuesPlugin = {
  id: "barValues",
  defaults: { display: false },
  afterDatasetsDraw(chart, args, settings) {
    if (!settings.display) {
      return;
    }

    const context = chart.ctx;
    const values = chart.data.datasets[0].data;
    context.save();
    context.fillStyle = chartColors.ink;
    context.font = `600 12px ${Chart.defaults.font.family}`;
    context.textBaseline = "middle";

    chart.getDatasetMeta(0).data.forEach((bar, index) => {
      context.fillText(values[index], bar.x + 6, bar.y);
    });
    context.restore();
  }
};

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
 * Builds one table row: date, opening, opponent, color and result tag.
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
