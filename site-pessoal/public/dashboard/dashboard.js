// Results in chart order, with their labels: right attempts first, then wrong ones.
const RESULTS_IN_CHARTS = ["acerto", "erro"];
const RESULT_LABELS = { acerto: "Acerto", erro: "Erro" };
const RESULT_CHART_LABELS = { acerto: "Acertos", erro: "Erros" };
// Values of the period select's options.
const PREVIOUS_WEEK = "previous-week";
const CUSTOM_PERIOD = "custom";
const DAYS_IN_WEEK = 7;
const FULL_RATE = 100;
const currentUser = getSessionUser();
const attemptsMessage = document.getElementById("attempts-message");
const periodMessage = document.getElementById("period-message");
const periodSelect = document.getElementById("period-select");
const customPeriodFields = document.getElementById("custom-period");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");

let attempts = [];
let lists = [];
let charts = [];
// The period shown on the page, as { start, end } days written "YYYY-MM-DD", both included.
let period;
// Read from the theme's CSS variables, and read again when the theme changes.
let chartColors;

/**
 * Prepares the page and loads the attempts and the lists of the current week.
 */
function startDashboard() {
  Chart.defaults.font.family = readCssVariable("--font-body");
  // Each chart fills its .chart box, whose height the CSS sets, instead of keeping a fixed proportion.
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.plugins.legend.display = false;
  Chart.register(barValuesPlugin);
  readChartColors();
  // layout.js connected its own click first, so the theme has already switched when the charts redraw.
  document.getElementById("theme-button").addEventListener("click", redrawChartsForTheme);
  periodSelect.addEventListener("change", handlePeriodChange);
  document.getElementById("period-form").addEventListener("submit", handleCustomPeriodSubmit);

  loadDashboard(getWeekPeriod(0));
}

/**
 * Loads the page again as soon as another week is chosen. A custom period only shows the date fields,
 * and loads when the button is clicked.
 */
function handlePeriodChange() {
  const isCustomPeriod = periodSelect.value === CUSTOM_PERIOD;
  customPeriodFields.hidden = !isCustomPeriod;
  periodMessage.className = "message";

  if (isCustomPeriod) {
    return;
  }
  if (periodSelect.value === PREVIOUS_WEEK) {
    loadDashboard(getWeekPeriod(1));
    return;
  }
  loadDashboard(getWeekPeriod(0));
}

/**
 * Checks the custom period's days and loads the page with them.
 * @param {SubmitEvent} event
 */
function handleCustomPeriodSubmit(event) {
  event.preventDefault();
  const customPeriod = { start: startDateInput.value, end: endDateInput.value };

  if (!customPeriod.start || !customPeriod.end) {
    showMessage(periodMessage, "Informe a data de início e a data de fim.", "error");
    return;
  }
  // Days written as "YYYY-MM-DD" compare as text in date order.
  if (customPeriod.start > customPeriod.end) {
    showMessage(periodMessage, "A data de início não pode ser depois da data de fim.", "error");
    return;
  }
  loadDashboard(customPeriod);
}

/**
 * Fetches the attempts and the lists of a period and draws the whole page with them.
 * @param {{start: string, end: string}} chosenPeriod - Days written "YYYY-MM-DD", both included.
 */
async function loadDashboard(chosenPeriod) {
  period = chosenPeriod;
  periodMessage.className = "message";
  attemptsMessage.className = "message";

  attempts = await loadAttempts();
  lists = await loadLists();

  renderStats();
  renderCharts();
  renderTable();
}

/**
 * Fetches the user's attempts in the period, newest first.
 * @returns {Promise<object[]>} The attempts, or an empty array when there are none or they could not be loaded.
 */
async function loadAttempts() {
  try {
    const response = await fetch(`/dashboard/tentativas/${currentUser.id}?${getPeriodQuery()}`);
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
 * Fetches the exercise lists, in their order, with the exercises the user solved in the period.
 * @returns {Promise<object[]>} The lists, or an empty array when they could not be loaded.
 */
async function loadLists() {
  try {
    const response = await fetch(`/dashboard/listasExercicios/${currentUser.id}?${getPeriodQuery()}`);
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
 * Writes the period shown on the page as the query string the dashboard routes read.
 * @returns {string} Such as "data_inicio=2026-11-09&data_fim=2026-11-15".
 */
function getPeriodQuery() {
  return `data_inicio=${period.start}&data_fim=${period.end}`;
}

/**
 * Fills the three indicator cards at the top of the page and the numbers next to the results chart.
 */
function renderStats() {
  renderSolvedInPeriod();
  renderHitRate();
  renderSolvedExercises();
  renderResultCounts();
}

/**
 * Shows how many right attempts the user made in the period, with the period below.
 */
function renderSolvedInPeriod() {
  document.getElementById("solved-in-period").textContent = countResults().acerto;
  document.getElementById("solved-in-period-detail").textContent = describePeriod();
}

/**
 * Shows the hit rate of the attempts made in the period, with the period below.
 */
function renderHitRate() {
  const hitRate = calculateRate(countResults().acerto, attempts.length);

  document.getElementById("hit-rate").textContent = `${hitRate}%`;
  document.getElementById("hit-rate-detail").textContent = describePeriod();
}

/**
 * Shows how many exercises the user solved at least once in the period, out of all the exercises in the lists.
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
 * Describes the period shown on the page, such as "09/11/2026 a 15/11/2026", or only the day when it has one.
 * @returns {string}
 */
function describePeriod() {
  if (period.start === period.end) {
    return formatDay(period.start);
  }
  return `${formatDay(period.start)} a ${formatDay(period.end)}`;
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

  charts = [createDailyChart(), createResultsChart(), createLevelsChart()];
}

/**
 * Stacked bar chart with the right and wrong attempts of each day of the period.
 * A 2px gap in the panel color separates the stacked results; only the top of each bar is rounded.
 * @returns {Chart}
 */
function createDailyChart() {
  const days = countAttemptsPerDay();
  const labels = [];
  const datasets = [];

  for (const day of days) {
    labels.push(day.label);
  }

  for (const result of RESULTS_IN_CHARTS) {
    const counts = [];
    for (const day of days) {
      counts.push(day[result]);
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

  return new Chart(document.getElementById("daily-chart"), {
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
 * Counts the right and wrong attempts of each day of the period, from its first day to its last.
 * Days are labeled as "DD/MM".
 * @returns {{key: string, label: string, acerto: number, erro: number}[]}
 */
function countAttemptsPerDay() {
  const days = [];
  // "T00:00" makes the browser read the day at midnight in the user's time zone, not in UTC.
  const day = new Date(`${period.start}T00:00`);
  const lastDay = new Date(`${period.end}T00:00`);

  while (day <= lastDay) {
    const label = day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    days.push({ key: getDayKey(day), label: label, acerto: 0, erro: 0 });
    day.setDate(day.getDate() + 1);
  }

  for (const attempt of attempts) {
    const attemptDayKey = getDayKey(new Date(attempt.data_tentativa));
    const attemptDay = days.find((item) => item.key === attemptDayKey);

    if (attemptDay) {
      attemptDay[getResult(attempt)]++;
    }
  }

  return days;
}

/**
 * Returns a week from Monday to Sunday, counted back from the current one.
 * @param {number} weeksAgo - 0 for the current week, 1 for the previous one.
 * @returns {{start: string, end: string}} Days written "YYYY-MM-DD".
 */
function getWeekPeriod(weeksAgo) {
  const monday = getWeekStart(new Date());
  monday.setDate(monday.getDate() - weeksAgo * DAYS_IN_WEEK);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + DAYS_IN_WEEK - 1);
  return { start: getDayKey(monday), end: getDayKey(sunday) };
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

/**
 * Turns a day of the period into the Brazilian format.
 * @param {string} dayKey - Day written "YYYY-MM-DD".
 * @returns {string} Day as "DD/MM/YYYY".
 */
function formatDay(dayKey) {
  const [year, month, day] = dayKey.split("-");
  return `${day}/${month}/${year}`;
}

startDashboard();
