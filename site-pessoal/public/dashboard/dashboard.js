// Results in chart order, with their labels: right attempts first, then wrong ones.
const RESULTS_IN_CHARTS = ["acerto", "erro"];
const RESULT_LABELS = { acerto: "Acerto", erro: "Erro" };
const RESULT_CHART_LABELS = { acerto: "Acertos", erro: "Erros" };
const WEEKS_IN_CHART = 8;
const DAYS_IN_WEEK = 7;
const FULL_RATE = 100;
const currentUser = getSessionUser();
const attemptsMessage = document.getElementById("attempts-message");

let attempts = [];
let lists = [];
let charts = [];
// Read from the theme's CSS variables, and read again when the theme changes.
let chartColors;

/**
 * Prepares the page and loads the user's attempts and the lists.
 */
async function startDashboard() {
  Chart.defaults.font.family = readCssVariable("--font-body");
  // Each chart fills its .chart box, whose height the CSS sets, instead of keeping a fixed proportion.
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.plugins.legend.display = false;
  Chart.register(barValuesPlugin);
  readChartColors();
  // layout.js connected its own click first, so the theme has already switched when the charts redraw.
  document.getElementById("theme-button").addEventListener("click", redrawChartsForTheme);

  attempts = await loadAttempts();
  lists = await loadLists();

  renderStats();
  renderCharts();
  renderTable();
}

/**
 * Fetches the user's attempts, newest first.
 * @returns {Promise<object[]>} The attempts, or an empty array when there are none or they could not be loaded.
 */
async function loadAttempts() {
  try {
    const response = await fetch(`/tentativas/listar/${currentUser.id}`);
    // 204 means the user has no attempts yet.
    if (response.status === 200) {
      return await response.json();
    }
    return [];
  } catch {
    showMessage(attemptsMessage, "Não foi possível carregar as tentativas.", "error");
    return [];
  }
}

/**
 * Fetches the exercise lists with the user's progress, in their order.
 * @returns {Promise<object[]>} The lists, or an empty array when they could not be loaded.
 */
async function loadLists() {
  try {
    const response = await fetch(`/listasExercicios/listar/${currentUser.id}`);
    if (response.status === 200) {
      return await response.json();
    }
    return [];
  } catch {
    showMessage(attemptsMessage, "Não foi possível carregar as listas de exercícios.", "error");
    return [];
  }
}

/**
 * Fills the three indicator cards at the top of the page and the numbers next to the results chart.
 */
function renderStats() {
  renderSolvedToday();
  renderHitRate();
  renderSolvedExercises();
  renderResultCounts();
}

/**
 * Shows how many right attempts the user made today, compared with yesterday.
 */
function renderSolvedToday() {
  const todayKey = getDayKey(new Date());
  const yesterdayKey = getDayKey(getYesterday());
  let solvedToday = 0;
  let solvedYesterday = 0;

  for (const attempt of attempts) {
    if (!attempt.acertou) {
      continue;
    }
    const attemptDayKey = getDayKey(new Date(attempt.data_tentativa));

    if (attemptDayKey === todayKey) {
      solvedToday++;
    }
    if (attemptDayKey === yesterdayKey) {
      solvedYesterday++;
    }
  }

  document.getElementById("solved-today").textContent = solvedToday;
  document.getElementById("solved-today-change").textContent =
    describeChange(solvedToday - solvedYesterday, "", "em relação a ontem");
}

/**
 * Shows the hit rate of all attempts, compared with the hit rate of the attempts made until yesterday.
 */
function renderHitRate() {
  const todayKey = getDayKey(new Date());
  let rightAttempts = 0;
  let attemptsUntilYesterday = 0;
  let rightUntilYesterday = 0;

  for (const attempt of attempts) {
    // Day keys are "YYYY-MM-DD", so comparing them as text compares the dates.
    const isBeforeToday = getDayKey(new Date(attempt.data_tentativa)) < todayKey;

    if (attempt.acertou) {
      rightAttempts++;
    }
    if (isBeforeToday) {
      attemptsUntilYesterday++;
    }
    if (attempt.acertou && isBeforeToday) {
      rightUntilYesterday++;
    }
  }

  const hitRate = calculateRate(rightAttempts, attempts.length);
  let change = "Sem tentativas até ontem";
  if (attemptsUntilYesterday > 0) {
    const hitRateUntilYesterday = calculateRate(rightUntilYesterday, attemptsUntilYesterday);
    // Rounded like the rates themselves: subtracting two decimals leaves noise such as 2.5500000000000043.
    const difference = Number((hitRate - hitRateUntilYesterday).toFixed(2));
    change = describeChange(difference, " p.p.", "desde ontem");
  }

  document.getElementById("hit-rate").textContent = `${hitRate}%`;
  document.getElementById("hit-rate-change").textContent = change;
}

/**
 * Shows how many exercises the user has solved at least once, out of all the exercises in the lists.
 */
function renderSolvedExercises() {
  let solved = 0;
  let total = 0;

  for (const list of lists) {
    solved += list.resolvidos;
    total += list.total_exercicios;
  }

  document.getElementById("solved-exercises").textContent = `${solved}/${total}`;
  document.getElementById("solved-exercises-detail").textContent = `${calculateRate(solved, total)}% dos exercícios`;
}

/**
 * Writes the number of right and wrong attempts in the legend of the results chart, and the hit rate in its middle.
 */
function renderResultCounts() {
  const results = countResults();

  for (const result of RESULTS_IN_CHARTS) {
    document.getElementById(`results-${result}`).textContent = results[result];
  }
  document.getElementById("results-hit-rate").textContent = `${calculateRate(results.acerto, attempts.length)}%`;
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
 * Reads the chart colors from the current theme: the result colors (--win for right, --loss for wrong),
 * the panel color for the gaps between marks, and the text and line colors.
 */
function readChartColors() {
  chartColors = {
    acerto: readCssVariable("--win"),
    erro: readCssVariable("--loss"),
    brass: readCssVariable("--brass"),
    card: readCssVariable("--card"),
    ink: readCssVariable("--ink")
  };
  Chart.defaults.color = readCssVariable("--muted");
  Chart.defaults.borderColor = readCssVariable("--line");
}

/**
 * Draws the three charts again from the current attempts and lists.
 */
function renderCharts() {
  // Chart.js cannot reuse a canvas until the previous chart on it is destroyed.
  for (const chart of charts) {
    chart.destroy();
  }

  charts = [createWeeklyChart(), createResultsChart(), createLevelsChart()];
}

/**
 * Stacked bar chart with the right and wrong attempts of each of the last weeks.
 * A 2px gap in the panel color separates the stacked results; only the top of each bar is rounded.
 * @returns {Chart}
 */
function createWeeklyChart() {
  const weeks = countAttemptsPerWeek();
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
 * Donut chart with the number of right and wrong attempts; the hit rate is written in its middle by the page.
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
 * Horizontal bar chart with the hit rate of each list, in the lists' order, with the percentage at the end of each bar.
 * @returns {Chart}
 */
function createLevelsChart() {
  const labels = [];
  const rates = [];

  for (const list of lists) {
    labels.push(list.nome);
    rates.push(calculateListHitRate(list.nome));
  }

  return new Chart(document.getElementById("levels-chart"), {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{ data: rates, backgroundColor: chartColors.brass, borderRadius: 4, borderSkipped: "start", maxBarThickness: 20 }]
    },
    options: {
      indexAxis: "y",
      // Room on the right for the percentage written after the longest bar.
      layout: { padding: { right: 40 } },
      plugins: { barValues: { display: true } },
      scales: {
        x: { beginAtZero: true, max: FULL_RATE },
        y: { grid: { display: false } }
      }
    }
  });
}

/**
 * Chart.js plugin that writes each bar's percentage after its end, for the horizontal charts that turn it on
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
      context.fillText(`${values[index]}%`, bar.x + 6, bar.y);
    });
    context.restore();
  }
};

/**
 * Fills the attempts table, or shows the empty message when there are no attempts.
 */
function renderTable() {
  const tableBody = document.getElementById("attempts-body");
  const hasAttempts = attempts.length > 0;

  document.getElementById("attempts-empty").hidden = hasAttempts;
  document.getElementById("attempts-table").hidden = !hasAttempts;

  tableBody.innerHTML = "";
  for (const attempt of attempts) {
    tableBody.appendChild(createAttemptRow(attempt));
  }
}

/**
 * Builds one table row: date, list, exercise and result tag.
 * @param {object} attempt
 * @returns {HTMLTableRowElement}
 */
function createAttemptRow(attempt) {
  const row = document.createElement("tr");
  const result = getResult(attempt);

  row.appendChild(createCell(formatDate(attempt.data_tentativa)));
  row.appendChild(createCell(attempt.lista));
  row.appendChild(createCell(attempt.exercicio));

  const resultTag = document.createElement("span");
  resultTag.className = `tag ${result}`;
  resultTag.textContent = RESULT_LABELS[result];
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
 * Names an attempt's result as the charts and tags do.
 * @param {{acertou: boolean}} attempt
 * @returns {"acerto"|"erro"}
 */
function getResult(attempt) {
  return attempt.acertou ? "acerto" : "erro";
}

/**
 * Counts the right and wrong attempts.
 * @returns {{acerto: number, erro: number}}
 */
function countResults() {
  const results = { acerto: 0, erro: 0 };

  for (const attempt of attempts) {
    results[getResult(attempt)]++;
  }

  return results;
}

/**
 * Calculates the hit rate of the attempts made in one list.
 * @param {string} listName - The list's name, as the attempts carry it.
 * @returns {number} The percentage, 0 when the list has no attempts.
 */
function calculateListHitRate(listName) {
  let total = 0;
  let right = 0;

  for (const attempt of attempts) {
    if (attempt.lista !== listName) {
      continue;
    }
    total++;
    if (attempt.acertou) {
      right++;
    }
  }

  return calculateRate(right, total);
}

/**
 * Counts the right and wrong attempts of each of the last WEEKS_IN_CHART weeks, from the oldest week to the current one.
 * Weeks start on Monday and are labeled with that day, as "DD/MM".
 * @returns {{start: number, label: string, acerto: number, erro: number}[]}
 */
function countAttemptsPerWeek() {
  const weeks = [];
  const weekStart = getWeekStart(new Date());

  for (let i = 0; i < WEEKS_IN_CHART; i++) {
    const label = weekStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    weeks.unshift({ start: weekStart.getTime(), label: label, acerto: 0, erro: 0 });
    weekStart.setDate(weekStart.getDate() - DAYS_IN_WEEK);
  }

  for (const attempt of attempts) {
    const attemptWeekStart = getWeekStart(new Date(attempt.data_tentativa)).getTime();
    const week = weeks.find((item) => item.start === attemptWeekStart);

    if (week) {
      week[getResult(attempt)]++;
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
 * Turns a date into its day in the user's time zone, so attempts can be grouped by day.
 * @param {Date} date
 * @returns {string} Day as "YYYY-MM-DD".
 */
function getDayKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Calculates a share as a percentage with up to two decimals.
 * @param {number} part
 * @param {number} total - 0 gives a rate of 0.
 * @returns {number}
 */
function calculateRate(part, total) {
  if (total === 0) {
    return 0;
  }
  return Number(((part / total) * FULL_RATE).toFixed(2));
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
 * @param {string} isoDate - Date as sent by the API, such as "2026-11-09T18:30:00.000Z".
 * @returns {string} Date as "DD/MM/YYYY, HH:MM".
 */
function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

startDashboard();
